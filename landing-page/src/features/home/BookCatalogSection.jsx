import { useState, useMemo, useCallback } from 'react';
import { Search, SlidersHorizontal, BookOpen, X } from 'lucide-react';
import { BookCard } from './BookCard';
import { BookGridSkeleton } from '@ui/Skeleton';

export const BookCatalogSection = ({
  books = [],
  loading = false,
  error = null,
  onRetry,
  onBookClick,
  onPaywallClick,
  user,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua'); // 'Semua' | 'Gratis' | 'Pro Eksklusif'
  const [sortBy, setSortBy] = useState('terbaru'); // 'terbaru' | 'az' | 'za'
  const [imgErrors, setImgErrors] = useState({});

  const handleImgError = useCallback((id) => {
    setImgErrors((prev) => ({ ...prev, [id]: true }));
  }, []);

  const counts = useMemo(() => {
    let gratis = 0;
    let pro = 0;
    books.forEach((b) => {
      if (b.isLocked) pro += 1;
      else gratis += 1;
    });
    return { semua: books.length, gratis, pro };
  }, [books]);

  const filteredBooks = useMemo(() => {
    let result = [...books];

    // 1. Text Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((b) => b.title?.toLowerCase().includes(q));
    }

    // 2. Category Filter
    if (selectedCategory === 'Gratis') {
      result = result.filter((b) => !b.isLocked);
    } else if (selectedCategory === 'Pro Eksklusif') {
      result = result.filter((b) => b.isLocked);
    }

    // 3. Sorting
    if (sortBy === 'az') {
      result.sort((a, b) => a.title.localeCompare(b.title, 'id'));
    } else if (sortBy === 'za') {
      result.sort((a, b) => b.title.localeCompare(a.title, 'id'));
    } else if (sortBy === 'terbaru') {
      result.sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      });
    }

    return result;
  }, [books, searchQuery, selectedCategory, sortBy]);

  return (
    <section id="katalog" className="w-full py-8 sm:py-12">
      <div className="w-full space-y-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-brand-700 tracking-wider uppercase bg-brand-100/70 px-3 py-1 rounded-full">
              Khazanah Naskah Digital
            </span>
            <h2 className="mt-2 font-serif text-2xl sm:text-3xl font-bold text-ink-900 tracking-tight">
              Koleksi & Literatur Wahidiyah
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Jelajahi karya keilmuan, amaliyah, terjemah naskah, dan pedoman resmi.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="text-xs font-medium text-ink-400">
            Menampilkan <strong className="text-ink-900">{filteredBooks.length}</strong> naskah
          </div>
        </div>

        {/* Search, Filter & Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-cream-100/80 p-3 sm:p-4 rounded-2xl border border-cream-200">
          {/* Live Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-ink-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul kitab atau naskah..."
              className="w-full pl-9 pr-8 py-2 text-sm bg-cream-50 border border-cream-300 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 transition text-ink-900 placeholder:text-ink-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 p-0.5 cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {[
              { id: 'Semua', label: 'Semua', count: counts.semua },
              { id: 'Gratis', label: 'Gratis', count: counts.gratis },
              { id: 'Pro Eksklusif', label: 'Pro Eksklusif', count: counts.pro },
            ].map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    active
                      ? 'bg-brand-700 text-cream-50 shadow-xs'
                      : 'bg-cream-50 text-ink-700 hover:bg-cream-200 border border-cream-200'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      active ? 'bg-brand-900 text-cream-100' : 'bg-cream-200 text-ink-600'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-ink-400 hidden sm:block" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 text-xs font-semibold text-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 cursor-pointer"
            >
              <option value="terbaru">Urutan: Terbaru</option>
              <option value="az">Judul (A — Z)</option>
              <option value="za">Judul (Z — A)</option>
            </select>
          </div>
        </div>

        {/* Catalog Body */}
        {loading ? (
          <BookGridSkeleton count={8} />
        ) : error ? (
          <div className="rounded-3xl border border-dashed border-semantic-danger/40 bg-semantic-dangerLight p-10 text-center">
            <BookOpen className="w-8 h-8 text-semantic-danger mx-auto mb-3" />
            <h3 className="font-serif text-lg font-bold text-ink-900">
              Katalog Naskah Gagal Dimuat
            </h3>
            <p className="mt-1 text-sm text-ink-600 max-w-md mx-auto">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-4 px-4 py-2 bg-brand-700 hover:bg-brand-800 text-cream-50 text-xs font-bold rounded-xl cursor-pointer"
              >
                Coba Muat Ulang
              </button>
            )}
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-cream-300 bg-cream-100/60 p-12 text-center">
            <BookOpen className="w-10 h-10 text-cream-400 mx-auto mb-3" />
            <h3 className="font-serif text-lg font-bold text-ink-900">
              Tidak Ada Naskah yang Cocok
            </h3>
            <p className="mt-1 text-sm text-ink-500 max-w-sm mx-auto">
              {searchQuery
                ? `Tidak ditemukan naskah dengan kata kunci "${searchQuery}". Silakan coba kata kunci lain.`
                : 'Belum ada buku dalam kategori ini.'}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-4 px-3 py-1.5 text-xs font-bold text-brand-700 border border-brand-700/30 rounded-xl hover:bg-brand-50 cursor-pointer"
              >
                Reset Pencarian
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5 lg:gap-6 justify-start items-start">
            {filteredBooks.map((book, index) => (
              <BookCard
                key={book.id}
                book={book}
                isLocked={Boolean(book.isLocked && !user?.isPro)}
                onBookClick={onBookClick}
                onPaywallClick={onPaywallClick}
                hasError={Boolean(imgErrors[book.id])}
                onError={handleImgError}
                priority={index < 2}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default BookCatalogSection;
