import dayjs from 'dayjs';
import { DEFAULT_PLAN } from './plans.js';

/**
 * @file src/lib/receiptFields.js
 * @description Penurunan kolom kwitansi — satu sumber kebenaran bagi layar yang
 * menyiapkan datanya (sukses pembayaran & riwayat langganan) dan berkas PDF
 * (`lib/receiptPdf.js`).
 *
 * Angka yang dilihat pengguna harus sama dengan yang tercetak di arsip resminya.
 * Selama penurunan ini tersalin di beberapa berkas, salah satunya bisa berubah
 * diam-diam (mis. biaya admin default) dan kwitansi layar tidak lagi cocok
 * dengan kwitansi PDF.
 */

/**
 * @param {object} details - Rincian pembayaran dari slice pembayaran
 * @param {object} user - Data pengguna pemakai kwitansi
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
