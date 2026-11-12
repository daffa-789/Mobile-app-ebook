/**
 * @file src/lib/plans.js
 * @description Sumber kebenaran paket langganan & biaya admin pembayaran QRIS.
 * Semua nominal paket dan biaya admin harus lewat modul ini agar tidak tersebar
 * sebagai hardcode di layar (Pro, konfirmasi, struk, riwayat).
 */

export { DEFAULT_PLAN } from '@shared/plans.js';

/** Biaya admin per transaksi pembayaran QRIS (Rp). */
export const QRIS_ADMIN_FEE = 3000;

/** Biaya admin aktif. */
export const getAdminFee = () => QRIS_ADMIN_FEE;
