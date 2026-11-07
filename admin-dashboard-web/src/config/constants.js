/**
 * @file admin-dashboard-web/src/config/constants.js
 * @description Centralized configuration and environment constants for Admin Dashboard.
 */

const metaEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
const procEnv = typeof process !== 'undefined' && process.env ? process.env : {};

export const API_CONFIG = {
  baseUrl: metaEnv.VITE_API_URL || procEnv.VITE_API_URL || '',
  fallbackOrigin:
    metaEnv.VITE_API_FALLBACK_ORIGIN || procEnv.VITE_API_FALLBACK_ORIGIN || 'http://localhost:5000',
  timeoutMs: Number(metaEnv.VITE_API_TIMEOUT_MS || procEnv.VITE_API_TIMEOUT_MS) || 20000,
};

export const STORAGE_KEYS = {
  session: 'buku-wahidiyah:auth-session',
  intendedLocation: 'buku-wahidiyah:intended-location',
};

export const MAPS_CONFIG = {
  searchBaseUrl: 'https://www.google.com/maps/search/?api=1&query=',
  dirBaseUrl: 'https://www.google.com/maps/dir/?api=1&destination=',
};

export const EVENT_CATEGORIES = ['Mujahadah', 'Pengajian', 'Kubro', 'Peringatan'];
