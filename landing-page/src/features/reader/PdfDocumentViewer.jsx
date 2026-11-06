import { useEffect, useRef, useState } from 'react';
import 'pdfjs-dist/web/pdf_viewer.css';
import { pdfjsLib, getPdfjsViewer } from './pdfWorkerSetup';

/**
 * Komponen penampil naskah PDF berbasis mesin native Mozilla PDF.js.
 *
 * @param {object} props
 * @param {Blob} props.pdfBlob - Objek Blob berkas PDF yang akan ditampilkan
 * @param {number} props.zoom - Persentase tingkat perbesaran dokumen (40 - 300)
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

  // 3. Penerapan Zoom Dinamis
  useEffect(() => {
    if (pdfViewerRef.current?.pdfDocument) {
      const scale = zoom / 100;
      if (pdfViewerRef.current.currentScale !== scale) {
        pdfViewerRef.current.currentScale = scale;
      }
    }
  }, [zoom]);

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

export default PdfDocumentViewer;
