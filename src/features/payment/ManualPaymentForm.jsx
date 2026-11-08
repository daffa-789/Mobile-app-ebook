/**
 * Formulir pengisian data pembayaran manual / bank transfer.
 *
 * @module src/features/payment/ManualPaymentForm
 */

/**
 * Komponen formulir pembayaran manual.
 *
 * @param {object} props - Properti komponen
 * @param {string} props.phone - Nomor handphone pembayaran
 * @param {(phone: string) => void} props.setPhone - Setter nomor telepon
 * @param {boolean} props.agreed - Status persetujuan syarat & ketentuan
 * @param {(agreed: boolean) => void} props.setAgreed - Setter persetujuan
 * @param {string} props.error - Pesan galat validasi formulir
 * @param {() => void} props.clearError - Handler membersihkan pesan galat
 * @param {(e: import('react').FormEvent) => void} props.onSubmit - Handler submit form
 * @returns {import('react').JSX.Element}
 */
export const ManualPaymentForm = ({
  phone,
  setPhone,
  agreed,
  setAgreed,
  error,
  clearError,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="payment-phone-input" className="block text-xs font-semibold text-ink-700">
          Detail Pembayaran (Nomor Handphone)
        </label>
        <input
          id="payment-phone-input"
          type="text"
          data-testid="payment-phone"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            if (error) clearError();
          }}
          placeholder="Contoh: 081234567890"
          className="w-full px-4 py-3.5 text-sm rounded-2xl border border-cream-300 focus:border-brand-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-50 focus-visible:bg-cream-50 transition font-medium text-ink-900 placeholder:text-ink-400 bg-cream-100/50 shadow-sm"
        />
      </div>

      <div className="pt-2 bg-brand-50/30 p-4 rounded-2xl border border-brand-100/50">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            data-testid="payment-terms-checkbox"
            checked={agreed}
            onChange={(e) => {
              setAgreed(e.target.checked);
              if (error) clearError();
            }}
            className="h-6 w-6 shrink-0 mt-0.5 text-brand-800 rounded border-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus:ring-brand-500 accent-brand-500"
          />
          <span className="text-xs text-ink-500 leading-snug">
            Saya menyetujui seluruh{' '}
            <span className="text-brand-800 font-semibold">Syarat & Ketentuan</span> berlangganan
            Buku Wahidiyah
          </span>
        </label>
      </div>

      {error && <p className="text-semantic-danger text-xs mt-2 font-medium">{error}</p>}

      <button
        type="submit"
        className="w-full mt-4 bg-brand-700 hover:bg-brand-700 active:bg-brand-800 text-cream-50 font-semibold py-3.5 rounded-2xl shadow-md shadow-brand-600/20 transition text-sm flex items-center justify-center gap-2 cursor-pointer"
      >
        <span>Bayar Sekarang</span>
      </button>
    </form>
  );
};
