/* Menghitung jumlah halaman PDF dari isi berkasnya sendiri.

 * Angka halaman tidak bisa dipercaya dari input manusia: pada 4 Nov 2026
 * katalog berisi 3 buku dan ketiganya salah — kolom 16 vs berkas 3 halaman,
 * 28 vs 20, 48 vs 62. Angka itu bukan hiasan; penampil memakainya sebagai
 * dasar progres baca ("halaman X dari Y"), jadi satu angka yang salah membuat
 * seluruh indikator posisi pembaca ikut salah.
 *
 * Kegagalan mengembalikan null dengan catatan di log, bukan lemparan: unggahan
 * buku tidak boleh ditolak hanya karena pengayaan metadata tidak berhasil.
 */

import { logger } from '../logger.js';

/** Batas ukuran berkas yang boleh ditelan ke memori untuk dihitung. */
export const PDF_PAGE_PROBE_MAX_BYTES = 25 * 1024 * 1024;

/* pdfjs menolak Buffer Node dengan "Please provide binary data as
 * `Uint8Array`, rather than `Buffer`" — padahal Buffer ADALAH subclass
 * Uint8Array. Jadi salin dulu ke ArrayBuffer sendiri. */
const toPlainBytes = (input) => {
  if (input instanceof Uint8Array) {
    return new Uint8Array(
      input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength),
    );
  }
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  return null;
};

export async function countPdfPages(buffer) {
  const bytes = toPlainBytes(buffer);
  if (!bytes || !bytes.byteLength) return null;

  if (bytes.byteLength > PDF_PAGE_PROBE_MAX_BYTES) {
    logger.warn('BUKU', 'Halaman PDF tidak dihitung — berkas melebihi batas probe', {
      byteLength: bytes.byteLength,
      batas: PDF_PAGE_PROBE_MAX_BYTES,
    });
    return null;
  }

  let doc;
  try {
    // Impor dinamis: pdfjs hanya dimuat ketika benar-benar ada berkas PDF.
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    doc = await pdfjs.getDocument({ data: bytes }).promise;
    const pages = Number(doc?.numPages) || 0;
    if (!pages) {
      logger.warn('BUKU', 'pdfjs mengembalikan 0 halaman');
      return null;
    }
    return pages;
  } catch (error) {
    logger.warn('BUKU', 'Gagal menghitung halaman PDF dari berkasnya', {
      pesan: String(error?.message || error).slice(0, 160),
    });
    return null;
  } finally {
    try {
      await doc?.destroy();
    } catch {
      // Pelepasan memori bukan bagian dari hasil.
    }
  }
}
