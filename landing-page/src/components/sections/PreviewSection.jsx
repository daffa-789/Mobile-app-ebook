import { useState } from 'react';
import {
  BookOpen,
  FileText,
  Calendar,
  User,
  Smartphone,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
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
      title: 'Katalog & Rekomendasi Terverifikasi',
      description:
        'Halaman beranda menghadirkan koleksi kitab sholawat, spanduk pengumuman kegiatan resmi, serta pencarian instan berdasarkan judul atau kategori amaliyah.',
      highlights: [
        'Katalog terorganisir per kategori naskah',
        'Pencarian kilat naskah & bab amaliyah',
        'Akses cepat bacaan terakhir yang dibuka',
      ],
    },
    {
      id: 'reader',
      label: 'Pembaca PDF',
      icon: FileText,
      image: '/mobile_screenshots/6_reader_buku.png',
      alt: 'Tampilan Pembaca PDF Dokumen Mobile-app-ebook',
      title: 'Pengalaman Membaca Murni & Khusyuk',
      description:
        'Layar pembaca dokumen terintegrasi dengan scroll vertikal alami, teks Arab yang tajam berharokat, serta navigasi daftar isi untuk langsung menuju bait yang diinginkan.',
      highlights: [
        'Render teks Arab beresolusi tinggi tanpa pecah',
        'Navigasi bab dan nomor halaman instan',
        'Fitur proteksi tangkapan layar untuk menjaga adab naskah',
      ],
    },
    {
      id: 'kalender',
      label: 'Kalender Agenda',
      icon: Calendar,
      image: '/mobile_screenshots/2_kalender.png',
      alt: 'Tampilan Kalender Agenda Mujahadah Mobile-app-ebook',
      title: 'Kalender Kegiatan & Waktu Mujahadah',
      description:
        'Jadwal lengkap kegiatan amaliyah dari tingkat desa, kecamatan, cabang daerah, hingga Mujahadah Kubro di Pesantren Kedunglo Kediri.',
      highlights: [
        'Sinkronisasi kalender amaliyah secara berkala',
        'Informasi lokasi dan rincian panitia penyelenggara',
        'Penanda agenda terdekat agar tidak terlewat',
      ],
    },
    {
      id: 'profil',
      label: 'Profil Pengguna',
      icon: User,
      image: '/mobile_screenshots/4_profil.png',
      alt: 'Tampilan Profil Akun Mobile-app-ebook',
      title: 'Manajemen Akun & Pengaturan Membaca',
      description:
        'Atur preferensi tampilan aplikasi, lihat riwayat amaliyah, kelola langganan, dan simpan naskah favorit ke penyimpanan internal perangkat.',
      highlights: [
        'Pengaturan preferensi baca dan unduhan',
        'Status keanggotaan dan riwayat dokumen',
        'Akses pusat bantuan & kontak pengurus',
      ],
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
          <p className="text-base sm:text-lg text-ink-600">
            Lihat langsung preview tangkapan layar aplikasi Android Mobile-app-ebook. Klik tab di
            bawah untuk mengeksplorasi setiap bagian.
          </p>
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

        {/* Mockup + Explanations Container */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: Device Mockup Frame */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="relative mx-auto">
              {/* Outer Phone Mockup Frame */}
              <div className="relative w-[280px] sm:w-[320px] max-w-full h-[580px] sm:h-[650px] bg-ink-900 rounded-[48px] p-3 shadow-2xl shadow-ink-900/30 border-4 border-ink-800 ring-1 ring-white/10">
                {/* Camera punch-hole notch */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-20 h-4 bg-ink-950 rounded-full z-20 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-ink-800 ring-1 ring-white/20" />
                </div>

                {/* Speaker slit */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-12 h-1 bg-ink-800 rounded-full z-20" />

                {/* Inner Screen Display with real screenshot - cropped bottom to remove system gesture bar */}
                <div className="relative w-full h-full bg-black rounded-[38px] overflow-hidden">
                  <div className="w-full h-full overflow-hidden">
                    <img
                      key={currentTab.id}
                      src={currentTab.image}
                      alt={currentTab.alt}
                      className="w-full h-[calc(100%+20px)] object-cover object-top animate-fadeIn select-none"
                      loading="lazy"
                    />
                  </div>
                  {/* Subtle glass reflection overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Screen Details & Key Highlights */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-800 border border-brand-200/70">
              <Sparkles className="w-3.5 h-3.5 text-gold-600" />
              <span>Preview • {currentTab.label}</span>
            </div>

            <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-ink-900 leading-snug">
              {currentTab.title}
            </h3>

            <p className="text-base text-ink-600 leading-relaxed">{currentTab.description}</p>

            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-ink-900 uppercase tracking-wider">
                Keunggulan Layar Ini:
              </h4>
              <div className="space-y-2.5">
                {currentTab.highlights.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm text-ink-700">
                    <CheckCircle2 className="w-5 h-5 text-brand-700 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
