/**
 * @file src/lib/plans.js
 * @description Sumber kebenaran paket langganan & biaya admin pembayaran QRIS.
 * Semua nominal paket dan biaya admin harus lewat modul ini agar tidak tersebar
 * sebagai hardcode di layar (Pro, konfirmasi, struk, riwayat).
 */

import { formatRupiah } from './formatUtils.js';

/** Biaya admin per transaksi pembayaran QRIS (Rp). */
export const QRIS_ADMIN_FEE = 3000;

/** Paket default yang dipilih saat belum ada pemilihan paket. */
export const DEFAULT_PLAN = {
  id: 'monthly',
  title: 'Paket Bulanan',
  price: 25000,
  formattedPrice: formatRupiah(25000),
  period: '/bulan',
};

/** Biaya admin aktif. */
export const getAdminFee = () => QRIS_ADMIN_FEE;
