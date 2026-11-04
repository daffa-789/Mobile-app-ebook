/**
 * Route Layer — Modul Pembayaran (Fase 2 roadmap arsitektur).
 *
 * Berkas ini sengaja tipis: hanya pemetaan URL → middleware (rate limiter,
 * otentikasi) → method controller. Seluruh logika bisnis ada di
 * `server/services/payment/`; pemformatan HTTP ada di
 * `server/controllers/payment_controller.js`.
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../auth.js';
import { wrap } from '../lib/http.js';
import { paymentRateLimiter, qrisStatusRateLimiter } from '../middleware/security.js';
import {
  cancelQris,
  createQrisCharge,
  getQrImage,
  getQrisStatus,
  midtransNotification,
  reconcileQris,
} from '../controllers/payment_controller.js';

export const paymentsRouter = Router();

const qrImageRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak permintaan kode QR. Tunggu sebentar.' },
});

// POST /api/qris/charge — Inisiasi tagihan pembayaran QRIS baru via Midtrans Core API
paymentsRouter.post('/qris/charge', paymentRateLimiter, requireAuth, wrap(createQrisCharge));

// GET /api/qris/:orderId/status — Cek status pembayaran transaksi QRIS (polling terproteksi limiter)
paymentsRouter.get(
  '/qris/:orderId/status',
  requireAuth,
  qrisStatusRateLimiter,
  wrap(getQrisStatus),
);

// POST /api/qris/reconcile — Tagih ulang order pending milik sendiri (pemulih sesi)
paymentsRouter.post('/qris/reconcile', requireAuth, qrisStatusRateLimiter, wrap(reconcileQris));

// POST /api/qris/:orderId/cancel — Batalkan tagihan QRIS yang belum dibayar
paymentsRouter.post('/qris/:orderId/cancel', paymentRateLimiter, requireAuth, wrap(cancelQris));

// GET /api/qris/:orderId/qr.png — Dapatkan gambar kode QR resmi dari Midtrans
paymentsRouter.get('/qris/:orderId/qr.png', qrImageRateLimiter, requireAuth, wrap(getQrImage));

// POST /api/midtrans/notification — Webhook notifikasi status pembayaran dari server Midtrans
paymentsRouter.post('/midtrans/notification', midtransNotification);
