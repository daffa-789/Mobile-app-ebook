import { CheckCircle2, Circle, Wallet } from 'lucide-react';
import { useApp } from '@context/AppContext';
import { PAYMENT_METHODS } from '@data/mockData';
import { AlreadySubscribedNotice } from './AlreadySubscribedNotice';
import { typography, controls } from '@lib/styles';

export const PaymentMethodScreen = () => {
  const {
    user,
    selectedPlan,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    navigateTo,
    isSubscriptionActive,
  } = useApp();

  const isSubscribed = isSubscriptionActive ? isSubscriptionActive(user) : Boolean(user?.isPro);

  const handleContinue = () => {
    if (isSubscribed) return;
    navigateTo('payment-confirm');
  };

  if (isSubscribed) {
    return (
      <AlreadySubscribedNotice
        minHeight="700px"
        reason="pembayaran"
        onPro={() => navigateTo('pro')}
        onHistory={() => navigateTo('subscription-history')}
      />
    );
  }

  return (
    <div className="min-h-[700px] flex flex-col justify-between px-4 sm:px-6 lg:px-8 py-8 bg-cream-50">
      <div className="max-w-4xl mx-auto w-full flex-1">
        <div className="mb-6">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 tracking-tight">
            Pilih Metode Pembayaran
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            Selesaikan transaksi keanggotaan Pro secara aman dengan metode pembayaran resmi.
          </p>
        </div>

        <div className="bg-gradient-to-r from-brand-600/10 via-brand-50 to-brand-600/10 border border-brand-200/80 rounded-2xl p-5 mb-6 flex justify-between items-center shadow-xs">
          <div>
            <span className="text-caption font-bold text-brand-800 uppercase tracking-wider bg-brand-100/70 px-2.5 py-0.5 rounded-full">
              Paket Dipilih
            </span>
            <h3 className="text-base font-extrabold text-ink-900 mt-1">{selectedPlan.title}</h3>
          </div>
          <div className="text-right">
            <span className="text-xl font-black text-brand-800 font-serif">
              {selectedPlan.formattedPrice}
            </span>
          </div>
        </div>

        <div className="space-y-6">
          {PAYMENT_METHODS.map((cat, catIdx) => (
            <div key={catIdx}>
              <h3 className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Wallet className={controls.iconSm} />
                <span>{cat.category}</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {cat.options.map((opt) => {
                  const isSelected = selectedPaymentMethod?.id === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedPaymentMethod(opt)}
                      aria-pressed={isSelected}
                      className={`w-full p-4 rounded-2xl border transition flex items-center justify-between text-left group hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50/40 shadow-xs ring-1 ring-brand-600'
                          : 'border-cream-300 hover:border-brand-500/50 bg-cream-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 p-2 rounded-xl flex items-center justify-center font-bold text-xs bg-cream-50 border border-cream-200 shadow-xs overflow-hidden">
                          {opt.logoUrl ? (
                            <img
                              src={opt.logoUrl}
                              alt={opt.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) {
                                  e.target.nextSibling.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <span
                            style={{
                              display: opt.logoUrl ? 'none' : 'flex',
                              backgroundColor: opt.color || '#14523A',
                            }}
                            className="w-full h-full text-cream-50 items-center justify-center text-xs font-bold rounded-lg shadow-inner"
                          >
                            {opt.id.slice(0, 3).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p
                            className={`text-sm font-bold transition ${
                              isSelected
                                ? 'text-brand-800'
                                : 'text-ink-900 group-hover:text-brand-800'
                            }`}
                          >
                            {opt.name}
                          </p>
                          <p className={typography.metaTight}>
                            Konfirmasi Instan via QRIS Midtrans
                          </p>
                        </div>
                      </div>

                      <div className="text-brand-800 shrink-0">
                        {isSelected ? (
                          <CheckCircle2 className="w-6 h-6 fill-brand-700 text-cream-50 drop-shadow-xs" />
                        ) : (
                          <Circle className="w-6 h-6 text-ink-300 group-hover:text-brand-700/40 transition" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-cream-200 mt-8">
          <div className="flex items-center justify-between mb-3 text-sm">
            <span className="text-ink-500 font-medium">Total Pembayaran:</span>
            <span className="text-xl font-black text-ink-900 font-serif">
              {selectedPlan.formattedPrice}
            </span>
          </div>
          <button
            type="button"
            onClick={handleContinue}
            className="w-full bg-brand-700 hover:bg-brand-800 active:bg-brand-900 text-cream-50 font-bold py-3.5 rounded-2xl shadow-md shadow-brand-900/10 transition text-sm cursor-pointer"
          >
            Lanjutkan Pembayaran
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodScreen;
