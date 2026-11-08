/**
 * @file src/lib/plans.js
 * @description Sumber kebenaran paket langganan & biaya admin pembayaran QRIS.
 * Semua nominal paket dan biaya admin harus lewat modul ini agar tidak tersebar
 * sebagai hardcode di layar (Pro, konfirmasi, struk, riwayat).
 */

import { formatRupiah } from '@lib/formatUtils';

/** Paket default yang dipilih saat belum ada pemilihan paket. */
export const DEFAULT_PLAN = {
  id: 'monthly',
  title: 'Paket Bulanan',
  price: 25000,
  formattedPrice: formatRupiah(25000),
  period: '/bulan',
};
