/**
 * Halaman serah-terima (handoff) OAuth Google untuk klien mobile Android.
 *
 * Masalah yang dipecahkan: `302` langsung ke `mobileappebook://auth/success?...`
 * tidak bisa dirender Chrome Custom Tab. Tab tetap berada di (atau kembali ke)
 * `accounts.google.com`, jadi pengguna mengira login gagal dan harus menutup
 * tab secara manual padahal sesi di aplikasi sudah aktif lewat deep link.
 *
 * Solusinya: callback mobile menjawab dengan halaman HTTPS milik sendiri yang
 * (1) langsung menavigasi ke `intent://` Android — Chrome meneruskan deep link
 * ke aplikasi dan menariknya ke latar depan, (2) menampilkan status "berhasil"
 * sehingga tab tidak lagi menyerupai halaman login Google, dan (3) menyediakan
 * tombol manual bila Chrome memblokir navigasi otomatis.
 *
 * Skrip inline sengaja TIDAK memuat data dinamis: URL dibaca dari atribut
 * tautan, sehingga hash CSP-nya konstan dan bisa dipasang sebagai header.
 * Modul ini MURNI (tidak menyentuh `req`/`res`) supaya mudah diuji.
 */

import crypto from 'node:crypto';

/** Prefiks state menandai alur mobile bahkan sebelum state ditebus (kasus gagal). */
export const MOBILE_STATE_PREFIX = 'mob.';

/* Satu-satunya skrip pada halaman. Jangan menyisipkan kode/URL di sini —
 * hash di bawah harus tetap cocok dengan byte persis yang dikirim ke browser. */
export const MOBILE_HANDOFF_SCRIPT =
  "location.replace(document.getElementById('buka-aplikasi').href);";

const scriptHash = crypto
  .createHash('sha256')
  .update(MOBILE_HANDOFF_SCRIPT, 'utf8')
  .digest('base64');

/** Header ketat: kode sekali pakai tidak boleh tersimpan di cache/history/Referer. */
export const MOBILE_HANDOFF_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': [
    "default-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
    `script-src 'sha256-${scriptHash}'`,
    "style-src 'unsafe-inline'",
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * Bangun dua URL untuk rute deep link yang sama.
 *
 * `intent://…#Intent;scheme=…;package=…;end` adalah bentuk yang dipahami
 * Chrome untuk meluncurkan activity aplikasi; `mobileappebook://…` disimpan
 * sebagai tautan cadangan untuk browser yang tidak mendukung `intent:`.
 *
 * @param {object} params
 * @param {string} params.scheme - Skema aplikasi, mis. `mobileappebook`
 * @param {string} params.androidPackage - Nama paket aplikasi Android
 * @param {string} params.path - Jalur deep link, mis. `auth/success`
 * @param {Record<string, string>} [params.params] - Parameter query
 * @returns {{ deepLinkUrl: string, intentUrl: string }}
 */
export const buildMobileAuthUrls = ({ scheme, androidPackage, path, params = {} }) => {
  const cleanPath = String(path || '').replace(/^\/+/, '');
  if (!scheme || !androidPackage || !cleanPath) {
    throw new Error('Konfigurasi deep link mobile belum lengkap.');
  }
  const query = new URLSearchParams(params).toString();
  const tail = `${cleanPath}${query ? `?${query}` : ''}`;
  return {
    deepLinkUrl: `${scheme}://${tail}`,
    intentUrl: `intent://${tail}#Intent;scheme=${scheme};package=${androidPackage};end`,
  };
};

/**
 * HTML mandiri untuk halaman serah-terima. Tidak memuat gambar atau sumber
 * daya eksternal — hanya gaya inline, satu skrip ber-hash, dan dua tautan.
 *
 * @param {object} options
 * @param {'success'|'failure'} options.status
 * @param {string} [options.message] - Pesan galat (status failure)
 * @param {string} options.intentUrl
 * @param {string} options.deepLinkUrl
 * @returns {string} Dokumen HTML lengkap
 */
export const buildMobileHandoffHtml = ({ status, message = '', intentUrl, deepLinkUrl }) => {
  const isSuccess = status === 'success';
  const title = isSuccess ? 'Login berhasil' : 'Login Google gagal';
  const description = isSuccess
    ? 'Akun Google Anda sudah terhubung. Aplikasi akan terbuka otomatis dalam sekejap.'
    : message || 'Otorisasi Google tidak selesai. Kembali ke aplikasi untuk mencoba lagi.';
  const safeIntent = escapeHtml(intentUrl);
  const safeDeepLink = escapeHtml(deepLinkUrl);
  const badge = isSuccess ? '✓' : '!';
  const accent = isSuccess ? '#14523A' : '#C00511';

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<title>${escapeHtml(title)} — Mobile-app-ebook</title>
<noscript><meta http-equiv="refresh" content="0;url=${safeDeepLink}"></noscript>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center;
    justify-content: center; padding: 24px; background: #FBF8F3;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    color: #1D1B17; -webkit-text-size-adjust: 100%;
  }
  main {
    width: 100%; max-width: 380px; background: #FFFDF9; border: 1px solid #E4D9C6;
    border-radius: 24px; padding: 28px 24px; text-align: center;
    box-shadow: 0 8px 28px rgba(20, 82, 58, 0.08);
  }
  .badge {
    width: 52px; height: 52px; margin: 0 auto 16px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: ${isSuccess ? '#DCEDE4' : '#FDE8E8'}; color: ${accent};
    font-size: 26px; font-weight: 700;
  }
  h1 { margin: 0 0 8px; font-size: 20px; line-height: 1.3; }
  p { margin: 0 0 22px; font-size: 14px; line-height: 1.55; color: #5A544C; }
  .btn {
    display: block; padding: 14px 18px; border-radius: 14px; background: ${accent};
    color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none;
  }
  .fallback { display: block; margin-top: 16px; font-size: 13px; color: ${accent}; }
  small { display: block; margin-top: 20px; font-size: 11px; color: #7C756C; }
</style>
</head>
<body>
<main>
  <div class="badge">${badge}</div>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(description)}</p>
  <a id="buka-aplikasi" class="btn" href="${safeIntent}">Buka Aplikasi</a>
  <a class="fallback" href="${safeDeepLink}">Tautan langsung ke aplikasi</a>
  <small>Halaman ini aman untuk ditutup setelah aplikasi terbuka.</small>
</main>
<script>${MOBILE_HANDOFF_SCRIPT}</script>
</body>
</html>
`;
};
