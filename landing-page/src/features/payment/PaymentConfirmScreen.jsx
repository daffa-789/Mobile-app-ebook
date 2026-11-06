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
      } catch {}
    }

    try {
      const area = document.createElement('textarea');
      area.value = teks;
      area.style.position = 'fixed';
      area.style.top = '0';
      area.style.left = '0';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.focus();
      area.select();
      const sukses = document.execCommand('copy');
      document.body.removeChild(area);
      return sukses;
    } catch {
      return false;
    }
  };

  const handleCopyQr = async () => {
    const teks =
      qrTransaction?.qrMidtransUrl ||
      qrTransaction?.qrImageUrl ||
      qrTransaction?.qrString ||
      qrTransaction?.orderId;
    if (!teks) return;

    const sukses = await salinKePapanJepit(teks);
    if (sukses) {
      setQrCopied(true);
      toast.success('Kode QRIS berhasil disalin! Silakan tempel di Midtrans Simulator.');
      setTimeout(() => setQrCopied(false), 3000);
    } else {
      toast.error('Tidak dapat menyalin otomatis. Silakan salin teks di bawah secara manual.');
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!paymentPhone.trim()) {
      setError('Nomor handphone wajib diisi.');
      return;
    }
    if (!paymentAgreed) {
      setError('Anda harus menyetujui syarat & ketentuan.');
      return;
    }

    setIsProcessing(true);
    timerRef.current = setTimeout(() => {
      setIsProcessing(false);
      handlePaymentSuccess({
        method: selectedPaymentMethod?.name || 'Manual Bank Transfer',
        phone: paymentPhone,
      });
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (isSubscribed) {
    return (
      <AlreadySubscribedNotice
        minHeight="700px"
        reason="pembayaran"
        onPro={() => navigateTo('pro')}
        onHistory={() => navigateTo('subscription-history')}
      />
    );
  }

  const qrLinkToCopy =
    qrTransaction?.qrMidtransUrl || qrTransaction?.qrImageUrl || qrTransaction?.qrString;

  return (
    <div className="min-h-[700px] flex flex-col justify-between px-4 sm:px-6 lg:px-8 py-8 bg-cream-50 relative">
      {isProcessing && (
        <PaymentProcessingOverlay
          onCancel={() => {
            if (timerRef.current) clearTimeout(timerRef.current);
            setIsProcessing(false);
          }}
        />
      )}

      <div className="max-w-xl mx-auto w-full flex-1">
        <div className="mb-6">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 tracking-tight">
            Konfirmasi Pembayaran
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            {isQrisMethod
              ? 'Pindai kode QRIS di bawah menggunakan aplikasi pembayaran apa pun.'
              : 'Periksa rincian pesanan dan selesaikan transaksi.'}
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
            onSubmit={handleManualSubmit}
          />
        )}
      </div>
    </div>
  );
};

export default PaymentConfirmScreen;
