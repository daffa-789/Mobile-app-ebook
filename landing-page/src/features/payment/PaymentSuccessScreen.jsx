import { useState, useEffect } from 'react';
import { Download, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { useApp } from '@context/AppContext';
import { typography } from '@lib/styles';
import { formatRupiah } from '@lib/formatUtils';
import dayjs from 'dayjs';
import { DEFAULT_PLAN, getAdminFee } from '@lib/plans';

export const PaymentSuccessScreen = () => {
  const { user, lastPaymentResult, selectedPlan, selectedPaymentMethod, navigateTo } = useApp();
  const [menyiapkanPdf, setMenyiapkanPdf] = useState(false);

  useEffect(() => {
    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.55 },
        colors: ['#14523A', '#B8860B', '#22C55E', '#F59E0B', '#3B82F6'],
      });
    } catch {}
  }, []);

  const fallbackAmount = Number(selectedPlan?.price || DEFAULT_PLAN.price);
  const fallbackAdminFee = getAdminFee();
  const details = lastPaymentResult || {
    refNo: null,
    dateStr: dayjs().format('DD/MM/YYYY, HH:mm'),
    periodStr: null,
    amount: fallbackAmount,
    adminFee: fallbackAdminFee,
    totalPaid: fallbackAmount + fallbackAdminFee,
    methodName: selectedPaymentMethod?.name || 'QRIS',
    planName: selectedPlan?.title || DEFAULT_PLAN.title,
  };

  const hasRef = Boolean(details.refNo) && details.refNo !== '—';
  const hasPeriod = Boolean(details.periodStr) && details.periodStr !== '—';

  const angka = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  };
  const amount = angka(details.amount) ?? fallbackAmount;
  const adminFee = angka(details.adminFee) ?? fallbackAdminFee;
  const total = angka(details.totalPaid) ?? amount + adminFee;

  const rows = [
    ['Nomor referensi', hasRef ? details.refNo : 'WB-' + Date.now().toString(36).toUpperCase()],
    ['Waktu', details.dateStr],
    ['Paket', details.planName],
    ['Masa aktif', hasPeriod ? details.periodStr : 'Aktif 30 Hari (Pro)'],
    ['Biaya layanan', adminFee === 0 ? 'Gratis (Rp 0)' : formatRupiah(adminFee)],
  ];

  const handleUnduhPdf = async () => {
    if (menyiapkanPdf) return;

    setMenyiapkanPdf(true);
    try {
      const { downloadReceiptPdf } = await import('@lib/receiptPdf');
      downloadReceiptPdf({ ...details, amount, adminFee, totalPaid: total }, user);
    } catch {
      toast.error('Kwitansi PDF gagal disiapkan. Silakan coba lagi.');
    } finally {
      setMenyiapkanPdf(false);
    }
  };

  return (
    <div className="min-h-[640px] bg-cream-50 px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-700 mx-auto flex items-center justify-center shadow-md animate-in zoom-in-95">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink-900">
            {details.pendingVerification
              ? 'Menunggu konfirmasi pembayaran'
              : 'Pembayaran Berhasil!'}
          </h1>

          {details.pendingVerification ? (
            <p className="mt-2 text-sm text-ink-500">
              Transaksi Anda tercatat. Paket Pro aktif setelah payment gateway mengonfirmasi
              pembayaran.
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-ink-600">
              Selamat, akun Anda telah aktif sebagai <strong>Member Pro</strong>. Silakan nikmati
              akses penuh seluruh kitab dan fitur eksklusif.
            </p>
          )}
        </div>

        <section className="overflow-hidden rounded-3xl border border-cream-300 bg-cream-50 shadow-xl shadow-brand-900/5">
          <div className="space-y-4 p-5 sm:p-6">
            <div className="border-b border-cream-200 pb-4 text-center">
              <p className="text-micro font-bold uppercase tracking-wider text-ink-400">
                Total pembayaran
              </p>
              <p className="mt-1 text-3xl font-black tracking-tight text-brand-800 font-serif">
                {formatRupiah(total)}
              </p>
              <p className={typography.helperTight}>{details.methodName}</p>
            </div>
            <dl className="space-y-3 text-sm">
              {rows.map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-start justify-between gap-5 border-b border-cream-200 pb-3 last:border-0 last:pb-0"
                >
                  <dt className="text-ink-400">{label}</dt>
                  <dd className="text-right text-xs font-bold text-ink-800">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleUnduhPdf}
            disabled={menyiapkanPdf}
            aria-busy={menyiapkanPdf}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-brand-700 bg-cream-50 px-4 py-3.5 text-sm font-bold text-brand-800 transition hover:bg-brand-50 shadow-xs cursor-pointer disabled:cursor-wait disabled:opacity-70"
          >
            <Download className="w-4 h-4 text-brand-700" />
            <span>{menyiapkanPdf ? 'Menyiapkan PDF…' : 'Simpan Kwitansi (PDF)'}</span>
          </button>
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-700 px-4 py-3.5 text-sm font-bold text-cream-50 transition hover:bg-brand-800 shadow-md cursor-pointer"
          >
            <span>Mulai Membaca Buku</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessScreen;
