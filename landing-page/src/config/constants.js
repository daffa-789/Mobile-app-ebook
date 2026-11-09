/**
 * @file landing-page/src/config/constants.js
 * @description Centralized configuration and environment constants for Landing Page.
 */

const metaEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
const procEnv = typeof process !== 'undefined' && process.env ? process.env : {};

/* 10 Nov 2026: rilis v0.1.3 dibangun ulang dari sumber 0.1.2 tanpa menghapus
 * fitur, memakai Hermes V1 dan ABI armeabi-v7a + arm64-v8a. Build v0.1.2
 * mematikan Hermes (`hermesEnabled=false`) sehingga memakai JSC dan force
 * close di perangkat 32-bit; Expo SDK 58 / RN 0.88 tidak lagi mendukung JSC.
 * Artefak JSC tidak boleh pernah dipakai lagi sebagai tautan unduh. */
const RELEASE_APK_URL =
  'https://github.com/daffa-789/Mobile-app-ebook/releases/download/v0.1.3/wahidiyah-v0.1.3-hermes-32bit.apk';

export const APK_DOWNLOAD_URL =
  metaEnv.VITE_APK_DOWNLOAD_URL || procEnv.VITE_APK_DOWNLOAD_URL || RELEASE_APK_URL;

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
