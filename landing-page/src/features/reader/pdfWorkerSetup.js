import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

if (typeof globalThis !== 'undefined') {
  globalThis.pdfjsLib = pdfjsLib;
}

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

let viewerPromise = null;

export const getPdfjsViewer = async () => {
  if (!viewerPromise) {
    viewerPromise = import('pdfjs-dist/web/pdf_viewer.mjs');
  }
  return viewerPromise;
};

export { pdfjsLib };
