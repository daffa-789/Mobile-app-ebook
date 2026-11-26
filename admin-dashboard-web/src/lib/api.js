/**
 * Modul klien API dan manajemen sesi peramban untuk Admin Dashboard Wahidiyah Book.
 * Mengatur pembungkusan fetch (`apiJson`), fallback origin saat mode pengembangan,
 * penanganan galat jaringan, dan persistensi token sesi di `localStorage`.
 *
 * @module admin-dashboard-web/src/lib/api
 */

import { API_CONFIG, STORAGE_KEYS } from '@/config/constants';
import { createApiTransport, readableError } from '@shared/apiTransport.js';

const API_FALLBACK_ORIGIN = API_CONFIG.fallbackOrigin;

const transport = createApiTransport({
  fallbackOrigin: API_FALLBACK_ORIGIN,
  timeoutMs: API_CONFIG.timeoutMs,
  canUseFallback: (path) =>
    import.meta.env?.DEV === true &&
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1', '::1', '[::1]'].includes(window.location.hostname) &&
    typeof path === 'string' &&
    path.startsWith('/') &&
    !path.startsWith('//'),
});

export const { apiRequest, apiJson, apiJsonSend } = transport;

const SESSION_STORAGE_KEY = STORAGE_KEYS.session;

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

export const authHeaders = (token = getStoredSession()?.token) =>
  token ? { Authorization: `Bearer ${token}` } : {};

export { readableError };
