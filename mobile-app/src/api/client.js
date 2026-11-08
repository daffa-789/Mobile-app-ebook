import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/constants.js';

export const API_BASE_URL = API_CONFIG.baseUrl;
export const API_TIMEOUT_MS = API_CONFIG.timeoutMs;

/**
 * Daftar endpoint yang bebas sesi (tidak memerlukan token otentikasi valid
 * dan tidak boleh memicu auto-logout saat merespons 401).
 */
export const SESSION_FREE_ENDPOINTS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify-registration',
  '/api/auth/request-password-reset',
  '/api/auth/reset-password',
  '/api/auth/resend-verification',
  '/api/auth/exchange',
  '/api/auth/google/mobile-start',
  '/api/auth/google-supabase',
];

export function isSessionFreeEndpoint(endpoint) {
  const clean = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const path = clean.startsWith('/api') ? clean : `/api${clean}`;
  return SESSION_FREE_ENDPOINTS.some((ep) => path === ep || path.startsWith(`${ep}/`));
}

let onUnauthorizedCallback = null;

/**
 * Daftarkan handler saat menerima respons 401 Unauthorized pada endpoint terproteksi.
 */
export function setUnauthorizedHandler(fn) {
  onUnauthorizedCallback = typeof fn === 'function' ? fn : null;
}

/**
 * Normalisasi URL untuk memastikan endpoint selalu memiliki prefix `/api`
 * tanpa menyebabkan duplikasi `/api/api` bila baseUrl sudah berakhiran `/api`.
 */
export function buildApiUrl(baseUrl, endpoint) {
  const cleanBase = String(baseUrl || '').replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (cleanBase.endsWith('/api') && cleanEndpoint.startsWith('/api/')) {
    return `${cleanBase}${cleanEndpoint.slice(4)}`;
  }
  if (!cleanBase.endsWith('/api') && !cleanEndpoint.startsWith('/api/')) {
    return `${cleanBase}/api${cleanEndpoint}`;
  }
  return `${cleanBase}${cleanEndpoint}`;
}

/**
 * Ambil token otentikasi dari SecureStore (jika tersedia) atau fallback ke AsyncStorage.
 */
async function getStoredToken() {
  try {
    const SecureStore = await import('expo-secure-store');
    if (SecureStore && typeof SecureStore.getItemAsync === 'function') {
      const secureToken = await SecureStore.getItemAsync('auth_token');
      if (secureToken) return secureToken;
    }
  } catch (_) {}

  try {
    return (
      (await AsyncStorage.getItem('@session_token')) || (await AsyncStorage.getItem('auth_token'))
    );
  } catch (_) {
    return null;
  }
}

/**
 * Dapatkan objek headers dengan Authorization Bearer token jika tersedia.
 */
export async function getAuthHeaders(extraToken) {
  const token = extraToken || (await getStoredToken());
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Fetch wrapper dengan penanganan token JWT otomatis, batas waktu (timeout) via AbortController,
 * penanganan 401 terpusat, & amplop standar { success, message, data }.
 */
export async function apiRequest(endpoint, options = {}) {
  const token = await getStoredToken();
  const url = buildApiUrl(API_BASE_URL, endpoint);
  const timeoutMs = Number(options.timeoutMs || API_TIMEOUT_MS);

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  const signal = options.signal || (controller ? controller.signal : undefined);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data?.message || data?.error || `Request gagal (${res.status})`;
      const error = new Error(errorMsg);
      error.status = res.status;
      error.data = data;

      // Tangani 401 terpusat: jika token kedaluwarsa pada endpoint terproteksi, picu logout
      if (res.status === 401 && !isSessionFreeEndpoint(endpoint)) {
        if (typeof onUnauthorizedCallback === 'function') {
          try {
            onUnauthorizedCallback(error);
          } catch (handlerErr) {
            console.warn('[API] Gagal mengeksekusi unauthorized handler:', handlerErr);
          }
        }
      }

      throw error;
    }

    return data;
  } catch (err) {
    if (err?.name === 'AbortError') {
      const timeoutError = new Error(`Request timeout setelah ${timeoutMs}ms`);
      timeoutError.timeout = true;
      timeoutError.network = true;
      console.warn(`[API] Timeout pada ${endpoint}:`, timeoutError.message);
      throw timeoutError;
    }
    console.warn(`[API] Error pada ${endpoint}:`, err.message);
    throw err;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export const request = apiRequest;
