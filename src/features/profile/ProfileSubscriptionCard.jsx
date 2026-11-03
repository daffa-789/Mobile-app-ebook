/**
 * Komponen kartu navigasi riwayat langganan dan akses Pro pengguna.
 *
 * @module src/features/profile/ProfileSubscriptionCard
 */

import { ReceiptText, ChevronRight } from 'lucide-react';

/**
 * Komponen ringkasan dan tautan riwayat langganan.
 *
 * @param {object} props - Properti komponen
 * @param {(view: string) => void} props.onNavigate - Handler navigasi halaman
 * @returns {import('react').JSX.Element}
 */
export const ProfileSubscriptionCard = ({ onNavigate }) => {
  return (
    <div className="space-y-2">
      <h2 className="text-caption font-bold uppercase tracking-wider text-ink-400 px-1">
        Layanan & Langganan
      </h2>
      <div className="rounded-3xl border border-cream-300 bg-ui-card overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => onNavigate('subscription-history')}
          className="w-full flex items-center justify-between p-4.5 hover:bg-cream-100 active:bg-cream-200/70 transition-colors text-left cursor-pointer group"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 group-hover:bg-brand-100 transition-colors">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-body font-bold text-ink-900 group-hover:text-brand-800 transition-colors">
                Riwayat Langganan
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-ink-300 group-hover:text-ink-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        </button>
      </div>
    </div>
  );
};
