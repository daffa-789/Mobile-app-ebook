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
 * Content-Disposition: attachment. GitHub Release v0.1.5 tetap menjadi arsip
 * rilis kanonik, bukan tujuan unduh pengguna. Rilis v0.1.9 memakai Hermes V1
 * + armeabi-v7a/arm64-v8a, menyematkan SDK Google Sign-In, reader PDF native,
 * dan proteksi screenshot/rekam layar (FLAG_SECURE) di ReaderScreen, serta
 * MENYEMATKAN bundel JS final sehingga instal segar tidak bergantung OTA.
 * Build JSC v0.1.2 sudah dihapus (force close). */
const DIRECT_APK_URL = '/unduh/wahidiyah-v0.1.9-hermes-32bit.apk';

export const APK_DOWNLOAD_URL =
  metaEnv.VITE_APK_DOWNLOAD_URL || procEnv.VITE_APK_DOWNLOAD_URL || DIRECT_APK_URL;
