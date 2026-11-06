import { formatRupiah } from './formatUtils.js';

/** Biaya admin per transaksi pembayaran QRIS (Rp). */
export const QRIS_ADMIN_FEE = 3000;

/** Katalog paket langganan. */
export const SUBSCRIPTION_PLANS = [
  { id: 'monthly', name: 'Paket Bulanan', price: 25000, period: '/bulan' },
];

/** ID paket default. */
export const DEFAULT_PLAN_ID = 'monthly';

/** Paket default yang dipilih saat belum ada pemilihan paket. */
export const DEFAULT_PLAN = {
  id: 'monthly',
  title: 'Paket Bulanan',
  price: 25000,
  formattedPrice: formatRupiah(25000),
  period: '/bulan',
};

/** Cari paket dari id, fallback ke paket default. */
export const findPlan = (planId) =>
  SUBSCRIPTION_PLANS.find((plan) => plan.id === String(planId || '').trim()) ||
  SUBSCRIPTION_PLANS[0];

/** Biaya admin aktif. */
export const getAdminFee = () => QRIS_ADMIN_FEE;
