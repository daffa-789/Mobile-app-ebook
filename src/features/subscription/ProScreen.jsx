import { useCallback } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { useApp } from '@context/AppContext';
import { layout, surfaces } from '@lib/styles';
import { DEFAULT_PLAN } from '@lib/plans';

export const ProScreen = () => {
  const { user, setSelectedPlan, navigateTo, isSubscriptionActive, clearLastPaymentResult } =
    useApp();

  const isSubscribed = isSubscriptionActive ? isSubscriptionActive(user) : Boolean(user?.isPro);
  const isMonthlyActive = isSubscribed;

  const handleSelectPlan = useCallback(
    (planId, title, price, period, formatted) => {
      if (isSubscribed) return;

      clearLastPaymentResult?.();
      setSelectedPlan({
        id: planId,
        title,
        price,
        period,
        formattedPrice: formatted,
      });
      navigateTo('payment-method');
    },
    [isSubscribed, setSelectedPlan, navigateTo, clearLastPaymentResult],
  );

  return (
    <div className="flex-1 flex flex-col justify-center items-center bg-cream-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg">
        <div className="w-full bg-cream-50 rounded-3xl p-6 sm:p-7 border border-cream-300 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between relative group hover:border-brand-200">
          <div>
            <div>
              <h3 className="text-title font-black text-ink-900">{DEFAULT_PLAN.title}</h3>
            </div>

            <div className="mt-5 pb-5 border-b border-cream-200">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black text-ink-900 tracking-tight">
                  {DEFAULT_PLAN.formattedPrice}
                </span>
                <span className="text-caption font-semibold text-ink-500">
                  {DEFAULT_PLAN.period}
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-caption text-ink-700">
              <div className={layout.rowStartGap}>
                <div className={surfaces.statBadge}>
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>Seluruh kitab bertanda Pro terbuka penuh</span>
              </div>
              <div className={layout.rowStartGap}>
                <div className={surfaces.statBadge}>
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>Dukungan pelanggan standar</span>
              </div>
            </div>
          </div>

          {isSubscribed ? (
            <button
              type="button"
              disabled
              className="w-full mt-6 py-3.5 bg-cream-200 text-ink-300 text-small font-bold rounded-2xl cursor-not-allowed border border-cream-300 flex items-center justify-center gap-1.5"
              title="Anda telah memiliki langganan aktif"
            >
              {isMonthlyActive && <Check className="w-4 h-4 text-brand-600" />}
              <span>
                {isMonthlyActive ? 'Paket Sedang Aktif' : 'Tidak Tersedia (Sedang Berlangganan)'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                handleSelectPlan(
                  DEFAULT_PLAN.id,
                  DEFAULT_PLAN.title,
                  DEFAULT_PLAN.price,
                  DEFAULT_PLAN.period,
                  DEFAULT_PLAN.formattedPrice,
                )
              }
              className="w-full mt-6 py-3.5 bg-brand-700 hover:bg-brand-600 active:bg-brand-800 text-cream-50 text-small font-extrabold rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2"
            >
              <span>Berlangganan Sekarang</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
