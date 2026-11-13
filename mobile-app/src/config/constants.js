/**
 * @file mobile-app/src/config/constants.js
 * @description Centralized configuration and environment constants for Mobile App.
 */

import { Platform } from 'react-native';

/* Build rilis (`__DEV__ === false`) tidak boleh diam-diam memakai HTTP
 * localhost ketika EXPO_PUBLIC_API_URL lupa terpasang: token sesi akan lewat
 * cleartext. Di dev / Node tes `__DEV__` tidak terdefinisi, sehingga fallback
 * emulator lama tetap dipakai dan konfigurasi lokal tidak berubah. */
const IS_RELEASE_BUILD = typeof __DEV__ !== 'undefined' && __DEV__ === false;
const PRODUCTION_API_URL = 'https://mobile-app-ebook.vercel.app/api';

const DEFAULT_API_URL = IS_RELEASE_BUILD
  ? PRODUCTION_API_URL
  : typeof Platform !== 'undefined' && Platform.select
    ? Platform.select({
        android: 'http://10.0.2.2:5000/api',
        default: 'http://localhost:5000/api',
      })
    : 'http://localhost:5000/api';

export const API_CONFIG = {
  baseUrl: process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL,
  timeoutMs: Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS) || 20000,
};

const GOOGLE_CALLBACK_PATH = '/api/auth/google/callback';

export const OAUTH_CONFIG = {
  googleClientId:
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
    '8108075809-kpcgb73h2d1t7klg785svrlqc9to3n9t.apps.googleusercontent.com',
  callbackPath: GOOGLE_CALLBACK_PATH,
  redirectUri:
    process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI ||
    `https://mobile-app-ebook.vercel.app${GOOGLE_CALLBACK_PATH}`,
  localWebRedirectUri:
    process.env.EXPO_PUBLIC_GOOGLE_LOCAL_REDIRECT_URI ||
    `http://localhost:3000${GOOGLE_CALLBACK_PATH}`,
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
};

export const APP_CONFIG = {
  supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL || 'info@wahidiyah.org',
};

/* Versi tampilan aplikasi. Jaga agar sama dengan `expo.version` di app.json
 * supaya layar Profil tidak menampilkan versi yang basi. */
export const APP_VERSION = '0.1.8';
