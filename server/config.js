import path from 'path';
import { fileURLToPath } from 'url';
import { isProductionFlag } from './lib/midtransKeys.js';

const here = path.dirname(fileURLToPath(import.meta.url));

const ROOT_DIR = path.resolve(here, '..');

export const PORT = process.env.PORT || 5000;

export const FRONTEND_PORT = Number(process.env.VITE_PORT || 3000);

export const USE_VITE_MIDDLEWARE = process.env.VITE_MIDDLEWARE === '1';

export const LISTEN_PORT = USE_VITE_MIDDLEWARE ? FRONTEND_PORT : Number(PORT);

export const ALLOWED_ORIGINS = (
  process.env.CORS_ORIGINS ||
  'http://localhost:3000,http://127.0.0.1:3000,http://localhost:4173,http://127.0.0.1:4173,http://localhost:5000,http://127.0.0.1:5000'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

/* Satu-satunya sumber tujuan redirect OAuth (VULN-04). Bila kosong, server
 * hanya menerima origin yang sudah ada di ALLOWED_ORIGINS — Host dari request
 * tidak pernah dipercaya. Wajib diisi di produksi.
 */
export const FRONTEND_ORIGIN = (process.env.FRONTEND_ORIGIN || '').trim();

export const SERVE_STATIC =
  String(process.env.SERVE_STATIC ?? 'true')
    .trim()
    .toLowerCase() !== 'false';

export const STATIC_DIR = path.resolve(ROOT_DIR, 'dist');
export const STATIC_INDEX_FILE = path.join(STATIC_DIR, 'index.html');

/* Polling status QRIS berjalan tiap 3 detik (≈20 permintaan/menit) sampai
 * transaksi lunas atau kedaluwarsa. Plafon ini sengaja berada di atas ritme
 * itu — pengguna sah tidak boleh terpotong di tengah pembayaran — tetapi
 * pemanggil yang membanjiri tetap dibatasi per akun.
 */
export const QRIS_STATUS_RATE_LIMIT = {
  windowMs: 5 * 60 * 1000,
  max: 150,
  message: {
    success: false,
    message: 'Terlalu banyak pengecekan status pembayaran. Tunggu beberapa saat.',
  },
};

/*
 * VULN-09 — Content Security Policy.
 *
 * index.html tidak lagi memuat skrip inline (dulu pra-cat tema malam), jadi
 * script-src cukup 'self'. Bila suatu hari skrip inline ditambahkan lagi,
 * daftarkan hash SHA-256 atas teks di antara <script> dan </script> persis
 * seperti byte yang dikirim server (LF; dihitung dari file ber-CRLF hasilnya
 * beda dan tetap ditolak). Selama CSP report-only hash yang keliru tidak
 * menimbulkan apa pun — ia baru kelihatan saat CSP_ENFORCE=1.
 */

export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'base-uri': ["'self'"],
  'object-src': ["'none'"],
  'frame-ancestors': ["'none'"],
  'form-action': ["'self'"],
  /* 'unsafe-inline' di style-src diperlukan untuk atribut style React dan
   * utilitas Tailwind; tidak ada jalan keluar selain menghapus keduanya.
   */
  'script-src': ["'self'"],
  /* Tanpa font kustom sepenuhnya (font bawaan OS), jadi
   * style/font cukup 'self' — origin Google Fonts tidak pernah diizinkan.
   */
  'style-src': ["'self'", "'unsafe-inline'"],
  'font-src': ["'self'"],
  'img-src': ["'self'", 'data:', 'blob:'],
  /* Supabase hanya dipakai jalur /auth/callback lama; Midtrans dipanggil
   * server, jadi peramban tidak perlu akses ke sana.
   */
  'connect-src': ["'self'", 'https://*.supabase.co'],
  'worker-src': ["'self'", 'blob:'],
  'manifest-src': ["'self'"],
};

/* Report-only secara default: policy yang terlalu ketat bisa mematangkan
 * aplikasi, dan halaman yang rusak sulit dilacak setelah ditegakkan. Nyalakan
 * CSP_ENFORCE=1 hanya setelah konsol peramban bersih.
 */
export const CSP_REPORT_ONLY = String(process.env.CSP_ENFORCE || '') !== '1';

/* Kosong = perilaku lama (1 hanya saat middleware Vite). Nilai produksi:
 * jumlah hop proxy di depan server, atau `true` bila proxy tunggal.
 */
export const TRUST_PROXY = (() => {
  const raw = String(process.env.TRUST_PROXY ?? '')
    .trim()
    .toLowerCase();
  if (!raw) return USE_VITE_MIDDLEWARE ? 1 : false;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  const hops = Number(raw);
  return Number.isInteger(hops) && hops > 0 ? hops : false;
})();

export const MIDTRANS_SERVER_KEY = (process.env.MIDTRANS_SERVER_KEY || '').trim();

export const MIDTRANS_CLIENT_KEY = (process.env.MIDTRANS_CLIENT_KEY || '').trim();

export const MIDTRANS_IS_PRODUCTION = isProductionFlag(process.env.MIDTRANS_IS_PRODUCTION);

export const MIDTRANS_QRIS_ACQUIRER = (process.env.MIDTRANS_QRIS_ACQUIRER || 'gopay').trim();

export const MIDTRANS_QRIS_EXPIRY_MINUTES = (() => {
  const parsed = Number(process.env.MIDTRANS_QRIS_EXPIRY_MINUTES);
  return Number.isFinite(parsed) && parsed >= 15 ? Math.floor(parsed) : 15;
})();

export const MIDTRANS_PAYMENT_METHOD_LABEL = 'QRIS Midtrans';

/* ── Web Push (pengingat agenda H-1) ─────────────────────────────────────
 * Kunci VAPID dibuat sekali lewat `npm run vapid:keys`. Bila kosong atau
 * cacat, fitur notifikasi otomatis dinonaktifkan — server tetap jalan
 * normal, hanya tanpa push (fail-soft, bukan fail-closed).
 */
export const VAPID_PUBLIC_KEY = (process.env.VAPID_PUBLIC_KEY || '').trim();

export const VAPID_PRIVATE_KEY = (process.env.VAPID_PRIVATE_KEY || '').trim();

export const VAPID_SUBJECT = (process.env.VAPID_SUBJECT || '').trim();

export const PUSH_REMINDER_HOUR = (() => {
  const raw = String(process.env.PUSH_REMINDER_HOUR || '08:00').trim();
  return /^\d{2}:\d{2}$/.test(raw) ? raw : '08:00';
})();
