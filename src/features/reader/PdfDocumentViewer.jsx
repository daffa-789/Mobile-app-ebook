/**
 * Penampil naskah PDF berbasis mesin native Mozilla PDF.js (pdfjs-dist/web/pdf_viewer).
 * Mengintegrasikan EventBus, PDFLinkService, dan PDFViewer untuk continuous vertical scrolling,
 * virtualisasi halaman otomatis, pemilihan teks (text layer), dan zoom dinamis berbasis
 * double-buffered rendering tanpa flickering atau pergeseran posisi baca.
 *
 * @module src/features/reader/PdfDocumentViewer
 */

import { useEffect, useRef, useState } from 'react';
import 'pdfjs-dist/web/pdf_viewer.css';
import { pdfjsLib, getPdfjsViewer } from './pdfWorkerSetup';

/**
 * Komponen pembaca dokumen PDF terenkapsulasi.
 *
 * @param {object} props
 * @param {Blob} props.pdfBlob - Objek Blob berkas PDF yang akan ditampilkan
 * @param {number} props.zoom - Persentase tingkat perbesaran dokumen (misal: 100)
 * @param {number} [props.currentPage] - Nomor halaman aktif saat ini
 * @param {(pageNumber: number, totalPages: number) => void} [props.onPageChange] - Callback saat halaman berganti
 * @param {number|null} [props.targetScrollPage] - Nomor halaman target untuk navigasi lompat halaman
 * @param {() => void} [props.onTargetScrollHandled] - Callback setelah lompatan halaman selesai ditangani
 * @returns {import('react').JSX.Element}
 */
export const PdfDocumentViewer = ({
  pdfBlob,
  zoom,
  currentPage,
  onPageChange,
  targetScrollPage,
  onTargetScrollHandled,
}) => {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const pdfViewerRef = useRef(null);
  const linkServiceRef = useRef(null);
  const loadingTaskRef = useRef(null);
  const pdfDocRef = useRef(null);
  const [isViewerReady, setIsViewerReady] = useState(false);

  const onPageChangeRef = useRef(onPageChange);
  onPageChangeRef.current = onPageChange;

  const targetScrollPageRef = useRef(targetScrollPage);
  targetScrollPageRef.current = targetScrollPage;

  const onTargetScrollHandledRef = useRef(onTargetScrollHandled);
  onTargetScrollHandledRef.current = onTargetScrollHandled;

  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  // 1. Inisialisasi PDFViewer native Mozilla
  useEffect(() => {
    if (!containerRef.current || !viewerRef.current) return;

    let cancelled = false;
    const abortController = new AbortController();
    let currentEventBus = null;
    let handlePageChanging = null;
    let handlePagesInit = null;

    getPdfjsViewer()
      .then((pdfjsViewer) => {
        if (cancelled || !containerRef.current || !viewerRef.current) return;

        const eventBus = new pdfjsViewer.EventBus();
        const linkService = new pdfjsViewer.PDFLinkService({ eventBus });

        const viewer = new pdfjsViewer.PDFViewer({
          container: containerRef.current,
          viewer: viewerRef.current,
          eventBus,
          linkService,
          removePageBorders: false,
          abortSignal: abortController.signal,
        });

        linkService.setViewer(viewer);
        pdfViewerRef.current = viewer;
        linkServiceRef.current = linkService;
        currentEventBus = eventBus;

        handlePageChanging = (evt) => {
          onPageChangeRef.current?.(evt.pageNumber, viewer.pagesCount);
        };

        handlePagesInit = () => {
          viewer.currentScale = zoomRef.current / 100;
          if (targetScrollPageRef.current) {
            viewer.scrollPageIntoView({ pageNumber: targetScrollPageRef.current });
            onTargetScrollHandledRef.current?.();
          }
        };

        eventBus.on('pagechanging', handlePageChanging);
        eventBus.on('pagesinit', handlePagesInit);

        setIsViewerReady(true);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('[PdfDocumentViewer] Gagal menginisialisasi PDFViewer:', err);
        }
      });

    return () => {
      cancelled = true;
      abortController.abort();
      setIsViewerReady(false);
      try {
        if (currentEventBus) {
          if (handlePageChanging) currentEventBus.off('pagechanging', handlePageChanging);
          if (handlePagesInit) currentEventBus.off('pagesinit', handlePagesInit);
        }
        const viewer = pdfViewerRef.current;
        if (viewer) {
          viewer._cancelRendering?.();
          viewer.cleanup();
          viewer.setDocument(null);
        }
      } catch (e) {
        console.warn('[PdfDocumentViewer] Kesalahan saat membersihkan viewer:', e);
      }
      pdfViewerRef.current = null;
      linkServiceRef.current = null;
    };
  }, []);

  // 2. Muat dokumen PDF dari Blob
  useEffect(() => {
    if (!isViewerReady || !pdfBlob || !pdfViewerRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        if (loadingTaskRef.current) {
          try {
            loadingTaskRef.current.destroy();
          } catch {}
          loadingTaskRef.current = null;
        }
        if (pdfDocRef.current) {
          try {
            pdfViewerRef.current?.setDocument(null);
            pdfDocRef.current.destroy();
          } catch {}
          pdfDocRef.current = null;
        }

        const buffer = await pdfBlob.arrayBuffer();
        if (cancelled) return;

        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(buffer),
          cMapPacked: true,
        });
        loadingTaskRef.current = loadingTask;

        const doc = await loadingTask.promise;
        if (cancelled) {
          doc.destroy();
          return;
        }

        pdfDocRef.current = doc;
        if (pdfViewerRef.current) {
          pdfViewerRef.current.setDocument(doc);
          linkServiceRef.current?.setDocument(doc, null);
          onPageChangeRef.current?.(1, doc.numPages);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[PdfDocumentViewer] Gagal memuat dokumen PDF:', err);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (loadingTaskRef.current) {
        try {
          loadingTaskRef.current.destroy();
        } catch {}
        loadingTaskRef.current = null;
      }
      if (pdfDocRef.current) {
        try {
          pdfViewerRef.current?.setDocument(null);
          pdfDocRef.current.destroy();
        } catch {}
        pdfDocRef.current = null;
      }
    };
  }, [isViewerReady, pdfBlob]);

  // 3. Penerapan Zoom Dinamis & Pencegahan Zoom Browser Global
  // Menangkap wheel (Ctrl+Scroll / Trackpad Pinch) dan touch pinch agar HANYA dokumen PDF
  // yang di-zoom, bukan seluruh layar web/browser.
  useEffect(() => {
    if (pdfViewerRef.current?.pdfDocument && typeof zoom === 'number') {
      const scale = zoom / 100;
      if (pdfViewerRef.current.currentScale !== scale) {
        pdfViewerRef.current.currentScale = scale;
      }
    }
  }, [zoom]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      // Browser Chromium & Firefox mengirim ctrlKey: true untuk trackpad pinch atau Ctrl+Wheel
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        const viewer = pdfViewerRef.current;
        if (!viewer || !viewer.pdfDocument) return;

        const delta = -e.deltaY;
        const factor = delta > 0 ? 1.05 : 0.95;
        const currentScale = viewer.currentScale || 1;
        const nextScale = Math.min(3.0, Math.max(0.4, Number((currentScale * factor).toFixed(2))));
        if (viewer.currentScale !== nextScale) {
          viewer.currentScale = nextScale;
        }
      }
    };

    let touchStartDist = 0;
    let initialScale = 1;

    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const [t1, t2] = e.touches;
        touchStartDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        initialScale = pdfViewerRef.current?.currentScale || 1;
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 2 && touchStartDist > 0) {
        e.preventDefault();
        const [t1, t2] = e.touches;
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const factor = dist / touchStartDist;
        const nextScale = Math.min(3.0, Math.max(0.4, Number((initialScale * factor).toFixed(2))));
        if (pdfViewerRef.current && pdfViewerRef.current.currentScale !== nextScale) {
          pdfViewerRef.current.currentScale = nextScale;
        }
      }
    };

    const handleTouchEnd = (e) => {
      if (e.touches.length < 2) {
        touchStartDist = 0;
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // 4. Navigasi Scroll ke Halaman Tertentu
  useEffect(() => {
    if (targetScrollPage && pdfViewerRef.current?.pdfDocument) {
      pdfViewerRef.current.scrollPageIntoView({ pageNumber: targetScrollPage });
      onTargetScrollHandled?.();
    }
  }, [targetScrollPage, onTargetScrollHandled]);

  return (
    <div className="relative flex-1 w-full h-full min-h-0 overflow-hidden bg-canvas-subtle">
      <div ref={containerRef} className="pdfViewerContainer absolute inset-0 overflow-auto">
        <div ref={viewerRef} className="pdfViewer" />
      </div>
    </div>
  );
};
