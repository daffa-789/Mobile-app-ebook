/**
 * Komponen panel rincian agenda pada tanggal yang dipilih pengguna.
 *
 * @module src/features/calendar/CalendarSelectedDatePanel
 */

import { Calendar, Clock, MapPin } from 'lucide-react';
import { getMapUrl, getDisplayLocation } from '@lib/maps';
import { layout, controls } from '@lib/styles';

/**
 * Komponen panel agenda tanggal terpilih.
 *
 * @param {object} props - Properti komponen
 * @param {string} props.selectedDate - Tanggal aktif format YYYY-MM-DD
 * @param {Array<object>} props.events - Daftar kegiatan pada tanggal tersebut
 * @returns {import('react').JSX.Element}
 */
export const CalendarSelectedDatePanel = ({ selectedDate, events }) => {
  const formattedDate = new Date(selectedDate).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="bg-cream-50 rounded-3xl p-4 border border-cream-200 shadow-sm space-y-3">
      <div className={layout.rowBetween}>
        <div>
          <span className="text-micro font-bold uppercase tracking-wider text-ink-500">
            Tanggal Terpilih
          </span>
          <h3 className="font-extrabold text-body text-ink-800">{formattedDate}</h3>
        </div>
      </div>

      {events.length > 0 ? (
        <div className="space-y-2">
          <div className="text-caption font-bold text-ink-500 flex items-center gap-1">
            <Calendar className={controls.iconSm} />
            <span>Agenda Wahidiyah:</span>
          </div>
          {events.map((evt) => (
            <div
              key={evt.id}
              className="bg-brand-50/50 rounded-2xl p-3 border border-brand-100/80 space-y-1.5"
            >
              <div className={layout.rowBetween}>
                <span
                  className={`text-overline font-bold px-2 py-0.5 rounded-full border ${evt.badgeColor}`}
                >
                  {evt.category}
                </span>
                <span className="text-micro text-ink-400 font-medium flex items-center gap-1">
                  <Clock className={controls.iconXs} />
                  {evt.time}
                </span>
              </div>
              <h4 className="font-bold text-caption text-ink-800">{evt.title}</h4>
              <p className="text-caption text-ink-400 leading-relaxed">{evt.description}</p>
              <div className="flex items-center justify-between pt-1 text-micro text-ink-500 border-t border-brand-100/50">
                {evt.location ? (
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span
                      className="font-semibold text-ink-800 truncate"
                      title={getDisplayLocation(evt.location)}
                    >
                      {getDisplayLocation(evt.location)}
                    </span>
                    {getMapUrl(evt.location) && (
                      <a
                        href={getMapUrl(evt.location)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-800 font-bold text-micro transition shadow-2xs shrink-0 cursor-pointer"
                        title="Buka rute di Google Maps"
                      >
                        <MapPin className="h-3 w-3 text-brand-600" />
                        <span>Rute Maps</span>
                      </a>
                    )}
                  </div>
                ) : (
                  <span className="text-ink-400 italic">Lokasi belum ditentukan</span>
                )}
                <span className="font-medium text-brand-700">{evt.organizer}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-cream-100 rounded-2xl p-3 text-center border border-dashed border-cream-300">
          <p className="text-caption text-ink-500">
            Tidak ada agenda majelis khusus pada tanggal ini
          </p>
        </div>
      )}
    </div>
  );
};
