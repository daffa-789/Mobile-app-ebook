import { useState, useCallback, useRef } from 'react';
import { BookOpen, Lock, Sparkles } from 'lucide-react';
import { useApp } from '@context/AppContext';
import { useDialogFocusTrap } from '@lib/useDialogFocusTrap';
import { BookGridSkeleton } from '@ui/Skeleton';
import HeroCarousel from './HeroCarousel';
import { BookCard } from './BookCard';

export const HomeScreen = () => {
  const {
    books,
    loadingCatalog,
    catalogError,
    refreshBooks,
    openReader,
    user,
    navigateTo,
    carouselSlides,
  } = useApp();

  const [imgErrors, setImgErrors] = useState({});
  const [paywallBook, setPaywallBook] = useState(null);

  const paywallPanelRef = useRef(null);

  const handleImgError = useCallback((id) => {
    setImgErrors((prev) => ({ ...prev, [id]: true }));
  }, []);

  const handleBookClick = useCallback(
    (book) => {
      const isLocked = book.isLocked && !user.isPro;
      if (isLocked) {
        setPaywallBook(book);
      } else {
        openReader(book);
      }
    },
    [user.isPro, openReader],
  );

  useDialogFocusTrap(paywallPanelRef, {
    isOpen: Boolean(paywallBook),
    onClose: () => setPaywallBook(null),
  });

  return (
    <div className="flex-1 flex flex-col justify-between bg-cream-50 min-h-[calc(100vh-2rem)]">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 flex-1 flex flex-col justify-between items-center">
        {loadingCatalog ? (
          <div className="w-full">
            <BookGridSkeleton count={10} />
          </div>
        ) : catalogError ? (
          <section
            className="my-auto w-full max-w-xl rounded-3xl border border-dashed border-semantic-danger/40 bg-semantic-dangerLight p-10 text-center"
            role="alert"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-semantic-danger/15 text-semantic-danger">
              <BookOpen className="h-7 w-7" />
            </div>
            <h1 className="mt-5 font-display text-h2 font-bold tracking-tight text-ink-900">
              Koleksi gagal dimuat
            </h1>
            <p className="mx-auto mt-2 max-w-md text-body leading-relaxed text-ink-500">
              {catalogError}
            </p>
            <button
              type="button"
              onClick={() => refreshBooks().catch(() => {})}
              className="mt-5 rounded-2xl bg-brand-700 px-4 py-3 text-small font-bold text-cream-50 transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              Coba muat ulang
            </button>
          </section>
        ) : books.length === 0 ? (
          <section className="my-auto w-full max-w-xl rounded-3xl border border-dashed border-cream-300 bg-cream-100 p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
              <BookOpen className="h-7 w-7" />
            </div>
            <h1 className="mt-5 font-display text-h2 font-bold tracking-tight text-ink-900">
              Koleksi sedang disiapkan
            </h1>
            <p className="mx-auto mt-2 max-w-md text-body leading-relaxed text-ink-500">
              Belum ada buku yang tersedia. Administrator dapat menambahkan buku beserta thumbnail
              dan lampiran bacaan dari dashboard.
            </p>
          </section>
        ) : (
          <div className="w-full">
            {carouselSlides.length > 0 && (
              <div className="w-full mb-5 sm:mb-7">
                <HeroCarousel slides={carouselSlides} />
              </div>
            )}

            {/* Grid Koleksi Buku */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5 lg:gap-6 justify-start items-start">
              {books.map((book, index) => (
                <BookCard
                  key={book.id}
                  book={book}
                  isLocked={Boolean(book.isLocked && !user.isPro)}
                  onBookClick={handleBookClick}
                  onPaywallClick={setPaywallBook}
                  hasError={Boolean(imgErrors[book.id])}
                  onError={handleImgError}
                  priority={index < 2}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {paywallBook && (
        <div
          data-testid="paywall-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 backdrop-blur-sm p-4 duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="paywall-title"
        >
          <div
            ref={paywallPanelRef}
            tabIndex={-1}
            className="w-full max-w-md rounded-3xl border border-cream-300 bg-cream-100 p-6 sm:p-7 shadow-2xl transition-all scale-100 animate-in fade-in zoom-in-95 outline-none"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-400/20 text-gold-500 ring-1 ring-gold-500/30">
              <Lock className="h-6 w-6 text-gold-700" />
            </div>

            <h2 id="paywall-title" className="mt-4 font-display text-h3 font-bold text-ink-900">
              Buku Khusus Anggota Pro
            </h2>

            <p className="mt-2 text-body leading-relaxed text-ink-500">
              <strong className="text-ink-900">{paywallBook.title}</strong> merupakan bagian dari
              koleksi eksklusif Wahidiyah Book. Berlangganan Pro untuk membuka akses baca penuh
              tanpa batas.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                data-testid="paywall-upgrade-button"
                onClick={() => {
                  setPaywallBook(null);
                  navigateTo('pro');
                }}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-brand-700 px-5 py-3 text-small font-bold text-cream-50 shadow-md shadow-brand-700/20 transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-gold-400" />
                <span>Buka Akses Pro</span>
              </button>

              <button
                type="button"
                data-testid="paywall-close-button"
                onClick={() => setPaywallBook(null)}
                className="flex-1 rounded-2xl border border-cream-300 bg-cream-50 px-5 py-3 text-small font-bold text-ink-700 transition hover:bg-cream-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-400 cursor-pointer"
              >
                Nanti Saja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
