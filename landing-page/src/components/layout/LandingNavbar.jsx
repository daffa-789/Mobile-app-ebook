import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { BookOpen, Crown, Download, LogOut, Menu, User, X } from 'lucide-react';
import { useApp } from '@context/AppContext';

export const LandingNavbar = () => {
  const { user, isLoggedIn, logout } = useApp();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navLinks = [
    { label: 'Beranda', to: '/' },
    { label: 'Katalog', to: '/catalog' },
    { label: 'Langganan Pro', to: '/pro' },
    { label: 'Tentang', to: '/about' },
    { label: 'Bantuan', to: '/help' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-cream-50/95 backdrop-blur-md border-b border-cream-200 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand Title */}
          <Link
            to="/"
            className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 rounded-lg p-1"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-700 text-cream-50 flex items-center justify-center shadow-md shadow-brand-900/10 group-hover:bg-brand-800 transition">
              <BookOpen className="w-5 h-5 text-gold-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-ink-900 group-hover:text-brand-700 transition">
                Wahidiyah Book
              </span>
              <span className="text-[10px] font-semibold text-ink-400 tracking-wider uppercase -mt-0.5">
                Perpustakaan Digital
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold transition ${
                    active
                      ? 'text-brand-700 bg-brand-50 shadow-xs'
                      : 'text-ink-600 hover:text-ink-900 hover:bg-cream-100'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Auth State / CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="https://expo.dev/artifacts/eas/qdKRlQGtuS4qap2eylCUfl46_HuxOLHgo3p9tUPCQHs.apk"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gold-400/20 text-gold-800 hover:bg-gold-400/30 border border-gold-500/40 rounded-xl transition cursor-pointer"
              title="Unduh Aplikasi Android (.APK)"
            >
              <Download className="w-3.5 h-3.5 text-gold-700" />
              <span>Unduh APK</span>
            </a>

            {isLoggedIn ? (
              <div className="flex items-center gap-3 pl-2 border-l border-cream-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center font-bold text-xs">
                    {user?.name ? user.name[0].toUpperCase() : <User className="w-4 h-4" />}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-ink-900 truncate max-w-[120px]">
                      {user?.name || 'Pembaca'}
                    </span>
                    {user?.isPro ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-gold-600">
                        <Crown className="w-2.5 h-2.5" /> PRO
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-ink-400">Reguler</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="p-2 text-ink-400 hover:text-semantic-danger rounded-xl hover:bg-semantic-dangerLight transition cursor-pointer"
                  title="Keluar"
                  aria-label="Keluar"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-bold text-brand-800 hover:text-brand-900 rounded-xl hover:bg-brand-50 transition"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-bold bg-brand-700 hover:bg-brand-800 active:bg-brand-900 text-cream-50 rounded-xl shadow-sm transition"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigasi menu"
              className="p-2 rounded-xl text-ink-600 hover:text-ink-900 hover:bg-cream-100 transition cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-cream-200 bg-cream-50/98 px-4 pt-3 pb-6 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-xl text-base font-semibold transition ${
                    active
                      ? 'text-brand-800 bg-brand-50 font-bold'
                      : 'text-ink-700 hover:bg-cream-100'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-cream-200">
            {isLoggedIn ? (
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center font-bold text-sm">
                    {user?.name ? user.name[0].toUpperCase() : <User className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink-900">{user?.name || 'Pembaca'}</p>
                    <p className="text-xs text-ink-400">
                      {user?.isPro ? 'Member Pro Aktif' : 'Akun Reguler'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-semantic-danger bg-semantic-dangerLight rounded-xl cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 text-sm font-bold text-brand-800 border border-brand-700/30 rounded-xl"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 text-sm font-bold bg-brand-700 text-cream-50 rounded-xl shadow-sm"
                >
                  Daftar Sekarang
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
