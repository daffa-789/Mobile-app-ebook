/**
 * Modul utilitas waktu server berzona waktu Indonesia Barat (WIB / Asia/Jakarta).
 *
 * @module server/lib/time
 */

const WIB_TIME_ZONE = 'Asia/Jakarta';

const DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: WIB_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * Mengembalikan string tanggal format ISO YYYY-MM-DD dalam zona waktu WIB (Asia/Jakarta).
 *
 * @param {Date} [date=new Date()] - Objek tanggal referensi
 * @returns {string} String tanggal ISO dalam WIB (misal: '2026-11-03')
 * @example
 * todayWib() // => '2026-11-03'
 */
export const todayWib = (date = new Date()) => DATE_FORMATTER.format(date);
