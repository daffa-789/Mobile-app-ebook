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
