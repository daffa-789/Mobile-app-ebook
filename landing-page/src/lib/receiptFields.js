import dayjs from 'dayjs';
import { DEFAULT_PLAN } from './plans.js';

/**
 * Penurunan kolom kwitansi — satu sumber kebenaran bagi layar pembayaran dan berkas PDF.
 *
 * @param {object} details - Rincian pembayaran
 * @param {object} user - Data pengguna
 * @returns {{ refNo: string, dateStr: string, planName: string, amount: number, adminFee: number, totalPaid: number, userName: string, userEmail: string, userPhone: string }}
 */
export const resolveReceiptFields = (details, user) => {
  const amount = Number(details?.amount || DEFAULT_PLAN.price);
  const adminFee = Number(details?.adminFee || 0);

  return {
    refNo: details?.refNo || details?.ref || `WB-${Date.now().toString(36).toUpperCase()}`,
    dateStr: details?.dateStr || details?.createdAt || dayjs().format('DD/MM/YYYY, HH:mm'),
    planName: details?.planName || DEFAULT_PLAN.title,
    amount,
    adminFee,
    totalPaid: Number(details?.totalPaid || amount + adminFee),
    userName: user?.name || user?.fullName || 'Pengguna Wahidiyah',
    userEmail: user?.email || '-',
    userPhone: user?.phone || details?.phone || '',
  };
};
