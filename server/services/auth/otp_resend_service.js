/**
 * Service Layer — Kirim Ulang Kode Verifikasi (tujuan register & reset).
 *
 * Aturan §3.1 panduan arsitektur: logika bisnis MURNI — tidak menerima objek
 * `req`/`res` Express. Keluaran berupa objek hasil (`outcome`) atau Error
 * bertipe `statusCode`; pemetaan ke HTTP adalah tanggung jawab controller.
 *
 * Dipakai SATU endpoint untuk dua tujuan, jadi modul ini berdiri sendiri
 * alih-alih menumpang pada modul registrasi atau pemulihan sandi.
 */

import { supabaseServer } from '../../db.js';
import { normalizeEmail } from '../../auth.js';
import { canExposeDevOtp, issueOtp, resendCooldownRemaining } from '../../lib/otp.js';
import { findLatestOtp } from '../../otpStore.js';
import { logger } from '../../logger.js';
import { normalizePhone } from '../../whatsapp.js';
import { OTP_VALIDITY_LABEL } from './messages.js';

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
