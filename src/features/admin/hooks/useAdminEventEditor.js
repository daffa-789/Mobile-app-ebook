import { useState } from 'react';
import { toast } from 'sonner';
import { apiJson, apiJsonSend } from '@lib/api';
import { getTodayStr } from '@lib/date';
import { withToast } from '@lib/withToast';

export const EMPTY_EVENT_FORM = {
  title: '',
  event_date: '',
  time_start: '19:30',
  time_end: '21:00',
  location: '',
  location_name: '',
  maps_url: '',
  category: 'Mujahadah',
  description: '',
  organizer: 'DPP PSW',
  show_in_carousel: false,
  broadcast_notification: true,
};

const toEventForm = (event) => {
  const rawLoc = String(event.location || '').trim();
  let locName = rawLoc;
  let mapUrl = '';
  if (rawLoc.includes('|')) {
    const parts = rawLoc.split('|');
    const urlPart = parts.find((p) => /^https?:\/\//i.test(p.trim())) || '';
    const namePart = parts.find((p) => p !== urlPart) || parts[0];
    locName = namePart.trim();
    mapUrl = urlPart.trim();
  } else if (/^https?:\/\//i.test(rawLoc)) {
    locName = '';
    mapUrl = rawLoc;
  }
  return {
    title: event.title || '',
    event_date: String(event.date || '').slice(0, 10),
    time_start: event.timeStart || '19:30',
    time_end: event.timeEnd || '21:00',
    location: event.location || '',
    location_name: locName,
    maps_url: mapUrl,
    category: event.category || 'Mujahadah',
    description: event.description || '',
    organizer: event.organizer || 'DPP PSW',
    show_in_carousel: Boolean(event.showInCarousel),
    broadcast_notification: false,
  };
};

export const useAdminEventEditor = ({ headers, loadDashboard }) => {
  const [currentCalDate, setCurrentCalDate] = useState(() => new Date());
  const [selectedCalDate, setSelectedCalDate] = useState(() => getTodayStr());
  const [agendaFilter, setAgendaFilter] = useState('Semua');
  const [eventForm, setEventForm] = useState(() => ({
    ...EMPTY_EVENT_FORM,
    event_date: getTodayStr(),
  }));
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);

  const submitEvent = async (event) => {
    event.preventDefault();
    setIsSavingEvent(true);
    return withToast(async () => {
      /* Lokasi dan tautan Maps digabung menjadi satu kolom teks. Jalur buat dan
         jalur ubah memakai aturan penggabungan yang sama, jadi tidak ditulis dua kali. */
      const locationCombined = eventForm.maps_url?.trim()
        ? eventForm.location_name?.trim()
          ? `${eventForm.location_name.trim()} | ${eventForm.maps_url.trim()}`
          : eventForm.maps_url.trim()
        : eventForm.location_name?.trim() || eventForm.location || '';
      const eventPayload = { ...eventForm, location: locationCombined };

      if (editingEventId) {
        const res = await apiJsonSend(
          `/api/events/${encodeURIComponent(editingEventId)}`,
          eventPayload,
          {
            method: 'PUT',
            headers,
          },
        );
        toast.success(res?.message || 'Agenda berhasil diperbarui.');
      } else {
        const res = await apiJsonSend('/api/events', eventPayload, { headers });
        if (res?.announcementSent > 0) {
          toast.success(`Agenda ditambahkan & disiarkan ke ${res.announcementSent} perangkat!`);
        } else {
          toast.success(res?.message || 'Agenda berhasil ditambahkan.');
        }
      }
      const savedDate = eventForm.event_date || selectedCalDate;
      setSelectedCalDate(savedDate);
      if (savedDate && !Number.isNaN(new Date(savedDate).getTime())) {
        const d = new Date(savedDate);
        setCurrentCalDate(new Date(d.getFullYear(), d.getMonth(), 1));
      }
      setEditingEventId(null);
      setEventForm({ ...EMPTY_EVENT_FORM, event_date: savedDate });
      await loadDashboard();
    }, 'Agenda belum dapat disimpan.').finally(() => setIsSavingEvent(false));
  };

  const editEvent = (event) => {
    setEditingEventId(event.id);
    setEventForm(toEventForm(event));
    const dateStr = String(event.date || '').slice(0, 10);
    if (dateStr && !Number.isNaN(new Date(dateStr).getTime())) {
      setSelectedCalDate(dateStr);
      const parsed = new Date(dateStr);
      setCurrentCalDate(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
    }
  };

  const cancelEditEvent = () => {
    setEditingEventId(null);
    setEventForm({ ...EMPTY_EVENT_FORM, event_date: selectedCalDate });
  };

  const toggleEventCarousel = (event) =>
    withToast(
      async () => {
        await apiJsonSend(
          `/api/events/${encodeURIComponent(event.id)}`,
          { ...toEventForm(event), show_in_carousel: !event.showInCarousel },
          { method: 'PUT', headers },
        );
        await loadDashboard();
      },
      'Status carousel agenda gagal diubah.',
      event.showInCarousel ? 'Agenda dikeluarkan dari carousel.' : 'Agenda masuk ke carousel.',
    );

  const deleteEvent = (event) => {
    if (!window.confirm(`Hapus agenda “${event.title}”?`)) return undefined;
    return withToast(
      async () => {
        await apiJson(`/api/events/${encodeURIComponent(event.id)}`, { method: 'DELETE', headers });
        await loadDashboard();
      },
      'Agenda belum dapat dihapus.',
      'Agenda berhasil dihapus.',
    );
  };

  return {
    currentCalDate,
    setCurrentCalDate,
    selectedCalDate,
    setSelectedCalDate,
    agendaFilter,
    setAgendaFilter,
    eventForm,
    setEventForm,
    isSavingEvent,
    editingEventId,
    submitEvent,
    editEvent,
    cancelEditEvent,
    toggleEventCarousel,
    deleteEvent,
  };
};
