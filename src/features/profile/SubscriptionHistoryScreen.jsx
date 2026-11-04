import { useState, useEffect } from 'react';
import { Download, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@context/AppContext';
import { formatWIB } from '@lib/date';
import { layout, controls } from '@lib/styles';
import { DEFAULT_PLAN } from '@lib/plans';

export const SubscriptionHistoryScreen = () => {
  const { subscriptions, refreshSubscriptions, navigateTo, user } = useApp();
  const [displayCount, setDisplayCount] = useState(2);
  const [refUnduh, setRefUnduh] = useState(null);

  useEffect(() => {
    refreshSubscriptions?.();
  }, [refreshSubscriptions]);

  /* Riwayat tidak lagi membuka pratinjau kwitansi: satu tombol unduh cukup dan
     layarnya tetap ringan. Angka kwitansi tetap satu sumber dengan PDF karena
     keduanya memakai resolveReceiptFields. */
  const handleUnduhPdf = async (sub) => {
    if (refUnduh) return;

    setRefUnduh(sub.id);
    try {
      const { downloadReceiptPdf } = await import('@lib/receiptPdf');
      downloadReceiptPdf(
        {
          refNo: sub.ref || sub.orderId,
          dateStr: formatWIB(sub.createdAt),
          planName: sub.planName || DEFAULT_PLAN.title,
          amount: sub.rawPrice || DEFAULT_PLAN.price,
          adminFee: sub.adminFee || 0,
          totalPaid: sub.totalPaid || DEFAULT_PLAN.price,
          periodStr: sub.period || '1 Bulan Langganan Pro',
        },
        user,
      );
    } catch {
      toast.error('Kwitansi PDF gagal disiapkan. Silakan coba lagi.');
    } finally {
      setRefUnduh(null);
    }
  };

  const isAllLoaded = displayCount >= subscriptions.length;

  const handleLoadMore = () => {
    if (!isAllLoaded) {
      setDisplayCount((prev) => Math.min(subscriptions.length, prev + 2));
    }
  };

  return (
    <div className="min-h-[640px] flex flex-col justify-between px-4 sm:px-6 py-6 bg-cream-50">
      <div className={layout.contentCenter}>
        {subscriptions.length === 0 ? (
          <div className="min-h-[460px] flex flex-col items-center justify-center py-12 px-4 text-center space-y-3">
            <h3 className="font-bold text-body text-ink-800">Belum Ada Riwayat Langganan</h3>
            <p className="text-caption text-ink-400 max-w-xs mx-auto">
              Anda belum memiliki transaksi langganan aktif maupun riwayat terdahulu.
            </p>
            <button
              type="button"
              onClick={() => navigateTo('pro')}
              className="inline-flex items-center justify-center min-h-10 px-5 py-2.5 bg-brand-700 hover:bg-brand-800 text-cream-50 text-caption font-bold rounded-xl shadow-sm transition mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer"
            >
              Lihat Paket Pro
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {subscriptions.slice(0, displayCount).map((sub) => {
              const isActive = sub.status === 'Aktif';
              const refNumber = sub.ref || sub.orderId || 'REF-86331757';

              return (
                <div
                  key={sub.id}
                  data-testid={`sub-card-${sub.id}`}
                  className="bg-cream-50 rounded-3xl p-5 border border-cream-300/80"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-ink-900 flex items-center gap-1.5">
                        <span>{sub.planName}</span>
                        {isActive && <Sparkles className={controls.iconSm} />}
                      </h3>
                      <p className="text-xs font-semibold text-brand-800 mt-0.5">{sub.price}</p>
                      <p className="text-micro font-mono text-ink-400 mt-0.5">{refNumber}</p>
                      <p className="text-micro text-ink-400 mt-1">
                        Dibeli: {formatWIB(sub.createdAt)}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span
                        className={`text-micro font-bold px-2.5 py-0.5 rounded-full border ${
                          isActive
                            ? 'bg-brand-100 text-brand-800 border-brand-300'
                            : 'bg-cream-200 text-ink-500 border-cream-300'
                        }`}
                      >
                        {sub.status}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleUnduhPdf(sub)}
                        disabled={refUnduh === sub.id}
                        aria-busy={refUnduh === sub.id}
                        className="inline-flex items-center gap-1.5 rounded text-micro font-bold text-brand-800 hover:text-brand-950 transition cursor-pointer disabled:opacity-60 disabled:cursor-wait focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{refUnduh === sub.id ? 'Menyiapkan…' : 'Unduh PDF'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {subscriptions.length > 0 && !isAllLoaded && (
        <div className="pt-6">
          <button
            type="button"
            data-testid="load-more-btn"
            onClick={handleLoadMore}
            className="w-full py-3.5 bg-cream-100 hover:bg-brand-50 text-brand-800 text-xs font-bold rounded-2xl border border-brand-200 transition text-center shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            Muat Lebih Banyak
          </button>
        </div>
      )}
    </div>
  );
};
