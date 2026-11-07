import { BookOpen, Download, Smartphone } from 'lucide-react';
import { APK_DOWNLOAD_URL } from '@/config/constants';

export const LandingNavbar = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-cream-50 border-b border-cream-200 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand Title */}
          <a
            href="/"
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

          {/* Direct APK CTA */}
          <div className="flex items-center gap-3">
            <a
              href={APK_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold bg-brand-700 text-white hover:bg-brand-800 shadow-sm shadow-brand-900/15 rounded-xl transition hover:-translate-y-0.5 cursor-pointer"
              title="Unduh Berkas APK Resmi Langsung"
            >
              <Download className="w-4 h-4 text-gold-300" />
              <span>Unduh APK</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
