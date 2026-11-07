import { useState } from 'react';
import { BookOpen, FileText, Calendar, User, Smartphone } from 'lucide-react';
import { APK_DOWNLOAD_URL } from '@/config/constants';

export const PreviewSection = () => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      id: 'beranda',
      label: 'Beranda Aplikasi',
      icon: BookOpen,
      image: '/mobile_screenshots/1_beranda.png',
      alt: 'Tampilan Beranda Mobile-app-ebook',
    },
    {
      id: 'reader',
      label: 'Pembaca PDF',
      icon: FileText,
      image: '/mobile_screenshots/6_reader_buku.png',
      alt: 'Tampilan Pembaca PDF Dokumen Mobile-app-ebook',
    },
    {
      id: 'kalender',
      label: 'Kalender Agenda',
      icon: Calendar,
      image: '/mobile_screenshots/2_kalender.png',
      alt: 'Tampilan Kalender Agenda Mujahadah Mobile-app-ebook',
    },
    {
      id: 'profil',
      label: 'Profil Pengguna',
      icon: User,
      image: '/mobile_screenshots/4_profil.png',
      alt: 'Tampilan Profil Akun Mobile-app-ebook',
    },
  ];

  const currentTab = tabs[activeTab];

  return (
    <section id="preview" className="py-20 lg:py-28 bg-cream-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase bg-brand-100 text-brand-800 border border-brand-200/80 shadow-xs">
            <Smartphone className="w-3.5 h-3.5 text-brand-700" />
            <span>Preview Antarmuka Aplikasi</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink-900 leading-tight">
            Preview Antarmuka: Bersih, Khusyuk & Minimalis
          </h2>
        </div>

        {/* Tab Switcher Buttons */}
        <div className="mt-10 flex flex-wrap justify-center gap-2.5 sm:gap-3">
          {tabs.map((tab, idx) => {
            const Icon = tab.icon;
            const active = activeTab === idx;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition duration-200 cursor-pointer ${
                  active
                    ? 'bg-brand-700 text-white shadow-md shadow-brand-900/15 ring-2 ring-brand-700/20'
                    : 'bg-cream-100/90 text-ink-700 hover:bg-cream-200 hover:text-ink-900 border border-cream-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-gold-300' : 'text-ink-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mockup Container - Centered */}
        <div className="mt-14 flex justify-center">
          <div className="relative mx-auto">
            {/* Outer Phone Mockup Frame - Flat rectangular frame without punch-hole / notch */}
            <div className="relative w-[280px] sm:w-[320px] max-w-full h-[580px] sm:h-[650px] bg-ink-900 rounded-2xl p-2.5 shadow-2xl shadow-ink-900/30 border-2 border-ink-700 ring-1 ring-white/10">
              {/* Inner Screen Display with real screenshot - 100% clean rectangular view without punch-hole or notch */}
              <div className="relative w-full h-full bg-black rounded-xl overflow-hidden">
                <img
                  key={currentTab.id}
                  src={currentTab.image}
                  alt={currentTab.alt}
                  className="w-full h-full object-cover object-top animate-fadeIn select-none"
                  loading="lazy"
                />
                {/* Subtle glass reflection overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
