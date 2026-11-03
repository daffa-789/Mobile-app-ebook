/**
 * Service Layer — Pembayaran: penerima notifikasi (webhook) Midtrans.
 *
 * Aturan §3.1 panduan arsitektur: logika bisnis MURNI — tidak menerima objek
 * `req`/`res` Express; masukan berupa payload JSON polos, keluaran berpola
 * `outcome` yang dipetakan controller ke kode HTTP.
 *
 * Verifikasi berlapis sebelum menyentuh database: signature sha512 → order
 * dikenal → nominal cocok. Transisi status tetap lewat `settlement_service`.
 */

import { supabaseServer } from '../../db.js';
import { isTransactionSettled, verifySignatureKey } from '../../lib/midtrans.js';
import { FAILED_MIDTRANS_STATUSES, TRANSACTION_COLUMNS } from './constants.js';
import { rejectTransaction, settleTransaction } from './settlement_service.js';

/**
 * Memproses payload webhook notifikasi Midtrans (POST /midtrans/notification).
 *
 * Keluaran pola `outcome` dipetakan controller ke kode HTTP (200/400/401/404)
 * sesuai amplop respons standar.
 */
export async function handleMidtransNotification(payload = {}) {
  const verification = verifySignatureKey(payload);
  if (!verification.ok) {
    return { outcome: 'invalid-signature', reason: verification.reason, orderId: payload.order_id };
  }

  const { data: transaction, error } = await supabaseServer
    .from('transactions')
    .select(TRANSACTION_COLUMNS)
    .eq('id', payload.order_id)
    .maybeSingle();

  if (error) throw error;
  if (!transaction) {
    return { outcome: 'unknown-order', orderId: payload.order_id };
  }

  const notifiedAmount = Math.round(Number(payload.gross_amount));
  const storedAmount = Math.round(Number(transaction.total_paid));
  if (!Number.isFinite(notifiedAmount) || notifiedAmount !== storedAmount) {
    return { outcome: 'amount-mismatch', orderId: payload.order_id, notifiedAmount, storedAmount };
  }

  const transactionStatus = String(payload.transaction_status || '').toLowerCase();
  const fraudStatus = String(payload.fraud_status || '').toLowerCase();

  if (isTransactionSettled(transactionStatus, fraudStatus)) {
    const { alreadyProcessed } = await settleTransaction(transaction);
    return { outcome: 'settled', alreadyProcessed };
  }

  if (FAILED_MIDTRANS_STATUSES.has(transactionStatus)) {
    const { alreadyProcessed } = await rejectTransaction(transaction, transactionStatus);
    return { outcome: 'rejected', alreadyProcessed };
  }

  return { outcome: 'ignored', status: transactionStatus || 'pending' };
}
