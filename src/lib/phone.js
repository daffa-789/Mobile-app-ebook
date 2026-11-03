/**
 * Utilitas normalisasi dan validasi nomor telepon Indonesia.
 *
 * Nilai yang disimpan dan dikirim ke server selalu berawalan 62 (format yang dipakai
 * Fonnte), sedangkan yang dilihat manusia selalu berawalan 0 tanpa spasi.
 *
 * @module src/lib/phone
 */

const ID_PREFIX = '62';

const digitsOnly = (raw) => String(raw ?? '').replace(/[^0-9]/g, '');

/**
 * Ubah 08xx, +62xx, atau 62xx menjadi format baku 628xx.
 *
 * @param {string|number|null|undefined} raw - Nomor telepon mentah
 * @returns {string} Nomor yang dinormalisasi dengan prefix 62
 * @example normalizePhone('08123456789') // => '628123456789'
 */
export const normalizePhone = (raw) => {
  const digits = digitsOnly(raw);
  if (!digits) return '';
  if (digits.startsWith('0')) return ID_PREFIX + digits.slice(1);
  if (digits.startsWith(ID_PREFIX)) return digits;
  if (digits.startsWith('8')) return ID_PREFIX + digits;
  return digits;
};

/**
 * Ubah format 62xx menjadi 08xx yang ramah pengguna untuk tampilan UI.
 *
 * @param {string|number|null|undefined} raw - Nomor telepon mentah atau ternormalisasi
 * @returns {string} Nomor tampilan berawalan 0
 * @example displayPhone('628123456789') // => '08123456789'
 */
export const displayPhone = (raw) => {
  const normalized = normalizePhone(raw);
  if (normalized.length > ID_PREFIX.length && normalized.startsWith(ID_PREFIX)) {
    return '0' + normalized.slice(ID_PREFIX.length);
  }
  return normalized;
};

/**
 * Periksa apakah nomor telepon merupakan nomor seluler Indonesia yang valid (628 diikuti 7–12 digit).
 *
 * @param {string|number|null|undefined} raw - Nomor telepon yang akan diperiksa
 * @returns {boolean} True jika format nomor valid
 * @example isValidPhone('081234567890') // => true
 */
export const isValidPhone = (raw) => /^628\d{7,12}$/.test(normalizePhone(raw));
