/**
 * Komponen ringkasan rincian paket dan biaya administrasi pada layar konfirmasi pembayaran.
 *
 * @module src/features/payment/PaymentPlanSummary
 */

/**
 * Komponen rincian tagihan paket langganan.
 *
 * @param {object} props - Properti komponen
 * @param {object} props.selectedPlan - Data paket langganan terpilih
 * @param {object} [props.selectedPaymentMethod] - Data metode pembayaran terpilih
 * @returns {import('react').JSX.Element}
 */
export const PaymentPlanSummary = ({ selectedPlan, selectedPaymentMethod }) => {
  const basePrice = Number(selectedPlan?.price || 25000);
  const adminFee = 3000;
  const total = basePrice + adminFee;

  return (
    <div className="bg-cream-50 border border-cream-300 shadow-sm rounded-3xl p-5 mb-6 space-y-4 hover:shadow-md transition">
      <div className="flex justify-between items-center pb-4 border-b border-cream-200">
        <span className="text-xs font-medium text-ink-400">Metode Pembayaran</span>
        <div className="flex items-center gap-3">
          {selectedPaymentMethod?.logoUrl && (
            <div className="w-10 h-8 p-1 rounded-lg bg-cream-50 border border-cream-200 shadow-sm flex items-center justify-center">
              <img
                src={selectedPaymentMethod.logoUrl}
                alt={selectedPaymentMethod.name}
                className={`w-full h-full object-contain ${selectedPaymentMethod.mono ? 'dark:invert' : ''}`}
              />
            </div>
          )}
          <span className="font-bold text-sm text-ink-900">
            {selectedPaymentMethod?.name || 'QRIS (Semua Pembayaran)'}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center pb-3 border-b border-cream-200">
        <span className="text-xs font-medium text-ink-400">Harga Paket</span>
        <span className="text-sm font-bold text-ink-800">{selectedPlan?.formattedPrice}</span>
      </div>

      <div className="flex justify-between items-center pb-3 border-b border-cream-200 text-xs">
        <span className="font-medium text-ink-400">Biaya Administrasi</span>
        <span className="font-bold text-ink-700 bg-cream-200 px-2 py-0.5 rounded-md border border-cream-300">
          Rp {adminFee.toLocaleString('id-ID')}
        </span>
      </div>

      <div className="flex justify-between items-center pt-1 text-xs">
        <span className="font-bold text-ink-700">Total Pembayaran</span>
        <span className="text-lg font-black text-brand-800">
          Rp {total.toLocaleString('id-ID')}
        </span>
      </div>
    </div>
  );
};
