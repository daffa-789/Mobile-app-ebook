/**
 * Route Layer — Modul Otentikasi (Fase 3 roadmap arsitektur).
 *
 * Berkas ini sengaja tipis: hanya pemetaan URL → middleware → method
 * controller. Login memakai pembatas terdistribusi berbasis IP dan akun;
 * verifikasi OTP juga memiliki batas percobaan dan cooldown pengiriman ulang.
 * Seluruh logika bisnis ada di paket `server/services/auth/`;
 * pemformatan HTTP ada di `server/controllers/auth_controller.js`.
 */

import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { wrap } from '../lib/http.js';
import { loginRateLimiter } from '../middleware/loginRateLimit.js';
import {
  exchange,
  googleCallback,
  googleMobileStart,
  googleNative,
  googleSupabase,
  login,
  me,
  register,
  requestPasswordReset,
  resendVerification,
  resetPassword,
  verifyRegistration,
} from '../controllers/auth_controller.js';

export const authRouter = Router();

authRouter.post('/login', loginRateLimiter, wrap(login));

authRouter.post('/register', wrap(register));

authRouter.post('/verify-registration', wrap(verifyRegistration));

authRouter.post('/request-password-reset', wrap(requestPasswordReset));

authRouter.post('/reset-password', wrap(resetPassword));

authRouter.post('/resend-verification', wrap(resendVerification));

authRouter.post('/google-supabase', wrap(googleSupabase));

authRouter.post('/google/mobile-start', wrap(googleMobileStart));

authRouter.post('/google/native', wrap(googleNative));

authRouter.get('/google/callback', wrap(googleCallback));

authRouter.post('/exchange', wrap(exchange));

authRouter.get('/me', requireAuth, wrap(me));
