import { AlertCircle } from 'lucide-react';
import { layout, typography } from '@lib/styles';

/**
 * Layar status bersama untuk alur autentikasi OAuth.
 *
 * Dipakai `AuthCallbackScreen` dan `GoogleSuccessScreen`, yang sebelumnya
 * menyalin blok JSX yang sama persis (shell + kartu error + spinner).
 *
 * Catatan: kedua berkas itu dulu memakai `typography.helperMuted` tanpa
 * mengimpor `typography`, sehingga layar error gagal render. Komponen ini
 * mengimpor `typography` dengan benar sekaligus menghapus duplikasinya.
 */
export const AuthStatus = ({ error, errorTitle, loadingText, onBack }) => {
  if (error) {
    return (
      <main className={layout.authShell}>
        <section className={layout.authCard}>
          <div className="flex flex-col items-center text-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-semantic-dangerLight">
              <AlertCircle className="h-6 w-6 text-semantic-danger" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink-900">{errorTitle}</h2>
              <p className={typography.helperMuted}>{error}</p>
            </div>
            <button type="button" onClick={onBack} className="auth-primary-button mt-2">
              Kembali ke halaman masuk
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={layout.authShell}>
      <section className={layout.authCard}>
        <div className="flex flex-col items-center text-center gap-3 py-4">
          <span className="h-5 w-5 rounded-full border-2 border-brand-300 border-t-brand-700 animate-spin" />
          <p className="text-sm font-semibold text-ink-500">{loadingText}</p>
        </div>
      </section>
    </main>
  );
};
