import { BellRing } from 'lucide-react';

export const PushStatusBanner = ({ enabled, subscribers }) => (
  <div
    className={`mb-4 flex items-start gap-2.5 rounded-2xl border px-3.5 py-3 ${
      enabled
        ? 'border-brand-200 bg-brand-50'
        : 'border-semantic-warning/30 bg-semantic-warningLight'
    }`}
  >
    <BellRing
      className={`mt-0.5 h-4 w-4 shrink-0 ${enabled ? 'text-brand-700' : 'text-semantic-warning'}`}
    />
    <div className="min-w-0 text-caption leading-relaxed">
      {enabled ? (
        <>
          <p className="font-bold text-brand-900">
            Notifikasi Pengumuman &amp; Pengingat Mujahadah Aktif
          </p>
          <p className="text-brand-800">
            {subscribers > 0
              ? `${subscribers} perangkat terhubung. Pengumuman otomatis disiarkan saat agenda dibuat atau lewat tombol kirim.`
              : 'Belum ada perangkat yang mengaktifkan. Ajak jemaah menekan tombol "Aktifkan notifikasi" di menu Profil.'}
          </p>
        </>
      ) : (
        <>
          <p className="font-bold text-semantic-warning">Notifikasi pengingat belum aktif</p>
          <p className="text-semantic-warning/85">
            Jalankan <code className="font-mono">node scripts/generate-vapid-keys.js</code>, tempel
            hasilnya ke <code className="font-mono">.env</code>, lalu restart server.
          </p>
        </>
      )}
    </div>
  </div>
);
