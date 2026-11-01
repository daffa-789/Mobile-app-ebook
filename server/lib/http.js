import { CONTENT_MIME_BY_EXTENSION } from './constants.js';

export const DB_DOWN_MESSAGE =
  'Layanan database Cloud sedang sibuk atau tidak terjangkau. Silakan periksa koneksi internet Anda.';

export const isDbDown = (error) =>
  error?.code === 'ECONNREFUSED' || Boolean(error?.message?.includes('ECONNREFUSED'));

const includeErrorDetail = process.env.NODE_ENV === 'development';

export const fail = (res, error) => {
  /* Service layer melempar Error ber-`statusCode` untuk kegagalan yang memang
   * bagian aturan bisnis (lihat lib/errors.js). Terjemahkan apa adanya supaya
   * route tidak perlu menulis cabang status satu per satu.
   */
  if (error?.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      ...(error.extra || {}),
    });
  }
  if (isDbDown(error)) {
    return res.status(503).json({
      success: false,
      message: DB_DOWN_MESSAGE,
      error: includeErrorDetail ? error.message : undefined,
      isDatabaseError: true,
    });
  }
  return res.status(500).json({
    success: false,
    error: includeErrorDetail ? error.message : undefined,
  });
};

export const internalErrorDetail = (error, exposeDetail = includeErrorDetail) =>
  exposeDetail ? error?.message : undefined;

/**
 * Helper jawaban galat 4xx — memampatkan pola yang sebelumnya ditulis tangan
 * di 81 tempat di seluruh `server/routes/`:
 *
 *   return res.status(400).json({ success: false, message: 'Judul wajib diisi' });
 *   // menjadi
 *   return badRequest(res, 'Judul wajib diisi');
 *
 * Semuanya mengembalikan `res` supaya tetap bisa dipakai dengan `return`,
 * jadi alur kendali pemanggil tidak berubah sama sekali.
 *
 * `extra` disediakan untuk kasus yang butuh bidang tambahan (mis. `code`,
 * `isDatabaseError`) — tanpa itu, pemanggil kembali menulis objek manual
 * dan helper-nya jadi setengah berguna.
 */
const reject = (status) => (res, message, extra) =>
  res.status(status).json({ success: false, message, ...extra });

export const badRequest = reject(400);
export const unauthorized = reject(401);
export const forbidden = reject(403);
export const notFound = reject(404);
export const conflict = reject(409);

export const authFailureMessage = (error, exposeDetail = includeErrorDetail) =>
  exposeDetail
    ? error?.message || 'Terjadi kesalahan pada server'
    : 'Terjadi kesalahan pada server';

/**
 * Bungkus handler async route Express untuk menangkap error dan mengalihkannya ke fail(res, error).
 * @param {Function} handler - Fungsi handler route Express (req, res, next)
 * @returns {Function} Express middleware wrapper
 */
export const wrap = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    fail(res, error);
  }
};

/**
 * Tentukan MIME type konten buku yang aman dari ekstensi berkas.
 * @param {Object} book - Objek buku dengan properti content_extension
 * @returns {string} MIME type kanonis yang aman
 */
export const safeContentMime = (book) =>
  CONTENT_MIME_BY_EXTENSION[
    String(book?.content_extension || '')
      .replace('.', '')
      .toLowerCase()
  ] || 'application/octet-stream';

const DATA_URL_PATTERN = /^data:([^;]+);base64,(.+)$/;

/**
 * Sajikan data URL base64 sebagai respons binary buffer dengan header keamanan.
 * @param {import('express').Response} res - Objek respons Express
 * @param {string} url - String data URL
 * @param {Object} [options] - Opsi content type dan cache control
 * @returns {boolean} True jika berhasil disajikan, false jika bukan data URL
 */
export const sendDataUrl = (res, url, { contentType, cacheControl } = {}) => {
  if (!url || !url.startsWith('data:')) return false;
  const matches = url.match(DATA_URL_PATTERN);
  if (!matches) return false;

  if (cacheControl) res.setHeader('Cache-Control', cacheControl);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  /* Label MIME di dalam data URL berasal dari klien dan tidak pernah dipercaya
   * (VULN-13). Pemanggil wajib menyebut jenis yang benar; tanpa itu berkas
   * dikirim sebagai octet-stream supaya tidak dirender sebagai HTML.
   */
  res.type(contentType || 'application/octet-stream');
  res.send(Buffer.from(matches[2], 'base64'));
  return true;
};
