// Padanan src/lib/api.js TANPA DOM (§5.1-5.7): URL absolut, storage SecureStore/kv.
// Amplop galat seragam: { success:false, message } — satu banner pesan, tanpa mapping per-field.
import { API_BASE_URL } from '../config';

let getTokenFn = null;
export const setTokenProvider = (fn) => { getTokenFn = fn; };

const REQUEST_TIMEOUT_MS = 20000;

const offlineError = () => {
  const e = new Error('Server tidak dapat dihubungi.');
  e.network = true;
  return e;
};

const fetchWithTimeout = async (url, options = {}) => {
  const { timeoutMs, ...rest } = options;
  if (rest.signal) return fetch(url, rest);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs || REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...rest, signal: controller.signal });
  } catch (error) {
    if (error?.name === 'AbortError') {
      const e = new Error('Server tidak membalas dalam batas waktu.');
      e.network = true; e.timeout = true;
      throw e;
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
};

const withAuth = async (headers = {}) => {
  const token = getTokenFn ? await getTokenFn() : null;
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
};

export const apiRequest = async (path, options = {}) => {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const headers = await withAuth(options.headers || {});
  try {
    return await fetchWithTimeout(url, { ...options, headers });
  } catch (e) {
    if (e?.timeout) throw e;
    throw offlineError();
  }
};

export const apiJson = async (path, options = {}) => {
  const response = await apiRequest(path, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || 'Permintaan ke server gagal.');
    error.status = response.status;
    error.code = payload.error || null;
    throw error;
  }
  return payload;
};

export const apiJsonSend = (path, body, { method = 'POST', headers, ...rest } = {}) =>
  apiJson(path, {
    ...rest,
    method,
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

export const readableError = (error) => {
  if (!error) return 'Data gagal dimuat.';
  if (error?.timeout) return 'Server tidak membalas tepat waktu. Coba lagi.';
  if (error?.network) return 'Server tidak dapat dihubungi.';
  if (error?.status === 503 || error?.status === 500)
    return 'Server menolak permintaan (basis data mungkin mati).';
  return error.message || 'Data gagal dimuat.';
};

// §5.6 — satu kali per sesi aktif + saat foreground. Mobile TIDAK mem-poll.
export const reconcileProOnce = async (refreshMe) => {
  try {
    const res = await apiJsonSend('/payments/qris/reconcile', {});
    if (!res.success) return 0;
    const settled = Number(res.settled ?? 0);
    if (settled > 0 && refreshMe) await refreshMe();
    return settled;
  } catch {
    return 0;
  }
};
