/**
 * Custom hook untuk mengelola proses rendering kanvas halaman PDF berbasis Mozilla PDF.js.
 * Mengimplementasikan antrean rendering aman, pembatalan task, rendering Retina HD,
 * serta lazy-rendering melalui IntersectionObserver untuk menghemat penggunaan memori peramban.
 *
 * @module src/features/reader/usePdfCanvasRenderer
 */

import { useRef, useCallback, useEffect } from 'react';

/**
 * Hook pengelola render kanvas PDF.js.
 *
 * @param {object} params - Konfigurasi hook
 * @param {any} params.pdfDoc - Objek dokumen PDF dari PDF.js
 * @param {number} params.totalPages - Total halaman dokumen
 * @param {number} params.displayPageWidth - Lebar fisik kanvas yang diinginkan
 * @param {import('react').RefObject<HTMLDivElement>} params.containerRef - Ref elemen container scroll
 * @param {import('react').MutableRefObject<Record<number, HTMLElement>>} params.pageContainerRefs - Ref dictionary container halaman
 * @param {import('react').MutableRefObject<Record<number, HTMLCanvasElement>>} params.canvasRefs - Ref dictionary elemen canvas
 * @param {import('react').MutableRefObject<{page: number, ratio: number}>} params.currentViewRef - Ref posisi halaman aktif
 * @param {number} params.currentPage - Nomor halaman aktif
 * @param {number} params.zoom - Nilai zoom persentase
 * @returns {{
 *   renderPageCanvas: (pageNumber: number) => Promise<void>
 * }}
 */
export function usePdfCanvasRenderer({
  pdfDoc,
  totalPages,
  displayPageWidth,
  containerRef,
  pageContainerRefs,
  canvasRefs,
  currentViewRef,
  currentPage,
  zoom,
}) {
  const renderTasksRef = useRef({});

  // 1. Render Halaman ke Canvas HTML5 Menggunakan PDF.js
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
    [pdfDoc, totalPages, displayPageWidth, canvasRefs],
  );

  // 2. IntersectionObserver untuk Lazy Rendering Canvas Halaman
  useEffect(() => {
    if (!pdfDoc || totalPages === 0) return undefined;

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
  }, [pdfDoc, totalPages, renderPageCanvas, containerRef, pageContainerRefs]);

  // 3. Re-render Halaman Aktif saat Zoom Berubah (Cepat & Ringan)
  useEffect(() => {
    const timer = setTimeout(() => {
      const activeP = currentViewRef.current?.page || currentPage || 1;
      const pagesToPrioritize = [activeP - 1, activeP, activeP + 1].filter(
        (p) => p >= 1 && p <= totalPages,
      );

      pagesToPrioritize.forEach((p) => {
        renderPageCanvas(p);
      });
    }, 80);

    return () => clearTimeout(timer);
  }, [zoom, displayPageWidth, totalPages, currentPage, renderPageCanvas, currentViewRef]);

  return { renderPageCanvas };
}
