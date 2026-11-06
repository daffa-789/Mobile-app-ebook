import { Loader2, X } from 'lucide-react';

export const PaymentProcessingOverlay = ({ onCancel }) => {
  return (
    <div
      data-testid="payment-processing-modal"
      role="alertdialog"
      aria-labelledby="payment-processing-title"
      className="absolute inset-0 bg-cream-50/95 backdrop-blur-md z-50 flex flex-col justify-between p-6 page-transition"
    >
      <div>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 -m-1 min-h-11 min-w-11 flex items-center justify-center text-ink-400 hover:text-ink-800 rounded-full hover:bg-cream-200 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer"
          title="Batal Memproses"
          aria-label="Batal memproses pembayaran"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex flex-col items-center justify-center text-center my-auto">
        <div className="relative mb-6">
          <Loader2 className="w-16 h-16 text-brand-800 animate-spin stroke-[2.5]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl">💳</span>
          </div>
        </div>
        <h3 id="payment-processing-title" className="text-lg font-bold text-ink-900">
          Memproses pembayaran...
        </h3>
        <p className="text-xs text-ink-400 mt-2 max-w-xs leading-relaxed">
          Mohon jangan menutup aplikasi sementara kami menghubungkan transaksi dengan payment
          gateway Midtrans.
        </p>
      </div>

      <div className="text-center text-caption text-ink-400 py-4 font-medium">
        Pembayaran QRIS Midtrans
      </div>
    </div>
  );
};

export default PaymentProcessingOverlay;
