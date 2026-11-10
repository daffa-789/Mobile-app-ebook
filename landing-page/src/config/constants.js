/**
 * @file landing-page/src/config/constants.js
 * @description Centralized configuration and environment constants for Landing Page.
 */

const metaEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
const procEnv = typeof process !== 'undefined' && process.env ? process.env : {};

/* 10 Nov 2026: tautan unduh WAJIB same-origin. Kalau href menunjuk GitHub,
 * browser mengabaikan atribut HTML `download` (cross-origin) dan malah
 * menavigasi ke halaman github.com ("Mendownload...") alih-alih mengunduh.
 * APK kini disajikan langsung dari `public/unduh/` dengan header
 * Content-Disposition: attachment. GitHub Release v0.1.3 tetap menjadi arsip
 * rilis kanonik, bukan tujuan unduh pengguna. Rilis v0.1.3 memakai Hermes V1
 * + armeabi-v7a/arm64-v8a; build JSC v0.1.2 sudah dihapus (force close). */
const DIRECT_APK_URL = '/unduh/wahidiyah-v0.1.3-hermes-32bit.apk';

export const APK_DOWNLOAD_URL =
  metaEnv.VITE_APK_DOWNLOAD_URL || procEnv.VITE_APK_DOWNLOAD_URL || DIRECT_APK_URL;

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
