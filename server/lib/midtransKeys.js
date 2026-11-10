/* Lingkungan kunci Midtrans TIDAK bisa disimpulkan hanya dari prefiks.
 *
 * `SB-Mid-…` memang pasti sandbox. Tetapi kunci tanpa prefiks itu **tidak
 * selalu produksi**: dashboard sandbox lama (dan akun yang dibuat sebelum
 * penomoran baru) menampilkan server key sebagai `Mid-server-…` biasa.
 * Bukti terukur 10 Nov 2026: `Mid-server-Ela…` berhasil membuat QRIS di
 * `api.sandbox.midtrans.com` (HTTP 201, `qr_string` ada) dan ditolak 401 di
 * `api.midtrans.com`. Guard lama menganggapnya produksi lalu memblokir charge
 * yang sebenarnya sah — persis galat "Gagal membuat transaksi di Midtrans."
 *
 * Karena itu hanya satu arah yang boleh memblokir: kunci berprefiks `SB-Mid-`
 * dipakai dengan `MIDTRANS_IS_PRODUCTION=true`. Selain itu lingkungan mengikuti
 * flag, dan Midtrans sendiri yang menjadi hakim terakhir (401 bila salah).
 *
 * Berkas ini sengaja murni (tidak membaca process.env) supaya bisa diimpor
 * skrip yang menjalankan dotenv-nya sendiri tanpa perlombaan urutan impor.
 * Nilai kunci TIDAK pernah ikut dikembalikan — hanya nama lingkungannya.
 */

export const SANDBOX_KEY_PREFIX = 'SB-Mid-';

/** Hanya 'true' (tanpa peka huruf/spasi) yang berarti lingkungan produksi. */
export const isProductionFlag = (value) =>
  String(value ?? 'false')
    .trim()
    .toLowerCase() === 'true';

/**
 * 'sandbox' bila prefiks `SB-Mid-` pasti; 'unknown' bila tanpa prefiks
 * (bisa sandbox lama maupun produksi); null bila kunci kosong.
 */
export const keyEnvironment = (key) => {
  const value = (key || '').trim();
  if (!value) return null;
  return value.startsWith(SANDBOX_KEY_PREFIX) ? 'sandbox' : 'unknown';
};

/**
 * Hanya ketidakcocokan yang PASTI salah yang dilaporkan: kunci `SB-Mid-…`
 * (sandbox) dipasang bersama `MIDTRANS_IS_PRODUCTION=true`. Kunci tanpa
 * prefiks sengaja dibiarkan — lihat penjelasan di atas.
 */
export const environmentMismatch = ({ isProduction, serverKey }) => {
  if (!isProduction) return null;
  if (keyEnvironment(serverKey) !== 'sandbox') return null;

  return 'MIDTRANS_IS_PRODUCTION=true padahal MIDTRANS_SERVER_KEY berprefiks SB-Mid- (kunci sandbox)';
};

/**
 * Catatan (bukan galat) bila kedua kunci punya prefiks yang pasti dan berbeda.
 * Kunci tanpa prefiks tidak menghasilkan catatan: dashboard sandbox memang
 * sering menampilkan client key tanpa `SB-`, dan QRIS Core API tidak memakai
 * client key untuk men-charge.
 */
export const clientKeyNotice = ({ serverKey, clientKey }) => {
  const serverEnv = keyEnvironment(serverKey);
  const clientEnv = keyEnvironment(clientKey);
  if (!serverEnv || !clientEnv) return null;
  if (serverEnv === 'unknown' || clientEnv === 'unknown') return null;
  if (serverEnv === clientEnv) return null;
  return `MIDTRANS_CLIENT_KEY terlihat sebagai ${clientEnv} sementara MIDTRANS_SERVER_KEY ${serverEnv} — tidak memblokir QRIS, tetapi periksa ulang nilai yang disalin`;
};

/** Perbaikan yang dimaksud, tanpa pernah menyadur nilai kunci apa pun. */
export const mismatchRemediation = (isProduction) =>
  isProduction
    ? 'set MIDTRANS_IS_PRODUCTION=false untuk memakai kunci sandbox tersebut, atau ganti dengan kunci produksi (Mid-server-…) dari akun yang sudah terverifikasi'
    : 'pastikan MIDTRANS_SERVER_KEY diambil dari dashboard sandbox; bila kunci tidak berprefiks SB-Mid- dan charge ditolak 401, ganti dengan kunci sandbox yang benar atau set MIDTRANS_IS_PRODUCTION=true bila memang memakai akun produksi';
