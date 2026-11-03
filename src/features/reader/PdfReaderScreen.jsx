/**
 * Layar pembaca naskah buku digital multi-format (PDF, DOCX, TXT, dan Lembar Sampel).
 * Mengoordinasikan pembacaan naskah, posisi halaman terakhir (reading progress persistence),
 * hak akses Pro, serta perbesaran dokumen responsif melalui sub-komponen terdedikasi.
 *
 * @module src/features/reader/PdfReaderScreen
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useApp } from '@context/AppContext';
import { apiJson, apiRequest, authHeaders } from '@lib/api';
import { sanitizeHtml } from '@lib/sanitizeHtml';
import { ContinuousPdfViewer } from './ContinuousPdfViewer';
import { useAnchoredPinchZoom } from './useAnchoredPinchZoom';

import { ReaderTopBar } from './ReaderTopBar';
import {
  BookNotFoundState,
  ProLockedState,
  DocumentErrorState,
  DocumentLoadingState,
  DocumentEmptyState,
} from './ReaderContentStates';
import { HtmlDocViewer } from './HtmlDocViewer';
import { TextDocViewer } from './TextDocViewer';

const TEXT_TYPES = new Set(['txt', 'md', 'csv', 'rtf']);
const PDF_TYPES = new Set(['pdf']);
const DOCX_TYPES = new Set(['docx', 'doc', 'odt']);

const getExtension = (book) =>
  String(book?.contentExtension || book?.contentType || '')
    .toLowerCase()
    .replace('.', '');

/**
 * Komponen utama layar pembaca buku.
 *
 * @returns {import('react').JSX.Element}
 */
export const PdfReaderScreen = () => {
  const { activeBook, navigateTo } = useApp();
  const [textContent, setTextContent] = useState('');
  const [docHtml, setDocHtml] = useState('');
  const [pdfBlob, setPdfBlob] = useState(null);
  const [contentStatus, setContentStatus] = useState('idle');
  const [reloadToken, setReloadToken] = useState(0);

  // Status Perbesaran Dokumen (Zoom) - Default 100%
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const supportsNativeFullscreen =
    typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;

  // Pelacak Halaman Terakhir & Navigasi Scroll
  const bookTotalPages = Number(
    activeBook?.pages || activeBook?.totalPages || activeBook?.samplePages?.length || 1,
  );
  const samplePages = activeBook?.samplePages || [];
  const [totalPages, setTotalPages] = useState(Math.max(1, samplePages.length || bookTotalPages));
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [targetScrollPage, setTargetScrollPage] = useState(null);

  const extension = getExtension(activeBook);

  // Ambil halaman terakhir yang tersimpan saat pertama kali dibuka
  useEffect(() => {
    if (!activeBook?.id) return;
    const storageKey = `last_read_page_${activeBook.id}`;
    const localSaved = Number(localStorage.getItem(storageKey));
    if (localSaved && localSaved >= 1) {
      setCurrentPage(localSaved);
      setPageInput(String(localSaved));
      setTargetScrollPage(localSaved);
    }
  }, [activeBook?.id]);

  // Simpan posisi membaca saat halaman berubah
  const handlePageChange = useCallback(
    (page, total) => {
      const validPage = Math.max(1, Math.min(total || totalPages, page));
      setCurrentPage(validPage);
      setPageInput(String(validPage));
      if (total && total > 0) setTotalPages(total);

      if (activeBook?.id) {
        localStorage.setItem(`last_read_page_${activeBook.id}`, String(validPage));
      }
    },
    [activeBook?.id, totalPages],
  );

  // Update level zoom dengan batasan aman (40% - 300%)
  const setClampedZoom = useCallback((newValOrFn) => {
    setZoom((prev) => {
      const raw = typeof newValOrFn === 'function' ? newValOrFn(prev) : newValOrFn;
      return Math.min(300, Math.max(40, Math.round(raw)));
    });
  }, []);

  const readingSurfaceRef = useRef(null);
  const readingPreviewRef = useRef(null);
  const pinchZoomHandlers = useAnchoredPinchZoom({
    containerRef: readingSurfaceRef,
    previewRef: readingPreviewRef,
    zoom,
    setZoom: setClampedZoom,
  });

  const adjustZoom = (delta) => {
    pinchZoomHandlers.prepareZoom();
    setClampedZoom((prev) => prev + delta);
  };

  const resetZoom = () => {
    pinchZoomHandlers.prepareZoom();
    setClampedZoom(100);
  };

  // Toggle Layar Penuh
  const toggleFullscreen = () => {
    if (!supportsNativeFullscreen) return;

    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Input halaman manual di pill atas: ketik nomor halaman lalu Enter untuk scroll ke sana
  const handlePageInputSubmit = (e) => {
    e.preventDefault();
    const val = parseInt(pageInput, 10);
    if (!isNaN(val) && val >= 1 && val <= totalPages) {
      setTargetScrollPage(val);
      setCurrentPage(val);
      if (activeBook?.id) {
        localStorage.setItem(`last_read_page_${activeBook.id}`, String(val));
      }
    } else {
      setPageInput(String(currentPage));
    }
  };

  // Muat konten PDF, Word (docx), atau teks
  useEffect(() => {
    let cancelled = false;
    setTextContent('');
    setDocHtml('');
    setPdfBlob(null);

    if (!activeBook?.id) {
      setContentStatus('idle');
      return undefined;
    }

    const isPdf = PDF_TYPES.has(extension);
    const isDoc = DOCX_TYPES.has(extension);
    const isText = TEXT_TYPES.has(extension);

    if (
      !isPdf &&
      !isDoc &&
      !isText &&
      (!activeBook?.samplePages || activeBook.samplePages.length === 0)
    ) {
      setContentStatus('idle');
      return undefined;
    }

    setContentStatus('loading');

    if (isDoc || isText) {
      apiJson(`/api/books/${encodeURIComponent(activeBook.id)}/html`, { headers: authHeaders() })
        .then((res) => {
          if (cancelled) return;
          if (res?.html) {
            setDocHtml(sanitizeHtml(res.html));
            setContentStatus('ready');
          } else if (res?.text) {
            setTextContent(res.text);
            setContentStatus('ready');
          } else {
            setContentStatus('error');
          }
        })
        .catch((err) => {
          if (cancelled) return;
          if (
            err?.status === 403 ||
            String(err?.message || '')
              .toLowerCase()
              .includes('pro')
          ) {
            setContentStatus('locked');
          } else {
            setContentStatus('error');
          }
        });
    } else if (isPdf && activeBook?.contentUrl) {
      apiRequest(activeBook.contentUrl, { headers: authHeaders() })
        .then(async (response) => {
          if (response.status === 403) throw new Error('PRO_LOCKED');
          if (!response.ok) throw new Error('FETCH_FAILED');
          return response.blob();
        })
        .then((blob) => {
          if (cancelled) return;
          setPdfBlob(blob);
          setContentStatus('ready');
        })
        .catch((err) => {
          if (!cancelled) setContentStatus(err.message === 'PRO_LOCKED' ? 'locked' : 'error');
        });
    } else if (activeBook?.samplePages && activeBook.samplePages.length > 0) {
      setContentStatus('ready');
    }

    return () => {
      cancelled = true;
    };
  }, [activeBook?.id, activeBook?.contentUrl, extension, reloadToken]);

  const retryLoadContent = () => setReloadToken((prev) => prev + 1);

  if (!activeBook) {
    return <BookNotFoundState onBack={() => navigateTo('home')} />;
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-canvas-subtle text-ink-900 dark:text-cream-50 select-none overflow-hidden">
      <ReaderTopBar
        title={activeBook.title}
        pageInput={pageInput}
        setPageInput={setPageInput}
        onPageInputSubmit={handlePageInputSubmit}
        totalPages={totalPages}
        zoom={zoom}
        onAdjustZoom={adjustZoom}
        onResetZoom={resetZoom}
        supportsNativeFullscreen={supportsNativeFullscreen}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onBack={() => navigateTo('home')}
      />

      <main className="flex-1 min-h-0 w-full relative flex flex-col items-center p-0 overflow-hidden">
        {contentStatus === 'locked' ? (
          <ProLockedState onUpgrade={() => navigateTo('pro')} />
        ) : contentStatus === 'error' ? (
          <DocumentErrorState onRetry={retryLoadContent} />
        ) : contentStatus === 'loading' ? (
          <DocumentLoadingState />
        ) : (docHtml || DOCX_TYPES.has(extension)) && docHtml ? (
          <HtmlDocViewer
            docHtml={docHtml}
            zoom={zoom}
            surfaceRef={readingSurfaceRef}
            previewRef={readingPreviewRef}
            pinchHandlers={pinchZoomHandlers}
          />
        ) : PDF_TYPES.has(extension) && pdfBlob ? (
          <ContinuousPdfViewer
            pdfBlob={pdfBlob}
            zoom={zoom}
            setZoom={setClampedZoom}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            targetScrollPage={targetScrollPage}
            onTargetScrollHandled={() => setTargetScrollPage(null)}
            bookId={activeBook.id}
          />
        ) : TEXT_TYPES.has(extension) && (textContent || docHtml) ? (
          <TextDocViewer
            textContent={textContent}
            zoom={zoom}
            surfaceRef={readingSurfaceRef}
            previewRef={readingPreviewRef}
            pinchHandlers={pinchZoomHandlers}
          />
        ) : totalPages > 0 && samplePages.length > 0 ? (
          <TextDocViewer
            samplePages={samplePages}
            currentPage={currentPage}
            totalPages={totalPages}
            zoom={zoom}
            surfaceRef={readingSurfaceRef}
            previewRef={readingPreviewRef}
            pinchHandlers={pinchZoomHandlers}
          />
        ) : (
          <DocumentEmptyState contentName={activeBook.contentName} />
        )}
      </main>
    </div>
  );
};
