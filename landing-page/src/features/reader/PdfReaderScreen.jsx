import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router';
import { useApp } from '@context/AppContext';
import { apiJson, apiRequest, authHeaders } from '@lib/api';
import { PdfDocumentViewer } from './PdfDocumentViewer';
import { DocxDocumentViewer } from './DocxDocumentViewer';
import { TextDocViewer } from './TextDocViewer';
import { ReaderTopBar } from './ReaderTopBar';
import {
  BookNotFoundState,
  ProLockedState,
  DocumentErrorState,
  DocumentLoadingState,
  DocumentEmptyState,
} from './ReaderContentStates';

const TEXT_TYPES = new Set(['txt', 'md', 'csv', 'rtf']);
const PDF_TYPES = new Set(['pdf']);
const DOCX_TYPES = new Set(['docx', 'doc', 'odt']);

const MIN_ZOOM = 40;
const MAX_ZOOM = 300;

const getExtension = (book) =>
  String(book?.contentExtension || book?.contentType || '')
    .toLowerCase()
    .replace('.', '');

export const PdfReaderScreen = () => {
  const { activeBook, setActiveBook, books, navigateTo } = useApp();
  const location = useLocation();

  const [textContent, setTextContent] = useState('');
  const [pdfBlob, setPdfBlob] = useState(null);
  const [docxBlob, setDocxBlob] = useState(null);
  const [contentStatus, setContentStatus] = useState('idle');
  const [reloadToken, setReloadToken] = useState(0);

  // Status Perbesaran Dokumen (Zoom 40% - 300%) - Bawaan 100%
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

  // Pulihkan activeBook dari query string (?id=xxx) bila pengguna refresh peramban
  useEffect(() => {
    if (activeBook?.id) return;
    const params = new URLSearchParams(location.search);
    const bookId = params.get('id');
    if (bookId && books && books.length > 0) {
      const found = books.find((b) => String(b.id) === String(bookId));
      if (found) {
        setActiveBook(found);
      }
    }
  }, [activeBook?.id, books, location.search, setActiveBook]);

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

  // Zoom Handlers
  const handleZoomIn = () => setZoom((prev) => Math.min(MAX_ZOOM, prev + 10));
  const handleZoomOut = () => setZoom((prev) => Math.max(MIN_ZOOM, prev - 10));
  const handleZoomReset = () => setZoom(100);

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

  // Input halaman manual
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
    setPdfBlob(null);
    setDocxBlob(null);

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

    const contentUrl =
      activeBook.contentUrl ||
      (activeBook.id ? `/api/books/${encodeURIComponent(activeBook.id)}/content` : null);

    if (isDoc && contentUrl) {
      apiRequest(contentUrl, { headers: authHeaders() })
        .then(async (response) => {
          if (response.status === 403) throw new Error('PRO_LOCKED');
          if (!response.ok) throw new Error('FETCH_FAILED');
          return response.blob();
        })
        .then((blob) => {
          if (cancelled) return;
          setDocxBlob(blob);
          setContentStatus('ready');
        })
        .catch((err) => {
          if (!cancelled) {
            setContentStatus(err.message === 'PRO_LOCKED' ? 'locked' : 'error');
          }
        });
    } else if (isPdf && contentUrl) {
      apiRequest(contentUrl, { headers: authHeaders() })
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
          if (!cancelled) {
            setContentStatus(err.message === 'PRO_LOCKED' ? 'locked' : 'error');
          }
        });
    } else if (isText) {
      apiJson(`/api/books/${encodeURIComponent(activeBook.id)}/html`, { headers: authHeaders() })
        .then((res) => {
          if (cancelled) return;
          if (res?.text || res?.html) {
            setTextContent(res.text || res.html);
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
    <div className="fixed inset-0 z-50 flex flex-col bg-cream-100 text-ink-900 select-none overflow-hidden">
      <ReaderTopBar
        title={activeBook.title}
        pageInput={pageInput}
        setPageInput={setPageInput}
        onPageInputSubmit={handlePageInputSubmit}
        totalPages={totalPages}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        supportsNativeFullscreen={supportsNativeFullscreen}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onBack={() => navigateTo('home')}
      />

      <main className="flex-1 min-h-0 w-full relative flex flex-col items-center p-0 overflow-hidden bg-cream-200/50">
        {contentStatus === 'locked' ? (
          <ProLockedState onUpgrade={() => navigateTo('pro')} />
        ) : contentStatus === 'error' ? (
          <DocumentErrorState onRetry={retryLoadContent} />
        ) : contentStatus === 'loading' ? (
          <DocumentLoadingState />
        ) : DOCX_TYPES.has(extension) && docxBlob ? (
          <DocxDocumentViewer docxBlob={docxBlob} zoom={zoom} />
        ) : PDF_TYPES.has(extension) && pdfBlob ? (
          <PdfDocumentViewer
            pdfBlob={pdfBlob}
            zoom={zoom}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            targetScrollPage={targetScrollPage}
            onTargetScrollHandled={() => setTargetScrollPage(null)}
          />
        ) : TEXT_TYPES.has(extension) && textContent ? (
          <TextDocViewer textContent={textContent} zoom={zoom} />
        ) : totalPages > 0 && samplePages.length > 0 ? (
          <TextDocViewer
            samplePages={samplePages}
            currentPage={currentPage}
            totalPages={totalPages}
            zoom={zoom}
          />
        ) : (
          <DocumentEmptyState contentName={activeBook.contentName} />
        )}
      </main>
    </div>
  );
};

export default PdfReaderScreen;
