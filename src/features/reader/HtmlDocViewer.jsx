/**
 * Penampil naskah dokumen berbasis format HTML dan Word (.docx).
 * Mendukung tipografi artikel responsif dan gestur pinch-to-zoom 2 jari.
 *
 * @module src/features/reader/HtmlDocViewer
 */

/**
 * Komponen pembaca HTML / Word DOCX.
 *
 * @param {object} props - Properti komponen
 * @param {string} props.docHtml - Markup HTML yang telah disanitasi
 * @param {number} props.zoom - Persentase tingkat perbesaran font
 * @param {import('react').RefObject<HTMLDivElement>} props.surfaceRef - Ref kontainer scroll pembaca
 * @param {import('react').RefObject<HTMLDivElement>} props.previewRef - Ref elemen konten zoom preview
 * @param {object} props.pinchHandlers - Handler touch start, move, dan end untuk gestur pinch
 * @returns {import('react').JSX.Element}
 */
export const HtmlDocViewer = ({ docHtml, zoom, surfaceRef, previewRef, pinchHandlers }) => {
  return (
    <div
      ref={surfaceRef}
      onTouchStart={pinchHandlers.handleTouchStart}
      onTouchEnd={pinchHandlers.handleTouchEnd}
      onTouchCancel={pinchHandlers.handleTouchEnd}
      className="w-full max-w-full md:max-w-4xl xl:max-w-5xl bg-ui-card shadow-none md:shadow-md rounded-none md:rounded-2xl p-4 sm:p-8 md:p-12 border-0 md:border border-ink-200/60 dark:border-ink-800/80 leading-relaxed text-ink-900 dark:text-cream-50 select-text overflow-y-auto h-full overscroll-contain"
      style={{
        fontSize: `${(zoom / 100) * 1.05}rem`,
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-x pan-y',
        overflowAnchor: 'none',
      }}
    >
      <div
        ref={previewRef}
        className="prose dark:prose-invert max-w-none [&>p]:mb-4 [&>p]:leading-relaxed [&>h1]:text-[1.5em] [&>h1]:font-black [&>h1]:mb-4 [&>h2]:text-[1.25em] [&>h2]:font-bold [&>h2]:mb-3 [&>table]:w-full [&>table]:border-collapse [&>table_td]:border [&>table_td]:border-cream-300 [&>table_td]:p-2 [&>table_th]:border [&>table_th]:border-cream-300 [&>table_th]:p-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 font-serif sm:font-sans"
        style={{ fontSize: `${(zoom / 100) * 1.05}rem` }}
        dangerouslySetInnerHTML={{ __html: docHtml }}
      />
    </div>
  );
};
