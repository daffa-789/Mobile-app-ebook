/**
 * Custom hook untuk mengelola proses rendering kanvas halaman PDF berbasis Mozilla PDF.js.
 *
 * Prinsip utama: kanvas yang terlihat tidak pernah dikosongkan lebih dulu. Mengubah
 * `canvas.width`/`canvas.height` menghapus isinya seketika, dan bila pdf.js lalu
 * menggambar secara asinkron di atasnya, halaman berkedip putih setiap kali zoom
 * selesai. Karena itu setiap halaman dirender ke kanvas buffer, lalu hasilnya disalin
 * sekali (drawImage) ke kanvas tampil pada task yang sama.
 *
 * Rendering tetap lazy lewat IntersectionObserver. Fungsi render dibuat stabil
 * (membaca parameter terbaru dari ref) supaya pergantian zoom tidak membangun ulang
 * pengamat dan memicu gelombang render ulang seluruh halaman yang sedang terlihat.
 *
 * @module src/features/reader/usePdfCanvasRenderer
 */

import { useRef, useCallback, useEffect } from 'react';

/* Batas luas backing store satu halaman (piksel). HP sering memakai devicePixelRatio 3
   dan zoom 300% pada halaman A4 menghasilkan kanvas puluhan juta piksel — memori habis
   dan render melambat. Di atas batas ini skala diturunkan proporsional: sedikit kurang
   tajam jauh lebih baik daripada jank. */
const MAX_CANVAS_PIXELS = 12_000_000;

const MAX_DPR = 2;

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
}) {
  const renderTasksRef = useRef({});
  // Ukuran yang sudah tergambar per halaman, supaya permintaan ulang yang sama diabaikan.
  const renderedKeyRef = useRef({});
  const visiblePagesRef = useRef(new Set());

  /* Parameter terbaru dibaca dari ref, bukan dari closure, sehingga renderPageCanvas
     tidak perlu dibuat ulang setiap kali zoom berubah. */
  const paramsRef = useRef({ pdfDoc, totalPages, displayPageWidth });
  paramsRef.current = { pdfDoc, totalPages, displayPageWidth };

  const buatBuffer = (lebar, tinggi) => {
    if (typeof OffscreenCanvas === 'function') return new OffscreenCanvas(lebar, tinggi);
    const c = document.createElement('canvas');
    c.width = lebar;
    c.height = tinggi;
    return c;
  };

  // 1. Render satu halaman ke buffer, lalu salin sekaligus ke kanvas tampil.
  const gambarSekarang = useCallback(
    async (pageNumber) => {
      const {
        pdfDoc: dokumen,
        totalPages: total,
        displayPageWidth: lebarTarget,
      } = paramsRef.current;
      if (!dokumen || pageNumber < 1 || pageNumber > total) return;

      const canvas = canvasRefs.current[pageNumber];
      if (!canvas) return;

      try {
        const page = await dokumen.getPage(pageNumber);
        const dasar = page.getViewport({ scale: 1.0 });
        if (!(dasar.width > 0) || !(dasar.height > 0)) return;

        const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
        let skala = (lebarTarget / dasar.width) * dpr;
        const luas = dasar.width * skala * (dasar.height * skala);
        if (luas > MAX_CANVAS_PIXELS) skala *= Math.sqrt(MAX_CANVAS_PIXELS / luas);

        const kunci = `${Math.round(lebarTarget)}@${skala.toFixed(3)}`;
        if (renderedKeyRef.current[pageNumber] === kunci) return;

        // Batalkan render task sebelumnya jika masih berjalan di halaman ini
        const berjalan = renderTasksRef.current[pageNumber];
        if (berjalan) {
          try {
            berjalan.cancel();
          } catch {
            /* abaikan jika sudah selesai */
          }
        }

        const viewport = page.getViewport({ scale: skala });
        const lebar = Math.round(viewport.width);
        const tinggi = Math.round(viewport.height);

        const buffer = buatBuffer(lebar, tinggi);
        const tugas = page.render({ canvasContext: buffer.getContext('2d'), viewport });
        renderTasksRef.current[pageNumber] = tugas;
        await tugas.promise;

        /* Resize dan penyalinan terjadi pada task yang sama, jadi peramban tidak
           sempat melukis kanvas kosong di antaranya. */
        canvas.width = lebar;
        canvas.height = tinggi;
        canvas.getContext('2d').drawImage(buffer, 0, 0);

        renderedKeyRef.current[pageNumber] = kunci;
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn(`[ContinuousPdfViewer] Gagal merender halaman ${pageNumber}:`, err);
        }
      } finally {
        delete renderTasksRef.current[pageNumber];
      }
    },
    [canvasRefs],
  );

  /* Render dijalankan bergiliran, satu halaman per waktu. Tanpa antrean, satu
     perubahan zoom memicu beberapa render bersamaan: buffer kanvas menumpuk di
     memori HP dan thread utama tersendat di saat yang paling sensitif. */
  const antreanRef = useRef(Promise.resolve());
  const renderPageCanvas = useCallback(
    (pageNumber) => {
      const jalan = () => gambarSekarang(pageNumber);
      const hasil = antreanRef.current.then(jalan, jalan);
      antreanRef.current = hasil.catch(() => {});
      return hasil;
    },
    [gambarSekarang],
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
            visiblePagesRef.current.add(pageNum);
            renderPageCanvas(pageNum);
          } else {
            visiblePagesRef.current.delete(pageNum);
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

  /* 3. Render ulang saat resolusi bucket berubah: yang sedang terlihat dulu,
     lalu sekitar halaman aktif. Zoom yang tidak melewati batas bucket tidak
     menyentuh kanvas sama sekali — itulah yang membuat zoom kecil bebas kedip.

     Jeda 180 ms memastikan swap bitmap tidak terjadi di tengah gestur trackpad
     yang punya celah antar-event: selama jari masih bergerak, gambar lama tetap
     tampil (hanya diskala), dan penggantian tajamnya menunggu gestur tenang. */
  useEffect(() => {
    if (!pdfDoc || totalPages === 0) return undefined;

    const timer = setTimeout(() => {
      const aktif = currentViewRef.current?.page || currentPage || 1;
      const kandidat = new Set(visiblePagesRef.current);
      [aktif - 1, aktif, aktif + 1].forEach((p) => kandidat.add(p));

      [...kandidat]
        .filter((p) => p >= 1 && p <= totalPages)
        .sort((a, b) => Math.abs(a - aktif) - Math.abs(b - aktif))
        .forEach((p) => renderPageCanvas(p));
    }, 180);

    return () => clearTimeout(timer);
  }, [displayPageWidth, pdfDoc, totalPages, currentPage, renderPageCanvas, currentViewRef]);

  return { renderPageCanvas };
}
