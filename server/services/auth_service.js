/**
 * Service Layer — Modul Otentikasi (Fase 3 roadmap arsitektur).
 *
 * Aturan §4.1 panduan arsitektur: logika bisnis MURNI — tidak menerima objek
 * `req`/`res` Express. Masukan berupa data polos (DTO yang sudah diekstrak
 * controller), keluaran berupa objek hasil (`outcome`) atau Error bertipe
 * `statusCode`, sehingga seluruh alur dapat di-unit-test tanpa server.
 *
 * Konvensi keluaran:
 *  - `{ ok: false, status, message }` — penolakan bisnis yang diharapkan
 *    (validasi gagal, konflik unik, kredensial salah); `status` adalah DATA
 *    semantik yang diteruskan controller ke HTTP, bukan pemformatan.
 *  - `{ ok: true, ... }` — sukses beserta datanya.
 *  - Error dibuang untuk kegagalan tak terduga (database mati, dsb.) —
 *    controller memetakannya lewat `replyAuthFailure`.
 */

import { OAuth2Client } from 'google-auth-library';
import { supabaseServer } from '../db.js';
import {
  createSessionToken,
  generateId,
  hashPassword,
  normalizeEmail,
  toPublicUser,
  verifyPassword,
} from '../auth.js';
import { canExposeDevOtp, consumeOtp, issueOtp, resendCooldownRemaining } from '../lib/otp.js';
import { findLatestOtp, deleteOtpByEmailPurpose, deleteOtpById } from '../otpStore.js';
import { sendGoogleAccountEmail, isMailerConfigured } from '../mailer.js';
import { logger } from '../logger.js';
import { loginSchema, registerSchema } from '../lib/validate.js';
import { normalizePhone, isValidPhone } from '../whatsapp.js';
import { redeemOneTimeCode } from '../lib/oneTimeCode.js';

export const INVALID_CREDENTIALS_MESSAGE =
  'Email atau password belum sesuai. Jika Anda menggunakan akun Google, silakan klik tombol "Login dengan Google" di bawah.';

export const GOOGLE_ACCOUNT_MESSAGE =
  'Akun ini terdaftar lewat Google. Silakan klik tombol "Login dengan Google" di bawah.';

/* Respons seragam anti-enumerasi: permintaan reset untuk akun yang tidak
 * dikenal TIDAK boleh dibedakan dari akun yang benar-benar dikirimi kode. */
export const RESET_UNIFORM_RESPONSE = {
  success: true,
  message: 'Jika akun tersebut terdaftar, kode pemulihan telah dikirim dan berlaku 10 menit.',
};

export const RESET_UNIFORM_WA_RESPONSE = {
  success: true,
  method: 'whatsapp',
  message:
    'Jika nomor tersebut terdaftar, kode pemulihan telah dikirim ke WhatsApp dan berlaku 10 menit.',
};

const OTP_VALIDITY_LABEL = 'berlaku 10 menit';

const firstIssueMessage = (parsed) => parsed.error.issues[0]?.message || 'Input tidak valid';

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

/**
 * Memulai pendaftaran: validasi, cek keunikan email/telepon, lalu terbitkan
 * OTP. Pendaftaran selalu diprioritaskan melalui Email untuk efisiensi biaya
 * & proteksi anti-spam. Pengirim `demo` berarti pengiriman gagal — kode tetap
 * dibuat dan boleh diekspos ke developer (gerbang canExposeDevOtp).
 *
 * @param {object} params - Data formulir registrasi
 * @param {string} params.name - Nama lengkap calon pengguna
 * @param {string} params.email - Alamat email
 * @param {string} params.phone - Nomor telepon seluler
 * @param {string} params.password - Kata sandi yang dipilih
 * @param {string} [params.clientIp] - Alamat IP klien untuk cooldown
 * @returns {Promise<{ ok: boolean, status?: number, message?: string, method?: string, devOtp?: string }>} Hasil inisiasi registrasi
 */
export async function beginRegistration({ name, email, phone, password, clientIp }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);
  // Pendaftaran selalu diprioritaskan melalui Email untuk efisiensi biaya & proteksi anti-spam
  const chosenMethod = 'email';

  const parsed = registerSchema.safeParse({
    name,
    email: normalizedEmail,
    phone: normalizedPhone,
    password,
    deliveryMethod: chosenMethod,
  });
  if (!parsed.success) {
    return { ok: false, status: 400, message: firstIssueMessage(parsed) };
  }

  const { data: existingEmail } = await supabaseServer
    .from('users')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle();
  if (existingEmail) {
    return {
      ok: false,
      status: 409,
      message: 'Email sudah terdaftar. Silakan masuk atau gunakan email lain.',
    };
  }

  if (normalizedPhone) {
    const { data: existingPhone } = await supabaseServer
      .from('users')
      .select('id')
      .eq('phone', normalizedPhone)
      .maybeSingle();
    if (existingPhone) {
      return {
        ok: false,
        status: 409,
        message:
          'Nomor WhatsApp sudah terdaftar pada akun lain. Silakan masuk atau gunakan nomor lain.',
      };
    }
  }

  const targetIdentifier = chosenMethod === 'whatsapp' ? normalizedPhone : normalizedEmail;

  const { code, deliveredBy } = await issueOtp({
    email: normalizedEmail,
    phone: normalizedPhone,
    identifier: targetIdentifier,
    deliveryMethod: chosenMethod,
    purpose: 'register',
    payload: {
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      deliveryMethod: chosenMethod,
      passwordHash: await hashPassword(password),
    },
  });

  logger.info('OTP', 'Kode pendaftaran dikirim', {
    identifier: targetIdentifier,
    method: chosenMethod,
    deliveredBy,
  });

  const targetLabel =
    chosenMethod === 'whatsapp' ? `nomor WhatsApp ${normalizedPhone}` : `email ${normalizedEmail}`;
  const deliveryFailed = deliveredBy === 'demo';

  return {
    ok: true,
    status: 202,
    body: {
      email: normalizedEmail,
      phone: normalizedPhone,
      identifier: targetIdentifier,
      deliveryMethod: chosenMethod,
      deliveredBy,
      message: deliveryFailed
        ? `Kode verifikasi dibuat, tetapi pengiriman ke ${targetLabel} gagal. Coba kirim ulang atau gunakan metode lain.`
        : `Kode verifikasi telah dikirim ke ${targetLabel} dan ${OTP_VALIDITY_LABEL}.`,
      devOtp: deliveryFailed && canExposeDevOtp(process.env, clientIp) ? code : undefined,
    },
  };
}

/**
 * Menuntaskan pendaftaran: menukar kode OTP menjadi baris pengguna baru.
 * Konflik unik (23505) saat INSERT dibedakan berdasarkan pesan PostgreSQL —
 * telepon vs email — lalu OTP dihanguskan supaya tidak bisa dipakai ulang.
 */
export async function completeRegistration({
  identifier: rawIdentifier,
  email: rawEmail,
  phone: rawPhone,
  code,
}) {
  const email = rawEmail ? normalizeEmail(rawEmail) : '';
  const phone = rawPhone ? normalizePhone(rawPhone) : '';
  const identity = rawIdentifier ? String(rawIdentifier).trim() : '';
  const finalIdentifier = identity || phone || email;

  if (!finalIdentifier || !code) {
    return { ok: false, status: 400, message: 'Identitas akun dan kode verifikasi wajib diisi.' };
  }

  const result = await consumeOtp({ identifier: finalIdentifier, purpose: 'register', code });
  if (!result.ok) {
    return { ok: false, status: result.status, message: result.message };
  }

  const payload = result.row.payload || {};
  if (!payload.name || !payload.passwordHash) {
    await deleteOtpById(result.row.id);
    return {
      ok: false,
      status: 400,
      message: 'Data pendaftaran tidak lengkap. Silakan daftar ulang.',
    };
  }

  const newId = generateId('usr');
  const newUser = {
    id: newId,
    name: payload.name,
    email: payload.email || email,
    phone: payload.phone || phone || null,
    password: payload.passwordHash,
    role: 'user',
    login_method: 'email',
    is_pro: false,
  };

  const { error: insertError } = await supabaseServer.from('users').insert([newUser]);
  if (insertError) {
    if (insertError.code === '23505') {
      await deleteOtpById(result.row.id);
      const detail = insertError.message?.toLowerCase().includes('phone')
        ? 'Nomor WhatsApp sudah terdaftar.'
        : 'Email sudah terdaftar.';
      return { ok: false, status: 409, message: `${detail} Silakan masuk.` };
    }
    throw insertError;
  }

  await deleteOtpById(result.row.id);

  logger.ok('AUTH', 'Registrasi akun baru berhasil', {
    email: newUser.email,
    phone: newUser.phone,
    id: newId,
  });

  return {
    ok: true,
    token: createSessionToken(newUser),
    user: toPublicUser(newUser),
  };
}

/**
 * Meminta kode pemulihan password via WhatsApp atau email.
 *
 * Setiap cabang WAJIB menjawab dengan pesan seragam (RESET_UNIFORM_*)
 * bila akun tidak dikenal atau terdaftar lewat Google — gap enumerasi akun
 * ditutup dengan tidak memberi tahu peminta apakah akun ada atau tidak.
 */
export async function requestPasswordReset({ method, email: rawEmail, phone: rawPhone, clientIp }) {
  if (method === 'whatsapp') {
    const normalizedPhone = normalizePhone(rawPhone);
    if (!normalizedPhone || !isValidPhone(normalizedPhone)) {
      return {
        ok: false,
        status: 400,
        message: 'Masukkan nomor WhatsApp yang valid (contoh: 081234567890).',
      };
    }

    const { data: account } = await supabaseServer
      .from('users')
      .select('id, email, phone, login_method')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (!account) {
      logger.info('OTP', 'Permintaan reset untuk nomor WA tak terdaftar', {
        phone: normalizedPhone,
      });
      return { ok: true, kind: 'uniform-wa' };
    }

    if (account.login_method === 'google') {
      logger.info('OTP', 'Reset password ditolak: akun terdaftar lewat Google', {
        phone: normalizedPhone,
      });
      return { ok: true, kind: 'uniform-wa' };
    }

    const { code, deliveredBy } = await issueOtp({
      phone: normalizedPhone,
      identifier: normalizedPhone,
      purpose: 'reset',
      deliveryMethod: 'whatsapp',
    });
    const exposeDevOtp = deliveredBy === 'demo' && canExposeDevOtp(process.env, clientIp);

    logger.info('OTP', 'Permintaan reset password via WhatsApp', {
      phone: normalizedPhone,
      deliveredBy,
      devOtpExposed: exposeDevOtp,
    });

    return {
      ok: true,
      kind: 'sent-wa',
      phone: normalizedPhone,
      identifier: normalizedPhone,
      devOtp: exposeDevOtp ? code : undefined,
    };
  }

  // Metode Email
  const email = normalizeEmail(rawEmail || rawPhone);
  if (!email || !email.includes('@')) {
    return { ok: false, status: 400, message: 'Masukkan alamat email yang valid.' };
  }

  const { data: account } = await supabaseServer
    .from('users')
    .select('id, login_method')
    .eq('email', email)
    .maybeSingle();

  if (!account) {
    logger.info('OTP', 'Permintaan reset untuk email tak terdaftar (respons disamakan)', { email });
    return { ok: true, kind: 'uniform-email' };
  }

  if (account.login_method === 'google') {
    let deliveredBy = 'demo';
    if (isMailerConfigured()) {
      try {
        await sendGoogleAccountEmail(email);
        deliveredBy = 'email';
      } catch (mailError) {
        logger.error('MAIL', 'Gagal mengirim pemberitahuan akun Google', {
          pesan: mailError.message,
        });
      }
    }
    logger.info('OTP', 'Reset password ditolak: akun terdaftar lewat Google', {
      email,
      deliveredBy,
    });
    return { ok: true, kind: 'uniform-email' };
  }

  const { code, deliveredBy } = await issueOtp({
    email,
    identifier: email,
    purpose: 'reset',
    deliveryMethod: 'email',
  });
  const exposeDevOtp = deliveredBy === 'demo' && canExposeDevOtp(process.env, clientIp);

  logger.info('OTP', 'Permintaan reset password', {
    email,
    deliveredBy,
    devOtpExposed: exposeDevOtp,
  });

  return {
    ok: true,
    kind: 'sent-email',
    identifier: email,
    devOtp: exposeDevOtp ? code : undefined,
  };
}

/**
 * Menetapkan password baru memakai kode OTP reset. Akun Google ditolak dengan
 * pesan khusus dan OTP-nya dihanguskan — akun tanpa password tidak boleh
 * diberi password lewat jalur reset.
 */
export async function resetPassword({
  method,
  email: rawEmail,
  phone: rawPhone,
  identifier,
  code,
  password,
}) {
  const target =
    method === 'whatsapp'
      ? normalizePhone(rawPhone || identifier)
      : normalizeEmail(rawEmail || identifier);

  if (!target || !code) {
    return { ok: false, status: 400, message: 'Identitas akun dan kode verifikasi wajib diisi.' };
  }
  if (password.length < 8) {
    return { ok: false, status: 400, message: 'Password baru minimal 8 karakter.' };
  }

  let userLookup = supabaseServer.from('users').select('id, login_method');
  userLookup =
    method === 'whatsapp' ? userLookup.eq('phone', target) : userLookup.eq('email', target);
  const { data: targetAccount } = await userLookup.maybeSingle();

  if (targetAccount?.login_method === 'google') {
    await deleteOtpByEmailPurpose(target, 'reset');
    logger.warn('OTP', 'Reset password ditolak: akun terdaftar lewat Google', { target });
    return {
      ok: false,
      status: 400,
      message:
        'Akun ini terdaftar melalui Google sehingga tidak memiliki password. Silakan masuk dengan tombol "Login dengan Google".',
    };
  }

  const result = await consumeOtp({ identifier: target, purpose: 'reset', code });
  if (!result.ok) {
    return { ok: false, status: result.status, message: result.message };
  }

  await deleteOtpById(result.row.id);

  let userUpdate = supabaseServer.from('users').update({ password: await hashPassword(password) });
  userUpdate =
    method === 'whatsapp' ? userUpdate.eq('phone', target) : userUpdate.eq('email', target);
  await userUpdate;

  logger.ok('OTP', 'Password berhasil direset', { target, method });
  return { ok: true };
}

/**
 * Mengirim ulang kode verifikasi (tujuan register/reset) dengan masa tunggu.
 * Untuk tujuan reset, akun tak dikenal/Google dijawab sukses palsu — tetap
 * anti-enumerasi tanpa mengungkap keberadaan akun.
 */
export async function resendVerificationOtp({
  method,
  identifier: rawTarget,
  purpose: rawPurpose,
  clientIp,
}) {
  const target = method === 'whatsapp' ? normalizePhone(rawTarget) : normalizeEmail(rawTarget);
  const purpose = rawPurpose === 'reset' ? 'reset' : 'register';

  if (!target) {
    return { ok: false, status: 400, message: 'Identitas tujuan verifikasi tidak valid.' };
  }

  const existing = await findLatestOtp(target, purpose);
  if (!existing) {
    return {
      ok: false,
      status: 400,
      message: 'Tidak ada permintaan verifikasi yang aktif. Silakan ulangi dari awal.',
    };
  }
  if (purpose === 'register' && !existing.payload) {
    return {
      ok: false,
      status: 400,
      message: 'Data pendaftaran tidak ditemukan. Silakan daftar ulang dari awal.',
    };
  }

  const cooldown = resendCooldownRemaining(existing);
  if (cooldown > 0) {
    return {
      ok: false,
      status: 429,
      retryAfterSeconds: cooldown,
      message: `Mohon tunggu ${cooldown} detik sebelum meminta kode baru.`,
    };
  }

  if (purpose === 'reset') {
    let checkLookup = supabaseServer.from('users').select('login_method');
    checkLookup =
      method === 'whatsapp' ? checkLookup.eq('phone', target) : checkLookup.eq('email', target);
    const { data: account } = await checkLookup.maybeSingle();
    if (!account || account.login_method === 'google') {
      return { ok: true, kind: 'silent-success' };
    }
  }

  const { code, deliveredBy } = await issueOtp({
    identifier: target,
    phone: method === 'whatsapp' ? target : null,
    email: method === 'email' ? target : null,
    deliveryMethod: method,
    purpose,
    payload: existing.payload ?? null,
  });
  const exposeDevOtp = deliveredBy === 'demo' && canExposeDevOtp(process.env, clientIp);

  logger.info('OTP', 'Kode dikirim ulang', { identifier: target, method, purpose, deliveredBy });

  const destinationLabel = method === 'whatsapp' ? 'WhatsApp' : 'email';
  const deliveryFailed = deliveredBy === 'demo';

  return {
    ok: true,
    kind: 'sent',
    body: {
      identifier: target,
      method,
      deliveredBy,
      message: deliveryFailed
        ? `Kode baru dibuat, tetapi pengiriman ke ${destinationLabel} gagal. Coba lagi atau gunakan metode lain.`
        : `Kode baru telah dikirim ke ${destinationLabel} dan ${OTP_VALIDITY_LABEL}.`,
      devOtp: exposeDevOtp ? code : undefined,
    },
  };
}

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
