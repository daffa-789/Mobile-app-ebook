/**
 * Komponen kartu baris slide banner carousel dalam tabel daftar admin.
 *
 * @module src/features/admin/carousel/CarouselSlideItem
 */

import { ImagePlus, Loader2, Pencil, Trash2 } from 'lucide-react';
import { dateLabel } from '@lib/date';
import { layout, typography } from '@lib/styles';

const periodLabel = (slide) => {
  if (!slide.startsAt && !slide.endsAt) return '';
  if (slide.startsAt && slide.endsAt)
    return `${dateLabel(slide.startsAt)} – ${dateLabel(slide.endsAt)}`;
  if (slide.startsAt) return `Mulai ${dateLabel(slide.startsAt)}`;
  return `Sampai ${dateLabel(slide.endsAt)}`;
};

/**
 * Komponen item kartu banner carousel.
 *
 * @param {object} props - Properti komponen
 * @param {object} props.slide - Data slide carousel
 * @param {number} props.index - Indeks urutan tampilan
 * @param {string|null} props.editingId - ID slide yang sedang diedit
 * @param {string|null} props.busyId - ID slide yang sedang diproses hapus
 * @param {(slide: object) => void} props.onEdit - Handler klik tombol ubah
 * @param {(slide: object) => void} props.onDelete - Handler klik tombol hapus
 * @param {(slideId: string, file: File) => void} props.onUploadImage - Handler unggah gambar banner
 * @returns {import('react').JSX.Element}
 */
export const CarouselSlideItem = ({
  slide,
  index,
  editingId,
  busyId,
  onEdit,
  onDelete,
  onUploadImage,
}) => {
  const isEditing = editingId === slide.id;

  return (
    <article
      className={`flex flex-wrap items-center gap-4 rounded-3xl border bg-cream-50 p-4 shadow-sm transition ${
        isEditing ? 'border-brand-400 ring-1 ring-brand-200' : 'border-cream-300'
      }`}
    >
      <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-brand-700 to-brand-900">
        {slide.imageUrl ? (
          <img src={slide.imageUrl} alt="" className={layout.media} />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImagePlus className="h-5 w-5 text-cream-100/70" />
          </div>
        )}
      </div>

      <div className="min-w-[180px] flex-1">
        <div className={layout.rowWrap}>
          <span className="rounded-md bg-cream-200 px-1.5 py-0.5 font-mono text-micro font-bold text-ink-500">
            #{index + 1}
          </span>
          <h3 className="font-bold text-ink-900">{slide.title}</h3>

          {slide.eventId && (
            <span className="rounded-full bg-brand-50 border border-brand-200 px-2 py-0.5 text-micro font-bold text-brand-700">
              Dari agenda
            </span>
          )}
        </div>
        {slide.description && (
          <p className="mt-1 line-clamp-2 text-caption text-ink-500">{slide.description}</p>
        )}
        {(slide.eventDate || periodLabel(slide)) && (
          <p className="mt-1 text-caption text-ink-400">
            {slide.eventDate ? `${dateLabel(slide.eventDate)} ` : ''}
            {periodLabel(slide)}
          </p>
        )}
      </div>

      <div className={layout.rowShrink}>
        <button
          type="button"
          onClick={() => onEdit(slide)}
          className="rounded-xl border border-cream-300 p-2 text-ink-700 hover:bg-cream-100 transition cursor-pointer"
          title="Ubah banner"
          aria-label={`Ubah banner ${slide.title}`}
        >
          <Pencil className="h-4 w-4 text-brand-700" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(slide)}
          disabled={busyId === slide.id}
          className="rounded-xl border border-semantic-danger/30 p-2 text-semantic-danger transition hover:bg-semantic-dangerLight disabled:opacity-50 cursor-pointer"
          title="Hapus banner"
          aria-label={`Hapus banner ${slide.title}`}
        >
          {busyId === slide.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </div>

      {isEditing && (
        <div className="w-full border-t border-cream-200 pt-3">
          <label className={typography.fieldLabel} htmlFor={`slide-image-${slide.id}`}>
            Ganti gambar banner
          </label>
          <input
            id={`slide-image-${slide.id}`}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            onChange={(e) => onUploadImage(slide.id, e.target.files?.[0])}
            className="w-full rounded-xl border border-cream-300 bg-cream-50 px-3 py-2 text-caption file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-2.5 file:py-1 file:text-caption file:font-bold file:text-brand-700"
          />
          <p className="mt-1 text-caption text-ink-400">
            PNG/JPEG/WebP, maksimal 8 MB. Otomatis dikompres ke WebP 1600 px.
          </p>
        </div>
      )}
    </article>
  );
};
