/**
 * Komponen daftar tautan bantuan dan informasi aplikasi pada layar profil.
 *
 * @module src/features/profile/ProfileNavigationLinks
 */

import { HelpCircle, Info, ChevronRight } from 'lucide-react';

/**
 * Komponen tautan navigasi bantuan dan info aplikasi.
 *
 * @param {object} props - Properti komponen
 * @param {(view: string) => void} props.onNavigate - Handler navigasi halaman
 * @returns {import('react').JSX.Element}
 */
export const ProfileNavigationLinks = ({ onNavigate }) => {
  return (
    <div className="space-y-2">
      <h2 className="text-caption font-bold uppercase tracking-wider text-ink-400 px-1">
        Bantuan & Info
      </h2>
      <div className="rounded-3xl border border-cream-300 bg-ui-card overflow-hidden shadow-xs divide-y divide-cream-200/80">
        <button
          type="button"
          onClick={() => onNavigate('help-center')}
          className="w-full flex items-center justify-between p-4.5 hover:bg-cream-100 active:bg-cream-200/70 transition-colors text-left cursor-pointer group"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ink-100 text-ink-700 group-hover:bg-ink-200 transition-colors">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-body font-bold text-ink-900 group-hover:text-brand-800 transition-colors">
                Pusat Bantuan
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-ink-300 group-hover:text-ink-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('about')}
          className="w-full flex items-center justify-between p-4.5 hover:bg-cream-100 active:bg-cream-200/70 transition-colors text-left cursor-pointer group"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ink-100 text-ink-700 group-hover:bg-ink-200 transition-colors">
              <Info className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-body font-bold text-ink-900 group-hover:text-brand-800 transition-colors">
                Tentang
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-ink-300 group-hover:text-ink-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        </button>
      </div>
    </div>
  );
};
