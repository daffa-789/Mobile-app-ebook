/**
 * Modul validasi schema dan parsing nilai masukan HTTP server.
 * Menggunakan Zod untuk schema runtime validasi request payload serta
 * menyediakan helper sanitasi/coercion tipe data.
 *
 * @module server/lib/validate
 */

import { z } from 'zod';

import { isValidPhone } from '../whatsapp.js';

const booleanFlagSchema = z.preprocess((val) => {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val === 1;
  if (typeof val === 'string') {
    const normalized = val.trim().toLowerCase();
    return (
      normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on'
    );
  }
  return false;
}, z.boolean());

/** Schema validasi untuk kredensial masuk pengguna. */
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Alamat email wajib diisi' })
    .trim()
    .email('Format email tidak valid'),
  password: z
    .string({ required_error: 'Password wajib diisi' })
    .min(8, 'Password minimal 8 karakter'),
});

/** Schema validasi untuk pendaftaran akun pengguna baru. */
export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi'),
  email: z.string().trim().email('Format email tidak valid'),
  phone: z
    .string({ required_error: 'Nomor WhatsApp wajib diisi' })
    .trim()
    .refine(
      isValidPhone,
      'Nomor WhatsApp tidak valid (contoh: 081234567890 atau format internasional)',
    ),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  deliveryMethod: z.enum(['whatsapp', 'email']).optional().default('email'),
});

/** Schema validasi untuk penambahan / pembaruan data buku perpustakaan. */
export const bookInputSchema = z.object({
  title: z.string().trim().min(1, 'Judul buku wajib diisi'),
  subtitle: z.string().optional().default(''),
  author: z.string().trim().min(1, 'Penulis wajib diisi'),
  category: z.string().trim().min(1, 'Kategori wajib diisi'),
  pages: z.coerce.number().int().positive().default(100),
  is_locked: booleanFlagSchema.default(false),
  cover_url: z.string().optional().default(''),
  description: z.string().optional().default(''),
});

/**
 * Parsing nilai fleksibel (boolean, string 'true'/'1', number 1) menjadi boolean murni.
 *
 * @param {any} value - Nilai masukan
 * @returns {boolean} Hasil konversi boolean
 */
export function parseBooleanFlag(value) {
  const result = booleanFlagSchema.safeParse(value);
  return result.success ? result.data : false;
}

/**
 * Konversi nilai ke angka positif; null bila bukan angka atau <= 0.
 *
 * @param {any} value - Nilai masukan
 * @returns {number|null} Angka positif atau null
 */
export function toPositiveNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Konversi nilai ke integer dalam rentang batas [min, max] dengan fallback aman.
 *
 * @param {any} value - Nilai masukan
 * @param {object} [options] - Opsi rentang batas
 * @param {number} [options.min=1] - Nilai minimum
 * @param {number} [options.max=100] - Nilai maksimum
 * @param {number} [options.fallback=20] - Fallback jika tidak valid
 * @returns {number} Integer dalam batas rentang
 */
export function toBoundedInt(value, { min = 1, max = 100, fallback = 20 } = {}) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

/**
 * Periksa apakah nilai string cocok dengan salah satu entri allowlist.
 *
 * @param {any} value - Nilai string
 * @param {string[]} allowed - Daftar string yang diizinkan
 * @returns {boolean} True jika cocok
 */
export function isOneOf(value, allowed) {
  return typeof value === 'string' && allowed.includes(value);
}

/**
 * Konversi dan validasi string tanggal ISO YYYY-MM-DD yang sah secara kalender.
 *
 * @param {any} value - String tanggal
 * @returns {string|null} String YYYY-MM-DD valid atau null
 */
export function toDateYmd(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const parsed = new Date(`${trimmed}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  if (parsed.toISOString().slice(0, 10) !== trimmed) return null;
  return trimmed;
}

/**
 * Potong panjang teks dengan batas maksimum karakter tertentu.
 *
 * @param {any} value - Teks masukan
 * @param {number} max - Panjang maksimal karakter
 * @returns {string} String terpangkas
 */
export function clippedText(value, max) {
  return String(value ?? '')
    .trim()
    .slice(0, max);
}

/**
 * Konversi nilai ke integer dalam rentang dengan fallback eksplisit.
 *
 * @param {any} value - Nilai masukan
 * @param {object} options - Opsi batas
 * @param {number} options.min - Nilai minimum
 * @param {number} options.max - Nilai maksimum
 * @param {number} options.fallback - Nilai fallback jika parsing gagal
 * @returns {number} Integer dalam batas
 */
export function toRangedInt(value, { min, max, fallback }) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}
