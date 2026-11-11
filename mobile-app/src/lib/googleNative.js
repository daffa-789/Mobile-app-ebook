/**
 * Login Google lewat SDK native (picker akun di dalam aplikasi, tanpa browser).
 *
 * SDK diimpor dinamis supaya build web tidak mengevaluasi kode native.
 * `signOut()` dipanggil sebelum setiap `signIn()`: inilah yang membuat daftar
 * akun Google selalu muncul lagi setelah pengguna logout, bukan terkunci pada
 * akun terakhir seperti layar "Anda login kembali ke …".
 */
import { Platform } from 'react-native';
import { OAUTH_CONFIG } from '../config/constants';

let configured = false;

const loadSdk = async () => {
  if (Platform.OS !== 'android') return null;
  try {
    return await import('@react-native-google-signin/google-signin');
  } catch (_) {
    return null;
  }
};

/** Siapkan SDK sekali saat provider auth dipasang. */
export const configureGoogleNative = async () => {
  const sdk = await loadSdk();
  if (!sdk || configured) return Boolean(sdk);
  sdk.GoogleSignin.configure({
    webClientId: OAUTH_CONFIG.googleClientId,
    offlineAccess: false,
  });
  configured = true;
  return true;
};

/**
 * @returns {Promise<{success:boolean, idToken?:string, cancelled?:boolean,
 *   fallback?:boolean, error?:string}>}
 */
export const signInWithGoogleNative = async () => {
  const sdk = await loadSdk();
  if (!sdk) return { success: false, fallback: true };

  try {
    await sdk.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    await sdk.GoogleSignin.signOut().catch(() => null);

    const response = await sdk.GoogleSignin.signIn();
    if (response?.type !== 'success') return { success: false, cancelled: true };

    let idToken = response.data?.idToken;
    if (!idToken) {
      const tokens = await sdk.GoogleSignin.getTokens();
      idToken = tokens?.idToken;
    }
    if (!idToken) return { success: false, error: 'Google tidak mengembalikan idToken.' };
    return { success: true, idToken };
  } catch (error) {
    const code = error?.code;
    if (code === sdk.statusCodes?.SIGN_IN_CANCELLED) {
      return { success: false, cancelled: true };
    }
    if (code === sdk.statusCodes?.PLAY_SERVICES_NOT_AVAILABLE) {
      return { success: false, fallback: true };
    }
    return { success: false, error: error?.message || 'Login Google native gagal.' };
  }
};
