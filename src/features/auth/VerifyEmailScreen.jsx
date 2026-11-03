/**
 * Layar Verifikasi Kode OTP (Email & WhatsApp).
 * Menangani verifikasi kode numerik 6 digit untuk registrasi akun baru
 * dan pembaruan kata sandi (Lupa Password).
 *
 * @module src/features/auth/VerifyEmailScreen
 */

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useApp } from '@context/AppContext';
import { apiJson } from '@lib/api';
import { layout, typography, controls } from '@lib/styles';
import { displayPhone } from '@lib/phone';
import { PasswordResetSuccess } from './PasswordResetSuccess';
import { OtpDevNotice } from './OtpDevNotice';
import { OtpResendAction } from './OtpResendAction';

/**
 * Komponen utama layar verifikasi kode OTP.
 *
 * @returns {import('react').JSX.Element}
 */
export const VerifyEmailScreen = () => {
  const { verification, clearVerification, login, navigateTo } = useApp();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendNotice, setResendNotice] = useState('');
  const [done, setDone] = useState(false);

  const [completedTarget, setCompletedTarget] = useState('');
  const [devOtp, setDevOtp] = useState(verification?.devOtp || '');
  const [deliveredBy, setDeliveredBy] = useState(verification?.deliveredBy || '');
  const codeInputRef = useRef(null);

  const method =
    verification?.method || (verification?.phone && !verification?.email ? 'whatsapp' : 'email');
  const isWhatsApp = method === 'whatsapp';
  const target = isWhatsApp
    ? verification?.phone || verification?.identifier || verification?.email || ''
    : verification?.email || verification?.identifier || verification?.phone || '';
  const email = verification?.email || '';
  const phone = verification?.phone || '';
  const purpose = verification?.purpose === 'reset' ? 'reset' : 'register';
  const isReset = purpose === 'reset';
  const deliveryFailed = deliveredBy === 'demo';

  const startedRef = useRef(false);
  useEffect(() => {
    if (target) {
      startedRef.current = true;
      return;
    }
    if (!startedRef.current) {
      navigateTo(isReset ? 'forgot-password' : 'register', { replace: true });
    }
  }, [target, isReset, navigateTo]);

  useEffect(() => {
    codeInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timer = setTimeout(() => setResendCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const submit = async (event) => {
    event.preventDefault();
    const trimmed = code.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      setError('Kode verifikasi tidak valid.');
      return;
    }
    if (isReset) {
      if (password.length < 8) return setError('Password baru minimal 8 karakter.');
      if (password !== confirmation) return setError('Konfirmasi password belum sesuai.');
    }

    setIsSubmitting(true);
    setError('');
    try {
      if (isReset) {
        await apiJson('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method,
            identifier: target,
            email,
            phone,
            code: trimmed,
            password,
          }),
        });
        clearVerification();
        setCompletedTarget(target);
        setDone(true);
      } else {
        const result = await apiJson('/api/auth/verify-registration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method,
            identifier: target,
            email,
            phone,
            code: trimmed,
          }),
        });
        clearVerification();
        login(result.user, result.token);
      }
    } catch (requestError) {
      setError(requestError.message || 'Kode belum dapat diverifikasi.');
      setCode('');
      codeInputRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resend = async () => {
    if (resendCooldown > 0) return;
    setIsResending(true);
    setError('');
    setResendNotice('');
    try {
      const result = await apiJson('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method,
          identifier: target,
          email,
          phone,
          purpose,
        }),
      });
      setResendNotice(result.message || 'Kode baru telah dikirim.');
      if (result.deliveredBy) setDeliveredBy(result.deliveredBy);
      if (result.devOtp) setDevOtp(result.devOtp);
      setCode('');
      codeInputRef.current?.focus();
      setResendCooldown(60);
    } catch (requestError) {
      setError(requestError.message || 'Kode belum dapat dikirim ulang.');
    } finally {
      setIsResending(false);
    }
  };

  if (done) {
    return (
      <PasswordResetSuccess
        targetAccount={completedTarget || target}
        onGoToLogin={() => navigateTo('login', { replace: true })}
      />
    );
  }

  return (
    <main className={layout.authShell}>
      <section className={layout.authCard}>
        <button
          type="button"
          onClick={() => {
            clearVerification();
            navigateTo(isReset ? 'forgot-password' : 'register', { replace: true });
          }}
          className="mb-6 inline-flex min-h-6 items-center gap-1 px-1 text-xs font-bold text-ink-400 transition hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>

        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900">
          {deliveryFailed
            ? isWhatsApp
              ? 'WhatsApp belum terkirim'
              : 'Email belum terkirim'
            : isWhatsApp
              ? 'Cek WhatsApp Anda'
              : 'Cek email Anda'}
        </h1>
        <p className={typography.helperRelaxed}>
          {deliveryFailed
            ? isReset
              ? 'Kode pemulihan gagal dikirim ke '
              : 'Kode verifikasi gagal dikirim ke '
            : isReset
              ? 'Kami mengirim kode pemulihan ke '
              : 'Kami mengirim kode verifikasi ke '}
          {isWhatsApp && target ? (
            <span className="font-bold text-ink-800 align-baseline">{displayPhone(target)}</span>
          ) : (
            <strong className="text-ink-700">{target}</strong>
          )}{' '}
          via {isWhatsApp ? 'WhatsApp' : 'email'}.{' '}
          {deliveryFailed
            ? 'Server gagal menyerahkan kode. Coba "Kirim ulang kode" di bawah, atau kembali dan pilih metode lain. '
            : isWhatsApp
              ? 'Buka aplikasi WhatsApp Anda, lalu masukkan kodenya di bawah. '
              : 'Buka kotak masuk (dan folder spam), lalu masukkan kodenya di bawah. '}
          Kode berlaku 10 menit.
        </p>

        <OtpDevNotice devOtp={devOtp} isWhatsApp={isWhatsApp} />

        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          <label className="block">
            <span className="auth-label">Kode verifikasi (6 angka)</span>
            <span className={controls.inputWrap}>
              <input
                ref={codeInputRef}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(event) => {
                  setCode(event.target.value.replace(/\D/g, ''));
                  setError('');
                }}
                placeholder="Kode"
                className="font-mono tracking-[0.35em]"
              />
            </span>
          </label>

          {isReset && (
            <>
              <label className="block">
                <span className="auth-label">Password baru</span>
                <span className={controls.inputWrap}>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError('');
                    }}
                    placeholder="Minimal 8 karakter"
                  />
                </span>
              </label>
              <label className="block">
                <span className="auth-label">Ulangi password baru</span>
                <span className={controls.inputWrap}>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirmation}
                    onChange={(event) => {
                      setConfirmation(event.target.value);
                      setError('');
                    }}
                    placeholder="Tulis ulang password"
                  />
                </span>
              </label>
            </>
          )}

          {error && (
            <div role="alert" className="auth-alert">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {resendNotice && (
            <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-xs font-semibold text-brand-800">
              {resendNotice}
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className="auth-primary-button">
            {isSubmitting ? (
              <>
                <span className="auth-spinner" />
                Memverifikasi…
              </>
            ) : isReset ? (
              'Simpan password baru'
            ) : (
              'Verifikasi & buat akun'
            )}
          </button>
        </form>

        <OtpResendAction
          isResending={isResending}
          resendCooldown={resendCooldown}
          onResend={resend}
          isReset={isReset}
          isWhatsApp={isWhatsApp}
          onReRegister={() => {
            clearVerification();
            navigateTo('register', { replace: true });
          }}
        />
      </section>
    </main>
  );
};
