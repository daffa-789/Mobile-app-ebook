import { BellRing, Images, Loader2, Pencil, Plus, X } from 'lucide-react';
import { surfaces, controls } from '@lib/styles';
import { Field } from '@ui/Field';
import { EVENT_CATEGORIES } from './constants';

export const EventFormPanel = ({
  eventForm,
  setEventForm,
  editingEventId,
  isSavingEvent,
  submitEvent,
  cancelEditEvent,
  handleEventDateChange,
}) => (
  <form onSubmit={submitEvent} className={surfaces.panelSpaced}>
    <div className="border-b border-cream-200 pb-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-bold text-ink-900 text-body flex items-center gap-2">
          {editingEventId ? (
            <>
              <Pencil className={controls.iconBrand} /> Ubah agenda
            </>
          ) : (
            <>
              <Plus className={controls.iconBrand} /> Tambah agenda baru
            </>
          )}
        </h3>
        {editingEventId && (
          <button
            type="button"
            onClick={cancelEditEvent}
            className="inline-flex items-center gap-1 text-caption font-bold text-ink-400 hover:text-ink-700 transition cursor-pointer"
          >
            <X className="h-3.5 w-3.5" /> Batal
          </button>
        )}
      </div>
    </div>

    <div className="space-y-3">
      <Field
        id="evt-title"
        label="Judul agenda *"
        required
        value={eventForm.title}
        onChange={(e) => setEventForm((form) => ({ ...form, title: e.target.value }))}
        placeholder="Contoh: Mujahadah Kubro Rojabiyah"
      />

      <Field
        id="evt-event_date"
        label="Tanggal kegiatan *"
        type="date"
        required
        value={eventForm.event_date}
        onChange={(e) => handleEventDateChange(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-2">
        <Field
          id="evt-time_start"
          label="Waktu mulai"
          type="time"
          value={eventForm.time_start}
          onChange={(e) => setEventForm((form) => ({ ...form, time_start: e.target.value }))}
        />
        <Field
          id="evt-time_end"
          label="Waktu selesai"
          type="time"
          value={eventForm.time_end}
          onChange={(e) => setEventForm((form) => ({ ...form, time_end: e.target.value }))}
        />
      </div>

      <div className="space-y-3">
        <Field
          id="evt-location-name"
          label="Nama tempat / gedung *"
          required
          value={eventForm.location_name ?? eventForm.location ?? ''}
          onChange={(e) =>
            setEventForm((form) => ({
              ...form,
              location_name: e.target.value,
              location: form.maps_url?.trim()
                ? `${e.target.value.trim()} | ${form.maps_url.trim()}`
                : e.target.value,
            }))
          }
          placeholder="Contoh: NEKA KEDIRI atau Ponpes Kedunglo"
        />

        <Field
          id="evt-maps-url"
          label="Tautan Google Maps / Koordinat (opsional)"
          value={eventForm.maps_url ?? ''}
          onChange={(e) =>
            setEventForm((form) => ({
              ...form,
              maps_url: e.target.value,
              location: e.target.value?.trim()
                ? `${(form.location_name || '').trim()} | ${e.target.value.trim()}`
                : form.location_name || '',
            }))
          }
          placeholder="Contoh: https://maps.app.goo.gl/... atau koordinat GPS"
        />
      </div>

      <Field
        as="select"
        id="evt-category"
        label="Kategori kegiatan"
        value={eventForm.category}
        onChange={(e) => setEventForm((form) => ({ ...form, category: e.target.value }))}
      >
        {EVENT_CATEGORIES.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Field>

      <Field
        id="evt-organizer"
        label="Penyelenggara"
        value={eventForm.organizer}
        onChange={(e) => setEventForm((form) => ({ ...form, organizer: e.target.value }))}
        placeholder="Contoh: DPP PSW"
      />

      <Field
        as="textarea"
        id="evt-description"
        label="Keterangan (opsional)"
        value={eventForm.description}
        onChange={(e) => setEventForm((form) => ({ ...form, description: e.target.value }))}
        placeholder="Catatan tambahan agenda..."
        rows="2"
      />

      <label className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-cream-300 bg-cream-50 px-3 py-3">
        <input
          type="checkbox"
          checked={Boolean(eventForm.show_in_carousel)}
          onChange={(e) =>
            setEventForm((form) => ({ ...form, show_in_carousel: e.target.checked }))
          }
          className="mt-0.5 h-4 w-4 rounded border-cream-300 text-brand-700 focus:ring-brand-300"
        />
        <span>
          <span className="flex items-center gap-1.5 text-caption font-bold text-ink-800">
            <Images className="h-3.5 w-3.5 text-brand-700" />
            Tampilkan di Carousel
          </span>
          <span className="mt-0.5 block text-caption text-ink-400">
            Agenda ini otomatis muncul sebagai banner di beranda jemaah.
          </span>
        </span>
      </label>

      <label className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-cream-300 bg-cream-50 px-3 py-3">
        <input
          type="checkbox"
          checked={eventForm.broadcast_notification ?? true}
          onChange={(e) =>
            setEventForm((form) => ({ ...form, broadcast_notification: e.target.checked }))
          }
          className="mt-0.5 h-4 w-4 rounded border-cream-300 text-brand-700 focus:ring-brand-300"
        />
        <span>
          <span className="flex items-center gap-1.5 text-caption font-bold text-ink-800">
            <BellRing className="h-3.5 w-3.5 text-brand-700" />
            Kirim Notifikasi Pengumuman ke Jemaah
          </span>
          <span className="mt-0.5 block text-caption text-ink-400">
            Kirimkan push notification langsung ke HP/perangkat jemaah saat agenda ini disimpan.
          </span>
        </span>
      </label>
    </div>

    <button
      disabled={isSavingEvent}
      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-brand-700 px-4 py-3 text-caption font-bold text-cream-50 shadow-sm transition hover:bg-brand-800 disabled:opacity-60 cursor-pointer"
    >
      {isSavingEvent ? (
        <Loader2 className={controls.spinner} />
      ) : editingEventId ? (
        <Pencil className="h-4 w-4" />
      ) : (
        <Plus className="h-4 w-4" />
      )}
      {editingEventId ? 'Simpan perubahan agenda' : 'Simpan agenda ke kalender'}
    </button>
  </form>
);
