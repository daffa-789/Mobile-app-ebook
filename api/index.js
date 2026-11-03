/**
 * @file api/index.js
 * @description Titik masuk serverless Vercel — seluruh /api mengalir ke sini
 * lewat rewrite di `vercel.json`. Urutan middleware tidak ditulis ulang di
 * berkas ini; ia memakai `createApiApp()` yang sama dengan server lokal supaya
 * perilaku produksi dan pengembangan tidak bisa berbeda.
 */

import { errorHandler } from '../server/middleware/errors.js';
import { createApiApp } from '../server/app.js';
import { initOtpStore } from '../server/otpStore.js';

// Panaskan penyimpanan OTP di lingkungan serverless (fungsi bisa dingin kapan saja).
initOtpStore().catch(() => {});

const app = createApiApp();

app.use(errorHandler);

export default app;
