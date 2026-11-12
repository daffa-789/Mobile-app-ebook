/**
 * Controller Layer — Modul Otentikasi (Fase 3 roadmap arsitektur).
 *
 * Tanggung jawab TUNGGAL berkas ini (§3.1 panduan): mengekstrak DTO dari
 * `req`, memanggil service di `server/services/auth/`, dan memformat respons HTTP (JSON maupun
 * redirect OAuth). Tidak ada query database, verifikasi OTP, atau logika
 * pendaftaran di sini — semuanya ada di paket `server/services/auth/`.
 *
 * Bentuk respons dipertahankan kompatibel dengan klien yang ada.
 */

import crypto from 'node:crypto';
import { DB_DOWN_MESSAGE, authFailureMessage, internalErrorDetail, isDbDown } from '../lib/http.js';
import { createOneTimeCode, redeemOneTimeCode } from '../lib/oneTimeCode.js';
import { logger } from '../logger.js';
import { createSessionToken, toPublicUser } from '../auth.js';
import { resolveFrontendOrigin } from '../lib/origin.js';
import {
  MOBILE_STATE_PREFIX,
  MOBILE_HANDOFF_HEADERS,
  buildMobileAuthUrls,
  buildMobileHandoffHtml,
} from '../lib/googleHandoff.js';
import { ALLOWED_ORIGINS, FRONTEND_ORIGIN } from '../config.js';
import { RESET_UNIFORM_RESPONSE, RESET_UNIFORM_WA_RESPONSE } from '../services/auth/messages.js';
import {
  authenticateWithPassword,
  exchangeSessionCode,
  loadCurrentUser,
} from '../services/auth/session_service.js';
import { beginRegistration, completeRegistration } from '../services/auth/registration_service.js';
import {
  requestPasswordReset as requestPasswordResetService,
  resetPassword as resetPasswordService,
} from '../services/auth/password_reset_service.js';
import { resendVerificationOtp } from '../services/auth/otp_resend_service.js';
import {
  loginWithGoogleSupabase,
  verifyGoogleOAuthCode,
  verifyGoogleIdToken,
  findOrCreateGoogleUser,
} from '../services/auth/google_oauth_service.js';

/** Pemetaan seragam kegagalan tak terduga (database mati → 503, lainnya 500). */
const replyAuthFailure = (res, error, { dbMessage = DB_DOWN_MESSAGE } = {}) => {
  const isDbError = isDbDown(error);
  logger.error('AUTH', 'Terjadi kegagalan proses otentikasi', {
    pesan: error?.message,
    code: error?.code,
  });
  return res.status(isDbError ? 503 : 500).json({
    success: false,
    message: isDbError ? dbMessage : authFailureMessage(error),
    error: internalErrorDetail(error),
    isDatabaseError: isDbError,
  });
};

/** Penolakan bisnis dari service → respons JSON dengan status semantiknya. */
const rejectOutcome = (res, result) => {
  const body = { success: false, message: result.message };
  if (result.retryAfterSeconds !== undefined) body.retryAfterSeconds = result.retryAfterSeconds;
  return res.status(result.status).json(body);
};

/**
 * Respons sukses yang mengakhiri sesi — login password, verifikasi registrasi,
 * dan login Google. Ketiganya dulu menulis objek `{ success, message, token,
 * user }` sendiri-sendiri; satu bentuk di sini menjaga klien (`AppContext`)
 * tetap membaca kunci yang sama di semua jalur masuk.
 */
const replySession = (res, result, message, status = 200) =>
  res.status(status).json({ success: true, message, token: result.token, user: result.user });

/** POST /api/auth/login */
export async function login(req, res) {
  try {
    const result = await authenticateWithPassword({
      email: req.body?.email,
      identifier: req.body?.identifier,
      password: req.body?.password,
    });

    if (!result.ok) return rejectOutcome(res, result);

    return replySession(res, result, 'Login berhasil');
  } catch (error) {
    return replyAuthFailure(res, error);
  }
}

/** POST /api/auth/register */
export async function register(req, res) {
  try {
    const result = await beginRegistration({
      name: req.body?.name,
      email: req.body?.email,
      phone: req.body?.phone,
      password: req.body?.password,
      clientIp: req.ip,
    });

    if (!result.ok) return rejectOutcome(res, result);
    return res.status(result.status).json({ success: true, ...result.body });
  } catch (error) {
    return replyAuthFailure(res, error, { dbMessage: 'Gagal terhubung ke database.' });
  }
}

/** POST /api/auth/verify-registration */
export async function verifyRegistration(req, res) {
  try {
    const result = await completeRegistration({
      identifier: req.body?.identifier,
      email: req.body?.email,
      phone: req.body?.phone,
      code: req.body?.code,
    });

    if (!result.ok) return rejectOutcome(res, result);

    return replySession(res, result, 'Akun berhasil dibuat.', 201);
  } catch (error) {
    return replyAuthFailure(res, error, { dbMessage: 'Gagal terhubung ke database.' });
  }
}

/** POST /api/auth/request-password-reset */
export async function requestPasswordReset(req, res) {
  try {
    const result = await requestPasswordResetService({
      method: req.body?.method === 'whatsapp' || req.body?.phone ? 'whatsapp' : 'email',
      email: req.body?.email,
      phone: req.body?.phone || req.body?.identifier,
      clientIp: req.ip,
    });

    if (!result.ok) return rejectOutcome(res, result);

    switch (result.kind) {
      case 'uniform-wa':
        return res.json(RESET_UNIFORM_WA_RESPONSE);
      case 'uniform-email':
        return res.json(RESET_UNIFORM_RESPONSE);
      case 'sent-wa':
        return res.json({
          ...RESET_UNIFORM_WA_RESPONSE,
          phone: result.phone,
          identifier: result.identifier,
          devOtp: result.devOtp,
        });
      default: // 'sent-email'
        return res.json({
          ...RESET_UNIFORM_RESPONSE,
          method: 'email',
          identifier: result.identifier,
          devOtp: result.devOtp,
        });
    }
  } catch (error) {
    return replyAuthFailure(res, error);
  }
}

/** POST /api/auth/reset-password */
export async function resetPassword(req, res) {
  try {
    const result = await resetPasswordService({
      method: req.body?.method === 'whatsapp' || req.body?.phone ? 'whatsapp' : 'email',
      email: req.body?.email,
      phone: req.body?.phone,
      identifier: req.body?.identifier,
      code: req.body?.code,
      password: String(req.body?.password || ''),
    });

    if (!result.ok) return rejectOutcome(res, result);
    return res.json({ success: true, message: 'Password berhasil diperbarui.' });
  } catch (error) {
    return replyAuthFailure(res, error);
  }
}

/** POST /api/auth/resend-verification */
export async function resendVerification(req, res) {
  try {
    const result = await resendVerificationOtp({
      method: req.body?.method === 'whatsapp' || req.body?.phone ? 'whatsapp' : 'email',
      identifier: req.body?.identifier || req.body?.phone || req.body?.email,
      purpose: req.body?.purpose,
      clientIp: req.ip,
    });

    if (!result.ok) return rejectOutcome(res, result);

    if (result.kind === 'silent-success') {
      return res.json({ success: true, message: 'Kode baru telah dikirim dan berlaku 10 menit.' });
    }
    return res.json({ success: true, ...result.body });
  } catch (error) {
    return replyAuthFailure(res, error);
  }
}

/** POST /api/auth/google-supabase */
export async function googleSupabase(req, res) {
  try {
    const result = await loginWithGoogleSupabase({
      accessToken: req.body?.access_token,
      googleName: req.body?.user?.name,
      googleEmail: req.body?.user?.email,
    });

    if (!result.ok) return rejectOutcome(res, result);

    return replySession(res, result, 'Login Google berhasil.');
  } catch (error) {
    return replyAuthFailure(res, error);
  }
}

/**
 * POST /api/auth/google/native — login lewat SDK Google Sign-In native.
 * Klien mengirim idToken hasil `GoogleSignin.signIn()`; server memverifikasi
 * tanda tangan + audience, lalu menerbitkan sesi JWT yang sama persis dengan
 * jalur OAuth browser. Tidak ada browser, tidak ada authorization code.
 */
export async function googleNative(req, res) {
  const idToken = typeof req.body?.idToken === 'string' ? req.body.idToken.trim() : '';
  if (!idToken) {
    return res.status(400).json({ success: false, message: 'Token Google wajib diisi.' });
  }
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  if (!clientId) {
    return res
      .status(500)
      .json({ success: false, message: 'Google OAuth belum dikonfigurasi di server.' });
  }

  try {
    const verified = await verifyGoogleIdToken({ idToken, clientId });
    if (!verified.ok) {
      return res.status(401).json({ success: false, message: verified.message });
    }
    const account = await findOrCreateGoogleUser({
      email: verified.email,
      name: verified.name,
      source: 'native Google Sign-In',
    });
    if (!account.ok) throw new Error('Gagal membuat atau mengambil akun Google.');

    return replySession(
      res,
      { token: createSessionToken(account.user), user: toPublicUser(account.user) },
      'Login berhasil',
    );
  } catch (error) {
    return replyAuthFailure(res, error);
  }
}

/* Nama paket dipakai Chrome pada URL `intent://` agar deep link diantar ke
 * activity aplikasi, bukan dibiarkan mengambang di Custom Tab. */
const MOBILE_ANDROID_PACKAGE = process.env.MOBILE_ANDROID_PACKAGE || 'id.wahidiyah.book';

/** Kirim halaman serah-terima HTTPS untuk menggantikan 302 ke skema custom. */
const replyMobileHandoff = (res, { status, path, params, message = '' }) => {
  const scheme = process.env.MOBILE_AUTH_SCHEME || 'mobileappebook';
  const { deepLinkUrl, intentUrl } = buildMobileAuthUrls({
    scheme,
    androidPackage: MOBILE_ANDROID_PACKAGE,
    path,
    params,
  });
  res.set(MOBILE_HANDOFF_HEADERS);
  return res
    .status(200)
    .type('html')
    .send(buildMobileHandoffHtml({ status, message, intentUrl, deepLinkUrl }));
};

/** POST /api/auth/google/mobile-start — inisialisasi OAuth untuk mobile native */
export async function googleMobileStart(req, res) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID || '';
    if (!clientId) {
      return res.status(500).json({
        success: false,
        message: 'Google OAuth belum dikonfigurasi di server.',
      });
    }
    const frontendOrigin = resolveFrontendOrigin({ FRONTEND_ORIGIN }, req, ALLOWED_ORIGINS) || '';
    const redirectUri =
      process.env.GOOGLE_OAUTH_REDIRECT_URI || `${frontendOrigin}/api/auth/google/callback`;

    /* Nonce OIDC 128-bit ikut terkunci di state sekali pakai yang sama, jadi
     * callback bisa membandingkan klaim `nonce` pada id_token tanpa sesi
     * server. Ini menutup penyisipan/replay token pada alur browser mobile. */
    const nonce = crypto.randomBytes(16).toString('base64url');
    const state = await createOneTimeCode(
      { kind: 'oauth_state', platform: 'mobile', nonce },
      { ttlMs: 5 * 60 * 1000 },
    );
    const scope = encodeURIComponent('openid email profile');
    /* Prefiks `mob.` membuat callback tahu ini alur mobile bahkan ketika state
     * sudah kedaluwarsa/gagal ditebus, sehingga kegagalan juga mendapat halaman
     * handoff, bukan halaman /login web yang terlihat seperti "nyangkut".
     * `prompt=select_account` WAJIB: tanpa ini Google langsung memaksa akun
     * terakhir ("Anda login kembali ke …") dan pengguna tidak bisa ganti akun
     * setelah logout. Dulu parameter ini sempat dihapus karena pemilih akun
     * muncul berulang — itu akibat 302 ke skema custom yang gagal dirender
     * Chrome; halaman handoff `intent://` sekarang sudah memperbaikinya. */
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${encodeURIComponent(MOBILE_STATE_PREFIX + state)}&nonce=${encodeURIComponent(nonce)}&prompt=select_account`;

    return res.json({ success: true, url, state: MOBILE_STATE_PREFIX + state });
  } catch (error) {
    return replyAuthFailure(res, error);
  }
}

const parseCookies = (header) => {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  }
  return out;
};

/** GET /api/auth/google/callback — ujung OAuth direct (redirect web & handoff mobile). */
export async function googleCallback(req, res) {
  /* Tujuan redirect hanya boleh berasal dari konfigurasi atau allowlist —
   * tidak pernah dari `Host`/`X-Forwarded-Proto` mentah (VULN-04).
   */
  const frontendOrigin = resolveFrontendOrigin({ FRONTEND_ORIGIN }, req, ALLOWED_ORIGINS);

  if (!frontendOrigin) {
    logger.error('GOOGLE_OAUTH', 'Origin frontend tidak dapat ditentukan; redirect dibatalkan', {
      host: req.get('host') || null,
      forwardedProto: req.headers['x-forwarded-proto'] || null,
    });
    return res
      .status(500)
      .type('html')
      .send(
        '<!doctype html><html lang="id"><meta charset="utf-8">' +
          '<title>Login Google gagal</title>' +
          '<p>Origin frontend tidak dapat ditentukan. ' +
          'Set FRONTEND_ORIGIN di server, atau daftarkan origin aplikasi pada CORS_ORIGINS.</p>' +
          '</html>',
      );
  }

  let isMobile = false;
  /* Nonce hanya ada pada state yang diterbitkan `googleMobileStart`. Alur web
   * lama memakai cookie state dan tidak punya nonce → tetap kompatibel. */
  let expectedNonce = null;
  const failRedirect = (message, code = 'google_oauth') => {
    logger.warn('GOOGLE_OAUTH', message);
    if (isMobile) {
      return replyMobileHandoff(res, {
        status: 'failure',
        path: 'auth/failure',
        params: { error: code, message },
        message,
      });
    }
    const url = new URL('/login', frontendOrigin);
    url.searchParams.set('error', code);
    url.searchParams.set('message', message);
    return res.redirect(url.toString());
  };

  try {
    const { code, state, error: oauthError } = req.query;
    const rawState = typeof state === 'string' ? state : '';
    /* Penanda platform dibaca SEBELUM state ditebus/ditolak supaya kegagalan
     * (state kedaluwarsa, kode hilang, konsol Google error) tetap kembali ke
     * aplikasi lewat halaman handoff, bukan halaman /login web. */
    const mobileState = rawState.startsWith(MOBILE_STATE_PREFIX);
    const stateToRedeem = mobileState ? rawState.slice(MOBILE_STATE_PREFIX.length) : rawState;
    isMobile = mobileState;

    if (oauthError) return failRedirect(`Google mengembalikan kesalahan: ${oauthError}.`);
    if (!code) return failRedirect('Kode otorisasi tidak ditemukan.');
    if (!rawState) return failRedirect('State OAuth tidak ditemukan.');

    const cookies = parseCookies(req.headers.cookie || '');
    const expectedState = cookies.google_oauth_state;

    let validState = false;
    if (!mobileState && expectedState && expectedState === rawState) {
      validState = true;
      res.setHeader('Set-Cookie', 'google_oauth_state=; Path=/; Max-Age=0; SameSite=Lax');
    } else {
      const redeemed = await redeemOneTimeCode(stateToRedeem);
      if (redeemed && redeemed.kind === 'oauth_state' && redeemed.platform === 'mobile') {
        validState = true;
        isMobile = true;
        expectedNonce = typeof redeemed.nonce === 'string' ? redeemed.nonce : null;
      }
    }

    if (!validState) {
      return failRedirect(
        'State OAuth tidak cocok (kemungkinan CSRF). Coba lagi dari halaman masuk.',
      );
    }
    /* State mobile yang sah SELALU membawa nonce (diterbitkan bersama URL oleh
     * googleMobileStart). Bila nonce hilang — state lama dari sebelum deploy,
     * payload rusak, atau upaya memaksa jalur yang melewati pengecekan — jangan
     * lanjut: kalau tidak, `expectedNonce` kosong membuat verifikasi nonce
     * dilewati diam-diam. Alur web memang tidak punya nonce dan tidak terkena. */
    if (isMobile && !expectedNonce) {
      return failRedirect('Sesi masuk Google kedaluwarsa. Silakan ulangi dari aplikasi.');
    }

    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
    const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
    if (!CLIENT_ID || !CLIENT_SECRET) {
      return failRedirect('Konfigurasi Google OAuth di server belum lengkap.');
    }
    const REDIRECT_URI =
      process.env.GOOGLE_OAUTH_REDIRECT_URI || `${frontendOrigin}/api/auth/google/callback`;

    const identity = await verifyGoogleOAuthCode({
      code,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
      expectedNonce,
    });
    if (!identity.ok) return failRedirect(identity.message);

    const account = await findOrCreateGoogleUser({
      email: identity.email,
      name: identity.name,
      source: 'direct OAuth',
    });
    if (!account.ok) return failRedirect('Gagal membuat atau mengambil akun Google.');

    const token = createSessionToken(account.user);
    const user = toPublicUser(account.user);
    const sessionCode = await createOneTimeCode({ token, user });

    if (isMobile) {
      /* JANGAN balas 302 langsung ke `mobileappebook://…`: Chrome Custom Tab
       * tidak bisa merender skema custom sehingga tab tetap terlihat seperti
       * halaman login Google dan pengguna harus menutupnya manual. Halaman
       * handoff menavigasi ke `intent://` (menarik aplikasi ke depan) sambil
       * menampilkan status berhasil sebagai jangkar visual. */
      return replyMobileHandoff(res, {
        status: 'success',
        path: 'auth/success',
        params: { code: sessionCode },
      });
    }

    const successUrl = new URL('/auth/success', frontendOrigin);
    successUrl.searchParams.set('code', sessionCode);

    return res.redirect(successUrl.toString());
  } catch (error) {
    return replyAuthFailure(res, error);
  }
}

/* Menukar kode sekali-pakai dari redirect Google menjadi sesi (VULN-03).
 * Kode berumur 60 detik dan hangus pada percobaan pertama, berhasil atau tidak.
 */
export async function exchange(req, res) {
  const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
  try {
    const session = await exchangeSessionCode(code);

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Kode sesi tidak valid atau sudah kedaluwarsa. Silakan masuk ulang.',
      });
    }

    return res.json({ success: true, token: session.token, user: session.user });
  } catch (error) {
    return replyAuthFailure(res, error);
  }
}

/** GET /api/auth/me */
export async function me(req, res) {
  try {
    const user = await loadCurrentUser(req.user.id);
    return res.json({ success: true, user: toPublicUser(user || req.authUser) });
  } catch {
    return res.json({ success: true, user: toPublicUser(req.authUser) });
  }
}
