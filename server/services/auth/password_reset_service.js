/**
 * Service Layer — Pemulihan Kata Sandi (OTP reset → password baru).
 *
 * Aturan §4.1 panduan arsitektur: logika bisnis MURNI — tidak menerima objek
 * `req`/`res` Express. Keluaran berupa objek hasil (`outcome`) atau Error
 * bertipe `statusCode`; pemetaan ke HTTP adalah tanggung jawab controller.
 *
 * Anti-enumerasi: modul ini hanya mengembalikan `kind: 'uniform-*'` dan
 * controller yang mengganti `kind` itu dengan `RESET_UNIFORM_*`
 * (`./messages.js`) — jangan menambah cabang pesan di sini.
 */

import { supabaseServer } from '../../db.js';
import { hashPassword, normalizeEmail } from '../../auth.js';
import { canExposeDevOtp, consumeOtp, issueOtp } from '../../lib/otp.js';
import { deleteOtpByEmailPurpose, deleteOtpById } from '../../otpStore.js';
import { sendGoogleAccountEmail, isMailerConfigured } from '../../mailer.js';
import { logger } from '../../logger.js';
import { normalizePhone, isValidPhone } from '../../whatsapp.js';

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
