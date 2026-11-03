import { useState } from 'react';
import { X, Download, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatRupiah } from '@lib/formatUtils';
import { resolveReceiptFields } from '@lib/receiptFields';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-ink-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-ui-card rounded-3xl shadow-2xl border border-cream-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Brand Stripe */}
        <div className="h-1.5 w-full bg-brand-800" />
        <div className="h-0.5 w-full bg-gold-500" />

        {/* Modal Topbar Controls */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-cream-200 bg-cream-50">
          <div className="flex items-center gap-2 text-brand-900 font-bold text-xs sm:text-sm">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-brand-700 shrink-0" />
            <span>Kwitansi Pembayaran Resmi (Pratinjau)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-ink-400 hover:text-ink-800 hover:bg-cream-200 transition cursor-pointer"
            aria-label="Tutup Kwitansi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Content Body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto bg-ui-card text-ink-900 thin-scrollbar">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-cream-200">
            <div>
              <h2 className="font-display font-black text-xl sm:text-2xl tracking-tight text-brand-900">
                WAHIDIYAH BOOK
              </h2>
              <p className="text-xs text-ink-600 font-medium mt-0.5">
                Perpustakaan Digital Ajaran Sholawat Wahidiyah
              </p>
              <p className="text-micro text-ink-400 mt-1">
                https://wahidiyah-book.vercel.app • support@bukuku.id
              </p>
            </div>

            <div className="sm:text-right space-y-1.5">
              <span className="inline-block font-display text-sm sm:text-base font-extrabold uppercase tracking-wider text-ink-800">
                Kwitansi Resmi
              </span>
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-semantic-successLight text-semantic-success text-micro font-black tracking-wide border border-semantic-success/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-semantic-success shrink-0" />
                  PEMBAYARAN LUNAS (SETTLED)
                </span>
              </div>
            </div>
          </div>

          {/* Metadata Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            {/* Customer Box */}
            <div className="p-4 rounded-2xl bg-cream-50/80 border border-cream-200 space-y-1.5">
              <p className="text-micro font-bold uppercase tracking-wider text-ink-400">
                Diterbitkan Kepada:
              </p>
              <p className="font-bold text-ink-900 text-sm">{userName}</p>
              <p className="text-ink-600 text-xs">{userEmail}</p>
              {userPhone && <p className="text-ink-500 text-micro">No. WhatsApp: {userPhone}</p>}
              <p className="text-micro font-semibold text-brand-700 pt-0.5">
                Status Akun: Member Pro (Aktif)
              </p>
            </div>

            {/* Transaction Box */}
            <div className="p-4 rounded-2xl bg-cream-50/80 border border-cream-200 space-y-1.5">
              <p className="text-micro font-bold uppercase tracking-wider text-ink-400">
                Informasi Transaksi:
              </p>
              <div className="flex justify-between">
                <span className="text-ink-500">Nomor Kwitansi:</span>
                <span className="font-mono font-bold text-ink-800">{refNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Waktu Pembayaran:</span>
                <span className="font-medium text-ink-800">{dateStr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Metode Pembayaran:</span>
                <span className="font-bold text-brand-800">QRIS Midtrans Core API</span>
              </div>
            </div>
          </div>

          {/* Item Breakdown Table */}
          <div className="border border-cream-300 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-xs">
              <thead className="bg-brand-900 text-cream-50 font-bold">
                <tr>
                  <th className="px-4 py-3 text-left w-12">No</th>
                  <th className="px-4 py-3 text-left">Deskripsi Item / Layanan</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Masa Aktif</th>
                  <th className="px-4 py-3 text-right">Harga</th>
                  <th className="px-4 py-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200 bg-ui-card">
                <tr>
                  <td className="px-4 py-3.5 text-ink-400 font-mono">01</td>
                  <td className="px-4 py-3.5">
                    <p className="font-bold text-ink-900 text-sm sm:text-xs">{planName}</p>
                    <p className="text-micro text-ink-500 mt-0.5">
                      Akses Penuh Seluruh Kitab & Dokumen Pro
                    </p>
                  </td>
                  <td className="px-4 py-3.5 text-ink-600 hidden sm:table-cell">30 Hari</td>
                  <td className="px-4 py-3.5 text-right font-medium text-ink-700">
                    {formatRupiah(amount)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-ink-900">
                    {formatRupiah(amount)}
                  </td>
                </tr>

                {adminFee > 0 && (
                  <tr className="bg-cream-50/50">
                    <td className="px-4 py-3 text-ink-400 font-mono">02</td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-ink-800">Biaya Administrasi & Gateway QRIS</p>
                    </td>
                    <td className="px-4 py-3 text-ink-600 hidden sm:table-cell">1x Transaksi</td>
                    <td className="px-4 py-3 text-right font-medium text-ink-700">
                      {formatRupiah(adminFee)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-ink-900">
                      {formatRupiah(adminFee)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary Block */}
          <div className="flex justify-end">
            <div className="w-full sm:w-72 space-y-2">
              <div className="flex justify-between text-xs text-ink-600 px-1">
                <span>Subtotal Layanan:</span>
                <span className="font-medium text-ink-800">{formatRupiah(amount)}</span>
              </div>
              {adminFee > 0 && (
                <div className="flex justify-between text-xs text-ink-600 px-1">
                  <span>Biaya Gateway QRIS:</span>
                  <span className="font-medium text-ink-800">{formatRupiah(adminFee)}</span>
                </div>
              )}
              <div className="p-3.5 rounded-2xl bg-brand-900 text-cream-50 flex items-center justify-between shadow-sm">
                <span className="text-xs font-bold uppercase tracking-wider">
                  Total Pembayaran:
                </span>
                <span className="font-display font-black text-base">{formatRupiah(totalPaid)}</span>
              </div>
            </div>
          </div>

          {/* Official Verification Stamp Box */}
          <div className="p-4 rounded-2xl bg-semantic-successLight/60 border border-semantic-success/20 flex items-start gap-3.5 text-xs">
            <div className="w-8 h-8 rounded-full bg-semantic-success text-cream-50 flex items-center justify-center shrink-0 shadow-xs font-bold text-sm">
              ✓
            </div>
            <div className="min-w-0 space-y-0.5">
              <p className="font-bold text-brand-950 text-xs">
                Bukti Pembayaran Sah & Diverifikasi Gateway Resmi
              </p>
              <p className="text-ink-600 text-micro leading-relaxed">
                Dokumen ini merupakan tanda terima digital resmi yang sah menurut UU ITE No. 11/2008
                Pasal 5. ID Transaksi:{' '}
                <span className="font-mono font-bold text-ink-800">{refNo}</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 bg-cream-50 border-t border-cream-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-cream-300 text-ink-600 text-xs font-bold hover:bg-cream-100 transition cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isPreparingPdf}
            aria-busy={isPreparingPdf}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-cream-50 text-xs font-bold shadow transition cursor-pointer disabled:cursor-wait disabled:opacity-70"
          >
            <Download className="w-4 h-4" />
            <span>{isPreparingPdf ? 'Menyiapkan PDF…' : 'Simpan Kwitansi PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
