import { BookOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import { layout, typography, controls } from '@lib/styles';

/**
 * BooksTab — Sub-tab Koleksi Buku Admin Dashboard (§Fase 5 Roadmap).
 *
 * Menampilkan:
 * 1. Tombol "Tambah buku" (memicu modal upload)
 * 2. Daftar koleksi buku lengkap dengan thumbnail, jumlah halaman, berkas lampiran, dan status Pro
 * 3. Aksi edit dan hapus per buku
 * 4. Tampilan kosong (empty state) jika belum ada buku
 */
export const BooksTab = ({ books = [], onAddBook, onEditBook, onDeleteBook }) => {
  return (
    <section className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div></div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAddBook}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-700 px-4 py-3 text-small font-bold text-cream-50 shadow-sm transition hover:bg-brand-800 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Tambah buku
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-cream-300 bg-cream-50 shadow-sm">
        {books.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className={controls.emptyIcon} />
            <p className="mt-3 font-bold text-ink-700">Koleksi masih kosong</p>
            <p className={typography.helper}>
              Tambahkan buku pertama beserta thumbnail dan lampirannya.
            </p>
          </div>
        ) : (
          <div className={layout.divider}>
            {books.map((book) => (
              <div key={book.id} className="flex flex-wrap items-center gap-4 p-4">
                <div className="h-14 w-11 overflow-hidden rounded-xl bg-gradient-to-tr from-brand-800 to-brand-800 flex items-center justify-center text-cream-50 shrink-0 shadow-sm">
                  {book.coverUrl ? (
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className={layout.media}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <BookOpen className="h-5 w-5 text-cream-50/80" />
                  )}
                </div>
                <div className="min-w-[180px] flex-1">
                  <p className="font-bold text-ink-900">{book.title}</p>
                  <p className={typography.helperTight}>
                    {book.pages ? `${book.pages} halaman • ` : ''}
                    {book.contentName || 'Tanpa lampiran'} {book.isLocked ? '• Pro' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onEditBook(book)}
                    className="rounded-xl border border-cream-300 p-2 text-ink-700 hover:bg-cream-100 transition cursor-pointer"
                    title="Ubah buku"
                  >
                    <Pencil className="h-4 w-4 text-brand-700" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteBook(book)}
                    className="rounded-xl border border-semantic-danger/30 p-2 text-semantic-danger transition hover:bg-semantic-dangerLight cursor-pointer"
                    title="Hapus buku"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
