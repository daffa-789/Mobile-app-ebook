import { useCallback } from 'react';
import { Check, ArrowRight, Sparkles, Shield, Crown } from 'lucide-react';
import { useApp } from '@context/AppContext';
import { layout, surfaces } from '@lib/styles';
import { DEFAULT_PLAN, getAdminFee } from '@lib/plans';
import { formatRupiah } from '@lib/formatUtils';

export const ProScreen = () => {
  const { user, setSelectedPlan, navigateTo, isSubscriptionActive, clearLastPaymentResult } =
    useApp();

  const isSubscribed = isSubscriptionActive ? isSubscriptionActive(user) : Boolean(user?.isPro);
  const adminFee = getAdminFee();
  const totalAmount = DEFAULT_PLAN.price + adminFee;

  const handleSelectPlan = useCallback(() => {
    if (isSubscribed) return;

    clearLastPaymentResult?.();
    setSelectedPlan({
      id: DEFAULT_PLAN.id,
      title: DEFAULT_PLAN.title,
      price: DEFAULT_PLAN.price,
      period: DEFAULT_PLAN.period,
      formattedPrice: DEFAULT_PLAN.formattedPrice,
    });
    navigateTo('payment-method');
  }, [isSubscribed, setSelectedPlan, navigateTo, clearLastPaymentResult]);

  return (
    <div className="flex-1 flex flex-col justify-center items-center bg-cream-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gold-400/20 text-gold-700 ring-1 ring-gold-500/30 mb-3">
            <Crown className="w-3.5 h-3.5 text-gold-600" />
            <span>Keanggotaan Eksklusif</span>
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink-900 tracking-tight">
            Tingkatkan ke Member Pro
          </h1>
          <p className="mt-2 text-sm text-ink-600 max-w-md mx-auto">
            Buka akses tanpa batas ke seluruh kitab, naskah kajian, dan khazanah literatur
            Wahidiyah.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="w-full bg-cream-50 rounded-3xl p-6 sm:p-8 border-2 border-brand-700 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-brand-700 text-cream-50 text-[11px] font-bold px-4 py-1 rounded-bl-xl uppercase tracking-wider">
            Rekomendasi
          </div>

          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-black text-ink-900">
              {DEFAULT_PLAN.title}
            </h2>
            <p className="text-xs text-ink-500 mt-0.5">Akses penuh selama 30 hari kalender</p>

            {/* Price Presentation */}
            <div className="mt-5 pb-5 border-b border-cream-200">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-ink-900 tracking-tight font-serif">
                  {DEFAULT_PLAN.formattedPrice}
                </span>
                <span className="text-sm font-semibold text-ink-500">{DEFAULT_PLAN.period}</span>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs text-ink-500 bg-cream-100/70 p-2.5 rounded-xl border border-cream-200">
                <span>Biaya layanan gateway QRIS:</span>
                <span className="font-semibold text-ink-700">{formatRupiah(adminFee)}</span>
              </div>

              <div className="mt-1.5 flex items-center justify-between text-xs font-bold text-brand-900 px-1">
                <span>Total Ditagihkan:</span>
                <span>{formatRupiah(totalAmount)}</span>
              </div>
            </div>

            {/* Feature List */}
            <div className="mt-6 space-y-3.5 text-xs sm:text-sm text-ink-700">
              <div className={layout.rowStartGap}>
                <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>
                  Buka seluruh naskah dan kitab bertanda <strong>PRO</strong>
                </span>
              </div>

              <div className={layout.rowStartGap}>
                <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>Pembaca dokumen digital multi-format (PDF & Word DOCX)</span>
              </div>

              <div className={layout.rowStartGap}>
                <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>Penyimpanan posisi halaman baca terakhir otomatis</span>
              </div>

              <div className={layout.rowStartGap}>
                <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>Kwitansi pembayaran resmi digital (PDF terverifikasi)</span>
              </div>

              <div className={layout.rowStartGap}>
                <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>Dukungan pelanggan prioritas</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          {isSubscribed ? (
            <button
              type="button"
              disabled
              className="w-full mt-8 py-3.5 bg-cream-200 text-ink-400 text-sm font-bold rounded-2xl cursor-not-allowed border border-cream-300 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 text-brand-600" />
              <span>Keanggotaan Pro Sedang Aktif</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSelectPlan}
              className="w-full mt-8 py-4 bg-brand-700 hover:bg-brand-800 active:bg-brand-900 text-cream-50 text-sm font-bold rounded-2xl shadow-md shadow-brand-900/15 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Berlangganan Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <p className="mt-4 text-center text-xs text-ink-400 flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-brand-600" />
            <span>Pembayaran aman instan via QRIS Midtrans</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProScreen;
