/**
 * Penampil naskah dokumen Microsoft Word (.docx) berbasis library docx-preview.
 * Merender naskah ke dalam lembar halaman fisik A4 terpaginasi lengkap dengan margin,
 * tata letak kolom, tabel, header, footer, dan tipografi asli.
 * Mengimplementasikan perbesaran dinamis (dynamic zoom) pada kontainer halaman fisik
 * sehingga posisi kata, baris kalimat, dan tata letak tidak bergeser (zero layout shift)
 * dan bebas kedip (zero flickering) menyerupai WPS Office.
 *
 * @module src/features/reader/DocxDocumentViewer
 */

import { useEffect, useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';

/**
 * Komponen pembaca naskah dokumen Word (.docx).
 *
 * @param {object} props
 * @param {Blob} props.docxBlob - Objek Blob berkas Word (.docx)
 * @param {number} props.zoom - Persentase tingkat perbesaran dokumen (misal: 100)
 * @returns {import('react').JSX.Element}
 */
export const DocxDocumentViewer = ({ docxBlob, zoom }) => {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!docxBlob || !containerRef.current) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const buffer = await docxBlob.arrayBuffer();
        if (cancelled) return;
        if (!containerRef.current) return;

        containerRef.current.innerHTML = '';

        await renderAsync(buffer, containerRef.current, null, {
          className: 'docx-page',
          inWrapper: true,
          breakPages: true,
          renderHeaders: true,
          renderFooters: true,
          ignoreWidth: false,
          ignoreHeight: false,
        });

        if (!cancelled) {
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[DocxDocumentViewer] Gagal merender naskah Word (.docx):', err);
          setError('Gagal memuat tata letak naskah Word (.docx)');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [docxBlob]);

  const scale = zoom / 100;
  const supportsZoom =
    typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('zoom', '1');

  return (
    <div className="relative flex-1 w-full h-full overflow-auto bg-canvas-subtle flex flex-col items-center py-6 px-4">
      {/* Scoped styling untuk lembaran halaman docx-preview agar menyatu dengan tema pembaca */}
      <style>{`
        .docx-render-host .docx-page-wrapper {
          background: transparent !important;
          padding: 16px 0 !important;
          display: flex;
          flex-flow: column;
          align-items: center;
        }
        .docx-render-host section.docx-page {
          background: #ffffff !important;
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.12), 0 2px 6px -1px rgba(0, 0, 0, 0.08) !important;
          margin-bottom: 24px !important;
        }
      `}</style>

      {loading && (
        <div className="flex h-64 items-center justify-center text-ink-500 font-medium">
          <p>Merender naskah Word...</p>
        </div>
      )}

      {error && (
        <div className="flex h-64 items-center justify-center text-semantic-danger font-medium">
          <p>{error}</p>
        </div>
      )}

      <div
        ref={containerRef}
        className="docx-render-host origin-top mx-auto transition-transform duration-75"
        style={
          supportsZoom
            ? { zoom: scale }
            : {
                transform: `scale(${scale})`,
                transformOrigin: 'top center',
              }
        }
      />
    </div>
  );
};
