import { CheckCircle2 } from 'lucide-react';
import { layout, typography } from '@lib/styles';

export const PasswordResetSuccess = ({ targetAccount, onGoToLogin }) => {
  return (
    <main className={layout.authShell}>
      <section className={layout.authCard}>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-ink-900">
          Password diperbarui
        </h1>
        <p className={typography.helperRelaxed}>
          Password akun <strong className="text-ink-700">{targetAccount}</strong> sudah diganti.
          Silakan masuk dengan password baru Anda.
        </p>
        <button type="button" onClick={onGoToLogin} className="auth-primary-button mt-7">
          Masuk sekarang
        </button>
      </section>
    </main>
  );
};
