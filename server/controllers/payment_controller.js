/**
 * Controller Layer — Modul Pembayaran (Fase 2 roadmap arsitektur).
 *
 * Tanggung jawab TUNGGAL berkas ini (§3.1 panduan): mengekstrak DTO dari
 * `req`, memanggil service di `server/services/payment/`, dan memformat respons HTTP. Tidak ada
 * query database ataupun panggilan gateway di sini — semua logika bisnis ada
 * di paket `server/services/payment/`.
 *
 * Bentuk respons dipertahankan kompatibel dengan klien yang ada (Fase 3 yang
 * akan menstandarkan amplop `{ success, message, data }` menyeluruh).
 */

import {
  badRequest,
  internalErrorDetail,
  notFound,
  replyAlreadyPro,
  unauthorized,
} from '../lib/http.js';
import { fetchQrImage } from '../lib/midtrans.js';
import { logger } from '../logger.js';
import { loadTransactionForViewer, createQrisOrder } from '../services/payment/order_service.js';
import {
  cancelQrisForUser,
  reconcilePendingQris,
  resolveQrisStatus,
} from '../services/payment/status_service.js';
import { handleMidtransNotification } from '../services/payment/notification_service.js';
import { TRANSACTION_PENDING_STATUS } from '../auth.js';

const ownTransactionOr404 = async (req, res) => {
  const { transaction, forbidden } = await loadTransactionForViewer({
    orderId: req.params.orderId,
    viewerId: req.user?.id,
    viewerRole: req.user?.role,
  });

  if (!transaction) {
    return {
      transaction: null,
      response: res.status(forbidden ? 403 : 404).json({
        success: false,
        message: forbidden ? 'Transaksi ini bukan milik Anda.' : 'Transaksi tidak ditemukan.',
      }),
    };
  }

  return { transaction, response: null };
};

/** POST /api/payments/qris/charge */
export async function createQrisCharge(req, res) {
  try {
    const result = await createQrisOrder({
      planId: req.body?.planId,
      userId: req.user.id,
      fallbackUser: req.user,
      phone: req.body?.phone,
    });

    if (result.outcome === 'gateway-unavailable') {
      return res.status(503).json({ success: false, message: result.message });
    }

    if (result.outcome === 'already-pro') return replyAlreadyPro(res, result);

    const body = { success: true, ...result.order, user: result.user };
    if (result.outcome === 'reused') {
      return res.json({ reused: true, ...body });
    }
    return res.status(201).json(body);
  } catch (error) {
    if (error?.code === 'MIDTRANS_NOT_CONFIGURED') {
      return res.status(503).json({ success: false, message: error.message });
    }
    logger.error('MIDTRANS', 'Gagal membuat charge QRIS', { pesan: error.message });
    return res
      .status(
        error?.statusCode && error.statusCode >= 400 && error.statusCode < 600
          ? error.statusCode
          : 502,
      )
      .json({
        success: false,
        message: error?.statusCode ? error.message : 'Gagal membuat transaksi di Midtrans.',
        error: internalErrorDetail(error),
      });
  }
}

/** GET /api/payments/qris/:orderId/status */
export async function getQrisStatus(req, res) {
  const { transaction, response } = await ownTransactionOr404(req, res);
  if (response) return response;

  const { status, isPaid } = await resolveQrisStatus({ transaction });

  return res.json({
    success: true,
    orderId: transaction.id,
    totalPaid: transaction.total_paid,
    expiredAt: transaction.expires_at,
    status,
    isPaid,
  });
}

/** POST /api/payments/qris/reconcile — tagih ulang order pending milik sendiri */
export async function reconcileQris(req, res) {
  const hasil = await reconcilePendingQris({ userId: req.user.id });
  return res.json({ success: true, ...hasil });
}

/** POST /api/payments/qris/:orderId/cancel */
export async function cancelQris(req, res) {
  const { transaction, response } = await ownTransactionOr404(req, res);
  if (response) return response;

  if (transaction.status === 'success') {
    return res.status(409).json({
      success: false,
      message: 'Pembayaran sudah selesai dan langganan aktif, jadi tidak bisa dibatalkan.',
    });
  }

  if (transaction.status !== TRANSACTION_PENDING_STATUS) {
    return res.json({
      success: true,
      alreadyCancelled: true,
      orderId: transaction.id,
      message: 'Kode QR ini sudah tidak aktif.',
    });
  }

  const { voidedByMidtrans, kedaluwarsaLama } = await cancelQrisForUser({ transaction });

  return res.json({
    success: true,
    cancelled: true,
    voidedByMidtrans,
    orderId: transaction.id,
    message: voidedByMidtrans
      ? 'Kode QR dibatalkan di Midtrans. Silakan buat kode baru.'
      : 'Kode QR dihentikan di sisi kami, kode baru bisa dibuat sekarang. Midtrans tidak mendukung pembatalan QRIS, jadi QR lama masih berlaku sampai ' +
        (kedaluwarsaLama ? `${kedaluwarsaLama} WIB` : 'waktu kedaluwarsanya'),
    warning: voidedByMidtrans
      ? null
      : 'Jangan membayar kode QR lama. Kalau terlanjur dibayar, langganan tetap aktif tetapi kamu membayar dua kali.',
  });
}

/** GET /api/payments/qris/:orderId/qr.png */
export async function getQrImage(req, res) {
  const { transaction, response } = await ownTransactionOr404(req, res);
  if (response) return response;

  if (!transaction.midtrans_qr_url) {
    return notFound(
      res,
      'Transaksi ini memakai payload QR (qr_string); tidak ada gambar dari Midtrans.',
    );
  }

  try {
    const image = await fetchQrImage(transaction.midtrans_qr_url);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'private, max-age=600');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.send(image);
  } catch (error) {
    logger.error('MIDTRANS', 'Gagal mengambil gambar QR', { pesan: error.message });
    return res.status(502).json({ success: false, message: 'Gagal memuat kode QR dari Midtrans.' });
  }
}

/** POST /api/payments/midtrans/notification — webhook Midtrans */
export async function midtransNotification(req, res) {
  try {
    const result = await handleMidtransNotification(req.body || {});

    switch (result.outcome) {
      case 'invalid-signature':
        logger.warn('MIDTRANS', 'Notifikasi ditolak: signature tidak valid', {
          orderId: result.orderId,
          alasan: result.reason,
          ip: req.ip,
        });
        return unauthorized(res, 'Notifikasi tidak terautentikasi.');

      case 'unknown-order':
        logger.warn('MIDTRANS', 'Notifikasi untuk order yang tidak dikenal', {
          orderId: result.orderId,
        });
        return notFound(res, 'Transaksi tidak ditemukan.');

      case 'amount-mismatch':
        logger.warn('MIDTRANS', 'Notifikasi ditolak: nominal tidak cocok', {
          orderId: result.orderId,
          notifiedAmount: result.notifiedAmount,
          storedAmount: result.storedAmount,
        });
        return badRequest(res, 'Nominal pembayaran tidak sesuai.');

      case 'settled':
      case 'rejected':
        return res.json({ success: true, alreadyProcessed: result.alreadyProcessed });

      default:
        return res.json({ success: true, status: result.status });
    }
  } catch (error) {
    logger.error('MIDTRANS', 'Gagal memproses notifikasi', { pesan: error.message });
    return res.status(500).json({
      success: false,
      message: 'Gagal memproses notifikasi.',
      error: internalErrorDetail(error),
    });
  }
}
