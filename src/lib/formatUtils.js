const idrFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

/**
 * Pemformat mata uang standar Rupiah Indonesia (IDR) tanpa angka desimal.
 * @param {number|string} value - Nilai nominal angka
 * @returns {string} String terformat mis. "Rp 25.000"
 */
export const formatRupiah = (value) => idrFormatter.format(Number(value || 0));
