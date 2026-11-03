/**
 * Komponen pemicu kirim ulang kode OTP beserta penghitung mundur (countdown cooldown).
 *
 * @module src/features/auth/OtpResendAction
 */

/**
 * Komponen aksi kirim ulang kode OTP.
 *
 * @param {object} props - Properti komponen
 * @param {boolean} props.isResending - Status sedang proses pengiriman ulang
 * @param {number} props.resendCooldown - Sisa detik waktu tunggu cooldown
 * @param {() => void} props.onResend - Handler kirim ulang kode
 * @param {boolean} props.isReset - Apakah sedang dalam mode reset password
 * @param {boolean} props.isWhatsApp - Apakah target kanal adalah WhatsApp
 * @param {() => void} props.onReRegister - Handler daftar ulang jika salah nomor/email
 * @returns {import('react').JSX.Element}
 */
export const OtpResendAction = ({
  isResending,
  resendCooldown,
  onResend,
  isReset,
  isWhatsApp,
  onReRegister,
}) => {
  return (
    <>
      <div className="mt-5 text-center">
        <button
          type="button"
          onClick={onResend}
          disabled={isResending || resendCooldown > 0}
          className="auth-link text-xs font-bold disabled:opacity-50"
        >
          {resendCooldown > 0 ? `Kirim ulang kode (${resendCooldown} dtk)` : 'Kirim ulang kode'}
        </button>
      </div>

      {!isReset && (
        <p className="mt-4 text-center text-caption leading-relaxed text-ink-400">
          Salah menulis {isWhatsApp ? 'nomor telepon' : 'alamat email'}?{' '}
          <button type="button" onClick={onReRegister} className="auth-link">
            Daftar ulang
          </button>
        </p>
      )}
    </>
  );
};
