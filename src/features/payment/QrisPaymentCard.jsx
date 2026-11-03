/**
 * Komponen kartu pembayaran QRIS terintegrasi Midtrans.
 * Menampilkan kode QR, countdown masa berlaku, tombol unduh QRIS, simulator copy link, dan tombol batalkan.
 *
 * @module src/features/payment/QrisPaymentCard
 */

import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { typography } from '@lib/styles';

/**
 * Komponen kartu QRIS utama.
 *
 * @param {object} props - Properti komponen
 * @param {object} props.qrTransaction - Data transaksi QRIS dari hook
 * @param {boolean} props.isGeneratingQr - Sedang memuat transaksi QRIS dari backend
 * @param {string|null} props.qrError - Pesan error saat pembuatan QR gagal
 * @param {string|null} props.qrNotice - Pesan pemberitahuan dari hook
 * @param {boolean} props.isQrisPaid - Apakah transaksi QRIS sudah lunas
 * @param {boolean} props.isExpired - Apakah masa berlaku QRIS sudah habis
 * @param {boolean} props.isCancelling - Sedang membatalkan QRIS
 * @param {string} props.formattedCountdown - Sisa waktu kedaluwarsa format menit:detik
 * @param {boolean} props.qrImageGagal - Indikator fallback bila image Midtrans gagal dimuat
 * @param {() => void} props.setQrImageGagal - Setter fallback image gagal
 * @param {boolean} props.qrCopied - Status teks tersalin ke papan klip
 * @param {string} props.qrLinkToCopy - Tautan QR untuk simulator
 * @param {import('react').RefObject<HTMLDivElement>} props.qrContainerRef - Ref container pembungkus QR
 * @param {() => void} props.onRegenerateQr - Handler coba lagi / buat ulang QR
 * @param {() => void} props.onCopyQr - Handler salin link simulator
 * @param {() => void} props.onDownloadQr - Handler unduh QRIS ke galeri
 * @param {() => void} props.onCancelQris - Handler batalkan transaksi QR
 * @returns {import('react').JSX.Element}
 */
export const QrisPaymentCard = ({
  qrTransaction,
  isGeneratingQr,
  qrError,
  qrNotice,
  isQrisPaid,
  isExpired,
  isCancelling,
  formattedCountdown,
  qrImageGagal,
  setQrImageGagal,
  qrCopied,
  qrLinkToCopy,
  qrContainerRef,
  onRegenerateQr,
  onCopyQr,
  onDownloadQr,
  onCancelQris,
}) => {
  return (
    <div className="bg-cream-100 border border-cream-300 rounded-3xl p-6 shadow-sm space-y-5 text-center">
      <div className="flex items-center justify-between bg-qris-600 text-cream-50 px-4 py-2.5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          <img
            src="/payments/qris-putih.svg"
            alt="Logo QRIS"
            className="h-4 w-auto shrink-0"
            loading="lazy"
          />
          <span className="font-black text-xs tracking-wider uppercase">QRIS PEMBAYARAN</span>
        </div>
        <span className="text-micro font-bold bg-cream-50/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-cream-100" />
          WAHIDIYAH BOOK
        </span>
      </div>

      {!isQrisPaid && qrTransaction && (
        <div className="flex items-center justify-center gap-1.5 text-xs text-ink-500 font-semibold">
          <Clock className="w-3.5 h-3.5 text-semantic-warning" />
          <span>Masa berlaku QR:</span>
          <span className="font-mono font-bold text-semantic-warning bg-semantic-warningLight px-2.5 py-0.5 rounded-lg border border-semantic-warning/30">
            {formattedCountdown}
          </span>
        </div>
      )}

      <div
        ref={qrContainerRef}
        className="relative mx-auto w-64 h-64 bg-cream-50 p-4 rounded-3xl border-2 border-dashed border-cream-300 shadow-inner flex flex-col items-center justify-center"
      >
        {isGeneratingQr ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
            <span className="text-xs text-ink-400 font-medium">Membuat Kode QR...</span>
          </div>
        ) : qrError ? (
          <div className="p-3 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-semantic-danger mx-auto" />
            <p className="text-xs text-semantic-danger font-medium">{qrError}</p>
            <button
              onClick={onRegenerateQr}
              className="px-3 py-1.5 bg-cream-300 hover:bg-cream-300 rounded-lg text-xs font-bold text-ink-800 inline-flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Coba Lagi</span>
            </button>
          </div>
        ) : isQrisPaid ? (
          <div className="flex flex-col items-center gap-2 text-brand-600 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>
            <span className="text-sm font-black">PEMBAYARAN LUNAS!</span>
            <span className={typography.helperInline}>Mengaktifkan paket Pro...</span>
          </div>
        ) : isExpired ? (
          <div className="flex flex-col items-center gap-2 text-semantic-warning">
            <Clock className="w-8 h-8" />
            <span className="text-xs font-bold">Kode QR kedaluwarsa</span>
            <button
              onClick={onRegenerateQr}
              className="px-3 py-1.5 bg-cream-300 hover:bg-cream-400 rounded-lg text-xs font-bold text-ink-800 inline-flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Buat Ulang</span>
            </button>
          </div>
        ) : qrTransaction?.qrImageUrl && !qrImageGagal ? (
          <img
            key={qrTransaction.orderId}
            src={qrTransaction.qrImageUrl}
            alt="Kode QRIS pembayaran resmi Midtrans"
            width="224"
            height="224"
            className="h-56 w-56 rounded-xl bg-cream-50 object-contain"
            onError={() => setQrImageGagal(true)}
          />
        ) : qrTransaction?.qrString ? (
          <QRCodeSVG
            value={qrTransaction.qrString}
            size={224}
            level="M"
            marginSize={4}
            className="w-56 h-56"
            title="Kode QRIS pembayaran"
          />
        ) : null}
      </div>

      {qrNotice && !isQrisPaid && (
        <p
          role="status"
          className="mt-3 rounded-xl border border-semantic-warning/40 bg-semantic-warningLight px-3 py-2 text-caption leading-relaxed text-semantic-warning"
        >
          {qrNotice}
        </p>
      )}

      {!isQrisPaid && !isExpired && !isGeneratingQr && qrTransaction && (
        <div className="pt-1 space-y-2.5">
          <div className="rounded-2xl border border-cream-300 bg-cream-100/70 p-3 space-y-2 text-left">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="h-2 w-2 rounded-full bg-brand-600 shrink-0" />
              <span className="text-caption font-bold text-ink-900 truncate">
                Simulator QRIS Midtrans
              </span>
            </div>

            {qrLinkToCopy && (
              <p
                className="font-mono text-micro text-ink-600 bg-cream-50 rounded-xl p-2 border border-cream-200 truncate select-all"
                title="Tautan gambar QR — tahan untuk menyalin manual"
              >
                {qrLinkToCopy}
              </p>
            )}

            <button
              type="button"
              onClick={onCopyQr}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-cream-300 bg-cream-50 hover:bg-cream-200 text-ink-800 text-caption font-bold transition shadow-xs cursor-pointer active:scale-95"
              title="Salin tautan QR untuk ditempel di kolom QR Code Image Url simulator"
            >
              {qrCopied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-700" />
                  <span className="text-brand-800">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-ink-600" />
                  <span>Salin Kode QR</span>
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={onDownloadQr}
            className="w-full inline-flex items-center justify-center gap-2 min-h-11 px-4 py-2.5 bg-brand-700 hover:bg-brand-800 active:bg-brand-900 text-cream-50 text-xs font-bold rounded-xl shadow transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Simpan QRIS ke Galeri (Buka di DANA/BCA)</span>
          </button>

          <button
            type="button"
            data-testid="qris-cancel"
            onClick={onCancelQris}
            disabled={isCancelling}
            className="w-full inline-flex items-center justify-center gap-2 min-h-11 px-4 py-2.5 border border-cream-300 bg-cream-50 hover:bg-cream-100 active:bg-cream-200 text-ink-700 text-xs font-bold rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isCancelling ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Membatalkan…</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Batalkan & Buat Kode Baru</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
