import { BookOpen, FileText, Calendar, Zap, Check } from 'lucide-react';

export const FeaturesSection = () => {
  const features = [
    {
      icon: BookOpen,
      title: 'Koleksi Kitab Sholawat',
      badge: 'Lengkap & Sahih',
      description:
        'Akses Lembaran Sholawat Wahidiyah berharokat rapi, Panduan Mujahadah (Rubu’ussanah, Nisfussanah, Kubro), Terjemah Hadits Arbain, dan literatur resmi Yayasan Perjuangan Wahidiyah.',
      points: [
        'Teks Arab jernih berharokat lengkap',
        'Terjemahan bahasa Indonesia baku',
        'Faidah & adab pengamalan terinci',
      ],
    },
    {
      icon: FileText,
      title: 'Pembaca PDF Nyaman & Ramah Mata',
      badge: 'Optimal di Layar',
      description:
        'Dirancang khusus untuk membaca lama tanpa melelahkan mata. Pembaca dokumen dengan continuous scrolling, bookmark cerdas, zoom fleksibel, dan mode malam/krem pelindung mata.',
      points: [
        'Navigasi daftar isi & lompat bab cepat',
        'Tampilan adaptif vertikal & horizontal',
        'Penyimpan halaman bacaan terakhir',
      ],
    },
    {
      icon: Calendar,
      title: 'Agenda & Kalender Amaliyah',
      badge: 'Pengingat Otomatis',
      description:
        'Jadwal terpadu peringatan amaliyah, Mujahadah Daerah, Mujahadah Kubro, serta panduan amaliyah yaumiyyah dengan sistem notifikasi pengingat waktu ibadah.',
      points: [
        'Kalender Hijriyah & Masehi tersinkron',
        'Detail waktu dan lokasi mujahadah resmi',
        'Pengingat amaliyah harian & mingguan',
      ],
    },
    {
      icon: Zap,
      title: 'Mode Luring (Offline) & Ringan',
      badge: 'Hemat Kuota',
      description:
        'Unduh kitab sekali dan nikmati bacaan di mana saja tanpa memerlukan koneksi internet aktif. Dirancang sangat hemat baterai dan ringan di berbagai tipe Android.',
      points: [
        'Tersimpan aman di penyimpanan internal',
        'Performa responsif pada RAM 2GB+',
        'Nol iklan pengganggu saat beramaliyah',
      ],
    },
  ];

  return (
    <section id="fitur" className="py-20 lg:py-28 bg-cream-100/60 border-t border-cream-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-brand-100 text-brand-800 border border-brand-200/80">
            Fitur Utama Aplikasi Mobile
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink-900 leading-tight">
            Dirancang Khusus untuk Kenyamanan Beribadah & Belajar
          </h2>
          <p className="text-base sm:text-lg text-ink-600">
            Semua kebutuhan amaliyah Sholawat Wahidiyah kini terpadu dalam satu aplikasi Android
            yang fokus, tenang, dan mudah digunakan oleh semua kalangan.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="bg-cream-50 border border-cream-200/90 rounded-3xl p-8 hover:border-brand-300 hover:shadow-xl hover:shadow-brand-900/5 transition duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-brand-700 text-cream-50 flex items-center justify-center shadow-md shadow-brand-900/10 group-hover:bg-brand-800 transition">
                      <Icon className="w-6 h-6 text-gold-300" />
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-cream-200/70 text-ink-700 border border-cream-300/60">
                      {feature.badge}
                    </span>
                  </div>

                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink-900 mt-6 group-hover:text-brand-800 transition">
                    {feature.title}
                  </h3>

                  <p className="text-sm text-ink-600 mt-3 leading-relaxed">{feature.description}</p>
                </div>

                <div className="mt-6 pt-6 border-t border-cream-200/80 space-y-2.5">
                  {feature.points.map((pt, pIdx) => (
                    <div
                      key={pIdx}
                      className="flex items-center gap-2.5 text-xs text-ink-700 font-medium"
                    >
                      <div className="w-4 h-4 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 text-brand-700 stroke-[3]" />
                      </div>
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
