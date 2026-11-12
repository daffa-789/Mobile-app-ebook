import dayjs from 'dayjs';
import 'dayjs/locale/id';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('id');

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

export const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export function formatYMD(year, monthIndex, day) {
  const y = String(year);
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayStr() {
  return dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD');
}

export function formatWIB(isoString, format = 'DD MMMM YYYY, HH:mm [WIB]') {
  if (!isoString) return '-';
  const parsed = dayjs(isoString);
  if (!parsed.isValid()) return '-';
  return parsed.tz('Asia/Jakarta').format(format);
}

export function dateLabel(ymd) {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return ymd;
  return `${d} ${MONTH_NAMES[m - 1]} ${y}`;
}

export function fullDateLabel(ymd) {
  if (!ymd) return '';
  const parsed = dayjs.tz(ymd, 'Asia/Jakarta');
  if (!parsed.isValid()) return ymd;
  const dayNameFull = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][
    parsed.day()
  ];
  const [y, m, d] = ymd.split('-').map(Number);
  return `${dayNameFull}, ${d} ${MONTH_NAMES[m - 1]} ${y}`;
}

export function getCalendarMonthGrid(year, monthIndex) {
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const prevMonthDays = new Date(year, monthIndex, 0).getDate();

  const cells = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const m = monthIndex === 0 ? 11 : monthIndex - 1;
    const y = monthIndex === 0 ? year - 1 : year;
    cells.push({
      dateStr: formatYMD(y, m, d),
      dayNumber: d,
      isCurrentMonth: false,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      dateStr: formatYMD(year, monthIndex, d),
      dayNumber: d,
      isCurrentMonth: true,
    });
  }

  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const m = monthIndex === 11 ? 0 : monthIndex + 1;
    const y = monthIndex === 11 ? year + 1 : year;
    cells.push({
      dateStr: formatYMD(y, m, d),
      dayNumber: d,
      isCurrentMonth: false,
    });
  }

  return cells;
}
