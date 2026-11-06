import { Link } from 'react-router';
import { BookOpen, Heart, Mail, Shield } from 'lucide-react';

export const LandingFooter = () => {
  return (
    <footer className="border-t border-cream-200 bg-cream-100 text-ink-600 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-700 text-cream-50 flex items-center justify-center shadow-xs">
                <BookOpen className="w-5 h-5 text-gold-400" />
              </div>
              <span className="font-serif text-xl font-bold text-ink-900 tracking-tight">
                Wahidiyah Book
              </span>
            </div>
            <p className="text-sm text-ink-500 leading-relaxed max-w-md">
              Perpustakaan digital dan wadah literatur resmi ajaran Sholawat Wahidiyah. Menyajikan
              koleksi naskah terverifikasi, amaliyah, serta layanan keanggotaan Pro untuk kemudahan
              belajar kapan saja dan di mana saja.
            </p>
            <div className="flex items-center gap-4 text-xs text-ink-500 pt-1">
              <span className="inline-flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-brand-600" /> Naskah Resmi & Terverifikasi
              </span>
            </div>
          </div>

          {/* Navigasi Cepat */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-ink-900 uppercase tracking-wider">Navigasi</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-brand-700 transition">
                  Beranda
                </Link>
              </li>
              <li>
                <Link to="/catalog" className="hover:text-brand-700 transition">
                  Katalog Naskah
                </Link>
              </li>
              <li>
                <Link to="/pro" className="hover:text-brand-700 transition">
                  Keanggotaan Pro
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-brand-700 transition">
                  Tentang Kami
                </Link>
              </li>
            </ul>
          </div>

          {/* Dukungan & Kontak */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-ink-900 uppercase tracking-wider">
              Bantuan & Layanan
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/help" className="hover:text-brand-700 transition">
                  Pusat Bantuan & FAQ
                </Link>
              </li>
              <li className="flex items-center gap-2 text-xs text-ink-500 pt-1">
                <Mail className="w-4 h-4 text-brand-700 shrink-0" />
                <span>support@bukuku.id</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-cream-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-ink-400 gap-4">
          <p>&copy; {new Date().getFullYear()} Wahidiyah Book. Hak Cipta Dilindungi.</p>
          <p className="flex items-center gap-1">
            Dibangun dengan penuh khidmah{' '}
            <Heart className="w-3 h-3 text-semantic-danger fill-semantic-danger" /> untuk Pengamal
            Wahidiyah
          </p>
        </div>
      </div>
    </footer>
  );
};
