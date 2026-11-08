/**
 * @file mobile-app/src/lib/calendar.js
 * @description Perhitungan kalender murni (tanpa React) untuk layar Agenda:
 * grid bulan, label tanggal Indonesia, dan pemetaan agenda ke hari.
 */

export const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const MONTH_ABBREVIATIONS = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MEI',
  'JUN',
  'JUL',
  'AGU',
  'SEP',
  'OKT',
  'NOV',
  'DES',
];

/** Nama hari lengkap, index mengikuti `Date.prototype.getDay()` (0 = Ahad). */
export const DAY_NAMES = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/** Header grid kalender; kolom pertama Senin seperti tata letak desain. */
export const DAY_HEADERS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Ahd'];

/**
 * Jumlah hari dalam satu bulan.
 *
 * @param {number} year - Tahun penuh, contoh 2026
 * @param {number} monthIndex - Index bulan, 0 = Januari
 * @returns {number}
 */
export const daysInMonth = (year, monthIndex) => new Date(year, monthIndex + 1, 0).getDate();

/**
 * Banyak sel kosong sebelum tanggal 1 agar grid selalu mulai dari kolom Senin.
 *
 * @param {number} year
 * @param {number} monthIndex
 * @returns {number} 0..6
 */
export const leadingBlankCells = (year, monthIndex) =>
  (new Date(year, monthIndex, 1).getDay() + 6) % 7;

/**
 * Label bulan untuk judul kalender, contoh "November 2026".
 *
 * @param {number} year
 * @param {number} monthIndex
 * @returns {string}
 */
export const monthLabel = (year, monthIndex) => `${MONTH_NAMES[monthIndex]} ${year}`;

/**
 * Susun tanggal ISO `YYYY-MM-DD` dari komponen lokal (bukan UTC) supaya
 * tidak bergeser satu hari di zona waktu WIB.
 *
 * @param {number} year
 * @param {number} monthIndex
 * @param {number} day
 * @returns {string}
 */
export const toIsoDate = (year, monthIndex, day) =>
  `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

/**
 * Uraikan tanggal ISO menjadi komponen lokal.
 *
 * @param {string} [isoDate]
 * @returns {{year: number, monthIndex: number, day: number}|null} null bila tidak valid
 */
export const parseIsoDate = (isoDate) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(isoDate || ''));
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (monthIndex < 0 || monthIndex > 11 || day < 1 || day > daysInMonth(year, monthIndex)) {
    return null;
  }
  return { year, monthIndex, day };
};

/**
 * Geser tampilan kalender beberapa bulan tanpa mengubah hari terpilih.
 *
 * @param {{year: number, month: number}} view
 * @param {number} delta - Jumlah bulan, negatif untuk mundur
 * @returns {{year: number, month: number}}
 */
export const shiftMonth = (view, delta) => {
  const shifted = new Date(view.year, view.month + delta, 1);
  return { year: shifted.getFullYear(), month: shifted.getMonth() };
};

/**
 * Label kartu agenda, contoh "29 OKT 2026".
 *
 * @param {string} [isoDate]
 * @returns {string} String kosong bila tanggal tidak valid
 */
export const formatEventDate = (isoDate) => {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) return '';
  return `${parsed.day} ${MONTH_ABBREVIATIONS[parsed.monthIndex]} ${parsed.year}`;
};

/**
 * Label panjang tanggal terpilih, contoh "Ahad, 8 November 2026".
 *
 * @param {string} [isoDate]
 * @returns {string}
 */
export const formatFullDate = (isoDate) => {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) return '';
  const dayName = DAY_NAMES[new Date(parsed.year, parsed.monthIndex, parsed.day).getDay()];
  return `${dayName}, ${parsed.day} ${MONTH_NAMES[parsed.monthIndex]} ${parsed.year}`;
};

/**
 * Kumpulan nomor hari yang punya agenda pada bulan yang sedang ditampilkan.
 *
 * @param {Array<{event_date?: string}>} events
 * @param {number} year
 * @param {number} monthIndex
 * @returns {Set<number>}
 */
export const eventDaysInMonth = (events, year, monthIndex) => {
  const days = new Set();
  for (const event of events || []) {
    const parsed = parseIsoDate(event?.event_date);
    if (parsed && parsed.year === year && parsed.monthIndex === monthIndex) {
      days.add(parsed.day);
    }
  }
  return days;
};
