/* Penjaga subsystem Web Push — dipakai bersama oleh penyimpanan langganan
   (pushSubscriptionStore.js) dan pengirim pesan (eventReminder.js).

   Dua hal menentukan fitur ini hidup, mati, atau mati dengan tenang:
     1. Kunci VAPID di `.env` — tanpa ketiganya tidak ada yang boleh dikirim.
     2. Skema basis data — tabel/kolom baru mungkin belum dibuat pemilik, dan
        fitur notifikasi sebaiknya mati dengan tenang, bukan menjatuhkan server.

   Bendera "peringatan satu kali" disimpan di modul ini supaya seluruh jalur
   push berbagi, sama seperti sebelum modul ini dipisahkan. */

import { logger } from '../logger.js';
import { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } from '../config.js';
import { isValidVapidPublicKey, isValidVapidPrivateKey } from './webpush.js';

/** Kirim hanya bila seluruh kunci VAPID tersedia dan sah. */
export const isPushConfigured = () =>
  isValidVapidPublicKey(VAPID_PUBLIC_KEY) &&
  isValidVapidPrivateKey(VAPID_PRIVATE_KEY) &&
  Boolean(VAPID_SUBJECT);

/** Amplop kredensial VAPID untuk `sendWebPush`. */
export const vapidConfig = () => ({
  publicKey: VAPID_PUBLIC_KEY,
  privateKey: VAPID_PRIVATE_KEY,
  subject: VAPID_SUBJECT,
});

const MISSING_SCHEMA_CODES = new Set(['42P01', '42703']);

/** Galat "tabel/kolom belum ada" (kode PostgreSQL) atau pesan turunannya. */
const isMissingSchema = (error) =>
  MISSING_SCHEMA_CODES.has(error?.code) ||
  /does not exist|schema cache/i.test(String(error?.message || ''));

let schemaWarningLogged = false;

/** Peringatkan sekali per proses bahwa skema push belum lengkap. */
const warnSchemaOnce = (error, scope) => {
  if (schemaWarningLogged) return;
  schemaWarningLogged = true;
  logger.warn(scope, 'Tabel/kolom Web Push belum ada — fitur notifikasi dilewati', {
    pesan: error?.message,
    solusi:
      'jalankan blok "PATCH Web Push" pada supabase_database/full_setup.sql di SQL Editor Supabase, lalu restart',
  });
};

/**
 * Gerbang tunggal pola "skema belum ada → peringatkan sekali, lalu lewati".
 *
 * Bentuk `isMissingSchema(e)` dipasangi `warnSchemaOnce(e, 'PUSH')` sebelumnya
 * ditulis ulang di enam tempat (empat di `eventReminder.js`, dua di
 * `pushSubscriptionStore.js`); pemanggil tinggal memeriksa hasil fungsi ini
 * dan memutuskan apa yang dikembalikan.
 *
 * @param {object|undefined} error - Galat dari kueri Supabase
 * @param {string} [scope] - Label log
 * @returns {boolean} `true` bila galatnya karena skema belum lengkap
 */
export const noteSchemaMissing = (error, scope = 'PUSH') => {
  if (!isMissingSchema(error)) return false;
  warnSchemaOnce(error, scope);
  return true;
};
