import { BookOpen, Download, Heart, Shield, Smartphone } from 'lucide-react';
import { APK_DOWNLOAD_URL } from '@/config/constants';

export const LandingFooter = () => {
  return (
    <footer className="border-t border-cream-200 bg-cream-100 text-ink-600 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-700 text-cream-50 flex items-center justify-center shadow-xs">
                <BookOpen className="w-5 h-5 text-gold-400" />
              </div>
              <div>
                <span className="font-serif text-xl font-bold text-ink-900 tracking-tight block">
                  Wahidiyah Book
                </span>
                <span className="text-xs text-ink-500 font-medium">
                  Aplikasi Android Kitab Sholawat Wahidiyah
                </span>
              </div>
            </div>
            <p className="text-sm text-ink-600 leading-relaxed max-w-md">
              Aplikasi mobile resmi untuk membaca lembaran Sholawat Wahidiyah, panduan mujahadah,
              kalender agenda amaliyah, dan khazanah literatur secara mudah, nyaman, dan offline di
              perangkat Android Anda.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-ink-600 pt-1">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Shield className="w-3.5 h-3.5 text-brand-600" /> Naskah Resmi & Terverifikasi
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Smartphone className="w-3.5 h-3.5 text-brand-600" /> Khusus Android 8.0+
              </span>
            </div>
          </div>

          {/* Quick Anchor Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-ink-900 uppercase tracking-wider">
              Navigasi Laman
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#fitur" className="hover:text-brand-700 transition">
                  Fitur Utama
                </a>
              </li>
              <li>
                <a href="#preview" className="hover:text-brand-700 transition">
                  Preview Aplikasi
                </a>
              </li>
              <li>
                <a href="#panduan" className="hover:text-brand-700 transition">
                  Panduan Pemasangan APK
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-brand-700 transition">
                  Tentang & Tanya Jawab (FAQ)
                </a>
              </li>
            </ul>
          </div>

          {/* Download & Version Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-ink-900 uppercase tracking-wider">Unduh Resmi</h4>
            <div className="space-y-2 text-sm">
              <a
                href={APK_DOWNLOAD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-700 text-white font-semibold text-xs hover:bg-brand-800 transition"
              >
                <Download className="w-3.5 h-3.5 text-gold-300" />
                <span>Unduh APK v0.1.0</span>
              </a>
              <p className="text-xs text-ink-500 pt-1">Rilis Alpha v0.1.0 • Ukuran ~60 MB</p>
              <p className="text-xs text-ink-500">Didukung oleh Yayasan Perjuangan Wahidiyah</p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-cream-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-ink-500 gap-4">
          <p>&copy; {new Date().getFullYear()} Wahidiyah Book. Hak Cipta Dilindungi.</p>
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
