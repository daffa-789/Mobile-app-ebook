import { useState, useCallback, useEffect } from 'react';
import { PAYMENT_METHODS } from '@data/mockData';
import {
  apiJson,
  apiJsonSend,
  authHeaders,
  getStoredSession,
  getStoredLastPayment,
  saveLastPayment,
  clearLastPayment,
} from '@lib/api';
import { normalizeUser } from '@lib/normalizers';

export const isQrisPaymentMethod = (method) => {
  if (!method) return false;
  const id = String(method.id || '').toLowerCase();
  const name = String(method.name || '').toLowerCase();
  return id.includes('qris') || id === 'midtrans' || name.includes('qris');
};

export const usePaymentSlice = ({ patchUser }) => {
  const [selectedPlan, setSelectedPlan] = useState({
    id: 'monthly',
    title: 'Paket Bulanan',
    price: 25000,
    formattedPrice: 'Rp 25.000',
    period: '/bulan',
  });

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(PAYMENT_METHODS[0].options[0]);
  const [paymentPhone, setPaymentPhone] = useState('');
  const [paymentAgreed, setPaymentAgreed] = useState(false);
  const [lastPaymentResult, setLastPaymentResult] = useState(() => getStoredLastPayment());
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    saveLastPayment(lastPaymentResult);
  }, [lastPaymentResult]);

  const clearLastPaymentResult = useCallback(() => {
    setLastPaymentResult(null);
    clearLastPayment();
  }, []);

  const refreshSubscriptions = useCallback(async () => {
    const stored = getStoredSession();
    if (!stored?.token) return [];
    try {
      const payload = await apiJson('/api/subscriptions/my', {
        headers: authHeaders(stored.token),
      });
      const subs = (payload.subscriptions || []).map((sub) => ({
        id: sub.id,
        planName: sub.plan_name,
        price: Number(sub.price) ? `Rp ${Number(sub.price).toLocaleString('id-ID')}` : sub.price,
        rawPrice: Number(sub.price) || 25000,
        adminFee: Number(sub.admin_fee) || 0,
        totalPaid: Number(sub.total_paid) || Number(sub.price) || 25000,
        status: sub.status,
        period: sub.period,
        ref: sub.ref_code,
        expiresAt: sub.expires_at || null,
        createdAt: sub.created_at,
      }));
      setSubscriptions(subs);
      return subs;
    } catch {
      return [];
    }
  }, []);

  const isSubscriptionActive = useCallback((targetUser) => {
    return Boolean(targetUser?.isPro);
  }, []);

  /* Pembayaran yang datang setelah polling di layar bayar berhenti tidak pernah
   * ditanyakan lagi, dan tidak ada cron yang melakukannya. Satu panggilan ini
   * menutup celah itu setiap sesi aktif. Kegagalan sengaja didiamkan: membuka
   * aplikasi tidak boleh ditimpa galat pembayaran yang tidak sedang dicari. */
  const reconcilePendingPayments = useCallback(async () => {
    const stored = getStoredSession();
    if (!stored?.token) return null;
    try {
      return await apiJsonSend(
        '/api/payments/qris/reconcile',
        {},
        {
          headers: authHeaders(stored.token),
        },
      );
    } catch {
      return null;
    }
  }, []);

  const completePayment = useCallback(
    async (facts = {}) => {
      const now = new Date();
      const expiry = new Date(now);
      expiry.setMonth(expiry.getMonth() + 1);
      const periodStr = `${now.toLocaleDateString('id-ID')} – ${expiry.toLocaleDateString('id-ID')}`;
      const refNo = `0000${Math.floor(10000000 + Math.random() * 90000000)}`;

      /* Angka struk diambil dari server kalau ada. `selectedPlan.price` hanya
       cadangan — riwayat langganan menyimpan harga sebagai TEKS ("Rp 25.000")
       untuk tampilan, dan memakai teks itu sebagai angka membuat total di
       struk menjadi NaN. */
      const toNumber = (value) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
      };
      const amount = toNumber(facts.amount) ?? toNumber(selectedPlan.price);
      const adminFee = toNumber(facts.adminFee);
      const totalPaid = toNumber(facts.totalPaid) ?? (amount ? amount + (adminFee ?? 0) : null);

      const result = {
        refNo,
        dateStr: `${now.toLocaleDateString('id-ID')}, ${now.toLocaleTimeString('id-ID')}`,
        periodStr,
        amount,
        adminFee,
        totalPaid,
        methodName: selectedPaymentMethod?.name || 'Bank Transfer',
        planName: facts.planName || selectedPlan.title,
      };
      setLastPaymentResult(result);

      if (isQrisPaymentMethod(selectedPaymentMethod)) {
        try {
          const me = await apiJson('/api/auth/me', {
            headers: authHeaders(getStoredSession()?.token),
          });
          if (me?.user) {
            patchUser((current) => ({
              ...normalizeUser({ ...current, ...me.user }),
              isPro: Boolean(me.user.isPro),
            }));
          }
          const subs = await refreshSubscriptions();
          const latest = subs[0];
          setLastPaymentResult((current) => ({
            ...(current || {}),
            refNo: latest?.ref || current?.refNo,
            periodStr: latest?.period || current?.periodStr,
            planName: latest?.planName || current?.planName,
          }));
        } catch (error) {
          console.warn(
            'Gagal menyinkronkan status langganan setelah pembayaran QRIS:',
            error.message,
          );
        }
        return;
      }

      const stored = getStoredSession();
      if (stored?.token) {
        try {
          const payload = await apiJsonSend(
            '/api/transactions',
            {
              plan_id: selectedPlan.id,
              plan_name: selectedPlan.title,
              amount: selectedPlan.price,
              payment_method: selectedPaymentMethod?.name || 'Bank Transfer',
              period: periodStr,
            },
            { headers: authHeaders(stored.token) },
          );

          const settledExpiry = payload.user?.subscription_expires_at || expiry.toISOString();
          const settledPeriod =
            payload.transaction?.periodStr || payload.subscription?.period || periodStr;
          const tx = payload.transaction;

          if (tx?.refNo || tx?.totalPaid != null) {
            setLastPaymentResult((current) => ({
              ...current,
              refNo: tx.refNo ?? current?.refNo,
              amount: toNumber(tx.amount) ?? current?.amount,
              adminFee: toNumber(tx.adminFee) ?? current?.adminFee,
              totalPaid: toNumber(tx.totalPaid) ?? current?.totalPaid,
            }));
          }

          if (payload.alreadyPro) {
            patchUser((current) => ({
              ...normalizeUser({ ...current, ...payload.user }),
              isPro: true,
              activePlan: null,
              subscriptionExpiresAt: payload.user?.subscription_expires_at || expiry.toISOString(),
            }));
            return;
          }

          if (payload.pendingVerification) {
            setLastPaymentResult((current) => ({ ...current, pendingVerification: true }));
            return;
          }

          if (payload.user) {
            patchUser((current) => ({
              ...normalizeUser({ ...current, ...payload.user }),
              isPro: true,
              activePlan: null,
              subscriptionExpiresAt: settledExpiry,
              subscriptionPeriod: settledPeriod,
            }));
          } else {
            patchUser({
              isPro: true,
              activePlan: null,
              subscriptionExpiresAt: settledExpiry,
              subscriptionPeriod: settledPeriod,
            });
          }

          if (payload.subscription) {
            const subItem = {
              id: payload.subscription.id,
              planName: payload.subscription.planName,
              price: selectedPlan.formattedPrice,
              status: payload.subscription.status,
              period: payload.subscription.period,
              ref: payload.subscription.ref,
            };
            setSubscriptions((current) => [subItem, ...current]);
          }
          return;
        } catch (error) {
          console.warn(
            'Gagal menyimpan transaksi ke backend, beralih ke state lokal:',
            error.message,
          );
        }
      }

      patchUser({
        isPro: true,
        activePlan: null,
        subscriptionExpiresAt: null,
        subscriptionPeriod: periodStr,
      });
      setSubscriptions((current) => [
        {
          id: `sub-${Date.now()}`,
          planName: selectedPlan.title,
          price: selectedPlan.formattedPrice,
          status: 'Aktif',
          period: periodStr,
          ref: `REF-${refNo.slice(-8)}`,
        },
        ...current,
      ]);
    },
    [patchUser, refreshSubscriptions, selectedPaymentMethod, selectedPlan],
  );

  return {
    selectedPlan,
    setSelectedPlan,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    paymentPhone,
    setPaymentPhone,
    paymentAgreed,
    setPaymentAgreed,
    lastPaymentResult,
    setLastPaymentResult,
    clearLastPaymentResult,
    subscriptions,
    setSubscriptions,
    refreshSubscriptions,
    isSubscriptionActive,
    reconcilePendingPayments,
    completePayment,
  };
};
