/**
 * Komponen daftar seluruh agenda Wahidiyah beserta filter kategori (Semua, Kubro, Mujahadah, Pengajian).
 *
 * @module src/features/calendar/CalendarAllEventsList
 */

import { Clock, MapPin } from 'lucide-react';
import { getMapUrl, getDisplayLocation } from '@lib/maps';
import { layout, controls } from '@lib/styles';

const CATEGORY_PILLS = ['Semua', 'Kubro', 'Mujahadah', 'Pengajian'];

/**
 * Komponen daftar seluruh agenda dengan filter.
 *
 * @param {object} props - Properti komponen
 * @param {Array<object>} props.events - Daftar seluruh agenda terfilter
 * @param {string} props.activeFilter - Kategori filter aktif
 * @param {(filter: string) => void} props.setActiveFilter - Setter filter kategori
 * @param {string|null} props.agendaError - Pesan error jika gagal memuat data
 * @param {() => Promise<void>} props.onRefresh - Handler coba muat ulang
 * @param {(dateStr: string) => void} props.onSelectDate - Handler saat item agenda diklik
 * @returns {import('react').JSX.Element}
 */
export const CalendarAllEventsList = ({
  events,
  activeFilter,
  setActiveFilter,
  agendaError,
  onRefresh,
  onSelectDate,
}) => {
  return (
    <div className="space-y-2 pt-1">
      <div className={layout.rowBetween}>
        <h3 className="font-extrabold text-body text-ink-800">Agenda Besar Wahidiyah</h3>
        <span className="text-micro text-ink-500 font-medium">Semua Jadwal Resmi</span>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-caption">
        {CATEGORY_PILLS.map((pill) => (
          <button
            key={pill}
            type="button"
            onClick={() => setActiveFilter(pill)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition text-caption cursor-pointer ${
              activeFilter === pill
                ? 'bg-brand-700 hover:bg-brand-700 text-cream-50 shadow-sm'
                : 'bg-cream-50 text-ink-500 border border-cream-300 hover:bg-brand-50'
            }`}
          >
            {pill}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {agendaError ? (
          <div
            className="rounded-2xl border border-dashed border-semantic-danger/40 bg-semantic-dangerLight p-6 text-center"
            role="alert"
          >
            <p className="text-caption font-bold text-semantic-danger">
              Agenda gagal dimuat: {agendaError}
            </p>
            <button
              type="button"
              onClick={() => onRefresh().catch(() => {})}
              className="mt-3 min-h-6 rounded-xl bg-brand-700 px-3.5 py-1.5 text-small font-bold text-cream-50 transition hover:bg-brand-800 cursor-pointer"
            >
              Coba muat ulang
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-cream-100 rounded-2xl p-6 text-center border border-dashed border-cream-300">
            <p className="text-caption text-ink-500 font-medium">
              Belum ada agenda atau jadwal majelis yang terdaftar
            </p>
          </div>
        ) : (
          events.map((evt) => (
            <div
              key={evt.id}
              onClick={() => onSelectDate(evt.date)}
              className="bg-cream-50 hover:bg-brand-50/30 cursor-pointer rounded-2xl p-3 border border-cream-200 shadow-sm transition space-y-1.5"
            >
              <div className={layout.rowBetween}>
                <span
                  className={`text-overline font-bold px-2 py-0.5 rounded-full border ${evt.badgeColor}`}
                >
                  {evt.category}
                </span>
                <span className="text-micro font-bold text-brand-800 bg-brand-50 px-2 py-0.5 rounded-lg border border-brand-100">
                  {new Date(evt.date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <h4 className="font-bold text-caption text-ink-800 leading-snug">{evt.title}</h4>
              <div className="flex items-center justify-between text-micro text-ink-400">
                {evt.location ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-ink-700 truncate">
                      {getDisplayLocation(evt.location)}
                    </span>
                    {getMapUrl(evt.location) && (
                      <a
                        href={getMapUrl(evt.location)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-800 font-bold text-micro transition shrink-0 cursor-pointer"
                        title="Buka rute di Google Maps"
                      >
                        <MapPin className="h-2.5 w-2.5 text-brand-600" />
                        <span>Rute Maps</span>
                      </a>
                    )}
                  </div>
                ) : (
                  <span className="text-ink-400 italic">Lokasi belum ditentukan</span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className={controls.iconXs} />
                  {evt.time}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
