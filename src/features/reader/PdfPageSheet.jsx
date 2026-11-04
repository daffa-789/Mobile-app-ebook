/**
 * Komponen lembar halaman PDF tunggal (Sheet) dengan kanvas render dan rasio aspek tetap.
 *
 * Ukuran lembar SENGAJA tidak bergantung pada zoom. Zoom diterapkan sebagai
 * `transform: scale()` pada tumpukan halaman, jadi kotak ini tidak pernah
 * berubah ukuran saat pengguna men-zoom: tidak ada reflow, tidak ada teks yang
 * melompat. Yang berubah hanya resolusi bitmap di dalam kanvas (lihat
 * `usePdfCanvasRenderer`), dan itu hanya mempertajam.
 *
 * @module src/features/reader/PdfPageSheet
 */

/**
 * Komponen lembar kanvas halaman PDF.
 *
 * @param {object} props - Properti komponen
 * @param {number} props.pageNum - Nomor halaman (1-based)
 * @param {number} props.totalPages - Total seluruh halaman dokumen
 * @param {number} props.sheetWidth - Lebar lembar dalam piksel CSS (tanpa zoom)
 * @param {number} props.sheetHeight - Tinggi lembar dalam piksel CSS (tanpa zoom)
 * @param {(el: HTMLDivElement | null) => void} props.registerContainer - Callback pendaftaran ref container
 * @param {(el: HTMLCanvasElement | null) => void} props.registerCanvas - Callback pendaftaran ref canvas
 * @returns {import('react').JSX.Element}
 */
export const PdfPageSheet = ({
  pageNum,
  totalPages,
  sheetWidth,
  sheetHeight,
  registerContainer,
  registerCanvas,
}) => {
  return (
    <div
      id={`pdf-page-${pageNum}`}
      data-page-number={pageNum}
      aria-label={`Halaman ${pageNum} dari ${totalPages}`}
      ref={registerContainer}
      className="relative shadow-md md:shadow-lg rounded-sm sm:rounded-md overflow-hidden bg-ui-card border border-ink-200/50"
      style={{
        width: `${sheetWidth}px`,
        height: `${sheetHeight}px`,
        flexShrink: 0,
      }}
    >
      {/* Kanvas mengisi lembar; bitmap di dalamnya boleh lebih besar dari kotak,
          dan itulah yang membuat zoom hanya mengubah ketajaman, bukan tata letak. */}
      <canvas
        ref={registerCanvas}
        className="block w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};
