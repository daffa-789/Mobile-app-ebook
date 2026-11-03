/**
 * Komponen bilah navigasi atas (top bar) untuk layar pembaca naskah buku.
 * Mengatur tombol kembali, navigasi lompat halaman, kontrol zoom (in/out/reset),
 * dan pengalih layar penuh (fullscreen).
 *
 * @module src/features/reader/ReaderTopBar
 */

import { ArrowLeft, Maximize, Minimize, ZoomIn, ZoomOut } from 'lucide-react';

/**
 * Komponen bilah atas pembaca dokumen.
 *
 * @param {object} props - Properti komponen
 * @param {string} props.title - Judul buku
 * @param {string} props.pageInput - Nilai masukan nomor halaman saat ini
 * @param {(val: string) => void} props.setPageInput - Setter teks input nomor halaman
 * @param {(e: import('react').FormEvent) => void} props.onPageInputSubmit - Handler submit lompat halaman
 * @param {number} props.totalPages - Total halaman dokumen
 * @param {number} props.zoom - Tingkat perbesaran dokumen saat ini (persen)
 * @param {(delta: number) => void} props.onAdjustZoom - Handler perbesaran/pengecilan zoom
 * @param {() => void} props.onResetZoom - Handler reset zoom ke 100%
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
  zoom,
  onAdjustZoom,
  onResetZoom,
  supportsNativeFullscreen,
  isFullscreen,
  onToggleFullscreen,
  onBack,
}) => {
  return (
    <header
      aria-label={title}
      className="h-12 shrink-0 z-30 bg-ui-card/95 backdrop-blur-md border-b border-ink-200/70 dark:border-ink-800/80 px-4 sm:px-6 flex items-center justify-between shadow-xs"
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onBack}
          className="p-2 -ml-2 rounded-xl text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-cream-50 hover:bg-ink-100 dark:hover:bg-ink-800/80 transition cursor-pointer shrink-0"
          title="Kembali ke beranda"
          aria-label="Kembali ke beranda"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <form
          onSubmit={onPageInputSubmit}
          className="flex shrink-0 items-center gap-0.5 rounded-lg px-1.5 py-1 font-mono text-small font-semibold text-ink-500 dark:text-ink-400"
          aria-label="Navigasi halaman"
        >
          <input
            type="text"
            inputMode="numeric"
            value={pageInput}
            onChange={(event) => setPageInput(event.target.value)}
            onBlur={onPageInputSubmit}
            className="min-w-[1ch] max-w-[4ch] bg-transparent text-right text-ink-800 dark:text-cream-100 focus-visible:outline-none"
            style={{ width: `${Math.max(1, pageInput.length)}ch` }}
            aria-label="Halaman saat ini"
            title="Ketik nomor halaman lalu tekan Enter"
          />
          <span aria-hidden="true">/</span>
          <span>{totalPages}</span>
        </form>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <div className="flex items-center bg-cream-100/90 dark:bg-ink-800/90 rounded-xl p-0.5 border border-cream-300 dark:border-ink-700 shadow-2xs">
          <button
            type="button"
            onClick={() => onAdjustZoom(-10)}
            disabled={zoom <= 40}
            className="p-1.5 rounded-lg text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-cream-50 hover:bg-cream-200/80 dark:hover:bg-ink-700/80 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
            title="Perkecil (Zoom Out)"
            aria-label="Perkecil dokumen"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onResetZoom}
            className={`px-2 py-0.5 rounded-md text-caption font-mono font-bold transition cursor-pointer ${
              zoom !== 100
                ? 'text-brand-700 dark:text-brand-400 bg-cream-50 dark:bg-ink-900 shadow-2xs'
                : 'text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-cream-50'
            }`}
            title="Klik untuk reset ke 100%"
            aria-label={`Zoom ${zoom}%. Klik untuk reset ke 100%`}
          >
            {zoom}%
          </button>

          <button
            type="button"
            onClick={() => onAdjustZoom(10)}
            disabled={zoom >= 300}
            className="p-1.5 rounded-lg text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-cream-50 hover:bg-cream-200/80 dark:hover:bg-ink-700/80 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
            title="Perbesar (Zoom In)"
            aria-label="Perbesar dokumen"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        {supportsNativeFullscreen && (
          <>
            <div className="h-4 w-px bg-cream-300 dark:bg-ink-700 mx-0.5" />

            <button
              type="button"
              onClick={onToggleFullscreen}
              className="p-2 rounded-xl text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-cream-50 hover:bg-ink-100 dark:hover:bg-ink-800 transition cursor-pointer"
              title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
              aria-label={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>
          </>
        )}
      </div>
    </header>
  );
};
