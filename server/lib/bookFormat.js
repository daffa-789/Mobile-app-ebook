/**
 * Formatting dan validasi ringan untuk entitas buku.
 *
 * Dipisahkan dari books_service.js supaya service tetap fokus pada orkestrasi
 * Supabase/storage. Fungsi di sini murni: tidak melakukan query atau I/O.
 */

import { createServiceError } from './errors.js';
import { sniffImageMime } from './sniff.js';

const THUMBNAIL_FORMAT_MESSAGE = 'Thumbnail harus berupa gambar PNG, JPG, WebP, atau GIF.';

/** Nama objek penyimpanan dibuat aman; nama asli tetap disimpan terpisah. */
export function safeContentName(filename, extension) {
  const base = String(filename || '')
    .replace(/\.[^.]*$/, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 80);
  return `${base || 'naskah'}.${extension}`;
}

/** Normalisasi field buku sebelum dikirim ke klien. */
export function toBookResponse(book) {
  return {
    ...book,
    pages: Number(book.pages || 1),
    is_locked: Boolean(book.is_locked),
    has_thumbnail: Boolean(book.cover_url || book.thumbnail_url),
    has_content: Number(book.content_size) > 0,
  };
}

/** Pastikan unggahan thumbnail benar-benar gambar, bukan sekadar ekstensi. */
export async function requireThumbnailMime(buffer) {
  const detected = await sniffImageMime(buffer);
  if (!detected) throw createServiceError(THUMBNAIL_FORMAT_MESSAGE, { statusCode: 415 });
  return detected;
}
