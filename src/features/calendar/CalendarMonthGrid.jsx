/**
 * Komponen kisi kalender bulanan interaktif.
 * Menampilkan nama bulan/tahun, navigasi antar-bulan, header hari, serta sel tanggal berindikator kegiatan.
 *
 * @module src/features/calendar/CalendarMonthGrid
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MONTH_NAMES, DAY_NAMES, formatYMD } from '@lib/date';

/**
 * Komponen kalender bulanan.
 *
 * @param {object} props - Properti komponen
 * @param {number} props.year - Tahun aktif
 * @param {number} props.month - Indeks bulan aktif (0-11)
 * @param {number} props.daysInMonth - Total hari dalam bulan
 * @param {number} props.firstDayIndex - Hari pertama bulan (0=Senin ... 6=Ahad)
 * @param {string} props.selectedDate - Tanggal aktif terpilih format YYYY-MM-DD
 * @param {(dateStr: string) => void} props.setSelectedDate - Setter tanggal terpilih
 * @param {string} props.todayStr - Tanggal hari ini format YYYY-MM-DD
 * @param {Set<string>} props.eventDatesSet - Himpunan tanggal yang memiliki jadwal kegiatan
 * @param {() => void} props.onPrevMonth - Handler pindah ke bulan sebelumnya
 * @param {() => void} props.onNextMonth - Handler pindah ke bulan berikutnya
 * @param {() => void} props.onGoToToday - Handler kembali ke hari ini
 * @returns {import('react').JSX.Element}
 */
export const CalendarMonthGrid = ({
  year,
  month,
  daysInMonth,
  firstDayIndex,
  selectedDate,
  setSelectedDate,
  todayStr,
  eventDatesSet,
  onPrevMonth,
  onNextMonth,
  onGoToToday,
}) => {
  return (
    <div className="bg-cream-50 rounded-3xl p-4 border border-cream-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-h3 font-extrabold text-ink-800 flex items-center gap-1.5">
            <span>
              {MONTH_NAMES[month]} {year}
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onGoToToday}
            className="text-caption font-bold px-2.5 py-1 bg-brand-50 text-brand-800 hover:bg-brand-100 rounded-xl transition mr-1 cursor-pointer"
          >
            Hari Ini
          </button>
          <button
            type="button"
            aria-label="Bulan sebelumnya"
            onClick={onPrevMonth}
            className="p-1.5 rounded-xl border border-cream-300 text-ink-500 hover:bg-brand-50 hover:text-brand-800 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Bulan selanjutnya"
            onClick={onNextMonth}
            className="p-1.5 rounded-xl border border-cream-300 text-ink-500 hover:bg-brand-50 hover:text-brand-800 transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {DAY_NAMES.map((day, idx) => (
          <div
            key={day}
            className={`text-caption font-bold py-1 ${idx === 4 ? 'text-brand-800' : 'text-ink-500'}`}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center" data-testid="calendar-grid">
        {Array.from({ length: firstDayIndex }).map((_, idx) => (
          <div key={`empty-${idx}`} className="h-10 text-caption text-ink-300 p-1" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const dayNum = idx + 1;
          const dateStr = formatYMD(year, month, dayNum);
          const isSelected = selectedDate === dateStr;
          const hasEvents = eventDatesSet.has(dateStr);
          const isToday = dateStr === todayStr;

          return (
            <button
              key={dayNum}
              type="button"
              data-testid={`calendar-day-${dayNum}`}
              onClick={() => setSelectedDate(dateStr)}
              className={`h-10 rounded-2xl flex flex-col items-center justify-center relative text-caption font-semibold transition-all duration-150 cursor-pointer ${
                isSelected
                  ? 'bg-brand-700 hover:bg-brand-700 text-cream-50 shadow-md shadow-brand-700/30 scale-105 z-10'
                  : isToday
                    ? 'bg-brand-50 text-brand-800 border border-brand-300'
                    : 'hover:bg-brand-50/70 text-ink-700'
              }`}
            >
              <span>{dayNum}</span>

              <div className="flex items-center gap-0.5 mt-0.5">
                {hasEvents && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-cream-50' : 'bg-brand-500'}`}
                    title="Ada Jadwal Wahidiyah"
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-cream-200 text-micro text-ink-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-brand-500" />
          <span>Agenda / Mujahadah Wahidiyah</span>
        </div>
      </div>
    </div>
  );
};
