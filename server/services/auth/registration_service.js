/**
 * Service Layer — Registrasi Akun (terbit OTP → tukar jadi baris pengguna).
 *
 * Aturan §4.1 panduan arsitektur: logika bisnis MURNI — tidak menerima objek
 * `req`/`res` Express. Keluaran berupa objek hasil (`outcome`) atau Error
 * bertipe `statusCode`; pemetaan ke HTTP adalah tanggung jawab controller.
 */

import { supabaseServer } from '../../db.js';
import {
  createSessionToken,
  generateId,
  hashPassword,
  normalizeEmail,
  toPublicUser,
} from '../../auth.js';
import { canExposeDevOtp, consumeOtp, issueOtp } from '../../lib/otp.js';
import { deleteOtpById } from '../../otpStore.js';
import { logger } from '../../logger.js';
import { registerSchema } from '../../lib/validate.js';
import { normalizePhone } from '../../whatsapp.js';
import { OTP_VALIDITY_LABEL, firstIssueMessage } from './messages.js';

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
