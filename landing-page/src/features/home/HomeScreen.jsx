import { useState, useCallback, useRef } from 'react';
import { ArrowRight, BookOpen, Crown, FileText, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { useApp } from '@context/AppContext';
import { useDialogFocusTrap } from '@lib/useDialogFocusTrap';
import { HeroCarousel } from './HeroCarousel';
import { BookCatalogSection } from './BookCatalogSection';

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

  const [paywallBook, setPaywallBook] = useState(null);
  const paywallPanelRef = useRef(null);

  const handleBookClick = useCallback(
    (book) => {
      const isLocked = book.isLocked && !user?.isPro;
      if (isLocked) {
        setPaywallBook(book);
      } else {
        openReader(book);
      }
    },
    [user?.isPro, openReader],
  );

  useDialogFocusTrap(paywallPanelRef, {
    isOpen: Boolean(paywallBook),
    onClose: () => setPaywallBook(null),
  });

  return (
    <div className="flex-1 w-full bg-cream-50">
      {/* Hero Section Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {carouselSlides && carouselSlides.length > 0 && (
          <div className="mb-8">
            <HeroCarousel slides={carouselSlides} />
          </div>
        )}

        {/* Landing Value Proposition Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cream-100 via-cream-50 to-cream-200/70 border border-cream-200/80 p-8 sm:p-12 shadow-xs mb-10 text-center sm:text-left">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gold-400/20 text-gold-700 ring-1 ring-gold-500/30 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-gold-600" />
              <span>Perpustakaan Digital Sholawat Wahidiyah</span>
            </span>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink-900 tracking-tight leading-tight">
              Akses Khazanah Keilmuan, Amaliyah & Naskah Terverifikasi
            </h1>

            <p className="mt-4 text-base sm:text-lg text-ink-600 leading-relaxed max-w-2xl">
              Platform literatur digital resmi untuk mempelajari, mendalami, dan mengamalkan ajaran
              Sholawat Wahidiyah secara mudah, terpercaya, dan nyaman langsung melalui peramban web.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 justify-center sm:justify-start">
              <a
                href="#katalog"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-brand-700 hover:bg-brand-800 text-cream-50 font-bold text-sm shadow-md shadow-brand-900/10 transition cursor-pointer"
              >
                <span>Mulai Membaca</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={() => navigateTo('pro')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-brand-700/40 text-brand-800 hover:bg-brand-50 font-bold text-sm transition cursor-pointer"
              >
                <Crown className="w-4 h-4 text-gold-600" />
                <span>Pelajari Paket Pro</span>
              </button>
            </div>
          </div>

          {/* Quick Feature Pillars */}
          <div className="mt-10 pt-8 border-t border-cream-300/60 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink-900">Naskah Resmi</h4>
                <p className="text-xs text-ink-500 mt-0.5">
                  Teks dan manuskrip terverifikasi langsung dari sumber keilmuan.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-gold-100 text-gold-700 flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink-900">Multi-Format Reader</h4>
                <p className="text-xs text-ink-500 mt-0.5">
                  Mendukung pembaca PDF continuous scroll dan dokumen Word (DOCX).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0 mt-0.5">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink-900">Akses Tanpa Batas</h4>
                <p className="text-xs text-ink-500 mt-0.5">
                  Buka koleksi eksklusif dengan keanggotaan Member Pro bulanan.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Book Catalog Section with Live Search and Filters */}
        <BookCatalogSection
          books={books}
          loading={loadingCatalog}
          error={catalogError}
          onRetry={() => refreshBooks().catch(() => {})}
          onBookClick={handleBookClick}
          onPaywallClick={setPaywallBook}
          user={user}
        />
      </div>

      {/* Paywall Modal */}
      {paywallBook && (
        <div
          data-testid="paywall-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="paywall-title"
        >
          <div
            ref={paywallPanelRef}
            tabIndex={-1}
            className="w-full max-w-md rounded-3xl border border-cream-300 bg-cream-50 p-6 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 outline-none"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-400/20 text-gold-600 ring-1 ring-gold-500/30">
              <Lock className="h-6 w-6 text-gold-700" />
            </div>

            <h2
              id="paywall-title"
              className="mt-4 font-serif text-xl sm:text-2xl font-bold text-ink-900"
            >
              Buku Khusus Anggota Pro
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              <strong className="text-ink-900 font-semibold">{paywallBook.title}</strong> merupakan
              bagian dari koleksi eksklusif Wahidiyah Book. Berlangganan Pro untuk membuka akses
              baca penuh tanpa batas.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                data-testid="paywall-upgrade-button"
                onClick={() => {
                  setPaywallBook(null);
                  navigateTo('pro');
                }}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-brand-700 px-5 py-3 text-sm font-bold text-cream-50 shadow-md shadow-brand-700/20 transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-gold-400" />
                <span>Buka Akses Pro</span>
              </button>

              <button
                type="button"
                data-testid="paywall-close-button"
                onClick={() => setPaywallBook(null)}
                className="flex-1 rounded-2xl border border-cream-300 bg-cream-100 px-5 py-3 text-sm font-bold text-ink-700 transition hover:bg-cream-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-400 cursor-pointer"
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

export default HomeScreen;
