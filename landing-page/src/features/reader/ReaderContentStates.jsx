import { BookOpen, FileText, Lock } from 'lucide-react';

export const BookNotFoundState = ({ onBack }) => (
  <div className="flex min-h-screen items-center justify-center bg-cream-50 px-4 text-center">
    <div className="max-w-md rounded-3xl border border-cream-300 bg-cream-100 p-8 shadow-xl">
      <BookOpen className="mx-auto h-12 w-12 text-ink-300" />
      <h2 className="mt-4 font-serif text-2xl font-bold text-ink-900">Buku tidak ditemukan</h2>
      <p className="mt-2 text-sm text-ink-500">Pilih buku dari beranda katalog terlebih dahulu.</p>
      <button
        type="button"
        onClick={onBack}
        className="mt-6 rounded-2xl bg-brand-700 px-6 py-3 text-sm font-bold text-cream-50 transition hover:bg-brand-800 cursor-pointer"
      >
        Kembali ke katalog
      </button>
    </div>
  </div>
);

export const ProLockedState = ({ onUpgrade }) => (
  <div className="my-auto max-w-md w-full rounded-3xl border border-cream-300 bg-cream-100 p-8 text-center shadow-xl">
    <Lock className="mx-auto h-10 w-10 text-gold-500 mb-3" />
    <h2 className="font-serif text-xl font-bold text-ink-900">Konten Khusus Member Pro</h2>
    <p className="mt-2 text-sm text-ink-500">
      Aktifkan paket Pro untuk membuka dan membaca naskah lengkap ini.
    </p>
    <button
      type="button"
      onClick={onUpgrade}
      className="mt-6 rounded-2xl bg-brand-700 px-6 py-2.5 text-sm font-bold text-cream-50 hover:bg-brand-800 transition cursor-pointer"
    >
      Lihat Paket Pro
    </button>
  </div>
);

export const DocumentErrorState = ({ onRetry }) => (
  <div className="my-auto max-w-md w-full rounded-3xl border border-cream-300 bg-cream-100 p-8 text-center shadow-xl">
    <FileText className="mx-auto h-10 w-10 text-semantic-danger mb-3" />
    <h2 className="font-serif text-xl font-bold text-ink-900">Gagal Memuat Dokumen</h2>
    <p className="mt-2 text-sm text-ink-500">
      Berkas dokumen naskah tidak dapat dimuat atau diekstrak.
    </p>
    <button
      type="button"
      onClick={onRetry}
      className="mt-6 rounded-2xl bg-brand-700 px-6 py-2.5 text-sm font-bold text-cream-50 hover:bg-brand-800 transition cursor-pointer"
    >
      Coba Muat Ulang
    </button>
  </div>
);

export const DocumentLoadingState = () => (
  <div className="my-auto flex flex-col items-center justify-center p-12 text-ink-500">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent mb-3" />
    <span className="text-sm font-medium">Memuat dan menyiapkan naskah bacaan...</span>
  </div>
);

export const DocumentEmptyState = ({ contentName }) => (
  <div className="my-auto max-w-md w-full rounded-3xl border border-cream-300 bg-cream-100 p-8 text-center shadow-xl">
    <FileText className="mx-auto h-10 w-10 text-ink-300 mb-3" />
    <h2 className="font-serif text-xl font-bold text-ink-900">Lampiran Dokumen</h2>
    <p className="mt-2 text-sm text-ink-500">
      {contentName ? `${contentName} telah tersimpan.` : 'Konten naskah buku belum diunggah.'}
    </p>
  </div>
);
