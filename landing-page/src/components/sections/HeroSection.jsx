import { Download, Sparkles, Smartphone, Eye, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const APK_URL = 'https://expo.dev/artifacts/eas/qdKRlQGtuS4qap2eylCUfl46_HuxOLHgo3p9tUPCQHs.apk';

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-16 lg:pb-28">
      {/* Background radial soft aura */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-brand-100/40 via-cream-100/20 to-transparent -z-10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline, Description & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Release Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-800 text-xs font-semibold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-gold-500" />
              <span>Rilis Resmi v0.1.0 (Alpha) untuk Android</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink-900 leading-[1.15]">
              Khazanah Keilmuan &{' '}
              <span className="text-brand-700 underline decoration-gold-400 decoration-wavy decoration-2 underline-offset-8">
                Amaliyah Wahidiyah
              </span>{' '}
              dalam Satu Genggaman
            </h1>

            {/* Subtitle / Tagline */}
            <p className="text-base sm:text-lg text-ink-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Aplikasi mobile resmi Wahidiyah Book menghadirkan kemudahan membaca lembaran Sholawat
              Wahidiyah, panduan mujahadah berharokat rapi, kalender agenda amaliyah, serta akses
              dokumen luring (offline) langsung di ponsel Android Anda.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <a
                href={APK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-brand-700 text-white font-bold text-base hover:bg-brand-800 shadow-lg shadow-brand-900/20 hover:shadow-brand-900/30 transition hover:-translate-y-0.5 group"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center group-hover:bg-brand-500 transition">
                  <Download className="w-5 h-5 text-gold-300" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-cream-50 leading-tight">
                    Unduh APK Langsung (.apk)
                  </div>
                  <div className="text-[11px] font-normal text-brand-200">
                    v0.1.0 (Alpha) • ~60 MB • Android 8.0+
                  </div>
                </div>
              </a>

              <a
                href="#preview"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-cream-100/90 text-ink-800 font-semibold text-sm border border-cream-200 hover:bg-cream-200 hover:text-brand-900 transition"
              >
                <Eye className="w-4 h-4 text-brand-700" />
                <span>Lihat Tampilan Aplikasi</span>
              </a>
            </div>

            {/* Trust Highlights */}
            <div className="pt-4 border-t border-cream-200/80 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs text-ink-500 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-600" />
                <span>100% Gratis & Bebas Iklan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-600" />
                <span>Naskah Resmi & Terverifikasi</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-brand-600" />
                <span>Ringan & Dukung Mode Offline</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive QR Code Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-sm bg-cream-50 border border-cream-300/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-ink-900/5 relative">
              {/* Subtle gold badge in corner */}
              <div className="absolute -top-3 right-6 bg-gold-400 text-ink-900 text-[11px] font-black uppercase px-3 py-1 rounded-full shadow-xs tracking-wider">
                Pindai & Unduh
              </div>

              <div className="text-center space-y-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-ink-900">
                    Instal Langsung di Ponsel
                  </h3>
                  <p className="text-xs text-ink-500 mt-1">
                    Arahkan kamera ponsel Anda ke kode QR di bawah untuk mengunduh APK secara
                    langsung
                  </p>
                </div>

                {/* QR Code Container */}
                <div className="flex justify-center p-4 bg-white rounded-2xl border border-cream-200 shadow-inner">
                  <QRCodeSVG
                    value={APK_URL}
                    size={180}
                    bgColor="#FFFFFF"
                    fgColor="#14523A"
                    level="M"
                    includeMargin={false}
                  />
                </div>

                <div className="pt-2 text-center">
                  <span className="inline-block px-3 py-1 bg-brand-50 text-brand-800 text-[11px] font-semibold rounded-lg border border-brand-200/60">
                    Berkas Resmi: Wahidiyah-Book-v0.1.0-alpha.apk
                  </span>
                  <div className="mt-3">
                    <a
                      href={APK_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-brand-700 hover:text-brand-900 underline underline-offset-4"
                    >
                      Atau klik di sini jika menggunakan browser ponsel
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
