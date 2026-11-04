/* Kunci Midtrans membawa lingkungannya sendiri di prefix: `SB-Mid-…` berarti
 * sandbox, `Mid-…` berarti produksi. Pasangan flag + kunci yang keliru tidak
 * pernah menghasilkan galat yang jelas di sisi kita — Midtrans menjawab 401 di
 * tengah alur bayar, setelah pengguna sudah menekan Bayar. Karena itu
 * kecocokannya diperiksa di satu tempat dan dipakai ulang oleh server,
 * health-check, dan klien pembayaran.
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

/** 'sandbox' | 'production' | null bila kunci kosong. */
export const keyEnvironment = (key) => {
  const value = (key || '').trim();
  if (!value) return null;
  return value.startsWith(SANDBOX_KEY_PREFIX) ? 'sandbox' : 'production';
};

/**
 * Masalah yang MEMBLOKIR pembayaran: kunci server menentukan apakah panggilan
 * API diterima atau ditolak 401, jadi hanya prefixnyalah yang boleh membuat
 * konfigurasi dinyatakan salah. Kunci client tidak ikut menyandera alur ini —
 * lihat `clientKeyNotice`.
 */
export const environmentMismatch = ({ isProduction, serverKey }) => {
  const serverEnv = keyEnvironment(serverKey);
  if (!serverEnv) return null;

  const wanted = isProduction ? 'production' : 'sandbox';
  if (serverEnv !== wanted) {
    return `MIDTRANS_IS_PRODUCTION=${isProduction ? 'true' : 'false'} padahal MIDTRANS_SERVER_KEY berasal dari lingkungan ${serverEnv}`;
  }

  return null;
};

/**
 * Catatan (bukan galat) bila kunci client berasal dari lingkungan yang berbeda
 * dari kunci server. Aplikasi ini memakai Core API QRIS, yang tidak memakai
 * client key untuk men-charge, jadi pasangan yang berbeda tidak menggagalkan
 * pembayaran — tetapi tetap perlu terlihat, karena dashboard kadang
 * menampilkan client key tanpa prefiks aslinya.
 */
export const clientKeyNotice = ({ serverKey, clientKey }) => {
  const serverEnv = keyEnvironment(serverKey);
  const clientEnv = keyEnvironment(clientKey);
  if (!serverEnv || !clientEnv || serverEnv === clientEnv) return null;
  return `MIDTRANS_CLIENT_KEY terlihat sebagai ${clientEnv} sementara MIDTRANS_SERVER_KEY ${serverEnv} — tidak memblokir QRIS, tetapi periksa ulang nilai yang disalin`;
};

/** Perbaikan yang dimaksud, tanpa pernah menyadur nilai kunci apa pun. */
export const mismatchRemediation = (isProduction) =>
  isProduction
    ? 'isi MIDTRANS_SERVER_KEY dan MIDTRANS_CLIENT_KEY dengan kunci produksi (Mid-server-… / Mid-client-…) dari akun yang sudah terverifikasi, atau kembalikan MIDTRANS_IS_PRODUCTION ke false untuk memakai sandbox'
    : 'ambil kunci sandbox (SB-Mid-server-… / SB-Mid-client-…) dari dashboard.sandbox.midtrans.com, atau set MIDTRANS_IS_PRODUCTION=true bila memang bermaksud memakai akun produksi';
