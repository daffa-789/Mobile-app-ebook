/**
 * Service Layer — Pembayaran: status order dari sisi pembeli & pembatalan lokal.
 *
 * Aturan §3.1 panduan arsitektur: logika bisnis MURNI — tidak menerima objek
 * `req`/`res` Express; masukan dan keluaran berupa data polos, kegagalan
 * dibuang sebagai Error bertipe `statusCode`.
 *
 * Transisi status tidak dilakukan di sini — selalu lewat `settlement_service`
 * agar jalur polling, webhook, dan pembatalan memakai klaim bersyarat yang sama.
 */

import { supabaseServer } from '../../db.js';
import { TRANSACTION_PENDING_STATUS } from '../../auth.js';
import { MIDTRANS_PAYMENT_METHOD_LABEL } from '../../config.js';
import {
  cancelQrisTransaction,
  expireQrisTransaction,
  getTransactionStatus,
  isTransactionSettled,
  isVoidAcknowledged,
} from '../../lib/midtrans.js';
import { logger } from '../../logger.js';
import { FAILED_MIDTRANS_STATUSES, TRANSACTION_COLUMNS } from './constants.js';
import { rejectTransaction, settleTransaction } from './settlement_service.js';

const isExpired = (transaction, now = Date.now()) =>
  Boolean(transaction.expires_at) && new Date(transaction.expires_at).getTime() < now;

/**
 * Status akhir sebuah order QRIS dari sudut pandang pembeli.
 *
 * Urutan: baris lokal yang sudah final menang tanpa memanggil Midtrans; bila
 * masih pending tapi timer habis, matikan lokal dulu; sisanya tanyakan ke
 * Midtrans dan terapkan transisi settle/reject secara idempoten.
 * Kegagalan polling tidak dianggap galat — status dikembalikan `pending`.
 */
export async function resolveQrisStatus({ transaction }) {
  if (transaction.status === 'success') {
    return { status: 'settlement', isPaid: true };
  }

  if (transaction.status === 'rejected') {
    return { status: 'expire', isPaid: false };
  }

  if (isExpired(transaction)) {
    await rejectTransaction(transaction, 'kedaluwarsa');
    return { status: 'expire', isPaid: false };
  }

  try {
    const status = await getTransactionStatus(transaction.id);
    const transactionStatus = String(status?.transaction_status || 'pending').toLowerCase();
    const fraudStatus = String(status?.fraud_status || '').toLowerCase();

    if (isTransactionSettled(transactionStatus, fraudStatus)) {
      await settleTransaction(transaction);
      return { status: 'settlement', isPaid: true };
    }

    if (FAILED_MIDTRANS_STATUSES.has(transactionStatus)) {
      await rejectTransaction(transaction, transactionStatus);
      return { status: transactionStatus, isPaid: false };
    }

    return { status: transactionStatus, isPaid: false };
  } catch (error) {
    logger.warn('MIDTRANS', 'Gagal memeriksa status ke Midtrans', { pesan: error.message });
    return { status: 'pending', isPaid: false };
  }
}

/**
 * Menagih ulang order QRIS milik sendiri yang masih `pending`.
 *
 * Polling biasa hidup hanya selama layar bayar terbuka. Pembayaran yang datang
 * setelah pengguna menutup layar — atau setelmen yang disimulasikan setelah itu
 * — tidak pernah ditanyakan lagi, dan tidak ada cron yang melakukannya, sehingga
 * Pro tidak pernah aktif tanpa galat yang terlihat. Fungsi ini memakai jalur
 * transisi yang sudah ada (`resolveQrisStatus`), bukan logika baru, dan hanya
 * menyentuh order milik pemanggil.
 *
 * Order yang ternyata sudah lewat masa berlaku ikut ditutup oleh jalur yang sama
 * (`rejectTransaction`), jadi daftar pending tidak menumpuk selamanya.
 */
export async function reconcilePendingQris({ userId, limit = 5 }) {
  const { data: rows, error } = await supabaseServer
    .from('transactions')
    .select(TRANSACTION_COLUMNS)
    .eq('user_id', userId)
    .eq('status', TRANSACTION_PENDING_STATUS)
    .eq('payment_method', MIDTRANS_PAYMENT_METHOD_LABEL)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  const hasil = { checked: 0, settled: 0, closed: 0 };
  for (const transaction of rows || []) {
    hasil.checked += 1;
    try {
      const { status, isPaid } = await resolveQrisStatus({ transaction });
      if (isPaid) hasil.settled += 1;
      else if (status !== 'pending') hasil.closed += 1;
    } catch (error) {
      logger.warn('MIDTRANS', 'Rekonsiliasi satu order pending gagal', {
        orderId: transaction.id,
        pesan: error.message,
      });
    }
  }

  if (hasil.checked) {
    logger.info('MIDTRANS', 'Order pending ditagih ulang saat sesi dipulihkan', hasil);
  }

  return hasil;
}

/**
 * Membatalkan kode QRIS milik sendiri lalu biarkan klien membuat order baru.
 *
 * Kenyataan terukur (22 Okt 2026, sandbox): Midtrans MENOLAK pembatalan QRIS —
 * /v2/{order_id}/expire dan /cancel membalas HTTP 412 "Transaction status
 * cannot be updated". Satu-satunya cara QRIS mati adalah kedaluwarsa. Karena
 * itu pembatalan di sini bersifat lokal:
 *  - masa berlaku ditarik ke sekarang, sehingga query reuse di `order_service`
 *    melewati order ini dan order baru dibuat dengan timer penuh;
 *  - status SENGAJA tetap `pending` selama Midtrans tidak mengakui pembatalan.
 *    Kalau pemilik terlanjur membayar QR lama, jalur settle yang ada masih
 *    mengaktifkan Pro dan uangnya tidak hilang; memindahkannya ke `rejected`
 *    akan membuat pembayaran itu tertelan tanpa aktivasi;
 *  - baru ditutup ke `rejected` kalau Midtrans benar-benar mematikan order
 *    (2xx, atau 404 karena order memang tidak pernah ada) — saat itu
 *    pembayaran sudah mustahil.
 */
export async function cancelQrisForUser({ transaction }) {
  let voidedByMidtrans = false;
  for (const upaya of [expireQrisTransaction, cancelQrisTransaction]) {
    try {
      if (isVoidAcknowledged(await upaya(transaction.id))) {
        voidedByMidtrans = true;
        break;
      }
    } catch {
      // Ditolak Midtrans (412 untuk QRIS): lanjut ke pembatalan lokal.
    }
  }

  const nowIso = new Date().toISOString();
  const { error: cancelError } = await supabaseServer
    .from('transactions')
    .update(
      voidedByMidtrans
        ? { expires_at: nowIso, status: 'rejected', verified_at: nowIso }
        : { expires_at: nowIso },
    )
    .eq('id', transaction.id)
    .eq('status', TRANSACTION_PENDING_STATUS);

  if (cancelError) throw cancelError;

  logger.info('MIDTRANS', 'Kode QRIS dibatalkan pengguna', {
    orderId: transaction.id,
    voidedByMidtrans,
  });

  const kedaluwarsaLama = transaction.expires_at
    ? new Date(transaction.expires_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
    : null;

  return { voidedByMidtrans, kedaluwarsaLama };
}
