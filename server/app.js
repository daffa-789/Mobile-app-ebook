/**
 * @file server/app.js
 * @description Rakitan aplikasi API yang SAMA untuk dua titik masuk:
 * `api/index.js` (Vercel serverless) dan `server/server.js` (Express lokal).
 *
 * Sebelumnya urutan middleware ditulis ulang di kedua berkas itu, sehingga
 * satu perbaikan keamanan bisa mendarat di satu sisi saja — dev hijau,
 * produksi diam-diam berperilaku beda. Satu fungsi ini yang menentukan urutannya.
 *
 * `errorHandler` sengaja TIDAK dipasang di sini: server.js masih perlu
 * menempelkan penyajian berkas statis dan middleware Vite sebelum error
 * handler, jadi tiap titik masuk memasangnya di akhir urutannya sendiri.
 */

import express from 'express';
import {
  corsPolicy,
  googleAuthRateLimiter,
  jsonBody,
  responseCompression,
  securityHeaders,
  trustProxy,
} from './middleware/security.js';
import { apiNotFound } from './middleware/errors.js';
import { requestContext } from './middleware/requestLog.js';
import { mountRoutes } from './routes/index.js';

/** Express app siap pakai: konteks request → keamanan → body → rute → 404 API. */
export function createApiApp() {
  const app = express();

  app.use(requestContext);
  app.use(securityHeaders);
  app.use(corsPolicy);
  app.use(responseCompression);
  app.use(jsonBody);

  trustProxy(app);

  /* Limiter dipasang di sini (bukan di auth_routes.js) supaya satu kebijakan
   * berlaku untuk kedua titik masuk dan rute tetap tipis. Dua endpoint ini
   * menerbitkan state/token tanpa sesi, jadi perlu pembatas tersendiri. */
  app.use(['/api/auth/google/native', '/api/auth/google/mobile-start'], googleAuthRateLimiter);

  // Semua router /api (health, auth, books, users, payments, subscriptions,
  // events, carousel, admin) didaftarkan dari satu tabel ROUTERS.
  mountRoutes(app);

  app.use('/api', apiNotFound);

  return app;
}
