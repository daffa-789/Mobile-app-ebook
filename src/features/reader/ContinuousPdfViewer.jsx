import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { pdfjsLib } from './pdfWorkerSetup';
import { getPinchScale, getPinchZoom } from './zoomUtils';

/**
 * ContinuousPdfViewer
 * Penampil PDF dengan model kanvas lembar halaman tetap (Fixed Sheet Canvas),
 * menjaga rasio asli PDF secara presisi seperti Acrobat / Chrome PDF Viewer.
 * Posisi teks dan baris bacaan terkunci 100% stabil (Reading Anchor Lock) saat zoom in / zoom out.
 */
export const ContinuousPdfViewer = ({
  pdfBuffer,
  zoom,
  setZoom,
  currentPage,
  onPageChange,
  targetScrollPage,
  onTargetScrollHandled,
  bookId,
}) => {
  const containerRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  // Dimensi dasar halaman PDF dalam point (default A4: 595.28 x 841.89)
  const [pageDimensions, setPageDimensions] = useState({ width: 595.28, height: 841.89 });
  const [containerWidth, setContainerWidth] = useState(800);
  const [loadError, setLoadError] = useState(null);

  // Status Render Task aktif untuk mencegah tabrakan render di canvas yang sama
  const renderTasksRef = useRef({});
  const canvasRefs = useRef({});
  const pageContainerRefs = useRef({});
  const pageStackRef = useRef(null);

  // Pelacak posisi bacaan aktif secara riil ({ page: nomor halaman, ratio: offset vertikal dalam halaman })
  const currentViewRef = useRef({ page: currentPage || 1, ratio: 0 });
  const prevZoomRef = useRef(zoom);
  const customFocalYRef = useRef(null);

  // Ref untuk mendeteksi Pinch-to-zoom (2 jari di mobile)
  const touchStartDistRef = useRef(0);
  const initialPinchZoomRef = useRef(100);
  const lastPinchDistRef = useRef(0);
  const pinchOriginRef = useRef({ x: 0, y: 0, clientX: 0, clientY: 0 });
  const pinchAnchorRef = useRef(null);
  const isPinchingRef = useRef(false);
  const pinchRafRef = useRef(null);
  const touchMoveHandlerRef = useRef(null);

  // 1. Muat Dokumen PDF dari ArrayBuffer
  useEffect(() => {
    if (!pdfBuffer) return;
    let cancelled = false;

    setLoadError(null);
    const loadingTask = pdfjsLib.getDocument({
      data: pdfBuffer,
      cMapPacked: true,
    });

    loadingTask.promise
      .then(async (doc) => {
        if (cancelled) return;
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        onPageChange?.(1, doc.numPages);

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
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[ContinuousPdfViewer] Gagal memuat PDF:', err);
        setLoadError('Dokumen PDF tidak dapat didekode.');
      });

    return () => {
      cancelled = true;
      loadingTask.destroy().catch(() => {});
    };
  }, [pdfBuffer]);

  // 2. Pantau Lebar Kontainer secara Responsif (ResizeObserver)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

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
  // Menjaga rasio aspek presisi native PDF tanpa distorsi atau peregangan teks
  const isMobile = containerWidth < 640;
  const basePdfWidth = pageDimensions.width || 595.28;
  const basePdfHeight = pageDimensions.height || 841.89;
  const naturalAspect = basePdfHeight / basePdfWidth;

  const baseFitWidth = isMobile
    ? Math.max(280, containerWidth - 16)
    : Math.min(Math.max(480, containerWidth - 48), 850);

  // Lebar dan tinggi halaman yang tepat mengikuti skala perbesaran
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
    if (!el) return;

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
  // Pinch hanya mengubah transform saat jari bergerak; ukuran PDF dan canvas
  // dihitung ulang sekali setelah gesture selesai.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || prevZoomRef.current === zoom) {
      prevZoomRef.current = zoom;
      return;
    }

    const anchor = pinchAnchorRef.current;
    const { page, ratio } = anchor || currentViewRef.current;
    const eyelineY =
      anchor?.focalY ??
      (customFocalYRef.current !== null ? customFocalYRef.current : container.clientHeight * 0.35);

    pageStackRef.current?.style.removeProperty('transform');
    pageStackRef.current?.style.removeProperty('transform-origin');
    pageStackRef.current?.style.removeProperty('will-change');
    customFocalYRef.current = null;

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

  // 6. Preview pinch memakai transform GPU, lalu commit zoom setelah jari dilepas.
  const handleTouchStart = (e) => {
    if (e.touches.length !== 2) return;

    const [firstTouch, secondTouch] = e.touches;
    const distance = Math.hypot(
      firstTouch.clientX - secondTouch.clientX,
      firstTouch.clientY - secondTouch.clientY,
    );
    const midpointX = (firstTouch.clientX + secondTouch.clientX) / 2;
    const midpointY = (firstTouch.clientY + secondTouch.clientY) / 2;
    const container = containerRef.current;
    const pageStack = pageStackRef.current;
    if (!container || !pageStack) return;

    const containerRect = container.getBoundingClientRect();
    const pageStackRect = pageStack.getBoundingClientRect();
    const focalY = midpointY - containerRect.top;
    updateReadingPosition(focalY);

    touchStartDistRef.current = distance;
    lastPinchDistRef.current = distance;
    initialPinchZoomRef.current = zoom;
    pinchOriginRef.current = {
      x: midpointX - pageStackRect.left,
      y: midpointY - pageStackRect.top,
      clientX: midpointX,
      clientY: midpointY,
    };
    pinchAnchorRef.current = { ...currentViewRef.current, focalY };
    isPinchingRef.current = true;
    pageStack.style.willChange = 'transform';
  };

  const handleTouchMove = (e) => {
    if (!isPinchingRef.current || e.touches.length !== 2) return;
    if (e.cancelable) e.preventDefault();

    const [firstTouch, secondTouch] = e.touches;
    const currentDist = Math.hypot(
      firstTouch.clientX - secondTouch.clientX,
      firstTouch.clientY - secondTouch.clientY,
    );
    const midpointX = (firstTouch.clientX + secondTouch.clientX) / 2;
    const midpointY = (firstTouch.clientY + secondTouch.clientY) / 2;
    lastPinchDistRef.current = currentDist;

    const container = containerRef.current;
    if (container) {
      pinchAnchorRef.current = {
        ...currentViewRef.current,
        focalY: midpointY - container.getBoundingClientRect().top,
      };
    }

    if (pinchRafRef.current) cancelAnimationFrame(pinchRafRef.current);
    pinchRafRef.current = requestAnimationFrame(() => {
      const pageStack = pageStackRef.current;
      if (!pageStack || touchStartDistRef.current <= 10) {
        pinchRafRef.current = null;
        return;
      }

      const scale = getPinchScale(
        initialPinchZoomRef.current,
        touchStartDistRef.current,
        currentDist,
      );
      const origin = pinchOriginRef.current;
      pageStack.style.transformOrigin = `${origin.x}px ${origin.y}px`;
      pageStack.style.transform = `translate(${midpointX - origin.clientX}px, ${midpointY - origin.clientY}px) scale(${scale})`;
      pinchRafRef.current = null;
    });
  };

  touchMoveHandlerRef.current = handleTouchMove;

  const handleTouchEnd = (e) => {
    if (!isPinchingRef.current || e.touches.length >= 2) return;

    isPinchingRef.current = false;
    if (pinchRafRef.current) cancelAnimationFrame(pinchRafRef.current);
    pinchRafRef.current = null;

    const targetZoom = getPinchZoom(
      initialPinchZoomRef.current,
      touchStartDistRef.current,
      lastPinchDistRef.current,
    );
    touchStartDistRef.current = 0;

    if (targetZoom === zoom) {
      pageStackRef.current?.style.removeProperty('transform');
      pageStackRef.current?.style.removeProperty('transform-origin');
      pageStackRef.current?.style.removeProperty('will-change');
      pinchAnchorRef.current = null;
      return;
    }

    setZoom(targetZoom);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const handleNativeTouchMove = (event) => touchMoveHandlerRef.current?.(event);
    container.addEventListener('touchmove', handleNativeTouchMove, { passive: false });
    return () => container.removeEventListener('touchmove', handleNativeTouchMove);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const rect = el.getBoundingClientRect();
        const cursorY = e.clientY - rect.top;
        updateReadingPosition(cursorY);
        customFocalYRef.current = cursorY;

        // Perbesaran seamless berkelanjutan tanpa batasan kelipatan 5%
        const delta = -e.deltaY;
        const deltaZoom = delta * 0.15;
        setZoom((prev) => Math.min(300, Math.max(40, Math.round(prev + deltaZoom))));
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [setZoom]);

  // 7. Render Halaman ke Canvas HTML5 Menggunakan PDF.js
  const renderPageCanvas = useCallback(
    async (pageNumber) => {
      if (!pdfDoc || pageNumber < 1 || pageNumber > totalPages) return;
      const canvas = canvasRefs.current[pageNumber];
      if (!canvas) return;

      // Batalkan render task sebelumnya jika masih berjalan di canvas ini
      if (renderTasksRef.current[pageNumber]) {
        try {
          renderTasksRef.current[pageNumber].cancel();
        } catch {
          // Abaikan jika sudah selesai
        }
      }

      try {
        const page = await pdfDoc.getPage(pageNumber);
        const unscaledViewport = page.getViewport({ scale: 1.0 });

        // Hitung skala rendering beresolusi tinggi (Retina / Sharpness, dibatasi maks 2 agar hemat memori)
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const scale = (displayPageWidth / unscaledViewport.width) * dpr;
        const viewport = page.getViewport({ scale });

        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);

        const ctx = canvas.getContext('2d');
        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        const task = page.render(renderContext);
        renderTasksRef.current[pageNumber] = task;
        await task.promise;
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn(`[ContinuousPdfViewer] Gagal merender halaman ${pageNumber}:`, err);
        }
      } finally {
        delete renderTasksRef.current[pageNumber];
      }
    },
    [pdfDoc, totalPages, displayPageWidth],
  );

  // 8. IntersectionObserver untuk Lazy Rendering Canvas Halaman
  useEffect(() => {
    if (!pdfDoc || totalPages === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const pageNum = Number(entry.target.getAttribute('data-page-number'));
          if (!pageNum) return;

          if (entry.isIntersecting) {
            renderPageCanvas(pageNum);
          }
        });
      },
      {
        root: containerRef.current,
        rootMargin: '400px 0px 400px 0px',
        threshold: 0.01,
      },
    );

    for (let p = 1; p <= totalPages; p++) {
      const el = pageContainerRefs.current[p];
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [pdfDoc, totalPages, renderPageCanvas]);

  // 9. Re-render Halaman Aktif saat Zoom Berubah (Cepat & Ringan)
  useEffect(() => {
    const timer = setTimeout(() => {
      const activeP = currentViewRef.current.page || currentPage || 1;
      const pagesToPrioritize = [activeP - 1, activeP, activeP + 1].filter(
        (p) => p >= 1 && p <= totalPages,
      );

      pagesToPrioritize.forEach((p) => {
        renderPageCanvas(p);
      });
    }, 80);

    return () => clearTimeout(timer);
  }, [zoom, displayPageWidth, totalPages, currentPage, renderPageCanvas]);

  // 10. Loncat ke Halaman Tertentu (Target Scroll Page)
  useEffect(() => {
    if (!pdfDoc || totalPages === 0 || !targetScrollPage) return;
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

  // Buat array nomor halaman [1, 2, ..., totalPages]
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
      {/* Tampilan Lembar Dokumen Kanvas Tetap (Fixed Sheet Canvas) */}
      <div
        ref={pageStackRef}
        className="mx-auto flex flex-col items-center gap-4"
        style={{
          width: `${displayPageWidth}px`,
        }}
      >
        {pageNumbers.map((pageNum) => (
          <div
            key={pageNum}
            id={`pdf-page-${pageNum}`}
            data-page-number={pageNum}
            aria-label={`Halaman ${pageNum} dari ${totalPages}`}
            ref={(el) => (pageContainerRefs.current[pageNum] = el)}
            className="relative shadow-md md:shadow-lg rounded-sm sm:rounded-md overflow-hidden bg-ui-card border border-ink-200/50 dark:border-ink-700/50"
            style={{
              width: `${displayPageWidth}px`,
              height: `${displayPageHeight}px`,
            }}
          >
            <canvas
              ref={(el) => (canvasRefs.current[pageNum] = el)}
              className="block w-full h-full"
              style={{
                width: `${displayPageWidth}px`,
                height: `${displayPageHeight}px`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
