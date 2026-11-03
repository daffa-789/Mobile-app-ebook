/**
 * Service Layer — Otentikasi Google (Supabase access token & OAuth code langsung).
 *
 * Aturan §4.1 panduan arsitektur: logika bisnis MURNI — tidak menerima objek
 * `req`/`res` Express. Keluaran berupa objek hasil (`outcome`) atau Error
 * bertipe `statusCode`; pemetaan ke HTTP adalah tanggung jawab controller.
 *
 * Dua jalur masuk menghasilkan akun yang sama: `findOrCreateGoogleUser`
 * adalah titik temu keduanya, jadi ia sengaja diekspor untuk dipakai controller
 * pada jalur callback OAuth.
 */

import { OAuth2Client } from 'google-auth-library';
import { supabaseServer } from '../../db.js';
import { createSessionToken, generateId, normalizeEmail, toPublicUser } from '../../auth.js';
import { logger } from '../../logger.js';

/**
 * Menukar access_token Supabase (hasil login Google di klien) menjadi sesi
 * server. Klien Supabase anon dibuat dinamis supaya modul ini tidak memuat
 * SDK saat jalur ini tidak dipakai.
 */
export async function loginWithGoogleSupabase({ accessToken, googleName, googleEmail }) {
  if (!accessToken || !googleEmail) {
    return { ok: false, status: 400, message: 'Token dan informasi akun Google wajib diisi.' };
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supaUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supaAnonKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const supaAuth = createClient(supaUrl, supaAnonKey);
  const {
    data: { user: supaUser },
    error: authError,
  } = await supaAuth.auth.getUser(accessToken);
  if (authError || !supaUser) {
    return { ok: false, status: 401, message: 'Token Google tidak valid atau sudah kedaluwarsa.' };
  }

  const email = normalizeEmail(supaUser.email);
  const result = await findOrCreateGoogleUser({ email, name: googleName, source: 'Supabase Auth' });
  if (!result.ok) {
    throw new Error('Gagal membuat atau mengambil akun Google.');
  }

  return { ok: true, token: createSessionToken(result.user), user: toPublicUser(result.user) };
}

/**
 * Menukar authorization code OAuth Google menjadi identitas terverifikasi
 * (email + nama). Seluruh kegagalan langkah ini adalah kegagalan bisnis yang
 * dilaporkan sebagai pesan `message` — pemanggil (controller) yang memutuskan
 * bentuk respons (redirect HTML / JSON).
 */
export async function verifyGoogleOAuthCode({ code, clientId, clientSecret, redirectUri }) {
  const oauthClient = new OAuth2Client(clientId, clientSecret, redirectUri);

  let tokens;
  try {
    const response = await oauthClient.getToken(code);
    tokens = response.tokens;
  } catch (exchangeError) {
    logger.error('GOOGLE_OAUTH', 'Penukaran code dengan token gagal', {
      pesan: exchangeError.message,
    });
    return { ok: false, message: 'Penukaran kode OAuth dengan Google gagal.' };
  }
  if (!tokens?.id_token) {
    return { ok: false, message: 'Google tidak mengembalikan id_token.' };
  }

  let payload;
  try {
    const ticket = await oauthClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId,
    });
    payload = ticket.getPayload();
  } catch (verifyError) {
    logger.error('GOOGLE_OAUTH', 'Verifikasi id_token gagal', { pesan: verifyError.message });
    return { ok: false, message: 'id_token tidak valid atau tidak cocok dengan client ID kita.' };
  }
  if (!payload?.email_verified) {
    return { ok: false, message: 'Email Google belum diverifikasi oleh Google.' };
  }

  const email = normalizeEmail(payload.email);
  if (!email) return { ok: false, message: 'Email Google kosong.' };

  return { ok: true, email, name: payload.name };
}

/**
 * Cari pengguna berdasarkan email Google, atau buat baru. Balapan INSERT
 * (23505) diselesaikan dengan membaca ulang barisnya — pemenang balapan
 * menganggap pendaftarannya berhasil.
 * `source` hanya untuk label log ('Supabase Auth' / 'direct OAuth').
 */
export async function findOrCreateGoogleUser({ email, name, source }) {
  let { data: existingUser } = await supabaseServer
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (!existingUser) {
    const newId = generateId('usr');
    const newUser = {
      id: newId,
      name: name || email.split('@')[0],
      email,
      password: null,
      role: 'user',
      login_method: 'google',
      is_pro: false,
    };
    const { error: insertError } = await supabaseServer.from('users').insert([newUser]);
    if (insertError) {
      if (insertError.code === '23505') {
        const { data: raceUser } = await supabaseServer
          .from('users')
          .select('*')
          .eq('email', email)
          .maybeSingle();
        existingUser = raceUser;
      } else {
        throw insertError;
      }
    } else {
      existingUser = newUser;
    }
    logger.ok('AUTH', `Registrasi akun baru via Google (${source})`, {
      email,
      id: existingUser?.id,
    });
  } else {
    logger.ok('AUTH', `Login via Google (${source})`, { email, role: existingUser.role || 'user' });
  }

  if (!existingUser) return { ok: false };
  return { ok: true, user: existingUser };
}
