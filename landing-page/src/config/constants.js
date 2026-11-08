/**
 * @file landing-page/src/config/constants.js
 * @description Centralized configuration and environment constants for Landing Page.
 */

const metaEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
const procEnv = typeof process !== 'undefined' && process.env ? process.env : {};

export const APK_DOWNLOAD_URL =
  metaEnv.VITE_APK_DOWNLOAD_URL ||
  procEnv.VITE_APK_DOWNLOAD_URL ||
  'https://expo.dev/artifacts/eas/nZG8qlaABNxRjAz_jBldJYlxghHw-ai4ecU1iYEVWSs.apk';

export const API_CONFIG = {
  baseUrl: metaEnv.VITE_API_URL || procEnv.VITE_API_URL || '',
  fallbackOrigin:
    metaEnv.VITE_API_FALLBACK_ORIGIN || procEnv.VITE_API_FALLBACK_ORIGIN || 'http://localhost:5000',
  timeoutMs: Number(metaEnv.VITE_API_TIMEOUT_MS || procEnv.VITE_API_TIMEOUT_MS) || 20000,
};

export const OAUTH_CONFIG = {
  googleClientId: metaEnv.VITE_GOOGLE_CLIENT_ID || procEnv.VITE_GOOGLE_CLIENT_ID || '',
  googleAuthUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
};

export const STORAGE_KEYS = {
  session: 'buku-wahidiyah:auth-session',
  lastPayment: 'buku-wahidiyah:last-payment',
  pendingVerification: 'buku-wahidiyah:pending-verification',
  intendedLocation: 'buku-wahidiyah:intended-location',
};
