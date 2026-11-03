import { useState } from 'react';
import { AlertCircle, Eye, EyeOff, Lock, Mail, UserRound } from 'lucide-react';
import { useApp } from '@context/AppContext';
import { apiJsonSend } from '@lib/api';
import { ServerStatusBanner } from '@ui/ServerStatusBanner';
import { PhoneInput } from '@ui/PhoneInput';
import { AuthBrandHeader } from './AuthBrandHeader';
import { layout, controls } from '@lib/styles';
import { useSubmit } from '@lib/useSubmit';

export const RegisterScreen = () => {
  const { navigateTo, setVerification } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const deliveryMethod = 'email';

  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { error, setError, isSubmitting, runSubmit } = useSubmit(
    'Pendaftaran belum dapat diproses.',
  );

  const submit = (event) => {
    event.preventDefault();
    if (!name.trim()) return setError('Nama lengkap wajib diisi.');
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim()))
      return setError('Masukkan alamat email yang valid.');

    const standardPhone = String(phone || '')
      .trim()
      .replace(/[^0-9]/g, '');
    if (!standardPhone || standardPhone.length < 8 || standardPhone.length > 15) {
      return setError('Masukkan nomor WhatsApp yang valid.');
    }

    if (password.length < 8) return setError('Password minimal 8 karakter.');
    if (password !== confirmation) return setError('Konfirmasi password belum sesuai.');

    return runSubmit(async () => {
      const targetEmail = email.trim().toLowerCase();
      const result = await apiJsonSend('/api/auth/register', {
        name: name.trim(),
        email: targetEmail,
        phone: standardPhone,
        password,
        deliveryMethod,
      });

      setVerification({
        email: targetEmail,
        phone: standardPhone,
        method: deliveryMethod,
        identifier: result.identifier,
        purpose: 'register',
        deliveredBy: result.deliveredBy,
        devOtp: result.devOtp,
      });
      navigateTo('verify-email');
    });
  };

  return (
    <main className={layout.authShell}>
      <section className={layout.authCard}>
        <AuthBrandHeader title="Buat akun" />

        <ServerStatusBanner />

        <form onSubmit={submit} className="mt-4 space-y-3.5" noValidate>
          <label className="block">
            <span className="auth-label">Nama lengkap</span>
            <span className={controls.inputWrap}>
              <UserRound className="auth-input-icon" />
              <input
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError('');
                }}
                autoComplete="name"
                placeholder="Nama Anda"
              />
            </span>
          </label>
          <label className="block">
            <span className="auth-label">Alamat email</span>
            <span className={controls.inputWrap}>
              <Mail className="auth-input-icon" />
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError('');
                }}
                autoComplete="email"
                placeholder="nama@email.com"
              />
            </span>
          </label>

          <div className="block">
            <label htmlFor="reg-phone" className="auth-label">
              Nomor WhatsApp
            </label>
            <PhoneInput
              id="reg-phone"
              value={phone}
              onChange={(val) => {
                setPhone(val);
                setError('');
              }}
              className="mt-1.5"
            />
          </div>

          <label className="block">
            <span className="auth-label">Password</span>
            <span className={controls.inputWrap}>
              <Lock className="auth-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError('');
                }}
                autoComplete="new-password"
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
          <label className="block">
            <span className="auth-label">Konfirmasi password</span>
            <span className={controls.inputWrap}>
              <Lock className="auth-input-icon" />
              <input
                type={showConfirmation ? 'text' : 'password'}
                value={confirmation}
                onChange={(event) => {
                  setConfirmation(event.target.value);
                  setError('');
                }}
                autoComplete="new-password"
                placeholder="Tulis ulang password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmation((value) => !value)}
                className="auth-icon-button"
                aria-label={
                  showConfirmation ? 'Sembunyikan konfirmasi password' : 'Tampilkan ulang password'
                }
              >
                {showConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </span>
          </label>

          {error && (
            <div role="alert" className="auth-alert">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          <button type="submit" disabled={isSubmitting} className="auth-primary-button">
            {isSubmitting ? (
              <>
                <span className="auth-spinner" />
                Mendaftar…
              </>
            ) : (
              'Daftar'
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-cream-200 pt-5 text-center text-sm text-ink-500">
          Sudah punya akun?{' '}
          <button type="button" onClick={() => navigateTo('login')} className="auth-link font-bold">
            Masuk
          </button>
        </div>
      </section>
    </main>
  );
};
