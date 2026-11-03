/**
 * Resolusi origin frontend untuk redirect OAuth aman (mitigasi open redirect / VULN-04).
 *
 * `Host` dan `X-Forwarded-Proto` adalah masukan yang berpotensi dikendalikan penyerang.
 * Keduanya tidak boleh menentukan tujuan redirect kecuali origin hasilnya sudah ada
 * di daftar allowlist terverifikasi. Variabel `FRONTEND_ORIGIN` selalu diprioritaskan bila diisi,
 * dan nilai yang tidak valid diperlakukan sebagai gagal (null).
 *
 * @module server/lib/origin
 */

const SAFE_PROTOCOLS = new Set(['http', 'https']);

/**
 * Normalisasi nilai URL menjadi origin (`protokol://host[:port]`) atau null bila cacat / protokol tidak aman.
 *
 * @param {string|null|undefined} value - URL string mentah
 * @returns {string|null} Origin terformat atau null jika tidak valid
 * @example
 * normalizeOrigin('https://wahidiyahbook.com/path?query=1') // => 'https://wahidiyahbook.com'
 */
const normalizeOrigin = (value) => {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const protocol = url.protocol.replace(/:$/, '');
    return SAFE_PROTOCOLS.has(protocol) ? url.origin : null;
  } catch {
    return null;
  }
};

/**
 * Ambil protokol pertama yang sah dari header majemuk; selain http/https diabaikan.
 *
 * @param {string|null|undefined} value - Nilai header x-forwarded-proto
 * @returns {string|null} 'http', 'https', atau null
 */
const sanitizeForwardedProto = (value) => {
  const first = String(value ?? '')
    .split(',')[0]
    .trim()
    .toLowerCase();
  return SAFE_PROTOCOLS.has(first) ? first : null;
};

/**
 * Tentukan origin frontend yang boleh dituju redirect.
 *
 * @param {object} [env=process.env] - Sumber `FRONTEND_ORIGIN` (biasanya `process.env`).
 * @param {import('express').Request|null} [req=null] - Request Express; boleh null untuk uji env saja.
 * @param {string[]} [allowedOrigins=[]] - Daftar origin yang sah (CORS allowlist).
 * @returns {string|null} Origin sah, atau null bila tidak ada yang bisa dipercaya.
 */
export const resolveFrontendOrigin = (env = process.env, req = null, allowedOrigins = []) => {
  const configured = String(env?.FRONTEND_ORIGIN ?? '').trim();
  if (configured) return normalizeOrigin(configured);

  if (!req) return null;

  const protocol =
    sanitizeForwardedProto(req.headers?.['x-forwarded-proto']) ||
    sanitizeForwardedProto(req.protocol) ||
    'http';

  /* Proxy pengembangan (Vite `changeOrigin`) menulis ulang `Host` menjadi
   * alamat backend. `X-Forwarded-Host` mengembalikan host asli yang dilihat
   * peramban — tetap hanya dipakai bila origin hasilnya ada di allowlist.
   */
  const forwardedHost = String(req.headers?.['x-forwarded-host'] ?? '')
    .split(',')[0]
    .trim();
  const host = forwardedHost || String(req.get?.('host') ?? '').trim();
  if (!host) return null;

  const candidate = normalizeOrigin(`${protocol}://${host}`);
  if (!candidate) return null;

  return allowedOrigins.includes(candidate) ? candidate : null;
};
