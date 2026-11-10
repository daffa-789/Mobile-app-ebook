/**
 * Service Layer — Pembayaran: pembuatan order QRIS & hak akses baca barisnya.
 *
 * Aturan §3.1 panduan arsitektur: logika bisnis MURNI — tidak menerima objek
 * `req`/`res` Express; masukan dan keluaran berupa data polos, kegagalan
 * dibuang sebagai Error bertipe `statusCode` sehingga dapat diuji tanpa
 * menyalakan server.
 *
 * Hasil bisnis yang diharapkan (bukan galat) dikembalikan sebagai objek
 * berpola `outcome` — pemetaan ke status HTTP menjadi tanggung jawab controller.
 */

import { supabaseServer } from '../../db.js';
import { generateId, toPublicUser, TRANSACTION_PENDING_STATUS } from '../../auth.js';
import { insertTransaction, resolvePurchaseGate } from '../../lib/membership.js';
import { QRIS_ADMIN_FEE, findPlan } from '../../lib/constants.js';
import { createServiceError } from '../../lib/errors.js';
import {
  MIDTRANS_IS_PRODUCTION,
  MIDTRANS_PAYMENT_METHOD_LABEL,
  MIDTRANS_QRIS_EXPIRY_MINUTES,
} from '../../config.js';
import {
  assertMidtransReady,
  createQrisCharge,
  extractQrAction,
  extractQrString,
} from '../../lib/midtrans.js';
import { logger } from '../../logger.js';
import { TRANSACTION_COLUMNS } from './constants.js';
import { rejectTransaction } from './settlement_service.js';

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
  /* Cek konfigurasi lebih dulu, sebelum `insertTransaction`. Kalau kunci
   * produksi dipasang bersama flag sandbox (atau kunci belum diisi), charge
   * PASTI gagal — menulis order pending lalu menandainya rejected hanya
   * meninggalkan deretan transaksi sampah di riwayat pengguna. */
  try {
    assertMidtransReady();
  } catch (error) {
    return {
      outcome: 'gateway-unavailable',
      code: error.code,
      message: error.message,
    };
  }

  const plan = findPlan(planId);
  const amount = plan.price;
  const adminFee = QRIS_ADMIN_FEE;
  const totalPaid = amount + adminFee;

  const { membership, conflict } = await resolvePurchaseGate(userId, fallbackUser);
  if (conflict) return conflict;

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
