import { apiRequest, buildApiUrl, API_BASE_URL } from './client.js';

/**
 * Buat transaksi tagihan baru QRIS Midtrans (atau reuse tagihan aktif jika ada).
 * Catatan arsitektur: nominal harga ditentukan murni oleh server (tidak dikirim klien).
 */
export async function createPaymentCharge({ planId = 'monthly', phone } = {}) {
  const body = { planId };
  if (phone) body.phone = String(phone).trim();

  return apiRequest('/api/payments/qris/charge', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Periksa status transaksi pembayaran QRIS terkini di server & Midtrans.
 */
export async function checkPaymentStatus(orderId) {
  if (!orderId) throw new Error('orderId wajib disertakan untuk memeriksa status.');
  return apiRequest(`/api/payments/qris/${encodeURIComponent(orderId)}/status`, {
    method: 'GET',
  });
}

/**
 * Batalkan transaksi QRIS pending milik pengguna agar dapat membuat kode baru.
 */
export async function cancelPayment(orderId) {
  if (!orderId) throw new Error('orderId wajib disertakan untuk membatalkan tagihan.');
  return apiRequest(`/api/payments/qris/${encodeURIComponent(orderId)}/cancel`, {
    method: 'POST',
  });
}

/**
 * Rekonsiliasi transaksi pending milik pengguna.
 */
export async function reconcilePayment() {
  return apiRequest('/api/payments/qris/reconcile', {
    method: 'POST',
  });
}

/**
 * URL endpoint gambar QR code PNG yang dilindungi auth server.
 */
export function getQrImageUrl(orderId) {
  if (!orderId) return null;
  return buildApiUrl(API_BASE_URL, `/payments/qris/${encodeURIComponent(orderId)}/qr.png`);
}
