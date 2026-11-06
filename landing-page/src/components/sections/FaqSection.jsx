import { useState } from 'react';
import { ChevronDown, HelpCircle, ShieldCheck } from 'lucide-react';

export const FaqSection = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: 'Apa itu aplikasi Wahidiyah Book?',
      a: 'Wahidiyah Book adalah aplikasi Android resmi yang menyajikan khazanah literatur digital Sholawat Wahidiyah, termasuk Lembaran Sholawat berharokat rapi, panduan amaliyah mujahadah yaumiyyah hingga kubro, kalender kegiatan amaliyah daerah dan pusat, serta buku-buku bimbingan tasawuf karya Muallif Sholawat Wahidiyah RA.',
    },
    {
      q: 'Mengapa formatnya APK dan belum tersedia di Google Play Store?',
      a: 'Saat ini aplikasi berada pada tahap rilis publik Alpha v0.1.0 untuk mengumpulkan umpan balik dari pengamal dan jamaah. Proses penerbitan ke Google Play Store sedang dipersiapkan dan akan diluncurkan segera setelah tahap uji Alpha selesai.',
    },
    {
      q: 'Apakah aplikasi ini gratis untuk digunakan?',
      a: 'Ya, seluruh naskah dasar Sholawat Wahidiyah, panduan mujahadah, dan kalender kegiatan dapat diakses 100% secara gratis tanpa pungutan biaya dan tanpa iklan yang mengganggu kekhusyukan beramaliyah.',
    },
    {
      q: 'Apa spesifikasi minimum perangkat Android yang dibutuhkan?',
      a: 'Aplikasi Wahidiyah Book dapat berjalan lancar pada perangkat Android dengan versi minimal Android 8.0 (Oreo) ke atas, RAM minimal 2 GB, serta ruang penyimpanan kosong sekitar 100 MB.',
    },
    {
      q: 'Apakah naskah Sholawat dan amaliyah di aplikasi ini resmi dan sahih?',
      a: 'Seluruh materi naskah Sholawat, tata tertib, susunan amaliyah, serta terjemahannya bersumber langsung dan diverifikasi oleh literatur resmi Yayasan Perjuangan Wahidiyah Pusat Kedunglo Kediri.',
    },
  ];

  const toggle = (idx) => {
    setOpenIndex(openIndex === idx ? -1 : idx);
  };

  return (
    <section id="faq" className="py-20 lg:py-28 bg-cream-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-brand-100 text-brand-800 border border-brand-200">
            <HelpCircle className="w-3.5 h-3.5 text-brand-700" />
            <span>Tentang & Tanya Jawab</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink-900 leading-tight">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-base sm:text-lg text-ink-600">
            Temukan jawaban seputar aplikasi mobile Wahidiyah Book, keabsahan naskah, dan panduan
            penggunaan.
          </p>
        </div>

        {/* Accordion List */}
        <div className="mt-14 space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-cream-100/70 border border-cream-200/90 rounded-2xl overflow-hidden transition duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 hover:bg-cream-200/60 transition cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="font-serif text-base sm:text-lg font-bold text-ink-900">
                    {faq.q}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full bg-cream-200/80 flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-brand-100 text-brand-800' : 'text-ink-600'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-2 text-sm sm:text-base text-ink-600 leading-relaxed border-t border-cream-200/60 animate-fadeIn">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Verification Footer Note */}
        <div className="mt-12 text-center text-xs text-ink-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-brand-700" />
          <span>Dikelola dengan penuh amanah untuk kemaslahatan pengamal Sholawat Wahidiyah</span>
        </div>
      </div>
    </section>
  );
};
