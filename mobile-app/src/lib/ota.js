/**
 * Utilitas EAS Update (OTA) — lapisan tanpa React dan tanpa UI.
 *
 * Dipakai bersama oleh hook pemantau otomatis (`useOtaUpdate`) dan tombol
 * manual di halaman Profil supaya aturan "kapan OTA boleh dicek" hanya ada
 * di satu tempat. `expo-updates` sudah memeriksa pembaruan sendiri saat
 * peluncuran (`checkOnLaunch = ALWAYS`); modul ini hanya menyediakan cara
 * aman untuk menanyakan status dan menerapkannya lewat satu ketukan.
 */
import * as Updates from 'expo-updates';

/** Jangan spam manifest server saat AppState bolak-balik aktif. */
export const OTA_CHECK_THROTTLE_MS = 60 * 1000;

/** OTA hanya tersedia di build terpasang, bukan Expo Go / development. */
export const isOtaSupported = () => !__DEV__ && Boolean(Updates.isEnabled);

/**
 * Apakah ada pembaruan untuk channel & runtime yang sedang berjalan.
 * @returns {Promise<boolean>} false bila tidak ada atau pemeriksaan gagal
 */
export const checkForOtaUpdate = async () => {
  const result = await Updates.checkForUpdateAsync();
  return Boolean(result?.isAvailable);
};

/** Unduh bundel baru ke perangkat (aman dipanggil bila sudah terunduh). */
export const downloadOtaUpdate = async () => {
  await Updates.fetchUpdateAsync();
};

/** Muat ulang aplikasi agar bundel baru dipakai. */
export const reloadWithOtaUpdate = async () => {
  await Updates.reloadAsync();
};

/** Jalur pendek untuk pembaruan satu ketukan: unduh lalu muat ulang. */
export const applyOtaUpdate = async () => {
  await downloadOtaUpdate();
  await reloadWithOtaUpdate();
};
