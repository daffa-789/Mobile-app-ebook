/**
 * Salin teks ke papan klip + umpan balik pop up "berhasil di salin".
 *
 * Memakai `Clipboard` bawaan React Native yang SUDAH ter-autolink di APK
 * 0.1.5/0.1.6 (`com.facebook.react.modules.clipboard.ClipboardModule`,
 * diverifikasi dari classes.dex), BUKAN `expo-clipboard` yang tidak ada di
 * biner sehingga tidak bisa dikirim lewat OTA. `ToastAndroid` juga bawaan
 * RN, jadi umpan baliknya berupa popup kecil tanpa elemen UI di layar.
 */
import { Alert, Clipboard, Platform, ToastAndroid } from 'react-native';

export const COPIED_MESSAGE = 'berhasil di salin';

/**
 * @param {string} text - Teks yang akan disalin
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export const copyTextWithToast = async (text) => {
  const value = String(text || '').trim();
  if (!value) return { success: false, error: 'Tautan belum tersedia.' };

  try {
    if (
      Platform.OS === 'web' &&
      typeof navigator !== 'undefined' &&
      navigator.clipboard?.writeText
    ) {
      await navigator.clipboard.writeText(value);
    } else {
      Clipboard.setString(value);
    }

    if (Platform.OS === 'android' && typeof ToastAndroid?.show === 'function') {
      ToastAndroid.show(COPIED_MESSAGE, ToastAndroid.SHORT);
    } else {
      Alert.alert(COPIED_MESSAGE);
    }
    return { success: true };
  } catch (_) {
    return { success: false, error: 'Tautan gagal disalin. Coba lagi.' };
  }
};
