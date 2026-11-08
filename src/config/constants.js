/**
 * @file src/config/constants.js
 * @description Konfigurasi terpusat PWA reader: origin API, kunci penyimpanan,
 * tautan Google Maps, dan parameter OAuth Google.
 */

const metaEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
const procEnv = typeof process !== 'undefined' && process.env ? process.env : {};

export const API_CONFIG = {
  baseUrl: metaEnv.VITE_API_URL || procEnv.VITE_API_URL || '',
  fallbackOrigin:
    metaEnv.VITE_API_FALLBACK_ORIGIN || procEnv.VITE_API_FALLBACK_ORIGIN || 'http://localhost:5000',
  timeoutMs: Number(metaEnv.VITE_API_TIMEOUT_MS || procEnv.VITE_API_TIMEOUT_MS) || 20000,
};

/** Hostname pengembangan yang boleh memakai `API_CONFIG.fallbackOrigin`. */
export const DEV_HOSTNAMES = ['localhost', '127.0.0.1', '::1', '[::1]'];

export const STORAGE_KEYS = {
  session: 'buku-wahidiyah:auth-session',
  intendedLocation: 'buku-wahidiyah:intended-location',
  lastPayment: 'buku-wahidiyah:last-payment',
  pendingVerification: 'buku-wahidiyah:pending-verification',
};

export const MAPS_CONFIG = {
  searchBaseUrl: 'https://www.google.com/maps/search/?api=1&query=',
  dirBaseUrl: 'https://www.google.com/maps/dir/?api=1&destination=',
};

export const OAUTH_CONFIG = {
  googleClientId: metaEnv.VITE_GOOGLE_CLIENT_ID || procEnv.VITE_GOOGLE_CLIENT_ID || '',
  googleAuthUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  callbackPath: '/api/auth/google/callback',
  scope: 'openid email profile',
};
