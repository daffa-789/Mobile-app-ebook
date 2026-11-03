import crypto from 'crypto';
import { supabaseServer } from '../db.js';
import {
  generateId,
  hasActivePro,
  loadMembershipUser,
  settleExpiredMembership,
  toPublicUser,
  TRANSACTION_PENDING_STATUS,
} from '../auth.js';
import { logger } from '../logger.js';
import { QRIS_ADMIN_FEE, SUBSCRIPTION_PLANS } from './constants.js';
import { toPositiveNumber } from './validate.js';

export const ACTIVE_SUBSCRIPTION_STATUS = 'Aktif';

export const ENDED_SUBSCRIPTION_STATUS = 'Berakhir';

const DEFAULT_PLAN_DAYS = 30;

const planDaysFromPeriod = (period) => {
  if (typeof period === 'number' && Number.isFinite(period) && period > 0) {
    return Math.floor(period);
  }
  const text = String(period || '').toLowerCase();
  const explicit = text.match(/(\d+)\s*(hari|day)/);
  if (explicit) return Number(explicit[1]);
  if (/tahun|year|annual/.test(text)) return 365;
  const months = text.match(/(\d+)\s*(bulan|month)/);
  if (months) return Number(months[1]) * DEFAULT_PLAN_DAYS;
  if (/bulan|month/.test(text)) return DEFAULT_PLAN_DAYS;
  return DEFAULT_PLAN_DAYS;
};

const expiresAtFromNow = (days = DEFAULT_PLAN_DAYS, from = new Date()) =>
  new Date(from.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

const generateRefNo = () => `0000${crypto.randomInt(10000000, 100000000)}`;

const throwIfDatabaseError = ({ error }, operation) => {
  if (!error) return;
  const wrappedError = new Error(`${operation} gagal: ${error.message || 'Galat basis data.'}`, {
    cause: error,
  });
  if (error.code) wrappedError.code = error.code;
  throw wrappedError;
};

export const toRefCode = (refNo) => 'REF-' + String(refNo).slice(-8);

export async function insertTransaction({
  txId,
  userId,
  planName,
  amount,
  adminFee,
  totalPaid,
  method,
  status = 'success',
}) {
  const refNo = generateRefNo();
  const result = await supabaseServer.from('transactions').insert({
    id: txId,
    ref_no: refNo,
    user_id: userId,
    plan_name: planName || 'Pro',
    amount: Number(amount) || 0,
    admin_fee: Number(adminFee) || 0,
    total_paid: Number(totalPaid) || 0,
    payment_method: method,
    status,
    created_at: new Date().toISOString(),
  });
  throwIfDatabaseError(result, 'Penyimpanan transaksi');
  return refNo;
}

export async function activatePaidMembership({
  userId,
  planName,
  price,
  refCode,
  periodFallback = null,
}) {
  const subId = generateId('sub');
  const days = planDaysFromPeriod(periodFallback);
  const expiresAt = expiresAtFromNow(days);

  const userUpdate = await supabaseServer
    .from('users')
    .update({
      is_pro: true,
      subscription_expires_at: expiresAt,
    })
    .eq('id', userId);
  throwIfDatabaseError(userUpdate, 'Pembaruan status Pro pengguna');

  const subscriptionInsert = await supabaseServer.from('subscriptions').insert({
    id: subId,
    user_id: userId,
    plan_name: planName || 'Pro',
    price: Number(price) || 0,
    status: ACTIVE_SUBSCRIPTION_STATUS,
    expires_at: expiresAt,
    ref_code: refCode,
    created_at: new Date().toISOString(),
  });
  throwIfDatabaseError(subscriptionInsert, 'Penyimpanan langganan');

  return { subscriptionId: subId, expiresAt, days };
}

export async function restorePendingTransaction(transactionId) {
  try {
    const result = await supabaseServer
      .from('transactions')
      .update({ status: TRANSACTION_PENDING_STATUS, verified_at: null })
      .eq('id', transactionId)
      .eq('status', 'success');
    throwIfDatabaseError(result, 'Pemulihan status transaksi');
  } catch (error) {
    logger.error('MEMBERSHIP', 'Gagal memulihkan transaksi ke pending', {
      transactionId,
      pesan: error.message,
    });
    throw error;
  }
}

/** Alasan penolakan bila pengguna masih berstatus Pro; `null` bila ia boleh membayar. */
const activeSubscriptionConflict = (user) => {
  if (!hasActivePro(user)) return null;
  return {
    success: false,
    message: 'Langganan Pro Anda saat ini masih aktif. Anda sudah menikmati seluruh fitur Pro.',
  };
};

/**
 * Gerbang pembelian yang SAMA untuk semua jalur bayar — QRIS Midtrans
 * (`services/payment/order_service.js`) dan transfer manual
 * (`services/transactions_service.js`): sapu kedaluwarsa langganan lebih dulu,
 * muat baris pengguna terkini, lalu tolak bila Pro masih aktif.
 *
 * Kedua jalur dulu menulis tiga langkah ini masing-masing, jadi perubahan aturan
 * "kapan tidak perlu bayar lagi" harus disinkronkan di dua tempat.
 *
 * @param {string} userId - Akun yang akan membayar
 * @param {object} fallbackUser - Data pengguna cadangan dari sesi
 * @returns {Promise<{ membership: object, conflict: object|null }>} `conflict`
 *   sudah berpola hasil bisnis `outcome: 'already-pro'`, siap dikembalikan pemanggil.
 */
export const resolvePurchaseGate = async (userId, fallbackUser) => {
  await settleExpiredMembership(userId);
  const membership = (await loadMembershipUser(userId)) || fallbackUser;

  const clash = activeSubscriptionConflict(membership);
  if (!clash) return { membership, conflict: null };

  return {
    membership,
    conflict: { outcome: 'already-pro', message: clash.message, user: toPublicUser(membership) },
  };
};

/**
 * Penyapu harian kedaluwarsa langganan (VULN-12).
 *
 * Sebelum ini `settleExpiredMembership` hanya dipanggil di jalur request
 * pembayaran, sehingga baris `is_pro` pengguna yang tidak pernah bertransaksi
 * lagi tetap bernyawa selamanya. Sekali sehari cukup: tanggal langganan tidak
 * berubah dalam hitungan menit, dan jalannya tetap diulang saat boot supaya
 * baris yang tertunda selama server mati ikut dirapikan.
 */
const MEMBERSHIP_SWEEP_INTERVAL_MS = 24 * 60 * 60 * 1000;

export function startMembershipSweeper(intervalMs = MEMBERSHIP_SWEEP_INTERVAL_MS) {
  const run = async () => {
    const before = new Date();
    await settleExpiredMembership();
    logger.info('MEMBERSHIP', 'Penyapu kedaluwarsa langganan berjalan', {
      sejak: before.toISOString(),
    });
  };
  run().catch((error) =>
    logger.error('MEMBERSHIP', 'Penyapu kedaluwarsa gagal', { pesan: error?.message }),
  );
  const timer = setInterval(
    () =>
      run().catch((error) =>
        logger.error('MEMBERSHIP', 'Penyapu kedaluwarsa gagal', { pesan: error?.message }),
      ),
    intervalMs,
  );
  timer.unref?.();
  return timer;
}

/**
 * Pencocok paket pada katalog server. Sengaja KETAT: paket tak dikenal harus
 * ditolak, bukan jatuh ke paket default seperti findPlan (yang dipakai jalur
 * QRIS karena order id sudah dipilihkan aplikasi).
 */
const matchCatalogPlan = ({ planId, planName } = {}) => {
  const id = String(planId ?? '').trim();
  if (id) return SUBSCRIPTION_PLANS.find((plan) => plan.id === id) || null;
  const name = String(planName ?? '')
    .trim()
    .toLowerCase();
  if (!name) return null;
  return SUBSCRIPTION_PLANS.find((plan) => String(plan.name).trim().toLowerCase() === name) || null;
};

/**
 * Harga transfer manual — server pemegang kebenaran (VULN-06).
 *
 * Sebelumnya rute ini menerima `amount` dan `total_paid` dari body, sehingga
 * `amount: 1` cukup untuk membuat transaksi pending Rp 1 yang tampak sah di
 * panel admin. kini nominal, nama paket, dan biaya layanan dibaca dari
 * `SUBSCRIPTION_PLANS`; nominal kiriman klien hanya dipakai sebagai klaim yang
 * harus cocok, dan `admin_fee`/`total_paid` dari body tidak dibaca sama sekali.
 */
export const resolveManualTransferPricing = (body = {}) => {
  const plan = matchCatalogPlan({ planId: body.plan_id, planName: body.plan_name });
  if (!plan) {
    return {
      ok: false,
      message: 'Paket langganan tidak dikenali. Muat ulang halaman lalu pilih paket lagi.',
    };
  }

  const claimedRaw = body.amount;
  const hasClaim =
    claimedRaw !== undefined && claimedRaw !== null && String(claimedRaw).trim() !== '';
  if (hasClaim) {
    const claimed = toPositiveNumber(claimedRaw);
    if (claimed === null) {
      return { ok: false, message: 'Nominal pembayaran tidak valid.' };
    }
    if (claimed !== plan.price) {
      return {
        ok: false,
        conflict: true,
        message: `Harga ${plan.name} adalah Rp ${plan.price}. Muat ulang halaman untuk harga terbaru.`,
      };
    }
  }

  return {
    ok: true,
    plan,
    planName: plan.name,
    amount: plan.price,
    adminFee: QRIS_ADMIN_FEE,
    totalPaid: plan.price + QRIS_ADMIN_FEE,
  };
};
