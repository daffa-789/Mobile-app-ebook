/**
 * Konfigurasi inisialisasi PDF.js Worker dan eksposur global untuk Mozilla PDF.js Viewer.
 * Modul web/pdf_viewer memerlukan 'globalThis.pdfjsLib' aktif sebelum dievaluasi.
 *
 * @module src/features/reader/pdfWorkerSetup
 */

import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Pastikan pdfjsLib tersedia di runtime global sebelum modul pdf_viewer diimpor
if (typeof window !== 'undefined') {
  window.pdfjsLib = pdfjsLib;
}
globalThis.pdfjsLib = pdfjsLib;

if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

let viewerPromise = null;

/**
 * Memuat pustaka komponen viewer native PDF.js secara asinkron setelah globalThis.pdfjsLib siap.
 * Mencegah kesalahan: "Cannot destructure property 'AbortException' of 'globalThis.pdfjsLib' as it is undefined".
 *
 * @returns {Promise<typeof import('pdfjs-dist/web/pdf_viewer.mjs')>}
 */
export const getPdfjsViewer = async () => {
  if (!viewerPromise) {
    if (typeof window !== 'undefined') {
      window.pdfjsLib = pdfjsLib;
    }
    globalThis.pdfjsLib = pdfjsLib;
    viewerPromise = import('pdfjs-dist/web/pdf_viewer.mjs');
  }
  return viewerPromise;
};

export { pdfjsLib };
