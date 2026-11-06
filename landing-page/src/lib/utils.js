import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Menggabungkan nama-nama kelas CSS Tailwind dengan resolusi konflik otomatis.
 *
 * @param {...any} inputs - Daftar string, array, atau objek kondisi kelas CSS
 * @returns {string} String kelas CSS yang telah di-merge secara rapi
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
