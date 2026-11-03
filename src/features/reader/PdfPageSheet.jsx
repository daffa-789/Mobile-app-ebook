/**
 * Komponen lembar halaman PDF tunggal (Sheet) dengan kanvas render dan rasio aspek tetap.
 *
 * @module src/features/reader/PdfPageSheet
 */

/**
 * Komponen lembar kanvas halaman PDF.
 *
 * @param {object} props - Properti komponen
 * @param {number} props.pageNum - Nomor halaman (1-based)
 * @param {number} props.totalPages - Total seluruh halaman dokumen
 * @param {number} props.displayPageWidth - Lebar piksel lembar halaman
 * @param {number} props.displayPageHeight - Tinggi piksel lembar halaman
 * @param {(el: HTMLDivElement | null) => void} props.registerContainer - Callback pendaftaran ref container
 * @param {(el: HTMLCanvasElement | null) => void} props.registerCanvas - Callback pendaftaran ref canvas
 * @returns {import('react').JSX.Element}
 */
export const PdfPageSheet = ({
  pageNum,
  totalPages,
  displayPageWidth,
  displayPageHeight,
  registerContainer,
  registerCanvas,
}) => {
  return (
    <div
      id={`pdf-page-${pageNum}`}
      data-page-number={pageNum}
      aria-label={`Halaman ${pageNum} dari ${totalPages}`}
      ref={registerContainer}
      className="relative shadow-md md:shadow-lg rounded-sm sm:rounded-md overflow-hidden bg-ui-card border border-ink-200/50 dark:border-ink-700/50"
      style={{
        width: `${displayPageWidth}px`,
        height: `${displayPageHeight}px`,
      }}
    >
      <canvas
        ref={registerCanvas}
        className="block w-full h-full"
        style={{
          width: `${displayPageWidth}px`,
          height: `${displayPageHeight}px`,
        }}
      />
    </div>
  );
};
