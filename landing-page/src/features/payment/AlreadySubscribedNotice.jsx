import { CheckCircle2 } from 'lucide-react';
import { typography } from '@lib/styles';

export const AlreadySubscribedNotice = ({ minHeight = '640px', reason, onPro, onHistory }) => (
  <div
    className={`min-h-[${minHeight}] flex flex-col justify-between px-4 sm:px-6 lg:px-8 py-8 bg-cream-50`}
  >
    <div className="max-w-xl mx-auto w-full text-center py-16 space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-brand-100 text-brand-700 mx-auto flex items-center justify-center shadow-md">
        <CheckCircle2 className="w-9 h-9" />
      </div>
      <h2 className={typography.subTitle}>Langganan Anda Sedang Aktif</h2>
      <p className="text-xs text-ink-500 leading-relaxed max-w-md mx-auto">
        Akun Anda telah memiliki status langganan aktif (Pro). Anda tidak dapat melakukan {reason}{' '}
        baru karena akun Anda sudah berstatus Pro.
      </p>
      <div className="pt-4 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={onPro}
          className="inline-flex items-center justify-center min-h-11 px-5 py-2.5 bg-brand-700 hover:bg-brand-800 text-cream-50 text-xs font-bold rounded-xl shadow transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer"
        >
          Kembali ke Menu Pro
        </button>
        <button
          type="button"
          onClick={onHistory}
          className="inline-flex items-center justify-center min-h-11 px-5 py-2.5 bg-cream-200 hover:bg-cream-300 text-ink-700 text-xs font-bold rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer"
        >
          Lihat Riwayat
        </button>
      </div>
    </div>
  </div>
);

export default AlreadySubscribedNotice;
