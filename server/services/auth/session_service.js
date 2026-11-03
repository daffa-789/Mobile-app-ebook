/**
 * Service Layer — Sesi Otentikasi (login kredensial, token sesi, identitas terkini).
 *
 * Aturan §4.1 panduan arsitektur: logika bisnis MURNI — tidak menerima objek
 * `req`/`res` Express. Keluaran berupa objek hasil (`outcome`) atau Error
 * bertipe `statusCode`; pemetaan ke HTTP adalah tanggung jawab controller.
 */

import { supabaseServer } from '../../db.js';
import { createSessionToken, normalizeEmail, toPublicUser, verifyPassword } from '../../auth.js';
import { logger } from '../../logger.js';
import { loginSchema } from '../../lib/validate.js';
import { redeemOneTimeCode } from '../../lib/oneTimeCode.js';
import {
  GOOGLE_ACCOUNT_MESSAGE,
  INVALID_CREDENTIALS_MESSAGE,
  firstIssueMessage,
} from './messages.js';

/**
 * Login email/password. Pesan galat dibedakan antara kredensial salah dan
 * akun yang sebenarnya terdaftar lewat Google (tanpa password) supaya
 * pengguna diarahkan ke tombol yang tepat.
 *
 * @param {object} params - Kredensial pengguna
 * @param {string} [params.email] - Alamat email pengguna
 * @param {string} [params.identifier] - Alias email masukan alternatif
 * @param {string} params.password - Kata sandi plaintext
 * @returns {Promise<{ ok: boolean, status?: number, message?: string, token?: string, user?: object }>} Hasil otentikasi
 */
export async function authenticateWithPassword({ email, identifier, password }) {
  const userEmail = normalizeEmail(email || identifier);

  const parsed = loginSchema.safeParse({ email: userEmail, password });
  if (!parsed.success) {
    return { ok: false, status: 400, message: firstIssueMessage(parsed) };
  }

  const { data: user, error: lookupError } = await supabaseServer
    .from('users')
    .select('*')
    .eq('email', userEmail)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (!user) {
    return { ok: false, status: 401, message: INVALID_CREDENTIALS_MESSAGE };
  }

  const passwordOk = await verifyPassword(password, user.password);
  if (!passwordOk) {
    return {
      ok: false,
      status: 401,
      message: user.password ? INVALID_CREDENTIALS_MESSAGE : GOOGLE_ACCOUNT_MESSAGE,
    };
  }

  logger.ok('AUTH', 'Login berhasil', { email: userEmail, role: user.role || 'user' });

  return { ok: true, token: createSessionToken(user), user: toPublicUser(user) };
}

/** Menukar kode sesi sekali-pakai (VULN-03) menjadi token + pengguna. */
export async function exchangeSessionCode(code) {
  const session = await redeemOneTimeCode(code);
  if (!session) return null;

  logger.ok('AUTH', 'Kode sesi sekali-pakai ditukar', { userId: session.user?.id });
  return session;
}

/** Memuat ulang baris pengguna terkini untuk GET /me (null bila gagal). */
export async function loadCurrentUser(userId) {
  try {
    const { data: user } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    return user || null;
  } catch {
    return null;
  }
}
