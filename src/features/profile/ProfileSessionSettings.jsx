/**
 * Komponen pengaturan preferensi tampilan tema (Dark/Light) dan aksi keluar (Logout).
 *
 * @module src/features/profile/ProfileSessionSettings
 */

import { LogOut } from 'lucide-react';

/**
 * Komponen pengaturan tema dan sesi akun.
 *
 * @param {object} props - Properti komponen
 * @param {boolean} props.isDark - Status aktif mode gelap
 * @param {() => void} props.onToggleTheme - Handler pergantian mode tema
 * @param {() => void} props.onRequestLogout - Handler pembukaan dialog konfirmasi logout
 * @returns {import('react').JSX.Element}
 */
export const ProfileSessionSettings = ({ isDark, onToggleTheme, onRequestLogout }) => {
  return (
    <div className="space-y-2">
      <h2 className="text-caption font-bold uppercase tracking-wider text-ink-400 px-1">
        Pengaturan & Sesi
      </h2>
      <div className="rounded-3xl border border-cream-300 bg-ui-card p-5 sm:p-6 shadow-xs space-y-4">
        {/* Slider Switch Mode Gelap / Terang */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-body font-bold text-ink-900">Mode Tampilan</p>
            <p className="text-caption text-ink-500">
              {isDark ? 'Mode Gelap (Malam) aktif' : 'Mode Terang (Siang) aktif'}
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            onClick={onToggleTheme}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
              isDark ? 'bg-brand-700' : 'bg-cream-300'
            }`}
            title={isDark ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
            aria-label="Peralihan tema gelap dan terang"
          >
            <span
              className={`pointer-events-none inline-flex h-6 w-6 transform rounded-full bg-cream-50 shadow-md ring-0 transition duration-200 ease-in-out ${
                isDark ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Tombol Logout */}
        <div className="border-t border-cream-200 pt-3">
          <button
            type="button"
            onClick={onRequestLogout}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-semantic-danger/30 bg-semantic-dangerLight text-semantic-danger text-caption font-bold hover:bg-semantic-danger/15 active:bg-semantic-danger/25 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};
