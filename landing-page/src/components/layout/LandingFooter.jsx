import { BookOpen, Heart, Shield, Smartphone } from 'lucide-react';

export const LandingFooter = () => {
  return (
    <footer className="border-t border-cream-200 bg-cream-100 text-ink-600 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-700 text-cream-50 flex items-center justify-center shadow-xs">
              <BookOpen className="w-4 h-4 text-gold-400" />
            </div>
            <div>
              <span className="font-serif text-lg font-bold text-ink-900 tracking-tight block">
                Mobile-app-ebook
              </span>
              <span className="text-xs text-ink-500 font-medium">
                Aplikasi Android Kitab Sholawat Wahidiyah
              </span>
            </div>
          </div>

          {/* Badges & Attribution */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-ink-500 font-medium">
            <span className="inline-flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-brand-600" /> Naskah Resmi & Terverifikasi
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-brand-600" /> Khusus Android 8.0+
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-ink-700">
              Yayasan Perjuangan Wahidiyah
            </span>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-cream-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-ink-500 gap-3">
          <p>&copy; {new Date().getFullYear()} Mobile-app-ebook. Hak Cipta Dilindungi.</p>
          <p className="flex items-center gap-1">
            Dibangun dengan penuh khidmah{' '}
            <Heart className="w-3.5 h-3.5 text-semantic-danger fill-semantic-danger" /> untuk
            Pengamal Sholawat Wahidiyah
          </p>
        </div>
      </div>
    </footer>
  );
};
