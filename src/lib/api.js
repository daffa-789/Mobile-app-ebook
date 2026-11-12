/**
 * Modul klien API dan manajemen sesi peramban untuk Wahidiyah Book.
 * Mengatur pembungkusan fetch (`apiJson`), fallback origin saat mode pengembangan,
 * penanganan galat jaringan, dan persistensi token sesi di `localStorage`.
 *
 * @module src/lib/api
 */

import { API_CONFIG, DEV_HOSTNAMES, STORAGE_KEYS } from '@/config/constants';
import { createApiTransport, readableError } from '@shared/apiTransport.js';

export const API_FALLBACK_ORIGIN = API_CONFIG.fallbackOrigin;

const canUseApiFallback = (path) =>
  import.meta.env?.DEV === true &&
  typeof window !== 'undefined' &&
  DEV_HOSTNAMES.includes(window.location.hostname) &&
  typeof path === 'string' &&
  path.startsWith('/') &&
  !path.startsWith('//');

const transport = createApiTransport({
  fallbackOrigin: API_FALLBACK_ORIGIN,
  timeoutMs: API_CONFIG.timeoutMs,
  canUseFallback: (path) =>
    import.meta.env?.DEV === true &&
    typeof window !== 'undefined' &&
    DEV_HOSTNAMES.includes(window.location.hostname) &&
    typeof path === 'string' &&
    path.startsWith('/') &&
    !path.startsWith('//'),
});

export const { apiRequest, apiJson, apiJsonSend } = transport;

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

const LAST_PAYMENT_STORAGE_KEY = STORAGE_KEYS.lastPayment;

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

const PENDING_VERIFICATION_STORAGE_KEY = STORAGE_KEYS.pendingVerification;

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

export { readableError };
