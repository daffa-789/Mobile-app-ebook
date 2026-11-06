export const OtpDevNotice = ({ devOtp, isWhatsApp }) => {
  if (!devOtp) return null;

  return (
    <div className="mt-4 rounded-2xl border border-semantic-warning/30 bg-semantic-warningLight px-4 py-3">
      <p className="text-caption font-bold uppercase tracking-wide text-semantic-warning">
        Mode pengembangan — pengiriman {isWhatsApp ? 'WhatsApp' : 'email'} belum aktif
      </p>
      <p className="mt-1 text-xs leading-relaxed text-semantic-warning/85">
        {isWhatsApp ? 'Gateway WhatsApp (Fonnte)' : 'Pengiriman email'} belum dikonfigurasi, jadi
        kode ditampilkan di sini. Kode Anda:{' '}
        <strong className="font-mono text-base tracking-[0.2em]">{devOtp}</strong>
      </p>
    </div>
  );
};
