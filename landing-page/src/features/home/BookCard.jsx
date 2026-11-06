import React from 'react';
import { BookOpen, Lock } from 'lucide-react';

export const BookCard = React.memo(
  ({ book, isLocked, onBookClick, onPaywallClick, hasError, onError, priority = false }) => {
    const handleClick = () => {
      if (isLocked) {
        onPaywallClick(book);
      } else {
        onBookClick(book);
      }
    };

    return (
      <div
        data-testid={`book-card-${book.id}`}
        role="button"
        tabIndex={0}
        aria-label={`Buka buku ${book.title}${isLocked ? ' (Terkunci Pro)' : ''}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        onClick={handleClick}
        className="group flex flex-col cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 rounded-lg p-1 transition-transform duration-300"
      >
        {/* Sampul Buku Realistis dengan Efek Tulang Belakang & Bayangan Lembut */}
        <div className="relative w-full aspect-[1/1.42] rounded-md overflow-hidden bg-cream-200/60 shadow-[0_4px_16px_rgba(0,0,0,0.12)] group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] group-hover:-translate-y-1.5 transition-all duration-300">
          {/* Efek Gradasi Punggung Buku di Sisi Kiri */}
          <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-ink-950/25 via-cream-50/15 to-transparent pointer-events-none z-10" />

          {!hasError && book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              loading={priority ? 'eager' : 'lazy'}
              fetchPriority={priority ? 'high' : undefined}
              decoding="async"
              onError={() => onError?.(book.id)}
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-4 text-center select-none w-full h-full bg-gradient-to-b from-brand-800 to-brand-950 text-cream-50">
              <BookOpen className="w-8 h-8 text-gold-400 mb-2 opacity-80 group-hover:scale-110 transition-transform" />
              <span className="text-caption font-bold line-clamp-2 px-1">{book.title}</span>
            </div>
          )}

          {/* Badge Pro Eksklusif bila Terkunci */}
          {isLocked && (
            <div className="absolute top-2 right-2 z-20">
              <span className="flex items-center gap-1 bg-ink-900/90 text-gold-300 text-micro font-bold px-2 py-0.5 rounded shadow-sm border border-gold-500/30 backdrop-blur-xs">
                <Lock className="w-2.5 h-2.5 text-gold-400" />
                <span>PRO</span>
              </span>
            </div>
          )}
        </div>

        {/* Teks Judul di Bawah Sampul */}
        <div className="mt-2.5">
          <h3 className="font-bold text-sm text-ink-900 leading-snug line-clamp-2 group-hover:text-brand-700 transition-colors">
            {book.title}
          </h3>
          <p className="mt-0.5 text-xs text-ink-400">
            {book.pages ? `${book.pages} halaman` : 'Naskah Digital'}
          </p>
        </div>
      </div>
    );
  },
);

export default BookCard;
