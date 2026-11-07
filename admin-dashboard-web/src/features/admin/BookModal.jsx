import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, FileText, FileUp, ImageUp, Loader2, LockKeyhole, X } from 'lucide-react';
import { useDialogFocusTrap } from '@lib/useDialogFocusTrap';
import { layout, typography, controls } from '@lib/styles';

const formatSize = (bytes) => {
  const size = Number(bytes || 0);
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(2)} MB`;
  return `${(size / 1024).toFixed(1)} KB`;
};

/**
 * BookModal — Dialog tambah/ubah buku dengan dropzone seret-lepas.
 * Nama field (title, thumbnail, content, is_locked) dipertahankan persis
 * agar useAdminBookEditor dan endpoint upload Supabase tetap bekerja.
 */
export const BookModal = ({
  isOpen = true,
  onClose,
  bookForm,
  setBookForm,
  onSubmit,
  isSavingBook,
  editingBookId = null,
}) => {
  const panelRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');

  useDialogFocusTrap(panelRef, { isOpen, onClose });

  const thumbnailFile =
    bookForm?.thumbnail && typeof bookForm.thumbnail === 'object' ? bookForm.thumbnail : null;
  const thumbnailSource = thumbnailFile
    ? thumbnailPreview
    : typeof bookForm?.thumbnail === 'string'
      ? bookForm.thumbnail
      : '';

  useEffect(() => {
    if (!thumbnailFile) {
      setThumbnailPreview('');
      return undefined;
    }
    const url = URL.createObjectURL(thumbnailFile);
    setThumbnailPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [thumbnailFile]);

  if (!isOpen) return null;

  const dropzoneProps = (field) => ({
    onDragOver: (event) => {
      event.preventDefault();
      setDragging(field);
    },
    onDragLeave: (event) => {
      event.preventDefault();
      setDragging((current) => (current === field ? null : current));
    },
    onDrop: (event) => {
      event.preventDefault();
      setDragging(null);
      const file = event.dataTransfer?.files?.[0];
      if (file) setBookForm((form) => ({ ...form, [field]: file }));
    },
  });

  const isDragging = (field) => dragging === field;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 p-4 page-transition"
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-modal-title"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-cream-200 bg-ui-card shadow-2xl focus-visible:outline-none"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex items-start justify-between gap-4 border-b border-brand-800 bg-brand-900 px-5 py-4 sm:px-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold-300">
              Koleksi Digital
            </span>
            <h2 id="book-modal-title" className="mt-1 font-serif text-xl font-bold text-cream-50">
              {editingBookId ? 'Ubah buku' : 'Tambah buku'}
            </h2>
            <p className="mt-0.5 text-[11px] text-cream-200/80">
              Unggah naskah dan sampul untuk ditampilkan di aplikasi.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="close-book-modal"
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl p-2 text-cream-200 transition hover:bg-brand-700 hover:text-cream-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
            aria-label="Tutup dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-5 sm:p-6">
          <label className="block">
            <span className={typography.fieldLabelSoft}>Judul buku</span>
            <input
              required
              value={bookForm.title}
              onChange={(event) => setBookForm((form) => ({ ...form, title: event.target.value }))}
              placeholder="Contoh: Lembaran Sholawat Wahidiyah"
              className="w-full rounded-xl border border-cream-300 bg-cream-50 px-3 py-2.5 text-sm text-ink-800 outline-none transition placeholder:text-ink-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
            />
          </label>

          {/* Dropzone thumbnail */}
          <div
            {...dropzoneProps('thumbnail')}
            className={`rounded-2xl border-2 border-dashed p-4 transition ${
              isDragging('thumbnail')
                ? 'border-brand-600 bg-brand-50'
                : 'border-cream-300 bg-cream-50 hover:border-brand-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                <ImageUp className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-ink-800">Sampul buku</p>
                <p className="text-[11px] text-ink-500">
                  Seret gambar ke sini atau pilih berkas (JPG/PNG/WebP).
                </p>
              </div>
            </div>
            <input
              required={!editingBookId && !bookForm.cover_url}
              type="file"
              accept="image/*"
              aria-label="Pilih sampul buku"
              className="mt-3 block w-full text-xs text-ink-500 file:mr-3 file:rounded-xl file:border-0 file:bg-brand-100 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-brand-800 hover:file:bg-brand-200 cursor-pointer"
              onChange={(event) =>
                setBookForm((form) => ({ ...form, thumbnail: event.target.files?.[0] || null }))
              }
            />
            {bookForm.thumbnail ? (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-brand-200 bg-ui-card p-2.5 shadow-sm">
                <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg border border-cream-200 bg-cream-100">
                  <img src={thumbnailSource} alt="Preview sampul" className={layout.media} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-ink-800">
                    {thumbnailFile ? thumbnailFile.name : 'Sampul baru'}
                  </p>
                  <p className={typography.metaTight}>
                    {thumbnailFile ? formatSize(thumbnailFile.size) : 'Siap diunggah'}
                  </p>
                  <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-brand-700">
                    <CheckCircle2 className="h-3 w-3" /> Siap diunggah
                  </span>
                </div>
              </div>
            ) : bookForm.cover_url ? (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-cream-200 bg-ui-card p-2.5">
                <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg border border-cream-200 bg-cream-100">
                  <img src={bookForm.cover_url} alt="Sampul saat ini" className={layout.media} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-ink-800">Sampul saat ini</p>
                  <p className="text-[11px] text-ink-500">
                    Pilih gambar baru jika ingin mengganti.
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          {/* Dropzone naskah */}
          <div
            {...dropzoneProps('content')}
            className={`rounded-2xl border-2 border-dashed p-4 transition ${
              isDragging('content')
                ? 'border-brand-600 bg-brand-50'
                : 'border-brand-200 bg-brand-50/40 hover:border-brand-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 text-cream-50">
                <FileUp className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-ink-800">Naskah buku</p>
                <p className="text-[11px] text-ink-500">
                  Seret dokumen ke sini (PDF, DOCX, TXT, EPUB).
                </p>
              </div>
            </div>
            <input
              required={!editingBookId && !bookForm.content_name}
              type="file"
              accept=".pdf,.txt,.doc,.docx,.rtf,.odt,.epub,.md,.csv"
              aria-label="Pilih naskah buku"
              className="mt-3 block w-full text-xs text-ink-500 file:mr-3 file:rounded-xl file:border-0 file:bg-brand-700 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-cream-50 hover:file:bg-brand-800 cursor-pointer"
              onChange={(event) =>
                setBookForm((form) => ({ ...form, content: event.target.files?.[0] || null }))
              }
            />
            {bookForm.content ? (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-brand-200 bg-ui-card p-2.5 shadow-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-ink-800">{bookForm.content.name}</p>
                  <p className={typography.metaTight}>
                    {formatSize(bookForm.content.size)} •{' '}
                    {bookForm.content.name.split('.').pop()?.toUpperCase() || 'DOKUMEN'}
                  </p>
                  <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-bold text-brand-700">
                    <CheckCircle2 className="h-3 w-3" /> Berkas terlampir
                  </span>
                </div>
              </div>
            ) : bookForm.content_name ? (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-brand-200 bg-ui-card p-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-ink-800">{bookForm.content_name}</p>
                  <p className="text-[11px] text-ink-500">
                    Berkas saat ini • pilih berkas baru untuk mengganti.
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-cream-200 bg-cream-50 px-3 py-3 text-xs font-semibold text-ink-700">
            <input
              type="checkbox"
              checked={bookForm.is_locked}
              onChange={(event) =>
                setBookForm((form) => ({ ...form, is_locked: event.target.checked }))
              }
              className="h-5 w-5 rounded border-cream-300 accent-brand-700 cursor-pointer"
            />
            <LockKeyhole className="h-4 w-4 text-gold-600" />
            <span>Hanya untuk pelanggan Pro</span>
          </label>

          <div className="flex items-center justify-end gap-2 border-t border-cream-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-cream-300 bg-ui-card px-4 py-2.5 text-xs font-bold text-ink-700 transition hover:bg-cream-100 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSavingBook}
              className="flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 py-2.5 text-xs font-bold text-cream-50 shadow-sm transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {isSavingBook ? (
                <>
                  <Loader2 className={controls.spinner} />
                  <span>Menyimpan buku…</span>
                </>
              ) : (
                <>
                  <FileUp className="h-4 w-4 text-gold-300" />
                  <span>Simpan buku & lampiran</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
