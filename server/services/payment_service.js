/**
 * Service Layer — Modul Pembayaran QRIS Midtrans (Fase 2 roadmap arsitektur).
 *
 * Aturan §4.1 panduan arsitektur: fungsi di berkas ini adalah logika bisnis
 * MURNI — tidak boleh menerima objek `req`/`res` Express. Masukan berupa data
 * polos, keluaran berupa data polos, dan kegagalan dibuang sebagai Error bertipe
 * `statusCode` sehingga 100% dapat di-unit-test tanpa menyalakan server.
 *
 * Hasil bisnis yang diharapkan (bukan galat) dikembalikan sebagai objek
 * berpola `outcome` — pemetaan ke status HTTP menjadi tanggung jawab controller.
 */

import { supabaseServer } from '../db.js';
import {
  generateId,
  loadMembershipUser,
  settleExpiredMembership,
  toPublicUser,
  TRANSACTION_PENDING_STATUS,
} from '../auth.js';
import {
  activatePaidMembership,
  activeSubscriptionConflict,
  insertTransaction,
  restorePendingTransaction,
  toRefCode,
} from '../lib/membership.js';
import { QRIS_ADMIN_FEE, findPlan } from '../lib/constants.js';
import {
  MIDTRANS_IS_PRODUCTION,
  MIDTRANS_PAYMENT_METHOD_LABEL,
  MIDTRANS_QRIS_EXPIRY_MINUTES,
} from '../config.js';
import {
  cancelQrisTransaction,
  createQrisCharge,
  expireQrisTransaction,
  extractQrAction,
  extractQrString,
  getTransactionStatus,
  isMidtransConfigured,
  isTransactionSettled,
  isVoidAcknowledged,
  verifySignatureKey,
} from '../lib/midtrans.js';
import { logger } from '../logger.js';

/** Status Midtrans yang berarti order mati (tidak mungkin dibayar lagi). */
export const FAILED_MIDTRANS_STATUSES = new Set(['expire', 'cancel', 'deny']);

export const TRANSACTION_COLUMNS =
  'id, ref_no, user_id, plan_name, amount, admin_fee, total_paid, payment_method, status, verified_at, created_at, midtrans_transaction_id, midtrans_qr_url, midtrans_qr_string, expires_at';

/**
 * Galat layanan dengan status HTTP usulan (konvensi §4.1 panduan arsitektur).
 * Controller hanya meneruskan `statusCode`/`code` — tidak menerka sendiri.
 */
export { createServiceError } from '../lib/errors.js';

const isExpired = (transaction, now = Date.now()) =>
  Boolean(transaction.expires_at) && new Date(transaction.expires_at).getTime() < now;

/**
 * Memuat transaksi milik pemohon. Pemilik baris atau admin boleh melihat;
 * orang lain mendapat `forbidden` tanpa isi barisnya.
 * @param {{ orderId: string, viewerId: string, viewerRole: string }} params
 * @returns {Promise<{ transaction: Object|null, forbidden: boolean }>}
 */
export async function loadTransactionForViewer({ orderId, viewerId, viewerRole }) {
  const { data, error } = await supabaseServer
    .from('transactions')
    .select(TRANSACTION_COLUMNS)
    .eq('id', orderId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { transaction: null, forbidden: false };
  if (data.user_id !== viewerId && viewerRole !== 'admin') {
    return { transaction: null, forbidden: true };
  }
  return { transaction: data, forbidden: false };
}

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

/**
 * Membuat (atau memakai ulang) order QRIS untuk satu pengguna.
 *
 * Alur: sapu kedaluwarsa langganan → tolak bila Pro masih aktif → pakai ulang
 * QR pending yang masih hidup → baru buat order + charge ke Midtrans.
 *
 * Keluaran (pola `outcome`, dipetakan controller ke HTTP):
 *  - `gateway-unavailable` : Midtrans belum dikonfigurasi (503).
 *  - `already-pro`         : langganan masih aktif, tidak perlu membayar lagi.
 *  - `reused` / `created`  : order siap dipakai beserta payload QR-nya.
 */
export async function createQrisOrder({ planId, userId, fallbackUser, phone }) {
  if (!isMidtransConfigured) {
    return {
      outcome: 'gateway-unavailable',
      message:
        'Payment gateway Midtrans belum dikonfigurasi. Isi MIDTRANS_SERVER_KEY dan MIDTRANS_CLIENT_KEY di .env.',
    };
  }

  const plan = findPlan(planId);
  const amount = plan.price;
  const adminFee = QRIS_ADMIN_FEE;
  const totalPaid = amount + adminFee;

  await settleExpiredMembership(userId);
  const membership = (await loadMembershipUser(userId)) || fallbackUser;

  const conflict = activeSubscriptionConflict(membership);
  if (conflict) {
    return {
      outcome: 'already-pro',
      message: conflict.message,
      user: toPublicUser(membership),
    };
  }

  const { data: pendingTx } = await supabaseServer
    .from('transactions')
    .select(TRANSACTION_COLUMNS)
    .eq('user_id', userId)
    .eq('status', TRANSACTION_PENDING_STATUS)
    .eq('payment_method', MIDTRANS_PAYMENT_METHOD_LABEL)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const reusable = pendingTx && (pendingTx.midtrans_qr_string || pendingTx.midtrans_qr_url);
  if (reusable) {
    return {
      outcome: 'reused',
      order: {
        orderId: pendingTx.id,
        refNo: pendingTx.ref_no,
        qrString: pendingTx.midtrans_qr_string || null,
        qrImageUrl: pendingTx.midtrans_qr_url ? `/api/payments/qris/${pendingTx.id}/qr.png` : null,
        qrMidtransUrl: pendingTx.midtrans_qr_url || null,
        planName: pendingTx.plan_name,
        amount: pendingTx.amount,
        adminFee: pendingTx.admin_fee,
        totalPaid: pendingTx.total_paid,
        status: TRANSACTION_PENDING_STATUS,
        expiredAt: pendingTx.expires_at,
      },
      user: toPublicUser(membership),
    };
  }

  const orderId = generateId('tx');
  const expiredAt = new Date(Date.now() + MIDTRANS_QRIS_EXPIRY_MINUTES * 60_000).toISOString();

  const refNo = await insertTransaction({
    txId: orderId,
    userId,
    planName: plan.name,
    amount,
    adminFee,
    totalPaid,
    method: MIDTRANS_PAYMENT_METHOD_LABEL,
    status: TRANSACTION_PENDING_STATUS,
  });
  await supabaseServer.from('transactions').update({ expires_at: expiredAt }).eq('id', orderId);

  const pendingRow = { id: orderId, status: TRANSACTION_PENDING_STATUS };

  let charge;
  try {
    charge = await createQrisCharge({
      orderId,
      grossAmount: totalPaid,
      itemDetails: [
        { id: plan.id, price: amount, quantity: 1, name: `Langganan ${plan.name}` },
        { id: 'admin-fee', price: adminFee, quantity: 1, name: 'Biaya Administrasi' },
      ],
      customerDetails: {
        first_name: membership?.name || 'Pembaca Wahidiyah',
        email: membership?.email || undefined,
        phone: phone || undefined,
      },
    });
  } catch (chargeError) {
    await rejectTransaction(pendingRow, 'charge gagal');
    throw chargeError;
  }

  const qrString = extractQrString(charge);
  const qrAction = extractQrAction(charge);

  if (!qrString && !qrAction) {
    await rejectTransaction(pendingRow, 'tanpa QR');
    logger.error('MIDTRANS', 'Respons charge tidak berisi qr_string maupun URL QR', { orderId });
    throw createServiceError('Midtrans tidak mengembalikan kode QR. Coba beberapa saat lagi.', {
      statusCode: 502,
      code: 'QR_MISSING',
    });
  }

  await supabaseServer
    .from('transactions')
    .update({
      midtrans_transaction_id: charge?.transaction_id || null,
      midtrans_qr_url: qrAction?.url || null,
      midtrans_qr_string: qrString || null,
      expires_at: expiredAt,
    })
    .eq('id', orderId);

  logger.ok('MIDTRANS', 'Charge QRIS dibuat', {
    orderId,
    totalPaid,
    acquirer: charge?.acquirer,
    sumberQr: qrString ? 'qr_string' : 'image',
  });

  return {
    outcome: 'created',
    order: {
      orderId,
      refNo,
      // Sumber utama: payload EMVCo → dirender jadi QR di sisi klien (SVG tajam, tanpa latensi).
      qrString,
      // Cadangan: endpoint gambar kita sendiri (proxy PNG dari Midtrans).
      qrImageUrl: qrAction ? `/api/payments/qris/${orderId}/qr.png` : null,
      ...(MIDTRANS_IS_PRODUCTION ? {} : { qrMidtransUrl: qrAction?.url || null }),
      planName: plan.name,
      amount,
      adminFee,
      totalPaid,
      status: TRANSACTION_PENDING_STATUS,
      expiredAt,
    },
    user: toPublicUser(membership),
  };
}

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
 * Membatalkan kode QRIS milik sendiri lalu biarkan klien membuat order baru.
 *
 * Kenyataan terukur (22 Okt 2026, sandbox): Midtrans MENOLAK pembatalan QRIS —
 * /v2/{order_id}/expire dan /cancel membalas HTTP 412 "Transaction status
 * cannot be updated". Satu-satunya cara QRIS mati adalah kedaluwarsa. Karena
 * itu pembatalan di sini bersifat lokal:
 *  - masa berlaku ditarik ke sekarang, sehingga query reuse di createQrisOrder
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

/**
 * Memproses payload webhook notifikasi Midtrans (POST /midtrans/notification).
 *
 * Verifikasi berlapis sebelum menyentuh database: signature sha512 → order
 * dikenal → nominal cocok. Setelah lolos, transisi settle/reject idempoten
 * lewat settleTransaction/rejectTransaction. Keluaran pola `outcome` dipetakan
 * controller ke kode HTTP (200/400/401/404) sesuai amplop respons standar.
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
