import { Trash2 } from 'lucide-react';
import { dateLabel } from '@lib/date';
import { typography } from '@lib/styles';
import { EVENT_CATEGORIES } from './constants';

export const AllAgendaPanel = ({ events, filter, setFilter, onJumpToDate, onDelete }) => (
  <div className="rounded-3xl border border-cream-300 bg-cream-50 p-5 shadow-sm space-y-3">
    <div className="flex items-center justify-between border-b border-cream-200 pb-3">
      <h4 className="font-bold text-ink-900 text-small">Semua Agenda ({events.length})</h4>
      <select
        aria-label="Saring agenda berdasarkan kategori"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="text-caption rounded-xl border border-cream-300 px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 text-ink-500 font-semibold cursor-pointer"
      >
        <option value="Semua">Semua Kategori</option>
        {EVENT_CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
    </div>

    <div className="max-h-72 overflow-y-auto space-y-2 pr-1 divide-y divide-cream-200">
      {events.length > 0 ? (
        events.map((evt) => (
          <div key={evt.id} className="pt-2 flex items-center justify-between gap-3 text-caption">
            <button
              type="button"
              onClick={() => onJumpToDate(evt)}
              className="text-left flex-1 min-w-0 hover:text-brand-700 cursor-pointer transition"
              title="Lihat di kalender"
            >
              <p className="font-bold text-ink-800 truncate">{evt.title}</p>
              <p className={typography.helperInline}>
                {dateLabel(evt.date)} • {evt.category}
              </p>
            </button>
            <button
              type="button"
              onClick={() => onDelete(evt)}
              className="p-1.5 rounded-lg text-semantic-danger hover:bg-semantic-dangerLight transition cursor-pointer"
              title="Hapus"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))
      ) : (
        <p className="text-caption text-ink-500 py-4 text-center">Tidak ada agenda.</p>
      )}
    </div>
  </div>
);
