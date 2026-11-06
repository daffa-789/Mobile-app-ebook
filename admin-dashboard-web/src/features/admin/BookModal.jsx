import { useRef } from 'react';
import { FileUp, Loader2, X, CheckCircle2, FileText } from 'lucide-react';
import { useDialogFocusTrap } from '@lib/useDialogFocusTrap';
import { layout, typography, controls } from '@lib/styles';

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

  useDialogFocusTrap(panelRef, { isOpen, onClose });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 p-4 backdrop-blur-sm page-transition"
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-modal-title"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-cream-50 p-5 shadow-2xl sm:p-6 focus-visible:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={layout.rowEnd}>
          <div>
            <h2 id="book-modal-title" className="text-title font-black text-ink-900">
              {editingBookId ? 'Ubah buku' : 'Tambah buku'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="close-book-modal"
            className="rounded-xl p-2 -m-1.5 min-h-11 min-w-11 flex items-center justify-center text-ink-300 hover:bg-cream-200 hover:text-ink-700 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Tutup dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <label className="block">
            <span className={typography.fieldLabelSoft}>Judul buku</span>
            <input
              required
              value={bookForm.title}
              onChange={(e) => setBookForm((form) => ({ ...form, title: e.target.value }))}
              placeholder="Judul buku"
              className="w-full rounded-xl border border-cream-300 px-3 py-2.5 text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 focus:border-brand-600 transition"
            />
          </label>

          <label className="block rounded-2xl border border-dashed border-cream-300 p-3 text-caption text-ink-500">
            <span className="font-bold text-ink-800">Thumbnail</span>
            <input
              required={!editingBookId && !bookForm.cover_url}
              type="file"
              accept="image/*"
              className="mt-2 block w-full text-caption text-ink-500 file:mr-3 file:rounded-xl file:border-0 file:bg-cream-200 file:px-3 file:py-1.5 file:text-caption file:font-semibold file:text-ink-700 hover:file:bg-cream-300 cursor-pointer"
              onChange={(e) =>
                setBookForm((form) => ({ ...form, thumbnail: e.target.files?.[0] || null }))
              }
            />
            {bookForm.thumbnail ? (
              <div className="mt-2.5 flex items-center gap-3 p-2 bg-cream-100 rounded-xl border border-cream-300">
                <div className="h-16 w-12 rounded-lg overflow-hidden bg-cream-300 shrink-0 border border-cream-300">
                  <img
                    src={
                      typeof bookForm.thumbnail === 'string'
                        ? bookForm.thumbnail
                        : URL.createObjectURL(bookForm.thumbnail)
                    }
                    alt="Preview thumbnail"
                    className={layout.media}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-ink-800 text-caption truncate">
                    {bookForm.thumbnail.name}
                  </p>
                  <p className={typography.metaTight}>
                    {(bookForm.thumbnail.size / 1024).toFixed(1)} KB
                  </p>
                  <span className="inline-flex items-center gap-1 text-micro font-bold text-brand-600 mt-1">
                    <CheckCircle2 className="w-3 h-3" /> Siap diunggah
                  </span>
                </div>
              </div>
            ) : bookForm.cover_url ? (
              <div className="mt-2.5 flex items-center gap-3 p-2 bg-cream-100 rounded-xl border border-cream-300">
                <div className="h-16 w-12 rounded-lg overflow-hidden bg-cream-300 shrink-0 border border-cream-300">
                  <img src={bookForm.cover_url} alt="Thumbnail saat ini" className={layout.media} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-ink-800 text-caption truncate">Thumbnail saat ini</p>
                  <span className="inline-flex items-center gap-1 text-micro font-bold text-ink-500 mt-1">
                    Pilih gambar baru jika ingin mengganti
                  </span>
                </div>
              </div>
            ) : null}
          </label>

          <label className="block rounded-2xl border border-dashed border-brand-300 bg-brand-50/40 p-3 text-caption text-ink-500">
            <span className="font-bold text-ink-800">Konten buku</span>
            <input
              required={!editingBookId && !bookForm.content_name}
              type="file"
              accept=".pdf,.txt,.doc,.docx,.rtf,.odt,.epub,.md,.csv"
              className="mt-2 block w-full text-caption text-ink-500 file:mr-3 file:rounded-xl file:border-0 file:bg-brand-100 file:px-3 file:py-1.5 file:text-caption file:font-semibold file:text-brand-800 hover:file:bg-brand-200 cursor-pointer"
              onChange={(e) =>
                setBookForm((form) => ({ ...form, content: e.target.files?.[0] || null }))
              }
            />
            {bookForm.content ? (
              <div className="mt-2.5 flex items-center gap-3 p-2.5 bg-cream-50 rounded-xl border border-brand-200 shadow-sm">
                <div className="h-10 w-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-ink-800 text-caption truncate">
                    {bookForm.content.name}
                  </p>
                  <p className={typography.metaTight}>
                    {(bookForm.content.size / 1024 / 1024).toFixed(2)} MB •{' '}
                    {bookForm.content.name.split('.').pop()?.toUpperCase() || 'DOKUMEN'}
                  </p>
                  <span className="inline-flex items-center gap-1 text-micro font-bold text-brand-700 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Berkas dokumen terlampir
                  </span>
                </div>
              </div>
            ) : bookForm.content_name ? (
              <div className="mt-2.5 flex items-center gap-3 p-2.5 bg-cream-50 rounded-xl border border-brand-200 shadow-sm">
                <div className="h-10 w-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-ink-800 text-caption truncate">
                    {bookForm.content_name}
                  </p>
                  <span className="inline-flex items-center gap-1 text-micro font-bold text-ink-500 mt-0.5">
                    Berkas saat ini • Pilih berkas baru jika ingin mengganti
                  </span>
                </div>
              </div>
            ) : null}
          </label>

          <label className="flex min-h-6 items-center gap-2 text-caption font-medium text-ink-500 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={bookForm.is_locked}
              onChange={(e) => setBookForm((form) => ({ ...form, is_locked: e.target.checked }))}
              className="h-6 w-6 rounded border-cream-300 accent-brand-700 cursor-pointer"
            />
            <span>Hanya untuk pelanggan Pro</span>
          </label>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSavingBook}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-700 px-4 py-3.5 text-body font-bold text-cream-50 transition hover:bg-brand-800 disabled:opacity-60 cursor-pointer shadow-sm"
            >
              {isSavingBook ? (
                <>
                  <Loader2 className={controls.spinner} />
                  <span>Menyimpan buku…</span>
                </>
              ) : (
                <>
                  <FileUp className="h-4 w-4" />
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
