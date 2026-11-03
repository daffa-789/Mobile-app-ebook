/**
 * Service Layer — Pembayaran: konstanta proyeksi baris & himpunan status gateway.
 *
 * Dipakai bersama oleh seluruh modul di paket `payment/`: daftar kolom harus
 * identik di jalur baca, polling, dan webhook — selisih satu kolom membuat
 * transisi settle kehilangan `total_paid` untuk pencocokan nominal.
 */

/** Status Midtrans yang berarti order mati (tidak mungkin dibayar lagi). */
export const FAILED_MIDTRANS_STATUSES = new Set(['expire', 'cancel', 'deny']);

export const TRANSACTION_COLUMNS =
  'id, ref_no, user_id, plan_name, amount, admin_fee, total_paid, payment_method, status, verified_at, created_at, midtrans_transaction_id, midtrans_qr_url, midtrans_qr_string, expires_at';
