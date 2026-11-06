/**
 * @file utils.js
 * @description Kumpulan fungsi utilitas umum untuk aplikasi Wahidiyah Book.
 * Menggabungkan clsx dan tailwind-merge untuk resolusi kelas CSS Tailwind dinamis.
 */

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Menggabungkan nama-nama kelas CSS Tailwind dengan resolusi konflik otomatis.
 * Sangat berguna untuk komponen reusable, varian state, dan class kondisional.
 *
 * @param {...any} inputs - Daftar string, array, atau objek kondisi kelas CSS
 * @returns {string} String kelas CSS yang telah di-merge secara rapi
 *
 * @example
 * cn('bg-brand-700 text-cream-50', isSuccess && 'bg-gold-600', className)
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
