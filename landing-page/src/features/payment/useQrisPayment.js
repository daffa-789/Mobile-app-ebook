import { useState, useEffect, useRef, useCallback } from 'react';
import { apiJson, apiJsonSend, authHeaders } from '@lib/api';

const POLL_INTERVAL_MS = 3000;
const DEFAULT_COUNTDOWN_SECONDS = 15 * 60;

const secondsUntil = (isoDate) => {
  const target = new Date(isoDate).getTime();
  if (!Number.isFinite(target)) return DEFAULT_COUNTDOWN_SECONDS;
  return Math.max(0, Math.round((target - Date.now()) / 1000));
};

export const useQrisPayment = ({
  selectedPlan,
  onPaymentSuccess,
  isQrisActive = true,
  phone = '',
}) => {
  const [qrTransaction, setQrTransaction] = useState(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [qrError, setQrError] = useState('');
  const [qrNotice, setQrNotice] = useState('');
  const [isQrisPaid, setIsQrisPaid] = useState(false);
  const [countdown, setCountdown] = useState(DEFAULT_COUNTDOWN_SECONDS);
  const [isExpired, setIsExpired] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const pollIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const isPaidRef = useRef(false);

  const generateTransaction = useCallback(async () => {
    setIsGeneratingQr(true);
    setQrError('');
    setQrNotice('');

    try {
      const data = await apiJsonSend(
        '/api/payments/qris/charge',
        { planId: selectedPlan?.id || 'monthly', phone },
        { headers: authHeaders() },
      );

      if (data.alreadyPro) {
        setQrError(data.message || 'Langganan Pro Anda masih aktif.');
        setQrTransaction(null);
        return;
      }

      setQrTransaction({
        orderId: data.orderId,
        qrString: data.qrString || null,
        qrImageUrl: data.qrImageUrl || null,
        qrMidtransUrl: data.qrMidtransUrl || null,
        totalPaid: data.totalPaid,
        amount: data.amount ?? null,
        adminFee: data.adminFee ?? null,
        planName: data.planName,
        expiredAt: data.expiredAt,
      });
      setCountdown(secondsUntil(data.expiredAt));
      setIsExpired(false);
    } catch (err) {
      setQrError(err?.message || 'Gagal membuat kode QR pembayaran.');
      setQrTransaction(null);
    } finally {
      setIsGeneratingQr(false);
    }
  }, [selectedPlan, phone]);

  useEffect(() => {
    if (isQrisActive && !isQrisPaid) {
      generateTransaction();
    }
  }, [isQrisActive, generateTransaction]);

  useEffect(() => {
    if (!qrTransaction || isQrisPaid) return undefined;

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [qrTransaction, isQrisPaid]);

  useEffect(() => {
    if (countdown === 0 && qrTransaction && !isQrisPaid) {
      setIsExpired(true);
    }
  }, [countdown, qrTransaction, isQrisPaid]);

  // Polling Status Pembayaran QRIS setiap 3 detik
  const pollStatus = useCallback(async () => {
    if (!qrTransaction?.orderId || isPaidRef.current) return;

    try {
      const data = await apiJson(`/api/payments/qris/${qrTransaction.orderId}/status`, {
        headers: authHeaders(),
      });

      if (data.isPaid || data.status === 'settlement' || data.status === 'capture') {
        isPaidRef.current = true;
        setIsQrisPaid(true);
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        onPaymentSuccess?.(data);
      } else if (data.status === 'expire') {
        setIsExpired(true);
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      }
    } catch {
      // Polling network glitch — ignore and retry next tick
    }
  }, [qrTransaction?.orderId, onPaymentSuccess]);

  useEffect(() => {
    if (!qrTransaction || isQrisPaid || isExpired) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      return undefined;
    }

    pollIntervalRef.current = setInterval(pollStatus, POLL_INTERVAL_MS);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [qrTransaction, isQrisPaid, isExpired, pollStatus]);

  const cancelQris = useCallback(async () => {
    if (!qrTransaction?.orderId) return;

    setIsCancelling(true);
    try {
      await apiJsonSend(
        `/api/payments/qris/${qrTransaction.orderId}/cancel`,
        {},
        { headers: authHeaders() },
      );
    } catch {
      // Abaikan bila backend/Midtrans menolak cancel (misal 412), tetap reset local state
    } finally {
      setIsCancelling(false);
      setQrTransaction(null);
      setIsExpired(false);
      generateTransaction();
    }
  }, [qrTransaction?.orderId, generateTransaction]);

  const formattedCountdown = `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}`;

  return {
    qrTransaction,
    isGeneratingQr,
    qrError,
    qrNotice,
    isQrisPaid,
    isExpired,
    isCancelling,
    formattedCountdown,
    regenerateQr: generateTransaction,
    cancelQris,
  };
};

export default useQrisPayment;
