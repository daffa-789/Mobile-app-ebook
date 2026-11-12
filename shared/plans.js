import { formatRupiah } from './formatUtils.js';

/** Paket default reader dan admin; nilai harga disimpan satu kali. */
export const DEFAULT_PLAN = {
  id: 'monthly',
  title: 'Paket Bulanan',
  price: 25000,
  formattedPrice: formatRupiah(25000),
  period: '/bulan',
};
