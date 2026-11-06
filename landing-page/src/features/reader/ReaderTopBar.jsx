import { ArrowLeft, Maximize, Minimize, Minus, Plus, RotateCcw } from 'lucide-react';

/**
 * Komponen bilah navigasi atas (top bar) untuk layar pembaca naskah buku.
 * Mengatur tombol kembali, navigasi lompat halaman, zoom in (+10%), zoom out (-10%), reset zoom, dan fullscreen.
 *
 * @param {object} props
 * @param {string} props.title - Judul buku
 * @param {string} props.pageInput - Nilai masukan nomor halaman saat ini
 * @param {(val: string) => void} props.setPageInput - Setter teks input nomor halaman
 * @param {(e: import('react').FormEvent) => void} props.onPageInputSubmit - Handler submit lompat halaman
 * @param {number} props.totalPages - Total halaman dokumen
 * @param {number} [props.zoom=100] - Persentase zoom saat ini
 * @param {() => void} [props.onZoomIn] - Handler zoom in (+10%)
 * @param {() => void} [props.onZoomOut] - Handler zoom out (-10%)
 * @param {() => void} [props.onZoomReset] - Handler reset zoom ke 100%
 * @param {boolean} props.supportsNativeFullscreen - Apakah peramban mendukung mode layar penuh
 * @param {boolean} props.isFullscreen - Apakah saat ini dalam mode layar penuh
 * @param {() => void} props.onToggleFullscreen - Handler toggle layar penuh
 * @param {() => void} props.onBack - Handler kembali ke katalog
 * @returns {import('react').JSX.Element}
 */
export const ReaderTopBar = ({
  title,
  pageInput,
  setPageInput,
  onPageInputSubmit,
  totalPages,
  zoom = 100,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  supportsNativeFullscreen,
  isFullscreen,
  onToggleFullscreen,
  onBack,
}) => {
  return (
    <header
      aria-label={title}
      className="h-14 shrink-0 z-30 bg-cream-50/95 backdrop-blur-md border-b border-cream-200 px-3 sm:px-6 flex items-center justify-between shadow-xs"
    >
      {/* Kiri: Tombol Kembali & Judul Buku */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onBack}
          className="p-2 -ml-1 rounded-xl text-ink-600 hover:text-ink-900 hover:bg-cream-200 transition cursor-pointer shrink-0"
          title="Kembali ke katalog"
          aria-label="Kembali ke katalog"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <span className="font-serif font-bold text-xs sm:text-sm text-ink-900 truncate max-w-[140px] sm:max-w-xs md:max-w-md">
          {title}
        </span>
      </div>

      {/* Tengah: Navigasi Lompat Halaman */}
      <form
        onSubmit={onPageInputSubmit}
        className="flex shrink-0 items-center gap-1 rounded-xl bg-cream-100 border border-cream-200 px-2 py-1 font-mono text-xs font-semibold text-ink-600"
        aria-label="Navigasi halaman"
      >
        <input
          type="text"
          inputMode="numeric"
          value={pageInput}
          onChange={(event) => setPageInput(event.target.value)}
          onBlur={onPageInputSubmit}
          className="min-w-[1ch] max-w-[4ch] bg-transparent text-right text-ink-900 font-bold focus-visible:outline-none"
          style={{ width: `${Math.max(1, pageInput.length)}ch` }}
          aria-label="Halaman saat ini"
          title="Ketik nomor halaman lalu tekan Enter"
        />
        <span aria-hidden="true" className="text-ink-400">
          /
        </span>
        <span>{totalPages}</span>
      </form>

      {/* Kanan: Zoom In, Zoom Out, Reset & Fullscreen */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Zoom Controls */}
        <div className="flex items-center bg-cream-100 border border-cream-200 rounded-xl p-0.5">
          <button
            type="button"
            onClick={onZoomOut}
            disabled={zoom <= 40}
            className="p-1.5 rounded-lg text-ink-600 hover:text-ink-900 hover:bg-cream-200 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            title="Perkecil (-10%)"
            aria-label="Perkecil zoom"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={onZoomReset}
            className="px-2 py-0.5 text-[11px] font-mono font-bold text-ink-700 hover:text-brand-700 transition cursor-pointer"
            title="Reset Zoom (100%)"
            aria-label="Reset zoom ke 100%"
          >
            {zoom}%
          </button>

          <button
            type="button"
            onClick={onZoomIn}
            disabled={zoom >= 300}
            className="p-1.5 rounded-lg text-ink-600 hover:text-ink-900 hover:bg-cream-200 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            title="Perbesar (+10%)"
            aria-label="Perbesar zoom"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Fullscreen Toggle */}
        {supportsNativeFullscreen && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="p-2 rounded-xl text-ink-600 hover:text-ink-900 hover:bg-cream-200 transition cursor-pointer"
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

export default ReaderTopBar;
