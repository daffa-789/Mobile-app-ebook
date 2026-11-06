import { Download, FolderOpen, ShieldAlert, CheckCircle, Smartphone } from 'lucide-react';

export const InstallGuideSection = () => {
  const steps = [
    {
      step: '01',
      title: 'Unduh Berkas APK',
      icon: Download,
      desc: 'Klik tombol "Unduh APK" atau pindai kode QR di laman ini. File installer resmi berekstensi .apk (~60 MB) akan otomatis terunduh ke perangkat Anda.',
    },
    {
      step: '02',
      title: 'Buka File Unduhan',
      icon: FolderOpen,
      desc: 'Setelah unduhan selesai, buka bilah notifikasi ponsel Anda dan ketuk notifikasi unduhan, atau buka folder "Download" melalui aplikasi File Manager ponsel Anda.',
    },
    {
      step: '03',
      title: 'Izinkan Sumber Ini',
      icon: ShieldAlert,
      desc: 'Jika Android menampilkan dialog keamanan "Instal aplikasi yang tidak dikenal", ketuk Setelan/Pengaturan dan aktifkan opsi "Izinkan dari sumber ini".',
    },
    {
      step: '04',
      title: 'Pasang & Buka Aplikasi',
      icon: CheckCircle,
      desc: 'Ketuk tombol "Instal" pada layar instalasi. Tunggu hingga proses pemasangan selesai. Buka Wahidiyah Book dan nikmati kemudahan beramaliyah.',
    },
  ];

  return (
    <section id="panduan" className="py-20 lg:py-28 bg-cream-100/60 border-t border-cream-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-brand-100 text-brand-800 border border-brand-200">
            <Smartphone className="w-3.5 h-3.5 text-brand-700" />
            <span>Panduan Pemasangan</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink-900 leading-tight">
            Cara Mudah Memasang Berkas APK di Android
          </h2>
          <p className="text-base sm:text-lg text-ink-600">
            Karena saat ini masih dalam tahap rilis Alpha v0.1.0, aplikasi dipasang langsung melalui
            berkas APK. Ikuti 4 langkah sederhana berikut:
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-cream-50 border border-cream-200/90 rounded-3xl p-6 sm:p-7 relative shadow-sm hover:shadow-md hover:border-brand-300 transition duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Step Number Badge */}
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-3xl font-extrabold text-gold-500/80">
                      {item.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-800 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-brand-700" />
                    </div>
                  </div>

                  <h3 className="font-serif text-lg font-bold text-ink-900 mt-5 leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-ink-600 mt-3 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security Reassurance Box */}
        <div className="mt-12 bg-cream-50 border border-gold-400/40 rounded-2xl p-5 sm:p-6 max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-xl bg-gold-400/20 text-gold-800 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6 text-gold-700" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-ink-900">Catatan Keamanan Berkas APK</h4>
            <p className="text-xs text-ink-600 leading-relaxed">
              Berkas APK ini dibangun langsung melalui cloud build resmi Expo EAS dan 100% aman dari
              malware/virus. Peringatan &quot;Aplikasi Tidak Dikenal&quot; adalah standar keamanan
              Android untuk file yang diunduh di luar Google Play Store.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
