import { useEffect, useState } from 'react';
import { AlertCircle, Eye, EyeOff, Info, Lock, LogIn, Mail } from 'lucide-react';
import { useApp } from '@context/AppContext';
import { apiJsonSend } from '@lib/api';
import { ServerStatusBanner } from '@ui/ServerStatusBanner';
import { AuthBrandHeader } from './AuthBrandHeader';
import { layout, controls } from '@lib/styles';
import { useSubmit } from '@lib/useSubmit';

const generateState = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
};

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
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

export const LoginScreen = () => {
  const { login, navigateTo } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { error, setError, isSubmitting, runSubmit } = useSubmit(
    'Email atau password belum sesuai.',
  );
  const [notice, setNotice] = useState('');
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

  const submit = (event) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError('Masukkan alamat email dan password Anda.');
      return;
    }
    if (password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }

    setNotice('');
    return runSubmit(async () => {
      const result = await apiJsonSend('/api/auth/login', { identifier: email.trim(), password });
      login(result.user, result.token);
    });
  };

  const handleGoogleLogin = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError('Konfigurasi VITE_GOOGLE_CLIENT_ID belum diisi di .env.');
      return;
    }

    const state = generateState();
    document.cookie = `google_oauth_state=${encodeURIComponent(state)}; Path=/; Max-Age=600; SameSite=Lax`;

    const redirectUri = `${window.location.origin}/api/auth/google/callback`;
    const scope = encodeURIComponent('openid email profile');
    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${scope}` +
      `&state=${encodeURIComponent(state)}` +
      `&access_type=online` +
      `&prompt=select_account`;

    setIsGoogleSubmitting(true);
    setError('');

    window.location.href = authUrl;
  };

  return (
    <main className={layout.authShell}>
      <section className={layout.authCard}>
        <AuthBrandHeader title="Masuk ke akun" />

        <ServerStatusBanner />

        <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
          <label className="block">
            <span className="auth-label">Alamat email</span>
            <span className={controls.inputWrap}>
              <Mail className="auth-input-icon" aria-hidden="true" />
              <input
                type="email"
                autoComplete="email"
                data-testid="login-email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError('');
                }}
                placeholder="nama@email.com"
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center justify-between gap-3">
              <span className="auth-label">Password</span>
              <button
                type="button"
                onClick={() => navigateTo('forgot-password')}
                className="auth-link"
              >
                Lupa password?
              </button>
            </span>
            <span className="auth-input-wrap">
              <Lock className="auth-input-icon" aria-hidden="true" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                data-testid="login-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError('');
                }}
                placeholder="Minimal 8 karakter"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="auth-icon-button"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </span>
          </label>

          {error && (
            <div role="alert" className="auth-alert">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {notice && (
            <div
              role="status"
              className="flex items-start gap-2 rounded-2xl border border-semantic-info/30 bg-semantic-infoLight p-3 text-xs font-semibold text-semantic-info page-transition"
            >
              <Info className="h-4 w-4 shrink-0 text-semantic-info mt-0.5" />
              <span>{notice}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || isGoogleSubmitting}
            className="auth-primary-button"
          >
            {isSubmitting ? (
              <>
                <span className="auth-spinner" />
                Memeriksa akun…
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Masuk
              </>
            )}
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-cream-300" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-cream-50 px-3 font-semibold tracking-wider text-ink-500">atau</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isSubmitting || isGoogleSubmitting}
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
              Masuk dengan Google
            </>
          )}
        </button>

        <div className="mt-6 border-t border-cream-200 pt-5 text-center text-sm text-ink-500">
          Belum memiliki akun?{' '}
          <button
            type="button"
            onClick={() => navigateTo('register')}
            className="auth-link font-bold"
          >
            Daftar sekarang
          </button>
        </div>
      </section>
    </main>
  );
};
