import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { DAY_NAMES, MONTH_NAMES } from '@lib/date';
import { layout } from '@lib/styles';
import { CATEGORY_STYLE, EVENT_CATEGORIES } from './constants';

export const EventCalendarPanel = ({
  calMonth,
  calYear,
  calendarGrid,
  eventsByDate,
  selectedCalDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onGoToday,
}) => (
  <>
    <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-cream-200">
      <div>
        <h3 className="text-h3 font-black text-ink-900 tracking-tight flex items-center gap-2">
          <Calendar className="h-5 w-5 text-brand-600" />
          <span>
            {MONTH_NAMES[calMonth]} {calYear}
          </span>
        </h3>
      </div>

      <div className={layout.rowStart} role="group" aria-label="Navigasi kalender agenda">
        <button
          type="button"
          onClick={onGoToday}
          className="px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-100 text-caption font-bold transition cursor-pointer"
        >
          Hari Ini
        </button>
        <button
          type="button"
          onClick={onPrevMonth}
          aria-label="Bulan sebelumnya"
          className="p-2 rounded-xl border border-cream-300 text-ink-500 hover:bg-cream-100 transition cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onNextMonth}
          aria-label="Bulan selanjutnya"
          className="p-2 rounded-xl border border-cream-300 text-ink-500 hover:bg-cream-100 transition cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>

    <div className="grid grid-cols-7 gap-1 text-center mt-4 mb-2">
      {DAY_NAMES.map((day, idx) => (
        <div
          key={day}
          className={`text-caption font-bold py-1 ${idx === 4 ? 'text-brand-700' : 'text-ink-500'}`}
        >
          {day}
        </div>
      ))}
    </div>

    <div className="grid grid-cols-7 gap-1 text-center" data-testid="admin-calendar-grid">
      {calendarGrid.leadingBlanks.map((item, idx) => (
        <div
          key={`blank-${idx}`}
          aria-hidden="true"
          className="h-14 sm:h-16 p-1 rounded-2xl border border-transparent text-ink-400 text-caption flex flex-col justify-start items-center select-none"
        >
          <span>{item.day}</span>
        </div>
      ))}

      {calendarGrid.days.map((item) => {
        const dayEvents = eventsByDate.get(item.ymd) || [];
        const hasEvents = dayEvents.length > 0;
        const isSelected = item.ymd === selectedCalDate;

        return (
          <button
            key={item.ymd}
            type="button"
            onClick={() => onSelectDate(item.ymd)}
            className={`h-14 sm:h-16 p-1 rounded-2xl border transition flex flex-col justify-between items-center cursor-pointer relative ${
              isSelected
                ? 'bg-brand-700 border-brand-800 text-cream-50 shadow-md shadow-brand-700/20'
                : item.isToday
                  ? 'bg-brand-50/70 border-brand-300 text-brand-900 font-black'
                  : hasEvents
                    ? 'bg-cream-100/80 border-cream-300 hover:border-brand-300 text-ink-800'
                    : 'border-cream-200 hover:bg-cream-100 text-ink-700'
            }`}
          >
            <span
              className={`text-caption font-extrabold mt-0.5 ${
                isSelected ? 'text-cream-50' : item.isToday ? 'text-brand-700' : ''
              }`}
            >
              {item.day}
            </span>

            <div className="w-full flex items-center justify-center gap-1 mb-1">
              {hasEvents && (
                <div className="flex items-center gap-0.5">
                  {dayEvents.slice(0, 3).map((evt, eIdx) => {
                    return (
                      <span
                        key={eIdx}
                        className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-cream-50' : CATEGORY_STYLE.dot}`}
                      />
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <span
                      className={`text-overline font-bold ${isSelected ? 'text-cream-50' : 'text-brand-700'}`}
                    >
                      +{dayEvents.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>

    <div className="mt-4 pt-3 border-t border-cream-200 flex flex-wrap items-center justify-between text-caption text-ink-400 gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-semibold text-ink-500">Kategori:</span>
        {EVENT_CATEGORIES.map((cat) => (
          <span key={cat} className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${CATEGORY_STYLE.dot}`} />
            {cat}
          </span>
        ))}
      </div>
      <span className="text-ink-500">Klik tanggal untuk memilih & menambah agenda</span>
    </div>
  </>
);
