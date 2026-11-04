/**
 * Komponen bilah navigasi atas (top bar) untuk layar pembaca naskah buku.
 * Mengatur tombol kembali, navigasi lompat halaman, dan pengalih layar penuh (fullscreen).
 *
 * @module src/features/reader/ReaderTopBar
 */

import { ArrowLeft, Maximize, Minimize } from 'lucide-react';

/**
 * Komponen bilah atas pembaca dokumen.
 *
 * @param {object} props - Properti komponen
 * @param {string} props.title - Judul buku
 * @param {string} props.pageInput - Nilai masukan nomor halaman saat ini
 * @param {(val: string) => void} props.setPageInput - Setter teks input nomor halaman
 * @param {(e: import('react').FormEvent) => void} props.onPageInputSubmit - Handler submit lompat halaman
 * @param {number} props.totalPages - Total halaman dokumen
 * @param {boolean} props.supportsNativeFullscreen - Apakah peramban mendukung mode layar penuh
 * @param {boolean} props.isFullscreen - Apakah saat ini dalam mode layar penuh
 * @param {() => void} props.onToggleFullscreen - Handler toggle layar penuh
 * @param {() => void} props.onBack - Handler kembali ke beranda
 * @returns {import('react').JSX.Element}
 */
export const ReaderTopBar = ({
  title,
  pageInput,
  setPageInput,
  onPageInputSubmit,
  totalPages,
  supportsNativeFullscreen,
  isFullscreen,
  onToggleFullscreen,
  onBack,
}) => {
  return (
    <header
      aria-label={title}
      className="h-12 shrink-0 z-30 bg-ui-card/95 backdrop-blur-md border-b border-ink-200/70 px-4 sm:px-6 flex items-center justify-between shadow-xs"
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onBack}
          className="p-2 -ml-2 rounded-xl text-ink-600 hover:text-ink-900 hover:bg-ink-100 transition cursor-pointer shrink-0"
          title="Kembali ke beranda"
          aria-label="Kembali ke beranda"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <form
          onSubmit={onPageInputSubmit}
          className="flex shrink-0 items-center gap-0.5 rounded-lg px-1.5 py-1 font-mono text-small font-semibold text-ink-500"
          aria-label="Navigasi halaman"
        >
          <input
            type="text"
            inputMode="numeric"
            value={pageInput}
            onChange={(event) => setPageInput(event.target.value)}
            onBlur={onPageInputSubmit}
            className="min-w-[1ch] max-w-[4ch] bg-transparent text-right text-ink-800 focus-visible:outline-none"
            style={{ width: `${Math.max(1, pageInput.length)}ch` }}
            aria-label="Halaman saat ini"
            title="Ketik nomor halaman lalu tekan Enter"
          />
          <span aria-hidden="true">/</span>
          <span>{totalPages}</span>
        </form>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {supportsNativeFullscreen && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="p-2 rounded-xl text-ink-600 hover:text-ink-900 hover:bg-ink-100 transition cursor-pointer"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
            aria-label={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        )}
      </div>
    </header>
  );
};
