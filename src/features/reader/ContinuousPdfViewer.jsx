/**
 * Penampil PDF dengan model kanvas lembar halaman tetap (Fixed Sheet Canvas),
 * menjaga rasio asli PDF secara presisi seperti Acrobat / Chrome PDF Viewer.
 * Posisi teks dan baris bacaan terkunci 100% stabil (Reading Anchor Lock) saat zoom in / zoom out.
 *
 * @module src/features/reader/ContinuousPdfViewer
 */

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { pdfjsLib } from './pdfWorkerSetup';
import { PdfPageSheet } from './PdfPageSheet';
import { usePdfPinchGesture } from './usePdfPinchGesture';
import { useWheelPinchZoom } from './useWheelPinchZoom';
import { usePdfCanvasRenderer } from './usePdfCanvasRenderer';

/**
 * Komponen penampil berkas PDF secara gulir vertikal berkelanjutan.
 *
 * @param {object} props - Properti komponen
 * @param {Blob|null} props.pdfBlob - Berkas PDF mentah hasil unduhan
 * @param {number} props.zoom - Level zoom persentase (40 - 300)
 * @param {(newZoom: number | ((prev: number) => number)) => void} props.setZoom - Setter level zoom
 * @param {number} props.currentPage - Nomor halaman aktif
 * @param {(page: number, total: number) => void} [props.onPageChange] - Callback perubahan nomor halaman
 * @param {number|null} [props.targetScrollPage] - Nomor halaman target loncat navigasi
 * @param {() => void} [props.onTargetScrollHandled] - Callback selesai scroll loncat halaman
 * @param {string|number} [props.bookId] - Identitas buku untuk pelacak baca
 * @returns {import('react').JSX.Element}
 */
export const ContinuousPdfViewer = ({
  pdfBlob,
  zoom,
  setZoom,
  currentPage,
  onPageChange,
  targetScrollPage,
  onTargetScrollHandled,
  bookId: _bookId,
}) => {
  const containerRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  // Dimensi dasar halaman PDF dalam point (default A4: 595.28 x 841.89)
  const [pageDimensions, setPageDimensions] = useState({ width: 595.28, height: 841.89 });
  const [containerWidth, setContainerWidth] = useState(800);
  const [loadError, setLoadError] = useState(null);

  const canvasRefs = useRef({});
  const pageContainerRefs = useRef({});
  const pageStackRef = useRef(null);

  // Pelacak posisi bacaan aktif secara riil ({ page: nomor halaman, ratio: offset vertikal dalam halaman })
  const currentViewRef = useRef({ page: currentPage || 1, ratio: 0 });
  const prevZoomRef = useRef(zoom);
  const pinchAnchorRef = useRef(null);

  // Callback dari induk sering berubah identitas (mis. saat total halaman diketahui),
  // sedangkan effect pencari dokumen tidak boleh ikut berjalan ulang karenanya.
  const onPageChangeRef = useRef(onPageChange);
  useEffect(() => {
    onPageChangeRef.current = onPageChange;
  }, [onPageChange]);

  // 1. Muat Dokumen PDF dari Berkas Sumber
  useEffect(() => {
    if (!pdfBlob) return undefined;
    let cancelled = false;
    let loadingTask = null;

    setLoadError(null);

    /* Byte dibaca ulang per percobaan: PDF.js memindahkan ArrayBuffer yang
     * diberikan ke thread worker (transferable), jadi buffer tersebut berhenti
     * berfungsi di main thread dan tidak mungkin dipakai untuk muat kedua. */
    (async () => {
      const buffer = await pdfBlob.arrayBuffer();
      if (cancelled) return;

      loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(buffer),
        cMapPacked: true,
      });
      const doc = await loadingTask.promise;
      if (cancelled) return;

      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      onPageChangeRef.current?.(1, doc.numPages);

      // Ambil ukuran native halaman pertama dari berkas PDF
      try {
        const firstPage = await doc.getPage(1);
        const vp = firstPage.getViewport({ scale: 1.0 });
        if (vp.width > 0 && vp.height > 0) {
          setPageDimensions({ width: vp.width, height: vp.height });
        }
      } catch (e) {
        console.warn('[ContinuousPdfViewer] Gagal membaca dimensi halaman pertama:', e);
      }
    })().catch((err) => {
      if (cancelled) return;
      console.error('[ContinuousPdfViewer] Gagal memuat PDF:', err);
      setLoadError('Dokumen PDF tidak dapat didekode.');
    });

    return () => {
      cancelled = true;
      loadingTask?.destroy().catch(() => {});
    };
  }, [pdfBlob]);

  // 2. Pantau Lebar Kontainer secara Responsif (ResizeObserver)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const updateWidth = () => {
      const w = el.clientWidth;
      if (w > 0) setContainerWidth(w);
    };

    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 3. Hitung Dimensi Halaman Kanvas Tetap (Fixed Canvas Dimensions)
  const isMobile = containerWidth < 640;
  const basePdfWidth = pageDimensions.width || 595.28;
  const basePdfHeight = pageDimensions.height || 841.89;
  const naturalAspect = basePdfHeight / basePdfWidth;

  const baseFitWidth = isMobile
    ? Math.max(280, containerWidth - 16)
    : Math.min(Math.max(480, containerWidth - 48), 850);

  const displayPageWidth = Math.round(baseFitWidth * (zoom / 100));
  const displayPageHeight = Math.round(displayPageWidth * naturalAspect);

  // 4. Deteksi Posisi Bacaan Terkini saat Menggulir (Scroll-Spy & Anchor Tracker)
  const updateReadingPosition = useCallback(
    (focalY) => {
      const el = containerRef.current;
      if (!el || !pdfDoc || totalPages === 0) return;

      const containerRect = el.getBoundingClientRect();
      const localEyelineY = focalY ?? el.clientHeight * 0.35;
      const eyelineY = containerRect.top + localEyelineY;

      let closestPage = 1;
      let minDistance = Infinity;

      for (let p = 1; p <= totalPages; p++) {
        const pageEl = pageContainerRefs.current[p];
        if (!pageEl) continue;

        const rect = pageEl.getBoundingClientRect();
        if (rect.top <= eyelineY && rect.bottom >= eyelineY) {
          closestPage = p;
          const ratio = rect.height > 0 ? (eyelineY - rect.top) / rect.height : 0;
          currentViewRef.current = { page: p, ratio: Math.max(0, Math.min(1, ratio)) };
          minDistance = 0;
          break;
        }

        const dist = Math.abs(rect.top - eyelineY);
        if (dist < minDistance) {
          minDistance = dist;
          closestPage = p;
          currentViewRef.current = { page: p, ratio: 0 };
        }
      }

      if (closestPage !== currentPage) {
        onPageChange?.(closestPage, totalPages);
      }
    },
    [pdfDoc, totalPages, currentPage, onPageChange],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateReadingPosition();
          ticking = false;
        });
        ticking = true;
      }
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [updateReadingPosition]);

  // 5. Kunci Posisi Fokus Membaca saat Zoom Berubah (Reading Anchor Lock)
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || prevZoomRef.current === zoom) {
      prevZoomRef.current = zoom;
      return;
    }

    const anchor = pinchAnchorRef.current;
    const { page, ratio } = anchor || currentViewRef.current;
    const eyelineY = anchor?.focalY ?? container.clientHeight * 0.35;

    pageStackRef.current?.style.removeProperty('transform');
    pageStackRef.current?.style.removeProperty('transform-origin');
    pageStackRef.current?.style.removeProperty('will-change');

    if (page >= 1 && page <= totalPages) {
      const GAP = 16;
      const pageElement = pageContainerRefs.current[page];
      const targetYInDoc = pageElement
        ? pageElement.getBoundingClientRect().top -
          container.getBoundingClientRect().top +
          container.scrollTop +
          ratio * pageElement.clientHeight
        : (page - 1) * (displayPageHeight + GAP) + ratio * displayPageHeight;
      container.scrollTop = Math.max(0, targetYInDoc - eyelineY);
    }

    pinchAnchorRef.current = null;
    prevZoomRef.current = zoom;
  }, [zoom, displayPageHeight, totalPages]);

  // 6. Integrasi Gesture Multi-Touch Pinch
  const { handleTouchStart, handleTouchEnd } = usePdfPinchGesture({
    containerRef,
    pageStackRef,
    zoom,
    setZoom,
    updateReadingPosition,
    currentViewRef,
    pinchAnchorRef,
  });

  // 7. Integrasi Renderer Canvas PDF.js
  usePdfCanvasRenderer({
    pdfDoc,
    totalPages,
    displayPageWidth,
    containerRef,
    pageContainerRefs,
    canvasRefs,
    currentViewRef,
    currentPage,
    zoom,
  });

  // 8. Pinch Trackpad (Ctrl/Cmd + Wheel) — jalur yang sama dengan pinch dua jari
  useWheelPinchZoom({
    containerRef,
    pageStackRef,
    zoom,
    setZoom,
    updateReadingPosition,
    currentViewRef,
    pinchAnchorRef,
  });

  // 9. Loncat ke Halaman Tertentu (Target Scroll Page)
  useEffect(() => {
    if (!pdfDoc || totalPages === 0 || !targetScrollPage) return undefined;
    const timer = setTimeout(() => {
      if (targetScrollPage >= 1 && targetScrollPage <= totalPages) {
        const pageEl = pageContainerRefs.current[targetScrollPage];
        if (pageEl) {
          pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          currentViewRef.current = { page: targetScrollPage, ratio: 0 };
          onTargetScrollHandled?.();
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [pdfDoc, targetScrollPage, totalPages, onTargetScrollHandled]);

  if (loadError) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6 text-center text-ink-500">
        <p className="text-body font-medium text-semantic-danger">{loadError}</p>
      </div>
    );
  }

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Area pembaca dokumen naskah PDF"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="relative flex-1 min-h-0 w-full h-full overflow-y-auto overflow-x-auto bg-canvas-subtle flex flex-col items-center py-4 px-2 sm:px-4 select-text overscroll-contain"
      style={{
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-x pan-y',
        overflowAnchor: 'none',
      }}
    >
      <div
        ref={pageStackRef}
        className="mx-auto flex flex-col items-center gap-4"
        style={{
          width: `${displayPageWidth}px`,
        }}
      >
        {pageNumbers.map((pageNum) => (
          <PdfPageSheet
            key={pageNum}
            pageNum={pageNum}
            totalPages={totalPages}
            displayPageWidth={displayPageWidth}
            displayPageHeight={displayPageHeight}
            registerContainer={(el) => (pageContainerRefs.current[pageNum] = el)}
            registerCanvas={(el) => (canvasRefs.current[pageNum] = el)}
          />
        ))}
      </div>
    </div>
  );
};
