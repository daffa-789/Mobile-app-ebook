/**
 * Aturan saluran kode OTP — murni (tidak membaca env / database) supaya bisa
 * diuji langsung.
 *
 * Keputusan pemilik (26 Nov 2026):
 *  - WhatsApp (Fonnte) HANYA dipakai untuk pemulihan kata sandi, dan hanya
 *    bila pengguna memakai nomor telepon.
 *  - Kode PEMDAFTARAN selalu lewat email; lewat email juga tetap tersedia
 *    untuk pemulihan. Pengingat agenda memakai Web Push, bukan WA/email.
 */

/** 'reset' untuk pemulihan kata sandi (menerima 'reset' dan 'password_reset'), selain itu 'register'. */
export const normalizeOtpPurpose = (rawPurpose) =>
  rawPurpose === 'reset' || rawPurpose === 'password_reset' ? 'reset' : 'register';

/**
 * Saluran pengiriman yang boleh dipakai. `method` dari klien hanya dihormati
 * untuk tujuan reset: permintaan kirim ulang kode pendaftaran lewat WhatsApp
 * dipaksa kembali ke email.
 */
export const resolveOtpChannel = ({ method, purpose } = {}) => {
  if (normalizeOtpPurpose(purpose) === 'register') return 'email';
  return method === 'whatsapp' ? 'whatsapp' : 'email';
};
