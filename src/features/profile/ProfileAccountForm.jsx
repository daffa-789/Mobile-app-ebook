/**
 * Komponen formulir pembaruan data profil akun pengguna (Nama, Email, WhatsApp).
 *
 * @module src/features/profile/ProfileAccountForm
 */

import { CheckCircle2, Loader2, AlertCircle, Save, User, Mail, Phone } from 'lucide-react';
import { typography, controls } from '@lib/styles';
import { displayPhone } from '@lib/phone';

/**
 * Komponen formulir akun pengguna.
 *
 * @param {object} props - Properti komponen
 * @param {string} props.name - Nilai nama lengkap
 * @param {(name: string) => void} props.setName - Setter nilai nama lengkap
 * @param {string} props.email - Alamat email pengguna (terproteksi/read-only)
 * @param {string|null} props.phone - Nomor WhatsApp pengguna
 * @param {boolean} props.isSubmitting - Indikator pemrosesan penyimpanan
 * @param {boolean} props.isNameChanged - Apakah nama telah mengalami perubahan
 * @param {string} props.errorMessage - Pesan galat bila ada
 * @param {boolean} props.savedSuccess - Indikator sukses simpan
 * @param {(e: import('react').FormEvent) => void} props.onSubmit - Handler submit form
 * @returns {import('react').JSX.Element}
 */
export const ProfileAccountForm = ({
  name,
  setName,
  email,
  phone,
  isSubmitting,
  isNameChanged,
  errorMessage,
  savedSuccess,
  onSubmit,
}) => {
  return (
    <div className="space-y-2">
      <h2 className="text-caption font-bold uppercase tracking-wider text-ink-400 px-1">
        Data Akun
      </h2>
      <div className="rounded-3xl border border-cream-300 bg-ui-card p-5 sm:p-6 shadow-xs">
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Field Nama Lengkap */}
          <div>
            <label htmlFor="edit-name-input" className={typography.legend}>
              Nama Lengkap
            </label>
            <div className="relative mt-1 flex items-center">
              <div className="pointer-events-none absolute left-3.5 flex items-center text-ink-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="edit-name-input"
                type="text"
                data-testid="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama Lengkap"
                className="h-12 w-full rounded-xl border border-cream-300 bg-cream-50 pl-10 pr-3.5 text-body font-medium text-ink-800 transition-colors duration-200 placeholder:text-ink-300 focus:border-brand-600 focus:bg-cream-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100"
              />
            </div>
          </div>

          {/* Field Email Terproteksi */}
          <div>
            <label htmlFor="edit-email-input" className={typography.legend}>
              Email Akun
            </label>
            <div className="relative mt-1 flex items-center">
              <div className="pointer-events-none absolute left-3.5 flex items-center text-ink-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="edit-email-input"
                type="email"
                data-testid="edit-email"
                value={email}
                readOnly
                className="h-12 w-full cursor-not-allowed rounded-xl border border-cream-300 bg-cream-200/50 pl-10 pr-28 text-body font-medium text-ink-500 focus-visible:outline-none"
              />
              <div className="absolute right-3 flex items-center">
                <span className="inline-flex items-center gap-1 rounded-md bg-brand-100 px-2 py-0.5 text-micro font-bold text-brand-800">
                  Terverifikasi
                </span>
              </div>
            </div>
          </div>

          {/* Field WhatsApp */}
          <div>
            <label htmlFor="edit-phone-input" className={typography.legend}>
              Nomor WhatsApp
            </label>
            <div className="relative mt-1 flex items-center">
              <div className="pointer-events-none absolute left-3.5 flex items-center text-ink-400">
                <Phone className="w-4 h-4" />
              </div>
              <div
                id="edit-phone-input"
                data-testid="edit-phone"
                className="flex h-12 w-full items-center gap-2.5 rounded-xl border border-cream-300 bg-cream-200/50 pl-10 pr-3.5 text-body font-medium text-ink-700"
              >
                {phone ? (
                  <span className="font-mono text-caption font-semibold text-ink-800">
                    {displayPhone(phone)}
                  </span>
                ) : (
                  <span className="text-ink-400">-</span>
                )}
                <span className="ml-auto inline-flex items-center rounded-md bg-cream-300/60 px-2 py-0.5 text-micro font-semibold text-ink-600">
                  Terkait
                </span>
              </div>
            </div>
            <p className="mt-1 text-micro text-ink-400">
              Nomor WhatsApp digunakan untuk pemulihan akun dan notifikasi resmi.
            </p>
          </div>

          {/* Status Pesan */}
          {errorMessage && (
            <div
              role="alert"
              className="flex items-center gap-2.5 rounded-xl border border-semantic-danger/30 bg-semantic-dangerLight p-3.5 text-caption font-semibold text-semantic-danger page-transition"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-semantic-danger" strokeWidth={2} />
              <span>{errorMessage}</span>
            </div>
          )}

          {savedSuccess && (
            <div className="flex items-center gap-2.5 rounded-xl border border-brand-200 bg-brand-50 p-3.5 text-caption font-semibold text-brand-800 page-transition">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-700" strokeWidth={2} />
              <span>Perubahan profil berhasil disimpan.</span>
            </div>
          )}

          {/* Tombol Simpan Perubahan */}
          <button
            type="submit"
            disabled={isSubmitting || !isNameChanged}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 text-body font-bold text-cream-50 shadow-sm transition-all duration-200 hover:bg-brand-800 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className={controls.spinner} />
                <span>Menyimpan…</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
