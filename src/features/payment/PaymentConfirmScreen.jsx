/**
 * Layar konfirmasi transaksi langganan dan instruksi pembayaran QRIS / manual.
 * Mengoordinasikan perhitungan tagihan, inisiasi transaksi QRIS, pengunduhan kode QR,
 * serta status polling pembayaran melalui sub-komponen modular.
 *
 * @module src/features/payment/PaymentConfirmScreen
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useApp, isQrisPaymentMethod } from '@context/AppContext';
import { useQrisPayment } from './useQrisPayment';
import { AlreadySubscribedNotice } from './AlreadySubscribedNotice';
import { downloadQrisImage } from './qrDownload';
import { layout } from '@lib/styles';

import { PaymentPlanSummary } from './PaymentPlanSummary';
import { QrisPaymentCard } from './QrisPaymentCard';
import { ManualPaymentForm } from './ManualPaymentForm';
import { PaymentProcessingOverlay } from './PaymentProcessingOverlay';

/**
 * Komponen Layar Konfirmasi Pembayaran.
 *
 * @returns {import('react').JSX.Element}
 */
export const PaymentConfirmScreen = () => {
  const {
    user,
    selectedPlan,
    selectedPaymentMethod,
    paymentPhone,
    setPaymentPhone,
    paymentAgreed,
    setPaymentAgreed,
    completePayment,
    navigateTo,
    isSubscriptionActive,
  } = useApp();

  const isSubscribed = isSubscriptionActive ? isSubscriptionActive(user) : Boolean(user?.isPro);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [qrCopied, setQrCopied] = useState(false);
  const [qrImageGagal, setQrImageGagal] = useState(false);
  const timerRef = useRef(null);
  const qrContainerRef = useRef(null);

  const isQrisMethod = isQrisPaymentMethod(selectedPaymentMethod);

  const handlePaymentSuccess = useCallback(
    async (facts) => {
      try {
        await completePayment(facts);
      } finally {
        navigateTo('payment-success');
      }
    },
    [completePayment, navigateTo],
  );

  const {
    qrTransaction,
    isGeneratingQr,
    qrError,
    qrNotice,
    isQrisPaid,
    isExpired,
    isCancelling,
    formattedCountdown,
    regenerateQr,
    cancelQris,
  } = useQrisPayment({
    selectedPlan,
    onPaymentSuccess: handlePaymentSuccess,
    isQrisActive: isQrisMethod && !isSubscribed,
    phone: paymentPhone,
  });

  useEffect(() => {
    setQrImageGagal(false);
  }, [qrTransaction?.orderId]);

  const handleDownloadQr = () => {
    downloadQrisImage({
      container: qrContainerRef.current,
      planId: selectedPlan?.id,
      qrImageUrl: qrTransaction?.qrImageUrl,
    });
  };

  const salinKePapanJepit = async (teks) => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(teks);
        return true;
      } catch {
        // fallback ke textarea di bawah
      }
    }

    const area = document.createElement('textarea');
    area.value = teks;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-9999px';
    document.body.appendChild(area);
    area.select();
    area.setSelectionRange(0, teks.length);
    const tersalin = document.execCommand('copy');
    document.body.removeChild(area);
    return tersalin;
  };

  const qrLinkToCopy =
    qrTransaction?.qrMidtransUrl ||
    (qrTransaction?.qrImageUrl ? `${window.location.origin}${qrTransaction.qrImageUrl}` : '') ||
    qrTransaction?.qrString ||
    '';

  const handleCopyQr = async () => {
    if (!qrLinkToCopy) {
      toast.error('Tautan QR belum tersedia.');
      return;
    }
    const tersalin = await salinKePapanJepit(qrLinkToCopy);
    if (!tersalin) {
      toast.error('Browser menolak menyalin. Tahan teks tautan di bawah, lalu salin manual.', {
        duration: 6000,
      });
      return;
    }
    setQrCopied(true);
    toast.success('Tautan QR tersalin — tempel di kolom "QR Code Image Url" simulator.');
    setTimeout(() => setQrCopied(false), 2500);
  };

  const handlePay = (e) => {
    e.preventDefault();
    if (!paymentPhone.trim()) {
      setError('Harap masukkan nomor telepon pembayaran');
      return;
    }
    if (!paymentAgreed) {
      setError('Harap setujui syarat & ketentuan sebelum melanjutkan');
      return;
    }

    setError('');
    setIsProcessing(true);

    timerRef.current = setTimeout(async () => {
      try {
        await completePayment();
      } finally {
        setIsProcessing(false);
        navigateTo('payment-success');
      }
    }, 1800);
  };

  const handleCancelProcessing = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsProcessing(false);
  };

  if (isSubscribed) {
    return (
      <AlreadySubscribedNotice
        reason="konfirmasi pembayaran"
        onPro={() => navigateTo('pro')}
        onHistory={() => navigateTo('subscription-history')}
      />
    );
  }

  return (
    <div className="relative min-h-[640px] flex flex-col justify-between px-4 sm:px-6 lg:px-8 py-6 bg-cream-50">
      <div className={layout.contentCenter}>
        <div className="mb-6">
          <h2 className="text-lg font-bold text-ink-900">
            {isQrisMethod ? 'Pembayaran QRIS' : 'Konfirmasi Pembayaran'}
          </h2>
          <p className="text-xs text-ink-400">
            {isQrisMethod
              ? 'Pindai kode QR untuk mengaktifkan langganan'
              : 'Lengkapi data pembayaran'}
          </p>
        </div>

        <PaymentPlanSummary
          selectedPlan={selectedPlan}
          selectedPaymentMethod={selectedPaymentMethod}
        />

        {isQrisMethod ? (
          <QrisPaymentCard
            qrTransaction={qrTransaction}
            isGeneratingQr={isGeneratingQr}
            qrError={qrError}
            qrNotice={qrNotice}
            isQrisPaid={isQrisPaid}
            isExpired={isExpired}
            isCancelling={isCancelling}
            formattedCountdown={formattedCountdown}
            qrImageGagal={qrImageGagal}
            setQrImageGagal={setQrImageGagal}
            qrCopied={qrCopied}
            qrLinkToCopy={qrLinkToCopy}
            qrContainerRef={qrContainerRef}
            onRegenerateQr={regenerateQr}
            onCopyQr={handleCopyQr}
            onDownloadQr={handleDownloadQr}
            onCancelQris={cancelQris}
          />
        ) : (
          <ManualPaymentForm
            phone={paymentPhone}
            setPhone={setPaymentPhone}
            agreed={paymentAgreed}
            setAgreed={setPaymentAgreed}
            error={error}
            clearError={() => setError('')}
            onSubmit={handlePay}
          />
        )}
      </div>

      {isProcessing && <PaymentProcessingOverlay onCancel={handleCancelProcessing} />}
    </div>
  );
};
