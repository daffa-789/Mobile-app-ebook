import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Endpoint lokal: 10.0.2.2 untuk Android emulator, localhost untuk iOS/Web
const DEFAULT_API_URL = Platform.select({
  android: 'http://10.0.2.2:5000/api',
  default: 'http://localhost:5000/api',
});

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

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
 * Fetch wrapper dengan penanganan token JWT otomatis & amplop standard { success, message, data }.
 */
export async function apiRequest(endpoint, options = {}) {
  const token = await getStoredToken();
  const url = buildApiUrl(API_BASE_URL, endpoint);

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data?.message || data?.error || `Request gagal (${res.status})`;
      const error = new Error(errorMsg);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    console.warn(`[API] Error pada ${endpoint}:`, err.message);
    throw err;
  }
}
