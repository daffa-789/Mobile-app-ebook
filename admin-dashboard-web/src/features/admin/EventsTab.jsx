import { useEffect, useMemo, useState } from 'react';
import { apiJson, authHeaders, getStoredSession } from '@lib/api';
import { withToast } from '@lib/withToast';
import { getTodayStr, getCalendarMonthGrid } from '@lib/date';
import { surfaces } from '@lib/styles';
import { PushStatusBanner } from './events/PushStatusBanner';
import { EventCalendarPanel } from './events/EventCalendarPanel';
import { SelectedDateAgenda } from './events/SelectedDateAgenda';
import { EventFormPanel } from './events/EventFormPanel';
import { AllAgendaPanel } from './events/AllAgendaPanel';

export const EventsTab = ({
  events,
  eventForm,
  setEventForm,
  isSavingEvent,
  submitEvent,
  deleteEvent,
  currentCalDate,
  setCurrentCalDate,
  selectedCalDate,
  setSelectedCalDate,
  agendaFilter,
  setAgendaFilter,
  editingEventId,
  editEvent,
  cancelEditEvent,
  toggleEventCarousel,
}) => {
  const [pushStatus, setPushStatus] = useState({ enabled: false, subscribers: 0 });
  const [sendingId, setSendingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    apiJson('/api/notifications/status')
      .then((data) => {
        if (!cancelled) setPushStatus(data);
      })
      .catch(() => {
        /* status opsional — jangan ganggu tampilan agenda */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sendReminder = (eventId) => {
    setSendingId(eventId);
    return withToast(
      () =>
        apiJson(`/api/events/${eventId}/send-reminder`, {
          method: 'POST',
          headers: authHeaders(getStoredSession()?.token),
        }),
      'Pengumuman gagal disiarkan.',
      (result) => result.message || `Pengumuman terkirim ke ${result.sent} perangkat.`,
    ).finally(() => setSendingId(null));
  };

  const calYear = currentCalDate.getFullYear();
  const calMonth = currentCalDate.getMonth();

  const prevCalMonth = () => {
    setCurrentCalDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextCalMonth = () => {
    setCurrentCalDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToTodayCal = () => {
    const now = new Date();
    setCurrentCalDate(now);
    const today = getTodayStr();
    setSelectedCalDate(today);
    setEventForm((prev) => ({ ...prev, event_date: today }));
  };

  const onSelectDate = (ymd) => {
    if (!ymd) return;
    setSelectedCalDate(ymd);
    setEventForm((prev) => ({ ...prev, event_date: ymd }));
  };

  const handleEventDateChange = (val) => {
    setEventForm((prev) => ({ ...prev, event_date: val }));
    if (val && !Number.isNaN(new Date(val).getTime())) {
      setSelectedCalDate(val);
      const d = new Date(val);
      setCurrentCalDate(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  };

  const calendarGrid = useMemo(() => {
    return getCalendarMonthGrid(calYear, calMonth);
  }, [calYear, calMonth]);

  const eventsByDate = useMemo(() => {
    const map = new Map();
    events.forEach((evt) => {
      const d = String(evt.date || '').slice(0, 10);
      if (!d) return;
      if (!map.has(d)) map.set(d, []);
      map.get(d).push(evt);
    });
    return map;
  }, [events]);

  const selectedDateEvents = useMemo(() => {
    return eventsByDate.get(selectedCalDate) || [];
  }, [eventsByDate, selectedCalDate]);

  const filteredAllEvents = useMemo(() => {
    return events.filter((e) => {
      if (agendaFilter === 'Semua') return true;
      return e.category === agendaFilter;
    });
  }, [events, agendaFilter]);

  const jumpToEventDate = (evt) => {
    const dStr = String(evt.date || '').slice(0, 10);
    if (!dStr) return;
    const d = new Date(dStr);
    if (!Number.isNaN(d.getTime())) {
      setCurrentCalDate(new Date(d.getFullYear(), d.getMonth(), 1));
      setSelectedCalDate(dStr);
      setEventForm((prev) => ({ ...prev, event_date: dStr }));
    }
  };

  const addForSelectedDate = () => {
    setEventForm((prev) => ({ ...prev, event_date: selectedCalDate }));
  };

  return (
    <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)] items-start">
        <div className="space-y-5">
          <div className={surfaces.panel}>
            <PushStatusBanner enabled={pushStatus.enabled} subscribers={pushStatus.subscribers} />
            <EventCalendarPanel
              calMonth={calMonth}
              calYear={calYear}
              calendarGrid={calendarGrid}
              eventsByDate={eventsByDate}
              selectedCalDate={selectedCalDate}
              onSelectDate={onSelectDate}
              onPrevMonth={prevCalMonth}
              onNextMonth={nextCalMonth}
              onGoToday={goToTodayCal}
            />
          </div>

          <SelectedDateAgenda
            selectedCalDate={selectedCalDate}
            events={selectedDateEvents}
            pushEnabled={pushStatus.enabled}
            subscribers={pushStatus.subscribers}
            sendingId={sendingId}
            onToggleCarousel={toggleEventCarousel}
            onSendReminder={sendReminder}
            onEdit={editEvent}
            onDelete={deleteEvent}
            onAddForDate={addForSelectedDate}
          />
        </div>

        <div className="space-y-5">
          <EventFormPanel
            eventForm={eventForm}
            setEventForm={setEventForm}
            editingEventId={editingEventId}
            isSavingEvent={isSavingEvent}
            submitEvent={submitEvent}
            cancelEditEvent={cancelEditEvent}
            handleEventDateChange={handleEventDateChange}
          />

          <AllAgendaPanel
            events={filteredAllEvents}
            filter={agendaFilter}
            setFilter={setAgendaFilter}
            onJumpToDate={jumpToEventDate}
            onDelete={deleteEvent}
          />
        </div>
      </div>
    </section>
  );
};
