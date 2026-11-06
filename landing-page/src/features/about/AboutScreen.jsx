import { Shield } from 'lucide-react';
import { layout } from '@lib/styles';

export const AboutScreen = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="bg-cream-100/90 rounded-3xl p-6 sm:p-8 border border-cream-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-serif font-bold text-ink-900">Tentang Wahidiyah Book</h1>
            <p className="text-xs text-ink-500">
              Platform literasi dan khazanah keilmuan digital Wahidiyah
            </p>
          </div>
        </div>

        <div className="text-sm text-ink-600 leading-relaxed space-y-3">
          <p>
            Wahidiyah Book adalah platform portal literasi resmi yang didedikasikan untuk
            memfasilitasi akses mudah, terverifikasi, dan berkualitas tinggi terhadap karya-karya
            kitab, naskah amaliyah, dan khazanah keilmuan Sholawat Wahidiyah.
          </p>
          <p>
            Dengan fitur pembaca modern, dukungan format PDF, DOCX, dan teks dengan tipografi Arab
            yang nyaman, serta model keanggotaan Pro untuk kelestarian dakwah literasi digital.
          </p>
        </div>

        <div className="bg-cream-50 rounded-2xl p-4 border border-cream-200 space-y-3 text-xs">
          <div className="flex justify-between items-center py-1.5 border-b border-cream-200">
            <span className="text-ink-500">Versi Portal Web</span>
            <span className="font-bold text-ink-900 bg-brand-100 text-brand-700 text-caption px-2.5 py-0.5 rounded-full">
              v0.1.0 (Alpha)
            </span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-cream-200">
            <span className="text-ink-500">Status Layanan</span>
            <span className="font-semibold text-semantic-success flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Operasional
            </span>
          </div>

          <div className="flex justify-between items-center py-1.5">
            <span className="text-ink-500">Layanan Dukungan & Hubungi Kami</span>
            <span className="font-semibold text-brand-700">support@bukuku.id</span>
          </div>
        </div>
      </div>
    </div>
  );
};
