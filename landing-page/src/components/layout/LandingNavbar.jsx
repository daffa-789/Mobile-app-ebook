import { useState } from 'react';
import { BookOpen, Download, Menu, X, Smartphone } from 'lucide-react';
import { APK_DOWNLOAD_URL } from '@/config/constants';

export const LandingNavbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Fitur', href: '#fitur' },
    { label: 'Preview', href: '#preview' },
    { label: 'Cara Pasang', href: '#panduan' },
    { label: 'Tentang & FAQ', href: '#faq' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-cream-50 border-b border-cream-200 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand Title */}
          <a
            href="#"
            className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 rounded-lg p-1"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-700 text-cream-50 flex items-center justify-center shadow-md shadow-brand-900/10 group-hover:bg-brand-800 transition">
              <BookOpen className="w-5 h-5 text-gold-400" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-ink-900 group-hover:text-brand-700 transition">
                  Wahidiyah Book
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 text-brand-800 border border-brand-200">
                  <Smartphone className="w-3 h-3 mr-0.5" /> Mobile
                </span>
              </div>
              <span className="text-[10px] font-semibold text-ink-500 tracking-wider uppercase -mt-0.5">
                Aplikasi Android Resmi
              </span>
            </div>
          </a>

          {/* Desktop Navigation Anchors */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3.5 py-2 rounded-xl text-sm font-semibold text-ink-600 hover:text-brand-800 hover:bg-cream-100/80 transition"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop Direct APK CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href={APK_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-brand-700 text-white hover:bg-brand-800 shadow-sm shadow-brand-900/15 rounded-xl transition hover:-translate-y-0.5 cursor-pointer"
              title="Unduh Berkas APK v0.1.0 Alpha Langsung"
            >
              <Download className="w-4 h-4 text-gold-300" />
              <span>Unduh APK (v0.1.0)</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <a
              href={APK_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-brand-700 text-white rounded-lg shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-gold-300" />
              <span>APK</span>
            </a>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-ink-700 hover:text-ink-900 hover:bg-cream-100 focus:outline-none"
              aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-cream-200 bg-cream-50 px-4 pt-2 pb-6 space-y-3 animate-fadeIn">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-base font-semibold text-ink-700 hover:text-brand-800 hover:bg-cream-100 transition"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="pt-3 border-t border-cream-200">
            <a
              href={APK_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-brand-700 text-white shadow-sm"
            >
              <Download className="w-4 h-4 text-gold-300" />
              <span>Unduh APK Resmi (v0.1.0 Alpha)</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
