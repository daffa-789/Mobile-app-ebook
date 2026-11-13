/**
 * @file src/lib/plans.js
 * @description Sumber kebenaran paket langganan & biaya admin pembayaran QRIS.
 * Semua nominal paket dan biaya admin harus lewat modul ini agar tidak tersebar
 * sebagai hardcode di layar (Pro, konfirmasi, struk, riwayat).
 */

// Impor relatif (bukan alias @shared) supaya barrel ini tetap bisa dimuat oleh
// Node ESM langsung, misalnya saat tes mengimpor src/lib/receiptFields.js.
// Alias Vite hanya tersedia saat build; ../../shared/ setara dan stabil.
export { DEFAULT_PLAN } from '../../shared/plans.js';

/** Biaya admin per transaksi pembayaran QRIS (Rp). */
export const QRIS_ADMIN_FEE = 3000;

/** Biaya admin aktif. */
export const getAdminFee = () => QRIS_ADMIN_FEE;
