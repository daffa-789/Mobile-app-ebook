/**
 * Penampil naskah dokumen berbasis teks polos dan halaman sampel buku.
 *
 * @module src/features/reader/TextDocViewer
 */

/**
 * Komponen pembaca naskah teks polos dan halaman contoh.
 *
 * @param {object} props - Properti komponen
 * @param {string} [props.textContent] - Konten teks polos
 * @param {Array<object>} [props.samplePages] - Daftar halaman contoh
 * @param {number} props.currentPage - Nomor halaman aktif
 * @param {number} props.totalPages - Total halaman
 * @param {number} props.zoom - Persentase tingkat perbesaran font
 * @param {import('react').RefObject<HTMLDivElement>} props.surfaceRef - Ref kontainer scroll
 * @param {import('react').RefObject<HTMLDivElement>} props.previewRef - Ref elemen konten zoom preview
 * @param {object} props.pinchHandlers - Handler touch gestur pinch
 * @returns {import('react').JSX.Element}
 */
export const TextDocViewer = ({
  textContent,
  samplePages = [],
  currentPage,
  totalPages,
  zoom,
  surfaceRef,
  previewRef,
  pinchHandlers,
}) => {
  const isSampleMode = !textContent && samplePages.length > 0;
  const currentSample = isSampleMode ? samplePages[currentPage - 1] : null;

  return (
    <div
      ref={surfaceRef}
      onTouchStart={pinchHandlers.handleTouchStart}
      onTouchEnd={pinchHandlers.handleTouchEnd}
      onTouchCancel={pinchHandlers.handleTouchEnd}
      className="w-full h-full flex flex-col items-center overflow-y-auto p-4 sm:p-8 overscroll-contain"
      style={{
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-x pan-y',
        overflowAnchor: 'none',
      }}
    >
      <article
        ref={previewRef}
        className="relative w-full max-w-3xl bg-ui-card p-8 sm:p-14 rounded-2xl shadow-lg border border-ink-200/60 leading-relaxed text-body text-ink-800 dark:text-cream-100 whitespace-pre-wrap select-none my-auto"
        style={{ fontSize: `${(zoom / 100) * 1.05}rem` }}
      >
        {isSampleMode && (
          <header className="flex justify-between border-b border-ink-100 pb-3 text-micro font-bold text-ink-400">
            <span>PERPUSTAKAAN DIGITAL WAHIDIYAH</span>
            <span>
              HALAMAN {currentPage} / {totalPages}
            </span>
          </header>
        )}

        {currentSample?.arabicHeading && (
          <p className="font-arabic my-6 text-center text-brand-700" style={{ fontSize: '1.5em' }}>
            {currentSample.arabicHeading}
          </p>
        )}

        {currentSample?.title && (
          <h2
            className="mb-4 text-center font-black text-brand-900 dark:text-cream-50"
            style={{ fontSize: '1.75em' }}
          >
            {currentSample.title}
          </h2>
        )}

        {isSampleMode
          ? currentSample?.content
          : textContent || 'Dokumen tidak berisi teks yang dapat dibaca.'}
      </article>
    </div>
  );
};
