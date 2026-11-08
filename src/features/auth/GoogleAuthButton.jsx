/**
 * Komponen Tombol Autentikasi Google OAuth dengan Penanganan State dan Bfcache.
 *
 * @module src/features/auth/GoogleAuthButton
 */

import { useEffect, useState } from 'react';
import { OAUTH_CONFIG } from '@/config/constants';

const generateState = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
};

const GoogleIcon = () => (
  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

/**
 * @param {object} props
 * @param {boolean} [props.disabled=false] - Status tombol dinonaktifkan
 * @param {(message: string) => void} [props.onError] - Callback pesan galat
 * @param {'login' | 'register'} [props.mode='login'] - Mode aksi
 * @returns {import('react').JSX.Element}
 */
export const GoogleAuthButton = ({ disabled = false, onError, mode = 'login' }) => {
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  /* Tombol Google menyalakan state ini lalu halaman pergi ke accounts.google.com.
     Ketika pengguna menekan Back, Chrome memulihkan /login dari bfcache dengan
     state masih menyala, jadi tombolnya macet "Mengarahkan ke Google…" selamanya.
     pageshow dengan persisted === true adalah sinyal pemulihan itu. */
  useEffect(() => {
    const pulihkan = (event) => {
      if (event.persisted) setIsGoogleSubmitting(false);
    };
    window.addEventListener('pageshow', pulihkan);
    return () => window.removeEventListener('pageshow', pulihkan);
  }, []);

  const handleGoogleLogin = () => {
    const clientId = OAUTH_CONFIG.googleClientId;
    if (!clientId) {
      onError?.('Konfigurasi VITE_GOOGLE_CLIENT_ID belum diisi di .env.');
      return;
    }

    const state = generateState();
    document.cookie = `google_oauth_state=${encodeURIComponent(state)}; Path=/; Max-Age=600; SameSite=Lax`;

    const redirectUri = `${window.location.origin}${OAUTH_CONFIG.callbackPath}`;
    const scope = encodeURIComponent(OAUTH_CONFIG.scope);
    const authUrl =
      `${OAUTH_CONFIG.googleAuthUrl}` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${scope}` +
      `&state=${encodeURIComponent(state)}` +
      `&access_type=online` +
      `&prompt=select_account`;

    setIsGoogleSubmitting(true);
    onError?.('');

    window.location.href = authUrl;
  };

  const actionText = mode === 'register' ? 'Daftar dengan Google' : 'Masuk dengan Google';

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={disabled || isGoogleSubmitting}
      className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-cream-300 bg-ui-card px-4 py-3 text-sm font-semibold text-ink-700 transition hover:border-cream-400 hover:bg-cream-50 disabled:opacity-50"
    >
      {isGoogleSubmitting ? (
        <>
          <span className="auth-spinner" />
          Mengarahkan ke Google…
        </>
      ) : (
        <>
          <GoogleIcon />
          {actionText}
        </>
      )}
    </button>
  );
};
