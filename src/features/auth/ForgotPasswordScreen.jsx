import { useState } from 'react';
import { AlertCircle, ArrowLeft, KeyRound, Mail, Phone } from 'lucide-react';
import { useApp } from '@context/AppContext';
import { apiJsonSend } from '@lib/api';
import { layout, typography, controls } from '@lib/styles';
import { useSubmit } from '@lib/useSubmit';
import { PhoneInput } from '@ui/PhoneInput';

export const ForgotPasswordScreen = () => {
  const { navigateTo, setVerification } = useApp();
  const [method, setMethod] = useState('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const { error, setError, isSubmitting, runSubmit } = useSubmit(
    'Permintaan belum dapat diproses.',
  );

  const submit = (event) => {
    event.preventDefault();

    if (method === 'whatsapp') {
      const standardPhone = String(phone || '')
        .trim()
        .replace(/[^0-9]/g, '');
      if (!standardPhone || standardPhone.length < 8 || standardPhone.length > 15) {
        setError('Masukkan nomor WhatsApp yang valid.');
        return;
      }

      return runSubmit(async () => {
        const result = await apiJsonSend('/api/auth/request-password-reset', {
          method: 'whatsapp',
          phone: standardPhone,
        });
        setVerification({
          phone: standardPhone,
          method: 'whatsapp',
          identifier: standardPhone,
          purpose: 'reset',
          devOtp: result.devOtp,
        });
        navigateTo('verify-email');
      });
    }

    const target = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(target)) {
      setError('Masukkan alamat email yang valid.');
      return;
    }

    return runSubmit(async () => {
      const result = await apiJsonSend('/api/auth/request-password-reset', {
        method: 'email',
        email: target,
      });
      setVerification({
        email: target,
        method: 'email',
        identifier: target,
        purpose: 'reset',
        devOtp: result.devOtp,
      });
      navigateTo('verify-email');
    });
  };

  return (
    <main className={layout.authShell}>
      <section className={layout.authCard}>
        <button
          type="button"
          onClick={() => navigateTo('login')}
          className="mb-6 inline-flex min-h-6 items-center gap-1 px-1 text-xs font-bold text-ink-400 transition hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke masuk
        </button>

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <KeyRound className="h-6 w-6" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-ink-900">
          Atur ulang password
        </h1>
        <p className={typography.helperRelaxed}>
          {method === 'whatsapp'
            ? 'Opsi alternatif jika Anda tidak dapat membuka email. Kami akan mengirimkan kode 6 angka ke nomor WhatsApp terdaftar.'
            : 'Prioritas utama pemulihan akun. Kami akan mengirimkan kode verifikasi 6 angka ke alamat email terdaftar Anda.'}
        </p>

        {/* Tab Selector Metode Reset: Prioritas Email, WhatsApp sebagai Opsi Cadangan */}
        <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-cream-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMethod('email');
              setError('');
            }}
            className={`flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-bold transition ${
              method === 'email'
                ? 'bg-cream-50 text-brand-800 shadow-sm'
                : 'text-ink-500 hover:text-ink-800'
            }`}
          >
            <Mail className="h-3.5 w-3.5 text-brand-600" />
            Email (Utama)
          </button>
          <button
            type="button"
            onClick={() => {
              setMethod('whatsapp');
              setError('');
            }}
            className={`flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-bold transition ${
              method === 'whatsapp'
                ? 'bg-cream-50 text-brand-800 shadow-sm'
                : 'text-ink-500 hover:text-ink-800'
            }`}
          >
            <Phone className="h-3.5 w-3.5 text-brand-600" />
            WhatsApp (Cadangan)
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
          {method === 'whatsapp' ? (
            <div className="block">
              <label htmlFor="forgot-phone" className="auth-label">
                Nomor WhatsApp
              </label>
              <PhoneInput
                id="forgot-phone"
                value={phone}
                onChange={(val) => {
                  setPhone(val);
                  setError('');
                }}
                className="mt-1.5"
              />
            </div>
          ) : (
            <label className="block">
              <span className="auth-label">Alamat email</span>
              <span className={controls.inputWrap}>
                <Mail className="auth-input-icon" />
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError('');
                  }}
                  placeholder="nama@email.com"
                />
              </span>
            </label>
          )}

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
                Memproses…
              </>
            ) : (
              'Kirim kode verifikasi'
            )}
          </button>
        </form>

        <p className="mt-5 text-center text-caption leading-relaxed text-ink-400">
          Akun yang dibuat lewat Google tidak punya password. Untuk akun seperti itu, gunakan tombol{' '}
          <strong className="text-ink-600">Login dengan Google</strong> di halaman masuk.
        </p>
      </section>
    </main>
  );
};
