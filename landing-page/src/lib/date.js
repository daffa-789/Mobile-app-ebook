import dayjs from 'dayjs';
import 'dayjs/locale/id';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('id');

const WIB_TIME_ZONE = 'Asia/Jakarta';

/** Daftar nama bulan dalam bahasa Indonesia (12 bulan). */
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

/** Singkatan nama hari dari Senin sampai Ahad. */
export const DAY_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Ahd'];

/**
 * Format tahun, bulan (0-indexed), dan hari ke string YYYY-MM-DD.
 */
export const formatYMD = (year, monthIndex, day) => {
  return dayjs(new Date(year, monthIndex, day)).format('YYYY-MM-DD');
};

const todayWib = () => dayjs().tz(WIB_TIME_ZONE).format('YYYY-MM-DD');

/**
 * Mendapatkan tanggal hari ini dalam format YYYY-MM-DD zona waktu WIB.
 */
export const getTodayStr = todayWib;

/**
 * Format timestamp / string tanggal ke format standar tampilan WIB.
 */
export const formatWIB = (dateInput, { withTime = true, withSeconds = false } = {}) => {
  if (!dateInput) return '-';
  const d = dayjs(dateInput).tz(WIB_TIME_ZONE);
  if (!d.isValid()) return '-';
  if (!withTime) return d.format('DD MMM YYYY');
  return d.format(withSeconds ? 'DD MMM YYYY, HH.mm.ss' : 'DD MMM YYYY, HH.mm');
};

/**
 * Format tanggal ringkas (DD MMM YYYY) atau strip jika kosong.
 */
export const dateLabel = (value) => {
  if (!value) return '—';
  const d = dayjs(value).tz(WIB_TIME_ZONE);
  return d.isValid() ? d.format('DD MMM YYYY') : '—';
};

/**
 * Format tanggal lengkap dengan nama hari (dddd, D MMMM YYYY).
 */
export const fullDateLabel = (value) => {
  if (!value) return '—';
  const d = dayjs(value).tz(WIB_TIME_ZONE);
  return d.isValid() ? d.format('dddd, D MMMM YYYY') : '—';
};

/**
 * Menghasilkan grid hari untuk kalender bulanan.
 */
export const getCalendarMonthGrid = (year, monthIndex) => {
  const todayStr = todayWib();
  const base = dayjs(new Date(year, monthIndex, 1));
  const daysInMonth = base.daysInMonth();
  const firstDayIndex = (base.day() + 6) % 7;
  const prevMonthDaysCount = dayjs(new Date(year, monthIndex, 0)).date();

  const leadingBlanks = [];
  for (let i = firstDayIndex - 1; i >= 0; i -= 1) {
    leadingBlanks.push({ day: prevMonthDaysCount - i, isCurrentMonth: false, ymd: null });
  }

  const days = [];
  for (let d = 1; d <= daysInMonth; d += 1) {
    const ymd = formatYMD(year, monthIndex, d);
    days.push({ day: d, isCurrentMonth: true, ymd, isToday: ymd === todayStr });
  }

  return { daysInMonth, firstDayIndex, leadingBlanks, days };
};
