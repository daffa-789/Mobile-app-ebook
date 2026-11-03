/**
 * Modul standardisasi galat (error) service layer.
 *
 * Service layer tidak boleh menyentuh objek respons Express `res`, sehingga kegagalan
 * yang merupakan bagian dari aturan bisnis (input tidak valid, hak akses kurang, data tidak ada)
 * dilempar sebagai objek Error yang membawa properti `statusCode`.
 *
 * Fungsi `fail()` di `server/lib/http.js` akan menerjemahkannya secara otomatis
 * menjadi respons JSON standar `{ success: false, message }`.
 *
 * @module server/lib/errors
 */

/**
 * Membuat galat bisnis terstruktur dengan usulan status HTTP dan kode error.
 *
 * @param {string} message - Pesan galat deskriptif
 * @param {object} [options] - Opsi konfigurasi galat
 * @param {number} [options.statusCode=500] - Status kode HTTP (mis. 400, 401, 403, 404, 409, 500)
 * @param {string|null} [options.code=null] - Kode unik galat mesin (mis. 'NOT_FOUND', 'UNAUTHORIZED')
 * @param {any} [options.extra=null] - Data kontekstual tambahan untuk keperluan logging/debugging
 * @returns {Error & { statusCode: number, code?: string, extra?: any }} Objek error yang telah diperkaya
 *
 * @example
 * throw createServiceError('Buku tidak ditemukan', { statusCode: 404, code: 'BOOK_NOT_FOUND' });
 */
export function createServiceError(message, { statusCode = 500, code = null, extra = null } = {}) {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (code) error.code = code;
  if (extra) error.extra = extra;
  return error;
}
