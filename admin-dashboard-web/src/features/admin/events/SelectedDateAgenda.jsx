import { getMapUrl, getDisplayLocation } from '@lib/maps';
import { Clock, Images, Loader2, MapPin, Pencil, Send, Trash2 } from 'lucide-react';
import { dateLabel, fullDateLabel } from '@lib/date';
import { layout, surfaces } from '@lib/styles';
import { CATEGORY_STYLE } from './constants';

export const SelectedDateAgenda = ({
  selectedCalDate,
  events,
  pushEnabled,
  subscribers,
  sendingId,
  onToggleCarousel,
  onSendReminder,
  onEdit,
  onDelete,
  onAddForDate,
}) => (
  <div className={surfaces.panel}>
    <div className="flex items-center justify-between gap-3 pb-3 border-b border-cream-200">
      <div>
        <h4 className="font-bold text-ink-900 text-small">
          Agenda pada {fullDateLabel(selectedCalDate)}
        </h4>
        <p className="text-caption text-ink-500">{events.length} agenda terjadwal</p>
      </div>
      <button
        type="button"
        onClick={onAddForDate}
        className="inline-flex min-h-6 items-center text-caption font-bold text-brand-700 hover:text-brand-800 cursor-pointer"
      >
        + Tambah di tanggal ini
      </button>
    </div>

    <div className="mt-4 space-y-3">
      {events.length > 0 ? (
        events.map((evt) => {
          return (
            <div
              key={evt.id}
              className="flex items-start justify-between gap-3 p-3.5 rounded-2xl border border-cream-200 bg-cream-100/50 hover:bg-cream-100 transition"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-micro font-extrabold border ${CATEGORY_STYLE.badge}`}
                  >
                    {evt.category}
                  </span>
                  <h5 className="font-bold text-ink-900 text-small">{evt.title}</h5>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-caption text-ink-400 pt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-ink-300" />
                    {evt.time}
                  </span>
                  {evt.location ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-ink-700">
                        {getDisplayLocation(evt.location)}
                      </span>
                      {getMapUrl(evt.location) && (
                        <a
                          href={getMapUrl(evt.location)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-800 font-bold text-micro transition shadow-2xs"
                          title="Buka rute presisi di Google Maps"
                        >
                          <MapPin className="h-3 w-3 text-brand-600" />
                          Rute Maps
                        </a>
                      )}
                    </div>
                  ) : (
                    <span className="text-ink-400 italic">Lokasi belum ditentukan</span>
                  )}
                </div>
                {evt.description && (
                  <p className="text-caption text-ink-500 pt-1 italic">{evt.description}</p>
                )}
              </div>
              <div className={layout.rowShrink}>
                <button
                  type="button"
                  onClick={() => onToggleCarousel(evt)}
                  className={`p-2 rounded-xl border transition cursor-pointer ${
                    evt.showInCarousel
                      ? 'border-brand-300 bg-brand-50 text-brand-700'
                      : 'border-cream-300 text-ink-400 hover:bg-cream-100'
                  }`}
                  title={evt.showInCarousel ? 'Keluarkan dari carousel' : 'Tampilkan di carousel'}
                  aria-pressed={evt.showInCarousel}
                >
                  <Images className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onSendReminder(evt.id)}
                  disabled={sendingId === evt.id || !pushEnabled}
                  className="p-2 rounded-xl border border-cream-300 text-ink-600 hover:bg-cream-100 transition shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  title={
                    pushEnabled
                      ? `Siarkan notifikasi pengumuman agenda ini ke ${subscribers} perangkat`
                      : 'Notifikasi belum aktif — isi kunci VAPID di .env'
                  }
                >
                  {sendingId === evt.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(evt)}
                  className="p-2 rounded-xl border border-cream-300 text-ink-600 hover:bg-cream-100 transition shrink-0 cursor-pointer"
                  title="Ubah agenda ini"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(evt)}
                  className="p-2 rounded-xl border border-semantic-danger/30 text-semantic-danger hover:bg-semantic-dangerLight transition shrink-0 cursor-pointer"
                  title="Hapus agenda ini"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-6 text-ink-500 text-caption">
          Belum ada agenda pada tanggal {dateLabel(selectedCalDate)}.
          <p className="mt-1 text-ink-400">
            Isi formulir di samping untuk menambahkan kegiatan pada tanggal ini.
          </p>
        </div>
      )}
    </div>
  </div>
);
