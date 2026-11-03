import { useState } from 'react';
import { X, Download } from 'lucide-react';
import { toast } from 'sonner';
import { formatRupiah } from '@lib/formatUtils';
import { resolveReceiptFields } from '@lib/receiptFields';

/** Satu baris "label ..... nilai" gaya struk. */
const Baris = ({ label, nilai, tebal = false }) => (
  <div
    className={`flex items-baseline justify-between gap-3 ${
      tebal ? 'font-bold text-ink-900' : 'text-ink-700'
    }`}
  >
    <span className="min-w-0 truncate">{label}</span>
    <span className="shrink-0 tabular-nums">{nilai}</span>
  </div>
);

const Garis = () => <div className="border-t border-dashed border-ink-300/70" aria-hidden="true" />;

const Pusat = ({ children, tebal = false }) => (
  <p
    className={`text-center ${tebal ? 'font-bold tracking-[0.18em] text-ink-900' : 'text-ink-600'}`}
  >
    {children}
  </p>
);

/**
 * Kwitansi pembayaran bergaya struk supermarket: satu kolom sempit, huruf mono,
 * garis putus-putus, tanpa kartu atau pita warna. Nilainya diambil dari
 * resolveReceiptFields — sama persis dengan yang tercetak di PDF.
 */
export const PaymentReceiptModal = ({ isOpen, onClose, details, user }) => {
  const [isPreparingPdf, setIsPreparingPdf] = useState(false);

  if (!isOpen) return null;

  const { refNo, dateStr, planName, amount, adminFee, totalPaid, userName, userEmail, userPhone } =
    resolveReceiptFields(details, user);

  const handleDownloadPdf = async () => {
    if (isPreparingPdf) return;

    setIsPreparingPdf(true);
    try {
      const { downloadReceiptPdf } = await import('@lib/receiptPdf');
      downloadReceiptPdf(details, user);
    } catch {
      toast.error('Kwitansi PDF gagal disiapkan. Silakan coba lagi.');
    } finally {
      setIsPreparingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 bg-ink-900/55">
      <div className="w-full max-w-[360px] my-auto bg-cream-50 border border-cream-300 rounded-2xl">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-dashed border-ink-300/70">
          <span className="font-mono text-micro uppercase tracking-[0.18em] text-ink-500">
            Kwitansi
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 -mr-1.5 rounded-lg text-ink-400 hover:text-ink-800 hover:bg-cream-200 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Tutup kwitansi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-5 font-mono text-xs leading-relaxed">
          <Pusat tebal>WAHIDIYAH BOOK</Pusat>
          <p className="text-center text-micro text-ink-500 mt-0.5">
            Perpustakaan Digital Sholawat Wahidiyah
          </p>
          <p className="text-center text-micro text-ink-400">wahidiyah-book.vercel.app</p>

          <div className="mt-3 space-y-1.5">
            <Garis />
            <Pusat>KWITANSI PEMBAYARAN</Pusat>
            <Baris label="No" nilai={refNo} />
            <Baris label="Tanggal" nilai={dateStr} />
            <Baris label="Kepada" nilai={userName} />
            <Baris label="Email" nilai={userEmail} />
            {userPhone && <Baris label="WhatsApp" nilai={userPhone} />}

            <div className="pt-1.5">
              <Garis />
            </div>

            <Baris label={planName} nilai={formatRupiah(amount)} tebal />
            <p className="text-micro text-ink-500">30 Hari</p>
            {adminFee > 0 && <Baris label="Biaya gateway" nilai={formatRupiah(adminFee)} />}

            <div className="pt-1.5">
              <Garis />
            </div>

            <Baris label="TOTAL" nilai={formatRupiah(totalPaid)} tebal />
            <Baris label="Bayar" nilai="QRIS" />

            <div className="pt-1.5">
              <Garis />
            </div>

            <Pusat tebal>* L U N A S *</Pusat>
            <p className="text-center text-micro text-ink-500">Terverifikasi gateway Midtrans</p>
            <p className="text-center text-micro text-ink-500">Sah menurut UU ITE 11/2008 Ps. 5</p>

            <div className="pt-1.5">
              <Garis />
            </div>

            <p className="text-center text-micro text-ink-500">Terima kasih sudah berlangganan</p>
            <p className="text-center text-micro text-ink-400">Bantuan: support@bukuku.id</p>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-dashed border-ink-300/70 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg border border-cream-300 text-ink-600 text-xs font-bold hover:bg-cream-100 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isPreparingPdf}
            aria-busy={isPreparingPdf}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-700 hover:bg-brand-800 text-cream-50 text-xs font-bold transition cursor-pointer disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <Download className="w-4 h-4" />
            <span>{isPreparingPdf ? 'Menyiapkan…' : 'Unduh PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
