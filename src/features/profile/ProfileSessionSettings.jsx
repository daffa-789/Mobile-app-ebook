/**
 * Komponen pengaturan aksi keluar (Logout) pada layar profil.
 *
 * @module src/features/profile/ProfileSessionSettings
 */

import { LogOut } from 'lucide-react';

/**
 * Komponen aksi sesi akun.
 *
 * @param {object} props - Properti komponen
 * @param {() => void} props.onRequestLogout - Handler pembukaan dialog konfirmasi logout
 * @returns {import('react').JSX.Element}
 */
export const ProfileSessionSettings = ({ onRequestLogout }) => {
  return (
    <div className="space-y-2">
      <h2 className="text-caption font-bold uppercase tracking-wider text-ink-400 px-1">
        Pengaturan & Sesi
      </h2>
      <div className="rounded-3xl border border-cream-300 bg-ui-card p-5 sm:p-6 shadow-xs space-y-4">
        {/* Tombol Logout */}
        <div>
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
