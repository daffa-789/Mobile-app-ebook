import { Download, Smartphone, Sparkles } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { APK_DOWNLOAD_URL } from '@/config/constants';

export const DownloadCtaSection = () => {
  return (
    <section
      id="unduh"
      className="py-20 lg:py-24 bg-gradient-to-br from-brand-800 via-brand-900 to-ink-950 text-white relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left: Call to action text and buttons */}
          <div className="lg:col-span-8 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-700/60 border border-brand-500/40 text-gold-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-gold-400" />
              <span>Mulai Amaliyah Hari Ini</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-cream-50 leading-tight">
              Unduh Wahidiyah Book & Nikmati Kemudahan Membaca Naskah Sholawat
            </h2>

            <p className="text-base sm:text-lg text-brand-100 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Tingkatkan kekhusyukan dan kemudahan beramaliyah Anda di mana pun berada. Unduh berkas
              APK resmi v0.1.0 Alpha secara gratis untuk ponsel Android Anda.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <a
                href={APK_DOWNLOAD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gold-400 text-ink-950 font-extrabold text-base hover:bg-gold-300 shadow-xl shadow-gold-500/20 hover:shadow-gold-500/30 transition hover:-translate-y-0.5"
              >
                <Download className="w-5 h-5 text-ink-950 stroke-[2.5]" />
                <div className="text-left">
                  <div className="leading-tight">Unduh APK Langsung (.apk)</div>
                  <div className="text-[11px] font-semibold text-ink-800">
                    v0.1.0 (Alpha) • ~60 MB • Android 8.0+
                  </div>
                </div>
              </a>

              <div className="flex items-center gap-2 text-xs text-brand-200">
                <Smartphone className="w-4 h-4 text-gold-400" />
                <span>Kompatibel dengan Android 8.0 ke atas</span>
              </div>
            </div>
          </div>

          {/* Right: Mini QR Code Card */}
          <div className="lg:col-span-4 flex justify-center">
            <div className="bg-brand-950/60 border border-white/15 rounded-3xl p-6 text-center space-y-3 max-w-xs w-full shadow-md">
              <div className="p-3 bg-white rounded-2xl inline-block shadow-inner">
                <QRCodeSVG
                  value={APK_DOWNLOAD_URL}
                  size={140}
                  bgColor="#FFFFFF"
                  fgColor="#14523A"
                  level="M"
                />
              </div>
              <div className="text-xs font-bold text-cream-100">Pindai untuk Unduh Cepat</div>
              <p className="text-[11px] text-brand-200 leading-tight">
                Arahkan kamera ponsel Android Anda langsung ke kode QR ini
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
