/**
 * Formulir Masuk (Login Form) untuk Layar Autentikasi Terpadu.
 *
 * @module src/features/auth/LoginForm
 */

import { useState } from 'react';
import { AlertCircle, Eye, EyeOff, Info, Lock, LogIn, Mail } from 'lucide-react';
import { useApp } from '@context/AppContext';
import { apiJsonSend } from '@lib/api';
import { controls } from '@lib/styles';
import { useSubmit } from '@lib/useSubmit';

/**
 * @param {object} props
 * @param {string} props.email - Nilai email bersama
 * @param {(email: string) => void} props.setEmail - Setter email bersama
 * @param {() => void} props.onForgotPassword - Handler navigasi lupa password
 * @param {boolean} [props.disabled=false] - Status form dinonaktifkan
 * @returns {import('react').JSX.Element}
 */
export const LoginForm = ({ email, setEmail, onForgotPassword, disabled = false }) => {
  const { login } = useApp();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState('');
  const { error, setError, isSubmitting, runSubmit } = useSubmit(
    'Email atau password belum sesuai.',
  );

  const handleSubmit = (event) => {
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
      const result = await apiJsonSend('/api/auth/login', {
        identifier: email.trim(),
        password,
      });
      login(result.user, result.token);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-4" noValidate>
      <label className="block">
        <span className="auth-label">Alamat email</span>
        <span className={controls.inputWrap}>
          <Mail className="auth-input-icon" aria-hidden="true" />
          <input
            type="email"
            autoComplete="email"
            data-testid="login-email"
            value={email}
            disabled={disabled || isSubmitting}
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
            onClick={onForgotPassword}
            className="auth-link text-xs"
            disabled={disabled || isSubmitting}
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
            disabled={disabled || isSubmitting}
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
            disabled={disabled || isSubmitting}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </span>
      </label>

      {error && (
        <div role="alert" className="auth-alert">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
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
        disabled={disabled || isSubmitting}
        className="auth-primary-button w-full"
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
  );
};
