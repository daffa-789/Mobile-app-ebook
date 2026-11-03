import crypto from 'crypto';
import midtransClient from 'midtrans-client';
import {
  MIDTRANS_CLIENT_KEY,
  MIDTRANS_IS_PRODUCTION,
  MIDTRANS_QRIS_ACQUIRER,
  MIDTRANS_QRIS_EXPIRY_MINUTES,
  MIDTRANS_SERVER_KEY,
} from '../config.js';

const DEFAULT_QRIS_EXPIRY_MINUTES = 15;

export const isMidtransConfigured = Boolean(MIDTRANS_SERVER_KEY && MIDTRANS_CLIENT_KEY);

let coreApi = null;

function getCoreApi() {
  if (!isMidtransConfigured) {
    const error = new Error(
      'Midtrans belum dikonfigurasi. Isi MIDTRANS_SERVER_KEY dan MIDTRANS_CLIENT_KEY di .env ' +
        '(kunci sandbox: SB-Mid-server-… / SB-Mid-client-… dari dashboard.sandbox.midtrans.com).',
    );
    error.code = 'MIDTRANS_NOT_CONFIGURED';
    throw error;
  }

  if (!coreApi) {
    coreApi = new midtransClient.CoreApi({
      isProduction: MIDTRANS_IS_PRODUCTION,
      serverKey: MIDTRANS_SERVER_KEY,
      clientKey: MIDTRANS_CLIENT_KEY,
    });
  }

  return coreApi;
}

const pad = (value) => String(value).padStart(2, '0');

const jakartaOrderTime = () => {
  const shifted = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return (
    `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())} ` +
    `${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}:${pad(shifted.getUTCSeconds())} +0700`
  );
};

/**
 * Midtrans mengembalikan QRIS dalam dua bentuk (hasil probe sandbox 6 Okt 2026):
 *   1. `qr_string`  — payload EMVCo mentah, pilihan utama karena paling andal:
 *                     tidak butuh request tambahan dan tidak bergantung pada
 *                     URL gambar yang bisa berubah/diblokir.
 *   2. `actions[]`  — URL gambar PNG (generate-qr-code-v2 diutamakan). Dipakai
 *                     sebagai cadangan bila `qr_string` tidak ada.
 *
 * Catatan: Midtrans membungkus payload dalam struktur berbeda antara SDK
 * (objek langsung) dan REST mentah (kadang `{ data: {...} }`), jadi kita
 * cek dua tingkat.
 */
const unwrapChargePayload = (charge) => {
  if (!charge || typeof charge !== 'object') return {};
  if (charge.qr_string || Array.isArray(charge.actions)) return charge;
  return charge.data && typeof charge.data === 'object' ? charge.data : charge;
};

export const extractQrString = (charge) => {
  const payload = unwrapChargePayload(charge);
  const raw = payload.qr_string;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : null;
};

const pickQrAction = (actions) => {
  const list = Array.isArray(actions) ? actions : [];
  const preferred = list.find((item) => item?.name === 'generate-qr-code-v2' && item?.url);
  if (preferred) return preferred;
  return list.find((item) => item?.name === 'generate-qr-code' && item?.url) || null;
};

export const extractQrAction = (charge) => pickQrAction(unwrapChargePayload(charge)?.actions);

export async function createQrisCharge({
  orderId,
  grossAmount,
  itemDetails = [],
  customerDetails = {},
}) {
  const api = getCoreApi();

  const parameter = {
    payment_type: 'qris',
    transaction_details: {
      order_id: orderId,
      gross_amount: Math.round(Number(grossAmount)),
    },
    item_details: itemDetails,
    customer_details: customerDetails,
    qris: {
      acquirer: MIDTRANS_QRIS_ACQUIRER || 'gopay',
    },
  };

  if (MIDTRANS_QRIS_EXPIRY_MINUTES !== DEFAULT_QRIS_EXPIRY_MINUTES) {
    parameter.custom_expiry = {
      order_time: jakartaOrderTime(),
      expiry_duration: MIDTRANS_QRIS_EXPIRY_MINUTES,
      unit: 'minute',
    };
  }

  return api.charge(parameter);
}

export async function getTransactionStatus(orderId) {
  const api = getCoreApi();
  return api.transaction.status(orderId);
}

/** Mematikan kode QR di sisi Midtrans (QRIS: endpoint expire lebih tepat). */
export async function expireQrisTransaction(orderId) {
  const api = getCoreApi();
  return api.transaction.expire(orderId);
}

export async function cancelQrisTransaction(orderId) {
  const api = getCoreApi();
  return api.transaction.cancel(orderId);
}

/**
 * Apakah Midtrans sudah mengakui order ini tidak bisa dibayar lagi?
 *
 * Kode Midtrans tidak mengikuti konvensi HTTP di sini (terukur 22 Okt 2026 pada
 * order QRIS sandbox):
 *  - 2xx = sukses generik.
 *  - 407 = "Success, transaction is expired" → expire QRIS BERHASIL. Kode 4xx
 *          ini bukan kegagalan dan wajib diakui; dulu tidak, sehingga
 *          pembatalan yang sebenarnya sukses disangka ditolak Midtrans.
 *  - 404 "Transaction doesn't exist" = aman, memang tidak ada yang menunggu
 *          pembayaran.
 *  - 412 "Transaction status cannot be updated" (mis. /cancel untuk QRIS, atau
 *          order yang sudah lunas) = TIDAK diakui.
 *
 * Kalau tidak diakui, baris lokal tidak boleh dimatikan — uang pengguna bisa
 * masuk ke order yang sudah kita matikan dan tidak akan pernah diaktifkan lagi.
 */
export function isVoidAcknowledged(payload = {}) {
  const code = String(payload?.status_code ?? '').trim();
  const pesan = String(payload?.status_message ?? '');
  if (code.startsWith('2')) return true;
  if (code === '407') return /success|expired/i.test(pesan) && !/not expired/i.test(pesan);
  if (code === '404') return /does ?n'?t exist|not found|tidak ditemukan/i.test(pesan);
  return false;
}

export function verifySignatureKey(payload = {}) {
  if (!MIDTRANS_SERVER_KEY) {
    return { ok: false, reason: 'MIDTRANS_SERVER_KEY belum diisi.' };
  }

  const raw = `${payload.order_id ?? ''}${payload.status_code ?? ''}${payload.gross_amount ?? ''}${MIDTRANS_SERVER_KEY}`;
  const expected = crypto.createHash('sha512').update(raw).digest('hex');
  const provided = Buffer.from(String(payload.signature_key ?? ''));
  const expectedBuffer = Buffer.from(expected);

  if (provided.length !== expectedBuffer.length) {
    return { ok: false, reason: 'Signature key tidak valid.' };
  }

  return crypto.timingSafeEqual(provided, expectedBuffer)
    ? { ok: true }
    : { ok: false, reason: 'Signature key tidak valid.' };
}

/**
 * Memeriksa apakah status transaksi Midtrans menyatakan pembayaran sudah lunas / sukses.
 * Khusus QRIS dan e-wallet (GoPay/ShopeePay), fraud_status tidak dikembalikan oleh Midtrans
 * sehingga pengecekan fraud_status bersifat fleksibel (kosong atau 'accept').
 * Untuk kartu kredit, status 'capture' memerlukan fraud_status 'accept'.
 */
export const isTransactionSettled = (transactionStatus, fraudStatus = '') => {
  const status = String(transactionStatus || '').toLowerCase();
  const fraud = String(fraudStatus || '').toLowerCase();
  if (status === 'settlement') {
    return !fraud || fraud === 'accept';
  }
  if (status === 'capture') {
    return fraud === 'accept';
  }
  return false;
};

const QR_IMAGE_TIMEOUT_MS = 10_000;

const isAllowedQrUrl = (rawUrl) => {
  try {
    const parsed = new URL(String(rawUrl));
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    return host === 'midtrans.com' || host.endsWith('.midtrans.com');
  } catch {
    return false;
  }
};

export async function fetchQrImage(qrUrl) {
  if (!isAllowedQrUrl(qrUrl)) {
    const error = new Error('URL gambar QR tidak diizinkan.');
    error.code = 'QR_URL_NOT_ALLOWED';
    throw error;
  }

  const auth = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString('base64');
  const response = await fetch(qrUrl, {
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: 'image/png',
    },
    redirect: 'manual',
    signal: AbortSignal.timeout(QR_IMAGE_TIMEOUT_MS),
  });

  if (response.status >= 300 && response.status < 400) {
    const error = new Error('Midtrans mengembalikan pengalihan saat mengambil gambar QR.');
    error.status = response.status;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(`Gagal mengambil gambar QR dari Midtrans (HTTP ${response.status}).`);
    error.status = response.status;
    throw error;
  }

  return Buffer.from(await response.arrayBuffer());
}
