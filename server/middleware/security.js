import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import express from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import {
  ALLOWED_ORIGINS,
  CSP_DIRECTIVES,
  CSP_REPORT_ONLY,
  QRIS_STATUS_RATE_LIMIT,
  TRUST_PROXY,
} from '../config.js';

/* Report-only sampai CSP_ENFORCE=1: aplikasi tetap jalan sementara pelanggaran
 * dilaporkan di konsol peramban (VULN-09).
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: CSP_DIRECTIVES,
    reportOnly: CSP_REPORT_ONLY,
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

export const corsPolicy = cors({
  origin(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
});

export const responseCompression = compression({ threshold: 1024 });

export const jsonBody = express.json({ limit: '1mb' });

export const trustProxy = (app) => {
  app.set('trust proxy', TRUST_PROXY);
};

/* Status pembayaran dibatasi per akun, bukan per alamat: pengguna sah
 * memakainya setiap 3 detik, dan limiter berbasis IP bisa mengunci seluruh
 * pengguna yang berbagi jaringan kampus.
 */
export const qrisStatusRateLimiter = rateLimit({
  windowMs: QRIS_STATUS_RATE_LIMIT.windowMs,
  max: QRIS_STATUS_RATE_LIMIT.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: QRIS_STATUS_RATE_LIMIT.message,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip || 'unknown'),
});

/* Endpoint penerbit sesi dari idToken Google tidak punya nonce, jadi batasi
 * percobaan per IP. Login sah hanya beberapa kali per jam, sehingga 30
 * permintaan / 5 menit masih jauh di atas pemakaian wajar. */
export const googleAuthRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan masuk dengan Google. Coba lagi dalam 5 menit.',
  },
});

export const paymentRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan transaksi atau pembayaran. Coba lagi dalam 5 menit.',
  },
});
