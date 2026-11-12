import './env.js';
import { logger } from './logger.js';
import {
  getActiveWhatsAppProvider,
  getProviderByName,
  listSupportedProviders,
} from './providers/index.js';
import { isValidPhoneNumber } from 'libphonenumber-js';

/**
 * Normalisasi nomor HP (Indonesia maupun internasional) ke format standar angka (E.164 tanpa +).
 * Contoh:
 *  - '08123456789'   -> '628123456789'
 *  - '+62812345678'  -> '62812345678'
 *  - '+60123456789'  -> '60123456789'
 *  - '8123456789'    -> '628123456789'
 */
export const normalizePhone = (raw) => {
  if (!raw) return '';
  let cleaned = String(raw)
    .trim()
    .replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  }
  if (cleaned.startsWith('08')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8') && cleaned.length >= 9 && cleaned.length <= 13) {
    cleaned = '62' + cleaned;
  }
  const e164 = cleaned.replace(/^\+/, '');
  if (!/^[1-9][0-9]{7,14}$/.test(e164)) return '';
  const valid = isValidPhoneNumber(e164, 'ID');
  return valid ? e164 : cleaned;
};

/**
 * Validasi nomor HP (mendukung Indonesia 628xxx maupun format internasional 8-15 digit).
 * Shape E.164 (tanpa plus, 8–15 digit, tidak diawali 0) dicek manual, lalu
 * kesesuaiannya dicek lewat libphonenumber-js (region ID).
 */
export const isValidPhone = (raw) => {
  const normalized = normalizePhone(raw);
  const e164 = normalized.replace(/^\+/, '');
  // Standar E.164 tanpa tanda plus: 8 sampai 15 digit angka, tidak diawali 0
  if (!/^[1-9][0-9]{7,14}$/.test(e164)) return false;
  return isValidPhoneNumber(e164, 'ID');
};

/**
 * Memeriksa apakah provider WhatsApp aktif sudah terkonfigurasi secara nyata
 * (bukan sekadar fallback mode demo).
 */
export const isWhatsAppConfigured = () => {
  const active = getActiveWhatsAppProvider();
  return active.isConfigured() && active.name !== 'demo';
};

/**
 * Mendapatkan informasi metadata provider yang sedang aktif.
 */
export const getWhatsAppProviderInfo = () => {
  const active = getActiveWhatsAppProvider();
  return {
    activeProvider: active.name,
    isConfigured: isWhatsAppConfigured(),
    supportedProviders: listSupportedProviders(),
  };
};

/**
 * Mengirim pesan WhatsApp berisi kode OTP menggunakan provider aktif.
 * Mendukung Fonnte serta mode demo.
 */
export async function sendOtpWhatsApp({ phone, code, purpose = 'register' }) {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    throw new Error('Nomor telepon tujuan tidak valid.');
  }

  const provider = getActiveWhatsAppProvider();

  // Jika provider nyata aktif dan terkonfigurasi, coba kirim
  if (provider.isConfigured() && provider.name !== 'demo') {
    try {
      const result = await provider.sendOtp({ phone: normalized, code, purpose });
      return result;
    } catch (err) {
      logger.error(
        'WHATSAPP',
        `Gagal kirim via gateway WA ${provider.name} (${err.message}). Menggunakan mode demo.`,
        {
          phone: normalized,
          provider: provider.name,
        },
      );
      return { deliveredBy: 'demo', success: false, error: err.message };
    }
  }

  // Fallback demo/development jika belum ada kredensial gateway yang aktif
  const demoResult = await getProviderByName('demo').sendOtp({ phone: normalized, code, purpose });
  return demoResult;
}
