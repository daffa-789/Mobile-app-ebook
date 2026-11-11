/**
 * Helper bersama untuk alur OAuth Google.
 *
 * Dua hal yang dulu ditulis sendiri-sendiri (dan tidak konsisten):
 *  - `state` CSRF harus berasal dari CSPRNG, bukan PRNG bawaan yang bisa
 *    diprediksi;
 *  - nilai query dari deep link / callback bisa berisi `%` rusak, sehingga
 *    `decodeURIComponent` mentah melempar `URIError` dan menggagalkan handler.
 *
 * Murni JS, tanpa modul native → aman dikirim lewat OTA.
 */

/** Sumber acak kriptografis yang tersedia di browser modern maupun RN/Hermes. */
const getWebCrypto = () => {
  if (typeof globalThis !== 'undefined' && globalThis.crypto) return globalThis.crypto;
  if (typeof window !== 'undefined' && window.crypto) return window.crypto;
  return null;
};

/**
 * @returns {string} state OAuth tak tertebak (128 bit entropi atau lebih)
 * @throws {Error} bila tidak ada CSPRNG — lebih baik gagal daripada memakai
 *   sumber acak yang bisa diprediksi.
 */
export const createSecureOauthState = () => {
  const webCrypto = getWebCrypto();
  if (webCrypto?.randomUUID) return webCrypto.randomUUID();
  if (webCrypto?.getRandomValues) {
    const bytes = new Uint8Array(32);
    webCrypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  throw new Error('Perangkat tidak menyediakan sumber acak aman untuk login Google.');
};

/** Decode komponen URI tanpa pernah melempar pada input rusak. */
export const safeDecodeUriComponent = (value, fallback = '') => {
  if (value === undefined || value === null) return fallback;
  try {
    return decodeURIComponent(String(value));
  } catch {
    return String(value) || fallback;
  }
};
