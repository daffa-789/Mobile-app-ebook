/**
 * Service Layer — Katalog Buku.
 *
 * Seluruh query Supabase dan aturan bisnis katalog (pencarian, pemfilteran
 * akses Pro, konversi naskah) ada di sini. Masukan dan keluaran berupa data
 * polos; kegagalan yang merupakan bagian aturan bisnis dilempar sebagai
 * `createServiceError` sehingga route tinggal meneruskannya ke `fail()`.
 */

import path from 'path';
import mammoth from 'mammoth';
import { supabaseServer } from '../db.js';
import { generateId, hasActivePro } from '../auth.js';
import { safeContentMime } from '../lib/http.js';
import { createServiceError } from '../lib/errors.js';
import { toDataUrl, toWebp } from '../lib/images.js';
import { matchesContentExtension, sniffImageMime } from '../lib/sniff.js';
import { PDF_PAGE_PROBE_MAX_BYTES, countPdfPages } from '../lib/pdfPages.js';
import { BOOK_FIELDS, CONTENT_EXTENSIONS } from '../lib/constants.js';
import { bookInputSchema, parseBooleanFlag } from '../lib/validate.js';
import { sanitizeHtml } from '../lib/sanitizeHtml.js';
import {
  CONTENT_BUCKET,
  CONTENT_MAX_BYTES,
  CONTENT_PATH_PREFIX,
  createUploadTicket,
  contentRef,
  headBytes,
  objectInfo,
  readContentBuffer,
  removeContent,
  resolveReadUrl,
} from '../lib/storage.js';

const UPLOAD_PATH_PATTERN = /^naskah\/[a-z0-9-]+\/[A-Za-z0-9._-]+$/;

const MAX_CONTENT_MB = Math.round(CONTENT_MAX_BYTES / 1048576);

const CONTENT_FORMAT_MESSAGE =
  'Konten mendukung PDF, TXT, DOC/DOCX, RTF, ODT, EPUB, Markdown, atau CSV.';

const THUMBNAIL_FORMAT_MESSAGE = 'Thumbnail harus berupa gambar PNG, JPG, WebP, atau GIF.';

/* Nama objek di penyimpanan dibuat aman; nama asli tetap disimpan terpisah
 * untuk tampilan, karena ekstensi berkas menentukan cara naskah disajikan.
 */
const safeContentName = (filename, extension) => {
  const base = String(filename || '')
    .replace(/\.[^.]*$/, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 80);
  return `${base || 'naskah'}.${extension}`;
};

/** Berkasnya sudah ada di penyimpanan; diperiksa ukuran dan isi aslinya. */
const storedContentFields = async (contentPath, originalName) => {
  if (typeof contentPath !== 'string' || !UPLOAD_PATH_PATTERN.test(contentPath)) {
    throw createServiceError('Lokasi konten tidak valid. Unggah ulang berkasnya.', {
      statusCode: 415,
    });
  }
  const extension = path.extname(contentPath).toLowerCase();
  if (!CONTENT_EXTENSIONS.has(extension)) {
    throw createServiceError(CONTENT_FORMAT_MESSAGE, { statusCode: 415 });
  }
  const info = await objectInfo(contentPath);
  const size = Number(info?.size) || 0;
  if (!info || size <= 0) {
    throw createServiceError('Berkas konten belum sampai ke penyimpanan. Coba unggah ulang.', {
      statusCode: 415,
    });
  }
  if (size > CONTENT_MAX_BYTES) {
    throw createServiceError(`Ukuran konten maksimal ${MAX_CONTENT_MB} MB.`, { statusCode: 415 });
  }
  const head = await headBytes(contentPath);
  if (!matchesContentExtension(head, extension)) {
    throw createServiceError(
      `Isi berkas tidak cocok dengan ekstensi ${extension}. Periksa apakah berkasnya benar-benar jenis tersebut.`,
      { statusCode: 415 },
    );
  }
  const fields = {
    content_url: contentRef(contentPath),
    content_name: String(originalName || path.basename(contentPath)),
    content_extension: extension.replace(/^\./, ''),
    content_size: size,
  };

  /* Jumlah halaman dibaca dari berkasnya, bukan dari angka yang diketik di
   * formulir. Hanya PDF yang bisa dihitung tanpa konversi; DOCX/TXT memakai
   * angka input apa adanya karena "halaman" di sana bergantung tata letak.
   */
  if (extension === '.pdf' && size <= PDF_PAGE_PROBE_MAX_BYTES) {
    const counted = await countPdfPages(await readContentBuffer(fields.content_url));
    if (counted) fields.pages = counted;
  }

  return fields;
};

const toBookResponse = (book) => ({
  ...book,
  pages: Number(book.pages || 1),
  is_locked: Boolean(book.is_locked),
  has_thumbnail: Boolean(book.cover_url || book.thumbnail_url),
  has_content: Number(book.content_size) > 0,
});

const requireThumbnailMime = (buffer) => {
  const detected = sniffImageMime(buffer);
  if (!detected) throw createServiceError(THUMBNAIL_FORMAT_MESSAGE, { statusCode: 415 });
  return detected;
};

/** Aturan akses naskah: buku terkunci hanya untuk Pro aktif atau admin. */
const assertCanRead = (book, viewer) => {
  const user = viewer?.user;
  const isAdmin = user?.role === 'admin';
  if (book.is_locked && !hasActivePro(viewer?.authUser || user) && !isAdmin) {
    throw createServiceError('Buku ini khusus pembaca Pro. Aktifkan paket Pro untuk membukanya.', {
      statusCode: 403,
    });
  }
};

const loadBookRow = async (id, columns) => {
  const { data, error } = await supabaseServer
    .from('books')
    .select(columns)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
};

/**
 * Mengambil daftar buku katalog dengan filter pencarian dan opsi pengurutan.
 *
 * @param {object} [options] - Opsi filter dan sorting
 * @param {string} [options.search] - Kata kunci pencarian judul
 * @param {'oldest'|'title_asc'|'title_desc'|'newest'} [options.sort] - Metode pengurutan
 * @returns {Promise<Array<object>>} Daftar buku terformat
 */
export async function listBooks({ search, sort } = {}) {
  let query = supabaseServer.from('books').select(BOOK_FIELDS);

  if (search && typeof search === 'string') {
    const trimmed = search.trim();
    if (trimmed) {
      const safe = trimmed.replace(/[%_,()]/g, '');
      if (safe) query = query.ilike('title', `%${safe}%`);
    }
  }

  if (sort === 'oldest') {
    query = query.order('created_at', { ascending: true });
  } else if (sort === 'title_asc') {
    query = query.order('title', { ascending: true });
  } else if (sort === 'title_desc') {
    query = query.order('title', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(toBookResponse);
}

/**
 * Mengambil detail informasi satu buku berdasarkan ID.
 *
 * @param {string} id - ID buku
 * @returns {Promise<object>} Data buku lengkap
 */
export async function getBookById(id) {
  const book = await loadBookRow(id, BOOK_FIELDS);
  if (!book) throw createServiceError('Buku tidak ditemukan', { statusCode: 404 });
  return toBookResponse(book);
}

/**
 * Menambahkan entri buku baru tanpa unggahan naskah fisik.
 *
 * @param {object} params - Data buku baru
 * @param {string} params.title - Judul buku
 * @param {number} [params.pages=1] - Jumlah halaman
 * @param {boolean} [params.isLocked=false] - Status khusus anggota Pro
 * @param {string|null} [params.coverUrl] - URL sampul buku
 * @returns {Promise<string>} ID buku yang berhasil dibuat
 */
export async function createBook({ title, pages, isLocked, coverUrl }) {
  const id = generateId('buku');
  const { error } = await supabaseServer.from('books').insert({
    id,
    title: String(title).trim(),
    pages: Number(pages) || 1,
    is_locked: Boolean(isLocked),
    cover_url: coverUrl || null,
  });
  if (error) throw error;
  return id;
}

/** Validasi input buku polos (dipakai route agar pesan validasinya seragam). */
export const parseBookInput = (body) => {
  const parsed = bookInputSchema.safeParse(body);
  if (!parsed.success) {
    throw createServiceError(parsed.error.issues[0]?.message || 'Input buku tidak valid', {
      statusCode: 400,
    });
  }
  return parsed.data;
};

/* Tanda unggah sekali-pakai: peramban mengirim byte naskah langsung ke
 * Supabase Storage sehingga tidak menyentuh batas muatan function Vercel.
 */
export async function createContentUploadIntent(filename) {
  const extension = path.extname(String(filename || '')).toLowerCase();
  if (!CONTENT_EXTENSIONS.has(extension)) {
    throw createServiceError(CONTENT_FORMAT_MESSAGE, { statusCode: 415 });
  }

  const uploadId = generateId('tmp').toLowerCase();
  const target = `${CONTENT_PATH_PREFIX}/${uploadId}/${safeContentName(filename, extension.replace(/^\./, ''))}`;
  const ticket = await createUploadTicket(target);

  return {
    bucket: CONTENT_BUCKET,
    path: ticket.path,
    token: ticket.token,
    maxBytes: CONTENT_MAX_BYTES,
  };
}

/* Jenis berkas ditentukan dari isinya, bukan dari `mimetype` kiriman klien
 * (VULN-11). Sharp tetap dipakai untuk konversi, tetapi keputusan menerima
 * atau menolak dibuat di sini.
 */
export async function createBookWithContent({
  title,
  pages,
  isLocked,
  contentPath,
  contentName,
  thumbnailBuffer,
}) {
  if (!title || !thumbnailBuffer || !contentPath) {
    throw createServiceError('Judul, thumbnail, dan berkas konten wajib diisi', {
      statusCode: 400,
    });
  }

  const thumbnailMimeDetected = requireThumbnailMime(thumbnailBuffer);
  const storedFields = await storedContentFields(contentPath, contentName);

  const id = generateId('buku');
  const cover = await toWebp(thumbnailBuffer, {
    width: 600,
    quality: 80,
    fallbackMime: thumbnailMimeDetected,
  });

  const { error } = await supabaseServer.from('books').insert({
    id,
    title: String(title).trim(),
    pages: Number(pages) || 1,
    is_locked: parseBooleanFlag(isLocked),
    cover_url: toDataUrl(cover.buffer, cover.mime),
    ...storedFields,
  });
  if (error) throw error;

  return id;
}

export async function getThumbnailTarget(id) {
  const book = await loadBookRow(id, 'cover_url');
  if (!book?.cover_url) throw createServiceError('Thumbnail tidak ditemukan', { statusCode: 404 });
  return book.cover_url;
}

/* Memuat naskah dalam bentuk HTML siap tampil. DOCX dikonversi lalu
 * disanitasi; format teks dibungkus `<pre>`; format lain ditolak karena
 * penampil hanya mengenal PDF dan dokumen teks.
 */
export async function loadHtmlContent({ id, viewer }) {
  const book = await loadBookRow(id, 'content_url, content_name, content_extension, is_locked');
  if (!book?.content_url) {
    throw createServiceError('Konten buku tidak ditemukan', { statusCode: 404 });
  }
  assertCanRead(book, viewer);

  let buffer;
  try {
    buffer = await readContentBuffer(book.content_url);
  } catch {
    throw createServiceError('Gagal mengambil isi berkas', { statusCode: 404 });
  }

  const ext = (book.content_extension || path.extname(book.content_name || ''))
    .toLowerCase()
    .replace('.', '');

  if (ext === 'docx' || ext === 'doc') {
    try {
      const conversion = await mammoth.convertToHtml({ buffer });
      return { html: sanitizeHtml(conversion.value), type: 'docx' };
    } catch {
      throw createServiceError('Gagal mengonversi dokumen Word', { statusCode: 500 });
    }
  }

  if (ext === 'txt' || ext === 'md' || ext === 'csv' || ext === 'rtf') {
    const text = buffer.toString('utf-8');
    return {
      html: `<div style="white-space: pre-wrap; font-family: inherit;">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`,
      type: ext,
    };
  }

  throw createServiceError('Format bukan dokumen naskah/Word', { statusCode: 400 });
}

/* PDF boleh tampil langsung di penampil; jenis lain dipaksa unduh supaya
 * tidak pernah dirender sebagai HTML (VULN-13).
 */
export async function loadContentTarget({ id, viewer }) {
  const book = await loadBookRow(id, 'content_url, content_name, content_extension, is_locked');
  if (!book?.content_url) {
    throw createServiceError('Konten buku tidak ditemukan', { statusCode: 404 });
  }
  assertCanRead(book, viewer);

  const mime = safeContentMime(book);
  return {
    target: await resolveReadUrl(book.content_url),
    mime,
    name: book.content_name || 'book.pdf',
    disposition: mime === 'application/pdf' ? 'inline' : 'attachment',
  };
}

export async function updateBook({
  id,
  title,
  pages,
  isLocked,
  contentPath,
  contentName,
  thumbnailBuffer,
}) {
  if (!title || !String(title).trim()) {
    throw createServiceError('Judul buku wajib diisi', { statusCode: 400 });
  }

  const updatePayload = {
    title: String(title).trim(),
    pages: Number(pages) || 1,
    is_locked: parseBooleanFlag(isLocked),
    updated_at: new Date().toISOString(),
  };

  if (thumbnailBuffer) {
    const thumbnailMimeDetected = requireThumbnailMime(thumbnailBuffer);
    const result = await toWebp(thumbnailBuffer, {
      width: 600,
      quality: 80,
      fallbackMime: thumbnailMimeDetected,
    });
    updatePayload.cover_url = toDataUrl(result.buffer, result.mime);
  }

  let previousContentUrl = null;
  if (contentPath) {
    const storedFields = await storedContentFields(contentPath, contentName);
    const current = await loadBookRow(id, 'content_url');
    previousContentUrl = current?.content_url || null;
    Object.assign(updatePayload, storedFields);
  } else {
    /* Berkas tidak diganti. Untuk PDF, jumlah halaman adalah milik berkas —
     * bukan milik formulir. Tanpa penjaga ini, menyunting judul saja akan
     * menimpa angka hasil hitungan dengan angka ketikan manusia.
     */
    const existing = await loadBookRow(id, 'content_extension');
    if (String(existing?.content_extension || '').toLowerCase() === 'pdf') {
      delete updatePayload.pages;
    }
  }

  const { error } = await supabaseServer.from('books').update(updatePayload).eq('id', id);
  if (error) throw error;

  /* Objek lama dibuang setelah barisnya pasti menunjuk yang baru, supaya
   * kegagalan di tengah jalan tidak meninggalkan buku tanpa naskah.
   */
  if (previousContentUrl && previousContentUrl !== updatePayload.content_url) {
    await removeContent(previousContentUrl);
  }
}

export async function deleteBook(id) {
  const current = await loadBookRow(id, 'content_url');

  const { data, error } = await supabaseServer.from('books').delete().eq('id', id).select('id');
  if (error) throw error;
  if (!data?.length) throw createServiceError('Buku tidak ditemukan', { statusCode: 404 });

  await removeContent(current?.content_url);
}
