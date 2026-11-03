/**
 * Service Layer — Pembayaran: mesin status transaksi (settle & reject).
 *
 * Aturan §4.1 panduan arsitektur: logika bisnis MURNI — tidak menerima objek
 * `req`/`res` Express; masukan dan keluaran berupa data polos, kegagalan
 * dibuang sebagai Error bertipe `statusCode`.
 *
 * Ini satu-satunya tempat status transaksi berpindah. Polling (`status_service`),
 * webhook (`notification_service`), dan kegagalan pembuatan order
 * (`order_service`) semuanya bermuara ke sini supaya klaim bersyarat idempoten
 * (§4.3 panduan) tidak pernah digandakan di tiga tempat.
 */

import { supabaseServer } from '../../db.js';
import { TRANSACTION_PENDING_STATUS } from '../../auth.js';
import {
  activatePaidMembership,
  restorePendingTransaction,
  toRefCode,
} from '../../lib/membership.js';
import { logger } from '../../logger.js';

/**
 * Menuntaskan transaksi menjadi lunas + mengaktifkan langganan Pro.
 *
 * IDEMPOTEN (§4.3 panduan): klaim baris dilakukan dengan UPDATE bersyarat
 * `.eq('status', 'pending')` — atomik di PostgreSQL, jadi webhook ulang maupun
 * polling yang balapan dengan webhook hanya sekali memenangkan klaim dan masa
 * aktif Pro tidak pernah ditambah dua kali. Bila aktivasi gagal setelah klaim,
 * status dikembalikan ke `pending` supaya notifikasi ulang Midtrans bisa
 * mencobanya lagi (tidak ada uang yang tertelan).
 * @param {Object} transaction - Data baris transaksi
 * @returns {Promise<{ alreadyProcessed: boolean, activated: Object|null }>}
 */
export async function settleTransaction(transaction) {
  if (!transaction || transaction.status === 'success') {
    return { alreadyProcessed: true, activated: null };
  }

  const { data: claimed, error: claimError } = await supabaseServer
    .from('transactions')
    .update({ status: 'success', verified_at: new Date().toISOString() })
    .eq('id', transaction.id)
    .eq('status', TRANSACTION_PENDING_STATUS)
    .select('id');

  if (claimError) throw claimError;
  if (!claimed || claimed.length === 0) {
    return { alreadyProcessed: true, activated: null };
  }

  let activated;
  try {
    activated = await activatePaidMembership({
      userId: transaction.user_id,
      planName: transaction.plan_name,
      price: transaction.amount,
      refCode: toRefCode(transaction.ref_no),
    });
  } catch (activationError) {
    let statusRestored = true;
    try {
      await restorePendingTransaction(transaction.id);
    } catch (rollbackError) {
      statusRestored = false;
      activationError.rollbackError = rollbackError;
    }

    logger.error(
      'MIDTRANS',
      statusRestored
        ? 'Aktivasi gagal; transaksi dikembalikan ke pending'
        : 'Aktivasi gagal; pemulihan transaksi juga gagal',
      {
        orderId: transaction.id,
        pesan: activationError.message,
      },
    );
    throw activationError;
  }

  logger.ok('MIDTRANS', 'Langganan Pro diaktifkan', {
    orderId: transaction.id,
    userId: transaction.user_id,
    subscriptionId: activated.subscriptionId,
  });

  return { alreadyProcessed: false, activated };
}

/**
 * Menandai transaksi pending sebagai gagal (expire/cancel/deny/kedaluwarsa).
 * Idempoten: baris yang bukan `pending` lagi tidak pernah diubah.
 * @param {Object} transaction - Data baris transaksi
 * @param {string} reason - Alasan pembatalan/kegagalan
 * @returns {Promise<{ alreadyProcessed: boolean }>}
 */
export async function rejectTransaction(transaction, reason) {
  if (!transaction || transaction.status !== TRANSACTION_PENDING_STATUS) {
    return { alreadyProcessed: true };
  }

  const { data: claimed, error } = await supabaseServer
    .from('transactions')
    .update({ status: 'rejected', verified_at: new Date().toISOString() })
    .eq('id', transaction.id)
    .eq('status', TRANSACTION_PENDING_STATUS)
    .select('id');

  if (error) throw error;
  logger.warn('MIDTRANS', `Transaksi ditandai gagal (${reason})`, { orderId: transaction.id });
  return { alreadyProcessed: !claimed || claimed.length === 0 };
}
