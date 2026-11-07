import { useMemo, useState } from 'react';
import {
  BookOpen,
  LockKeyhole,
  Pencil,
  Plus,
  Search,
  Trash2,
  UnlockKeyhole,
  X,
} from 'lucide-react';
import { layout, typography, controls } from '@lib/styles';

const FILTERS = [
  { id: 'semua', label: 'Semua' },
  { id: 'gratis', label: 'Gratis' },
  { id: 'pro', label: 'Pro' },
];

/**
 * BooksTab — Katalog buku dengan pencarian langsung dan filter akses.
 * Data & aksi CRUD tetap diterima dari props (useAdminBookEditor), tanpa perubahan logika.
 */
export const BooksTab = ({ books = [], onAddBook, onEditBook, onDeleteBook }) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('semua');

  const filteredBooks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return books.filter((book) => {
      const matchesQuery =
        !needle ||
        String(book.title || '')
          .toLowerCase()
          .includes(needle) ||
        String(book.contentName || '')
          .toLowerCase()
          .includes(needle);
      const matchesFilter =
        filter === 'semua' || (filter === 'pro' ? Boolean(book.isLocked) : !book.isLocked);
      return matchesQuery && matchesFilter;
    });
  }, [books, query, filter]);

  return (
    <section className="space-y-5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-600">
          Koleksi Digital
        </p>
        <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight text-brand-900">
          Manajemen Buku
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          Kelola naskah, sampul, dan hak akses untuk setiap judul.
        </p>
      </div>

      {/* Toolbar: pencarian + filter + tambah */}
      <div className="flex flex-col gap-3 rounded-2xl border border-cream-200 bg-ui-card p-4 shadow-[0_1px_2px_rgba(20,18,16,0.04)] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari judul atau berkas…"
              aria-label="Cari buku"
              className="w-full rounded-xl border border-cream-300 bg-cream-50 py-2.5 pl-9 pr-9 text-sm text-ink-800 outline-none transition placeholder:text-ink-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Hapus pencarian"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-ink-400 hover:bg-cream-200 hover:text-ink-700 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5" role="group" aria-label="Filter akses buku">
            {FILTERS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setFilter(option.id)}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer ${
                  filter === option.id
                    ? 'bg-brand-700 text-cream-50 shadow-sm'
                    : 'border border-cream-300 bg-cream-50 text-ink-600 hover:bg-cream-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-ink-400">
            {filteredBooks.length} dari {books.length} buku
          </span>
          <button
            type="button"
            onClick={onAddBook}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-xs font-bold text-cream-50 shadow-sm transition hover:bg-brand-800 hover:shadow-md cursor-pointer"
          >
            <Plus className="h-4 w-4 text-gold-300" /> Tambah buku
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-cream-200 bg-ui-card shadow-[0_1px_2px_rgba(20,18,16,0.04)]">
        {books.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className={controls.emptyIcon} />
            <p className="mt-3 font-bold text-ink-700">Koleksi masih kosong</p>
            <p className={typography.helper}>
              Tambahkan buku pertama beserta thumbnail dan lampirannya.
            </p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="p-12 text-center">
            <Search className="mx-auto h-9 w-9 text-cream-400" />
            <p className="mt-3 font-bold text-ink-700">Tidak ada buku yang cocok</p>
            <p className={typography.helper}>
              Ubah kata kunci atau filter akses untuk melihat hasil.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setFilter('semua');
              }}
              className="mt-3 rounded-xl border border-cream-300 px-3 py-2 text-xs font-bold text-brand-700 transition hover:bg-cream-100 cursor-pointer"
            >
              Reset pencarian
            </button>
          </div>
        ) : (
          <div className={layout.divider}>
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className="flex flex-wrap items-center gap-4 px-4 py-3.5 transition hover:bg-cream-50"
              >
                <div className="flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-cream-200 bg-gradient-to-br from-brand-800 to-brand-950 text-cream-50 shadow-sm">
                  {book.coverUrl ? (
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className={layout.media}
                      onError={(event) => {
                        event.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <BookOpen className="h-5 w-5 text-gold-300/80" />
                  )}
                </div>

                <div className="min-w-[180px] flex-1">
                  <p className="font-bold text-ink-900">{book.title}</p>
                  <p className={typography.helperTight}>
                    {book.pages ? `${book.pages} halaman • ` : ''}
                    {book.contentName || 'Tanpa lampiran'}
                  </p>
                </div>

                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    book.isLocked
                      ? 'bg-gold-300/25 text-gold-700 ring-1 ring-gold-400/40'
                      : 'bg-brand-50 text-brand-700 ring-1 ring-brand-200'
                  }`}
                >
                  {book.isLocked ? (
                    <LockKeyhole className="h-3 w-3" />
                  ) : (
                    <UnlockKeyhole className="h-3 w-3" />
                  )}
                  {book.isLocked ? 'Pro' : 'Gratis'}
                </span>

                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onEditBook(book)}
                    className="rounded-xl border border-cream-300 bg-ui-card p-2 text-ink-700 transition hover:border-brand-300 hover:bg-brand-50 cursor-pointer"
                    title="Ubah buku"
                    aria-label={`Ubah ${book.title}`}
                  >
                    <Pencil className="h-4 w-4 text-brand-700" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteBook(book)}
                    className="rounded-xl border border-semantic-danger/30 bg-ui-card p-2 text-semantic-danger transition hover:bg-semantic-dangerLight cursor-pointer"
                    title="Hapus buku"
                    aria-label={`Hapus ${book.title}`}
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
