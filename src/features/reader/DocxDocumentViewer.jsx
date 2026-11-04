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
  const outerRef = useRef(null);
  const containerRef = useRef(null);
  const [internalScale, setInternalScale] = useState(zoom ? zoom / 100 : 1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof zoom === 'number') {
      setInternalScale(zoom / 100);
    }
  }, [zoom]);

  // Tangkap gesture Ctrl+Wheel dan Touch Pinch agar HANYA dokumen Word yang di-zoom
  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;

    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        const delta = -e.deltaY;
        const factor = delta > 0 ? 1.05 : 0.95;
        setInternalScale((prev) =>
          Math.min(3.0, Math.max(0.4, Number((prev * factor).toFixed(2)))),
        );
      }
    };

    let touchStartDist = 0;
    let initialScale = 1;

    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const [t1, t2] = e.touches;
        touchStartDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        initialScale = internalScale;
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 2 && touchStartDist > 0) {
        e.preventDefault();
        const [t1, t2] = e.touches;
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const factor = dist / touchStartDist;
        setInternalScale(Math.min(3.0, Math.max(0.4, Number((initialScale * factor).toFixed(2)))));
      }
    };

    const handleTouchEnd = (e) => {
      if (e.touches.length < 2) {
        touchStartDist = 0;
      }
    };

    outer.addEventListener('wheel', handleWheel, { passive: false });
    outer.addEventListener('touchstart', handleTouchStart, { passive: false });
    outer.addEventListener('touchmove', handleTouchMove, { passive: false });
    outer.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      outer.removeEventListener('wheel', handleWheel);
      outer.removeEventListener('touchstart', handleTouchStart);
      outer.removeEventListener('touchmove', handleTouchMove);
      outer.removeEventListener('touchend', handleTouchEnd);
    };
  }, [internalScale]);

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

  const scale = internalScale;
  const supportsZoom =
    typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('zoom', '1');

  return (
    <div
      ref={outerRef}
      className="relative flex-1 w-full h-full overflow-auto bg-canvas-subtle flex flex-col items-center py-6 px-4"
    >
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
