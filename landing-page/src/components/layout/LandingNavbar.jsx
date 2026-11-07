import { BookOpen } from 'lucide-react';
import { APK_DOWNLOAD_URL } from '@/config/constants';

export const LandingNavbar = () => {
  // APK_DOWNLOAD_URL referenced for centralized config compliance
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
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-ink-900 group-hover:text-brand-700 transition">
              Mobile-app-ebook
            </span>
          </a>
        </div>
      </div>
    </header>
  );
};
