import { useEffect, useRef, useState } from 'react';
import { useApp } from '@context/AppContext';
import { apiJsonSend } from '@lib/api';
import { AuthStatus } from '@ui/AuthStatus';

export const GoogleSuccessScreen = () => {
  const { login, navigateTo } = useApp();
  const [error, setError] = useState('');
  const exchangeStarted = useRef(false);

  useEffect(() => {
    /* StrictMode menjalankan efek dua kali di pengembangan. Kode sekali-pakai
     * sudah hangus pada penukaran pertama, jadi penukaran dijaga ref.
     */
    if (exchangeStarted.current) return undefined;
    exchangeStarted.current = true;

    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get('error');
    const code = params.get('code');

    /* Buang kode dari address bar sebelum ditukar: jangan sampai tersisa di
     * riwayat peramban atau ikut terkirim sebagai Referer.
     */
    window.history.replaceState({}, '', '/auth/success');

    if (oauthError) {
      setError(params.get('message') || 'Login Google dibatalkan.');
      return undefined;
    }

    if (!code) {
      setError('Kode sesi Google tidak ditemukan. Silakan coba masuk lagi.');
      return undefined;
    }

    (async () => {
      try {
        const payload = await apiJsonSend('/api/auth/exchange', { code });
        login(payload.user, payload.token);
      } catch (exchangeError) {
        setError(exchangeError?.message || 'Gagal menukar kode sesi Google.');
      }
    })();

    return undefined;
  }, [login]);

  if (error) {
    return (
      <AuthStatus
        error={error}
        errorTitle="Login Google Gagal"
        onBack={() => navigateTo('login', { replace: true })}
      />
    );
  }

  return <AuthStatus loadingText="Menyiapkan sesi Google…" />;
};
