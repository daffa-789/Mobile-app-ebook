import { useEffect, useState } from 'react';
import { supabase } from '@lib/supabase';
import { useApp } from '@context/AppContext';
import { apiJsonSend } from '@lib/api';
import { AuthStatus } from '@ui/AuthStatus';

export const AuthCallbackScreen = () => {
  const { login, navigateTo } = useApp();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const handleCallback = async () => {
      try {
        if (!supabase) {
          throw new Error('Supabase belum terkonfigurasi.');
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!session) {
          throw new Error('Sesi Google tidak ditemukan. Silakan coba lagi.');
        }

        const result = await apiJsonSend('/api/auth/google-supabase', {
          access_token: session.access_token,
          user: {
            id: session.user.id,
            email: session.user.email,
            name:
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              session.user.email?.split('@')[0] ||
              'Pengguna',
          },
        });

        if (!cancelled && result.token && result.user) {
          login(result.user, result.token);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Gagal masuk dengan akun Google.');
        }
      }
    };

    handleCallback();
    return () => {
      cancelled = true;
    };
  }, [login]);

  if (error) {
    return (
      <AuthStatus
        error={error}
        errorTitle="Gagal Masuk"
        onBack={() => navigateTo('login', { replace: true })}
      />
    );
  }

  return <AuthStatus loadingText="Memverifikasi akun Google…" />;
};
