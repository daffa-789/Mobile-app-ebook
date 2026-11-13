import React, { useState, useMemo, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '@context/AppContext';
import { SidebarContent } from '../layout/SidebarContent';
import { LogoutConfirmDialog } from '../layout/LogoutConfirmDialog';
import { MobileBottomNav } from '../layout/MobileBottomNav';
import { buildSidebarSections, ACTIVE_KEYS_BY_SCREEN } from '../layout/navigationConfig';

const SUBPAGE_TITLES = {
  'help-center': 'Pusat Bantuan',
  help: 'Pusat Bantuan',
  'subscription-history': 'Riwayat Langganan',
  riwayat: 'Riwayat Langganan',
  about: 'Tentang',
  'profile-edit': 'Profil',
  profile: 'Profil',
};

const DeviceFrameBase = ({ children }) => {
  const { currentScreen, navigateTo, logout } = useApp();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const activeKeys = useMemo(() => ACTIVE_KEYS_BY_SCREEN[currentScreen] || [], [currentScreen]);
  const sections = useMemo(() => buildSidebarSections(activeKeys), [activeKeys]);

  const handleNavClick = useCallback(
    (target) => {
      if (target === 'logout') {
        setLogoutConfirmOpen(true);
        return;
      }
      navigateTo(target);
    },
    [navigateTo],
  );

  const handleConfirmLogout = useCallback(() => {
    setLogoutConfirmOpen(false);
    logout();
  }, [logout]);

  return (
    <div className="app-surface relative flex min-h-screen w-full flex-col bg-cream-50 font-sans text-ink-800 md:flex-row">
      {/* Sidebar Desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 hidden shrink-0 select-none flex-col border-r border-cream-50/[0.06] bg-ink-900 transition-[width] duration-300 ease-out md:flex ${
          sidebarCollapsed ? 'w-[68px]' : 'w-[218px]'
        }`}
      >
        <div className={`h-full w-full ${sidebarCollapsed ? 'px-2 py-3' : 'px-3 py-4'}`}>
          <SidebarContent
            onNavClick={handleNavClick}
            isCollapsed={sidebarCollapsed}
            sections={sections}
            setSidebarCollapsed={setSidebarCollapsed}
          />
        </div>
      </aside>

      {/* Dialog Konfirmasi Logout */}
      <LogoutConfirmDialog
        isOpen={logoutConfirmOpen}
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={handleConfirmLogout}
      />

      {/* Konten Halaman Utama */}
      <div
        className={`flex min-h-screen min-w-0 flex-1 flex-col bg-cream-50 transition-[margin] duration-300 ease-out ${
          sidebarCollapsed ? 'md:ml-[68px]' : 'md:ml-[218px]'
        }`}
      >
        {/* Header Subpage dengan Tombol Kembali (Mobile, Tablet, & Desktop).
            Padding atas sengaja lebih besar agar tombol tidak menempel pada
            tepi/status bar HP dan isi halaman Pengaturan tidak terlalu ke atas. */}
        {SUBPAGE_TITLES[currentScreen] && (
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-cream-300 bg-cream-50/95 px-4 sm:px-6 pt-6 pb-2.5 sm:pt-5 sm:pb-3.5 backdrop-blur-md">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) {
                  window.history.back();
                } else {
                  navigateTo(
                    currentScreen === 'profile-edit' || currentScreen === 'profile'
                      ? 'home'
                      : 'profile-edit',
                  );
                }
              }}
              className="flex items-center gap-2 text-ink-800 hover:text-ink-900 active:opacity-75 cursor-pointer -ml-1 py-1 px-2.5 rounded-xl transition hover:bg-cream-200/60"
              aria-label="Kembali"
            >
              <ArrowLeft className="w-5 h-5 text-ink-700" strokeWidth={2.2} />
              <span className="font-sans text-base font-semibold tracking-normal text-ink-900">
                {SUBPAGE_TITLES[currentScreen]}
              </span>
            </button>
          </header>
        )}

        <main className="flex w-full flex-1 flex-col">
          <div className="relative flex w-full flex-1 flex-col bg-cream-50 pb-20 md:pb-0">
            {children}
          </div>
        </main>
      </div>

      {/* Navigasi Bawah Mobile */}
      <MobileBottomNav activeKeys={activeKeys} onNavClick={handleNavClick} />
    </div>
  );
};

export const DeviceFrame = React.memo(DeviceFrameBase);
