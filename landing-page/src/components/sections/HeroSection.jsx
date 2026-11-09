import { Download, Smartphone, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { APK_DOWNLOAD_URL } from '@/config/constants';

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Main Headline — clean typography without wavy underline lines */}
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink-900 leading-[1.18] max-w-4xl mx-auto">
          Khazanah Keilmuan & <span className="text-brand-700 font-serif">Amaliyah Wahidiyah</span>{' '}
          dalam Satu Genggaman
        </h1>

        {/* Subtitle / Tagline */}
        <p className="mt-6 text-base sm:text-lg lg:text-xl text-ink-600 max-w-3xl mx-auto leading-relaxed">
          Aplikasi mobile resmi Mobile-app-ebook menghadirkan kemudahan membaca Lembaran Sholawat
          Wahidiyah, panduan mujahadah berharokat rapi, kalender agenda amaliyah, serta akses
          dokumen luring (offline) langsung di ponsel Android Anda.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <a
            href={APK_DOWNLOAD_URL}
            download="wahidiyah-v0.1.1-stabil.apk"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3.5 px-8 py-4 rounded-2xl bg-brand-700 text-white font-bold text-base hover:bg-brand-800 shadow-lg shadow-brand-900/15 hover:shadow-brand-900/25 transition duration-200 hover:-translate-y-0.5 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-brand-600/80 flex items-center justify-center group-hover:bg-brand-500 transition">
              <Download className="w-5 h-5 text-gold-300" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-cream-50 leading-tight">
                Unduh APK Langsung (.apk)
              </div>
              <div className="text-xs font-normal text-brand-200">
                v0.1.2 (Alpha) • Android 8.0+ • 32-bit & 64-bit
              </div>
              <div className="text-xs font-normal text-brand-200">
                Unduhan saat ini: rilis stabil v0.1.1 (Hermes)
              </div>
            </div>
          </a>
        </div>

        {/* Trust Highlights */}
        <div className="mt-12 pt-8 border-t border-cream-200/80 flex flex-wrap items-center justify-center gap-y-3 gap-x-8 text-xs sm:text-sm text-ink-500 font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
            <span>100% Gratis & Bebas Iklan</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" />
            <span>Naskah Resmi & Terverifikasi</span>
          </div>
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-brand-600 shrink-0" />
            <span>Ringan & Dukung Mode Offline</span>
          </div>
        </div>
      </div>
    </section>
  );
};
