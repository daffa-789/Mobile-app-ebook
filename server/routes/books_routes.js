/**
 * Route Layer — Katalog Buku.
 *
 * Hanya berisi pendaftaran URL, middleware, ekstraksi DTO dari `req`, dan
 * pembentukan respons HTTP. Semua query database dan aturan bisnis berada di
 * `server/services/books_service.js`.
 */

import { Router } from 'express';
import { requireAdmin, requireAuth } from '../auth.js';
import { notFound, sendDataUrl, wrap } from '../lib/http.js';
import { sniffDataUrlImage } from '../lib/sniff.js';
import { uploadBookFiles } from '../middleware/uploads.js';
import {
  createBook,
  createBookWithContent,
  createContentUploadIntent,
  deleteBook,
  getBookById,
  getThumbnailTarget,
  listBooks,
  loadContentTarget,
  loadHtmlContent,
  parseBookInput,
  updateBook,
} from '../services/books_service.js';

export const booksRouter = Router();

const viewerOf = (req) => ({ user: req.user, authUser: req.authUser });

/**
 * Kolom buku dari form unggah multipart. Handler buat dan handler ubah dulu
 * memetakan nama field yang sama persis di dua tempat — satu fungsi supaya
 * penambahan kolom tidak mendarat di satu rute saja.
 */
const bookUploadFields = (req) => {
  const { title, pages, is_locked, content_path, content_name } = req.body;
  return {
    title,
    pages,
    isLocked: is_locked,
    contentPath: content_path,
    contentName: content_name,
    thumbnailBuffer: req.files?.thumbnail?.[0]?.buffer,
  };
};

// GET /api/books — Daftar buku publik dengan pencarian judul dan pengurutan
booksRouter.get(
  '/books',
  wrap(async (req, res) => {
    const books = await listBooks(req.query);
    res.json({ success: true, books });
  }),
);

// GET /api/books/:id — Detail data buku publik
booksRouter.get(
  '/books/:id',
  wrap(async (req, res) => {
    const book = await getBookById(req.params.id);
    res.json({ success: true, book });
  }),
);

// POST /api/books — Tambah buku baru (Admin)
booksRouter.post(
  '/books',
  requireAuth,
  requireAdmin,
  wrap(async (req, res) => {
    const { title, pages, is_locked, cover_url } = parseBookInput(req.body);
    const bookId = await createBook({
      title,
      pages,
      isLocked: is_locked,
      coverUrl: cover_url,
    });
    res.status(201).json({ success: true, message: 'Buku berhasil ditambahkan', bookId });
  }),
);

// POST /api/books/upload-intent — Siapkan tiket upload langsung ke Supabase Storage (Admin)
booksRouter.post(
  '/books/upload-intent',
  requireAuth,
  requireAdmin,
  wrap(async (req, res) => {
    const ticket = await createContentUploadIntent(req.body?.filename);
    res.json({ success: true, ...ticket });
  }),
);

// POST /api/books/upload — Simpan buku beserta naskah dari storage dan thumbnail (Admin)
booksRouter.post(
  '/books/upload',
  requireAuth,
  requireAdmin,
  uploadBookFiles,
  wrap(async (req, res) => {
    const bookId = await createBookWithContent(bookUploadFields(req));
    res.status(201).json({ success: true, message: 'Buku berhasil diunggah', bookId });
  }),
);

// GET /api/books/:id/thumbnail — Sajikan cover buku (data URL atau redirect signed storage URL)
booksRouter.get(
  '/books/:id/thumbnail',
  wrap(async (req, res) => {
    const url = await getThumbnailTarget(req.params.id);

    /* Jenis gambar ditentukan dari byte-nya, bukan label di data URL (VULN-13).
     * Data URL yang isinya bukan gambar tidak disajikan sama sekali.
     */
    if (url.startsWith('data:')) {
      const imageMime = await sniffDataUrlImage(url);
      if (!imageMime) return notFound(res, 'Thumbnail tidak dapat disajikan');
      if (sendDataUrl(res, url, { contentType: imageMime, cacheControl: 'public, max-age=86400' }))
        return;
    }

    return res.redirect(url);
  }),
);

// GET /api/books/:id/html — Konversi konten dokumen (DOCX/TXT) menjadi HTML untuk pembaca
booksRouter.get(
  '/books/:id/html',
  requireAuth,
  wrap(async (req, res) => {
    const { html, type } = await loadHtmlContent({ id: req.params.id, viewer: viewerOf(req) });
    res.json({ success: true, html, type });
  }),
);

// GET /api/books/:id/content — Stream/unduh naskah buku (PDF inline atau berkas lampiran)
booksRouter.get(
  '/books/:id/content',
  requireAuth,
  wrap(async (req, res) => {
    const { target, mime, name, disposition } = await loadContentTarget({
      id: req.params.id,
      viewer: viewerOf(req),
    });

    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename*=UTF-8''${encodeURIComponent(name)}`,
    );
    /* Alihan ke URL bertanda tidak boleh ikut tersimpan di tepi CDN: alamat itu
     * memberi akses baca tanpa sesi, dan usianya sengaja pendek.
     */
    res.setHeader(
      'Cache-Control',
      target.startsWith('http') ? 'no-store' : 'private, max-age=3600',
    );

    if (sendDataUrl(res, target, { contentType: mime })) return;
    return res.redirect(target);
  }),
);

// GET /api/books/:id/content-url — URL baca singkat untuk reader PDF native
booksRouter.get(
  '/books/:id/content-url',
  requireAuth,
  wrap(async (req, res) => {
    const { target, mime } = await loadContentTarget({
      id: req.params.id,
      viewer: viewerOf(req),
    });

    res.setHeader('Cache-Control', 'private, no-store');
    res.json({ url: target, mime });
  }),
);

// PUT /api/books/:id — Perbarui data buku dan/atau naskah/thumbnail (Admin)
booksRouter.put(
  '/books/:id',
  requireAuth,
  requireAdmin,
  uploadBookFiles,
  wrap(async (req, res) => {
    await updateBook({ id: req.params.id, ...bookUploadFields(req) });
    res.json({ success: true, message: 'Buku berhasil diperbarui' });
  }),
);

// DELETE /api/books/:id — Hapus buku beserta file naskah dari storage (Admin)
booksRouter.delete(
  '/books/:id',
  requireAuth,
  requireAdmin,
  wrap(async (req, res) => {
    await deleteBook(req.params.id);
    res.json({ success: true, message: 'Buku berhasil dihapus' });
  }),
);
