/**
 * Layar Agenda & Kalender Kegiatan Wahidiyah.
 * Mengoordinasikan tampilan kalender bulanan, panel agenda tanggal terpilih,
 * dan daftar seluruh agenda tersaring.
 *
 * @module src/features/calendar/CalendarScreen
 */

import { useState, useMemo, useCallback } from 'react';
import { useApp } from '@context/AppContext';
import { getTodayStr, getCalendarMonthGrid } from '@lib/date';
import { CalendarSkeleton } from '@ui/Skeleton';
import { CalendarMonthGrid } from './CalendarMonthGrid';
import { CalendarSelectedDatePanel } from './CalendarSelectedDatePanel';
import { CalendarAllEventsList } from './CalendarAllEventsList';

/**
 * Komponen utama layar kalender dan agenda kegiatan.
 *
 * @returns {import('react').JSX.Element}
 */
export const CalendarScreen = () => {
  const { events, loadingAgenda, agendaError, refreshEvents } = useApp();

  const todayStr = useMemo(() => getTodayStr(), []);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => getTodayStr());
  const [activeFilter, setActiveFilter] = useState('Semua');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = useCallback(() => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const nextMonth = useCallback(() => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const goToToday = useCallback(() => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(getTodayStr());
  }, []);

  const { daysInMonth, firstDayIndex } = useMemo(
    () => getCalendarMonthGrid(year, month),
    [year, month],
  );

  const eventDatesSet = useMemo(() => new Set(events.map((e) => e.date)), [events]);

  const selectedDateEvents = useMemo(() => {
    return events.filter((e) => e.date === selectedDate);
  }, [events, selectedDate]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (activeFilter === 'Semua') return true;
      if (activeFilter === 'Kubro') return e.category === 'Kubro';
      if (activeFilter === 'Mujahadah') return e.category === 'Mujahadah';
      if (activeFilter === 'Pengajian')
        return e.category === 'Pengajian' || e.category === 'Bimbingan';
      return true;
    });
  }, [events, activeFilter]);

  if (loadingAgenda) {
    return (
      <div className="min-h-[640px] flex flex-col justify-between bg-cream-50 pb-6 font-sans">
        <CalendarSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-[640px] flex flex-col justify-between bg-cream-50 pb-6 font-sans">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-5 space-y-4">
            <CalendarMonthGrid
              year={year}
              month={month}
              daysInMonth={daysInMonth}
              firstDayIndex={firstDayIndex}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              todayStr={todayStr}
              eventDatesSet={eventDatesSet}
              onPrevMonth={prevMonth}
              onNextMonth={nextMonth}
              onGoToToday={goToToday}
            />
          </div>

          <div className="lg:col-span-7 space-y-4">
            <CalendarSelectedDatePanel selectedDate={selectedDate} events={selectedDateEvents} />

            <CalendarAllEventsList
              events={filteredEvents}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              agendaError={agendaError}
              onRefresh={refreshEvents}
              onSelectDate={setSelectedDate}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
