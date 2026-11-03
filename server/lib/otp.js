import crypto from 'crypto';
import { isMailerConfigured, sendOtpEmail } from '../mailer.js';
import { sendOtpWhatsApp } from '../whatsapp.js';
import {
  deleteOtpByEmailPurpose,
  deleteOtpById,
  findLatestOtp,
  incrementOtpAttempts,
  insertOtp,
} from '../otpStore.js';
import { logger } from '../logger.js';

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

const hashOtp = (identifier, purpose, code) =>
  crypto.createHash('sha256').update(`${purpose}:${identifier}:${code}`).digest('hex');

const IPV4_MAPPED_PREFIX = '::ffff:';

const isLoopbackAddress = (ip) => {
  const value = String(ip ?? '')
    .trim()
    .toLowerCase();
  if (!value) return false;
  const normalized = value.startsWith(IPV4_MAPPED_PREFIX)
    ? value.slice(IPV4_MAPPED_PREFIX.length)
    : value;
  return normalized === '::1' || normalized.startsWith('127.');
};

// Bocor tidaknya OTP ke respons HTTP: butuh flag eksplisit, bukan sekadar
// NODE_ENV=development, dan hanya untuk permintaan dari mesin yang sama.
export const canExposeDevOtp = (env = process.env, ip = null) => {
  if (String(env.EXPOSE_DEV_OTP ?? '') !== '1') return false;
  if (env.NODE_ENV === 'production') return false;
  return ip === null ? true : isLoopbackAddress(ip);
};

export function resendCooldownRemaining(row) {
  if (!row?.created_at) return 0;
  const issuedAt = new Date(row.created_at).getTime();
  if (Number.isNaN(issuedAt)) return 0;
  const elapsed = Date.now() - issuedAt;
  if (elapsed >= OTP_RESEND_COOLDOWN_MS) return 0;
  return Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
}

export async function issueOtp({
  email,
  phone,
  identifier,
  purpose,
  payload = null,
  deliveryMethod = 'email',
}) {
  const target = identifier || (deliveryMethod === 'whatsapp' && phone ? phone : email);
  const code = String(crypto.randomInt(100000, 1000000));

  await deleteOtpByEmailPurpose(target, purpose);
  await insertOtp({
    email: target,
    purpose,
    codeHash: hashOtp(target, purpose, code),
    payload,
    expiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString(),
  });

  let deliveredBy = 'demo';
  if (deliveryMethod === 'whatsapp' && (phone || target)) {
    try {
      const res = await sendOtpWhatsApp({ phone: phone || target, code, purpose });
      deliveredBy = res.deliveredBy;
    } catch (waError) {
      logger.error('WHATSAPP', 'Gagal mengirim kode via WA, memakai mode demo', {
        pesan: waError.message,
      });
      deliveredBy = 'demo';
    }
  } else if (isMailerConfigured() && (email || target)) {
    try {
      await sendOtpEmail(email || target, code, purpose);
      deliveredBy = 'email';
    } catch (mailError) {
      logger.error('MAIL', 'Gagal mengirim kode, memakai mode pengembangan', {
        pesan: mailError.message,
      });
      deliveredBy = 'demo';
    }
  }

  return { code, deliveredBy, identifier: target };
}

export async function consumeOtp({ email, phone, identifier, purpose, code }) {
  const target = identifier || phone || email;
  const row = await findLatestOtp(target, purpose);

  if (!row) {
    return {
      ok: false,
      status: 400,
      message: 'Kode verifikasi tidak ditemukan. Minta kode baru terlebih dahulu.',
    };
  }
  if ((row.attempts || 0) >= OTP_MAX_ATTEMPTS) {
    await deleteOtpById(row.id);
    return { ok: false, status: 429, message: 'Percobaan kode terlalu banyak. Minta kode baru.' };
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await deleteOtpById(row.id);
    return {
      ok: false,
      status: 400,
      message: 'Kode verifikasi sudah kedaluwarsa. Minta kode baru.',
    };
  }
  if (hashOtp(target, purpose, code) !== row.code_hash) {
    await incrementOtpAttempts(row.id);
    return { ok: false, status: 400, message: 'Kode verifikasi salah.' };
  }
  return { ok: true, row };
}
