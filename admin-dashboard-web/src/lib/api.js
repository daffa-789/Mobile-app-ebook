/**
 * Modul klien API dan manajemen sesi peramban untuk Wahidiyah Book.
 * Mengatur pembungkusan fetch (`apiJson`), fallback origin saat mode pengembangan,
 * penanganan galat jaringan, dan persistensi token sesi di `localStorage`.
 *
 * @module src/lib/api
 */

import { API_CONFIG, STORAGE_KEYS } from '@/config/constants';

export const API_FALLBACK_ORIGIN = API_CONFIG.fallbackOrigin;

const canUseApiFallback = (path) =>
  import.meta.env?.DEV === true &&
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1', '::1', '[::1]'].includes(window.location.hostname) &&
  typeof path === 'string' &&
  path.startsWith('/') &&
  !path.startsWith('//');

const offlineError = () => {
  const error = new Error('Server tidak dapat dihubungi.');
  error.network = true;
  return error;
};

const SESSION_STORAGE_KEY = STORAGE_KEYS.session;

const INTENDED_LOCATION_STORAGE_KEY = STORAGE_KEYS.intendedLocation;

export const getStoredSession = () => {
  try {
    const value = window.localStorage.getItem(SESSION_STORAGE_KEY);
    const session = value ? JSON.parse(value) : null;
    return session?.token ? session : null;
  } catch {
    return null;
  }
};

export const saveSession = (session) => {
  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {}
};

export const clearSession = () => {
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
};

const LAST_PAYMENT_STORAGE_KEY = 'buku-wahidiyah:last-payment';

export const getStoredLastPayment = () => {
  try {
    const value = window.sessionStorage.getItem(LAST_PAYMENT_STORAGE_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

export const saveLastPayment = (result) => {
  try {
    if (!result) {
      window.sessionStorage.removeItem(LAST_PAYMENT_STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(LAST_PAYMENT_STORAGE_KEY, JSON.stringify(result));
  } catch {}
};

export const clearLastPayment = () => {
  window.sessionStorage.removeItem(LAST_PAYMENT_STORAGE_KEY);
};

const PENDING_VERIFICATION_STORAGE_KEY = 'buku-wahidiyah:pending-verification';

export const getPendingVerification = () => {
  try {
    const value = window.sessionStorage.getItem(PENDING_VERIFICATION_STORAGE_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

export const savePendingVerification = (context) => {
  window.sessionStorage.setItem(PENDING_VERIFICATION_STORAGE_KEY, JSON.stringify(context));
};

export const clearPendingVerification = () => {
  window.sessionStorage.removeItem(PENDING_VERIFICATION_STORAGE_KEY);
};

export const saveIntendedLocation = (path) => {
  try {
    window.sessionStorage.setItem(INTENDED_LOCATION_STORAGE_KEY, String(path));
  } catch {}
};

export const peekIntendedLocation = () => {
  try {
    return window.sessionStorage.getItem(INTENDED_LOCATION_STORAGE_KEY) || null;
  } catch {
    return null;
  }
};

export const clearIntendedLocation = () => {
  try {
    window.sessionStorage.removeItem(INTENDED_LOCATION_STORAGE_KEY);
  } catch {}
};

export const authHeaders = (token = getStoredSession()?.token) =>
  token ? { Authorization: `Bearer ${token}` } : {};

const REQUEST_TIMEOUT_MS = API_CONFIG.timeoutMs;

const timeoutError = () => {
  const error = new Error('Server tidak membalas dalam batas waktu.');
  error.network = true;
  error.timeout = true;
  return error;
};

const fetchWithTimeout = async (url, options = {}) => {
  const { timeoutMs, ...rest } = options;
  if (rest.signal) return fetch(url, rest);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs || REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...rest, signal: controller.signal });
  } catch (error) {
    if (error?.name === 'AbortError') throw timeoutError();
    throw error;
  } finally {
    clearTimeout(timer);
  }
};

export const apiRequest = async (path, options = {}) => {
  try {
    return await fetchWithTimeout(path, options);
  } catch (error) {
    if (error?.timeout) throw error;
    if (!canUseApiFallback(path)) throw offlineError();

    try {
      return await fetchWithTimeout(`${API_FALLBACK_ORIGIN}${path}`, options);
    } catch (fallbackError) {
      if (fallbackError?.timeout) throw fallbackError;
      throw offlineError();
    }
  }
};

export const apiJson = async (path, options = {}) => {
  const response = await apiRequest(path, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || 'Permintaan ke server gagal.');
    error.status = response.status;
    throw error;
  }
  return payload;
};

/**
 * `apiJson` dengan badan JSON — satu tempat untuk kontrak `Content-Type` +
 * `JSON.stringify`. Bentuk tiga baris (`method`, `headers`, `body`) sebelumnya
 * ditulis ulang di 20 titik pada 13 berkas, sehingga perubahan kontrak (mis.
 * menambah `Accept`) harus dicari di seluruh aplikasi.
 *
 * @param {string} path - URL relatif `/api/...`
 * @param {object} body - Nilai yang diserialisasi menjadi JSON
 * @param {object} [options] - `method` (bawaan POST), `headers` tambahan
 *   (mis. otorisasi dari `authHeaders`), dan opsi `fetch` lain seperti `timeoutMs`
 * @returns {Promise<object>} Payload JSON respons
 */
export const apiJsonSend = (path, body, { method = 'POST', headers, ...rest } = {}) =>
  apiJson(path, {
    ...rest,
    method,
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

export const readableError = (error) => {
  if (error?.timeout) return 'Server tidak membalas tepat waktu. Coba lagi.';
  if (error?.network) return 'Server tidak dapat dihubungi.';
  if (error?.status === 503 || error?.status === 500)
    return 'Server menolak permintaan (basis data mungkin mati).';
  return error?.message || 'Data gagal dimuat.';
};
