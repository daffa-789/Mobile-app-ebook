import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  apiJson,
  authHeaders,
  clearIntendedLocation,
  clearPendingVerification,
  clearSession,
  getPendingVerification,
  getStoredSession,
  savePendingVerification,
  saveSession,
} from '@lib/api';
import { EMPTY_USER, normalizeUser, userSignature } from '@lib/normalizers';
import { useCatalogSlice } from './slices/useCatalogSlice';
import { usePaymentSlice, isQrisPaymentMethod } from './slices/usePaymentSlice';
import { useNavigationSlice } from './slices/useNavigationSlice';

const AppContext = createContext(null);

export { isQrisPaymentMethod };

export const AppProvider = ({ children, initialScreen }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = getStoredSession();
      return stored?.user ? normalizeUser(stored.user) : EMPTY_USER;
    } catch {
      return EMPTY_USER;
    }
  });

  const userRef = useRef(EMPTY_USER);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [sessionToken, setSessionToken] = useState(() => getStoredSession()?.token || null);
  const [verificationState, setVerificationState] = useState(() => getPendingVerification());

  const patchUser = useCallback((fields) => {
    setUser((current) =>
      normalizeUser(
        typeof fields === 'function'
          ? { ...current, ...fields(current) }
          : { ...current, ...fields },
      ),
    );
  }, []);

  const nav = useNavigationSlice({ initialScreen });
  const catalog = useCatalogSlice({ navigateTo: nav.navigateTo });
  const payment = usePaymentSlice({ patchUser });

  const setVerification = useCallback((nextValue) => {
    setVerificationState(nextValue);
    if (nextValue) {
      const { devOtp: _devOnly, ...persisted } = nextValue;
      savePendingVerification(persisted);
    } else {
      clearPendingVerification();
    }
  }, []);

  const clearVerification = useCallback(() => setVerification(null), [setVerification]);

  // Sesi & Pemulihan saat aplikasi dibuka
  useEffect(() => {
    let cancelled = false;
    const restoreSession = async () => {
      const storedSession = getStoredSession();
      if (!storedSession?.token) {
        if (!cancelled) setAuthReady(true);
        return;
      }

      try {
        const payload = await apiJson('/api/auth/me', {
          headers: authHeaders(storedSession.token),
        });
        if (cancelled) return;
        const restoredUser = normalizeUser(payload.user);
        setSessionToken(storedSession.token);
        setUser(restoredUser);
        setIsLoggedIn(true);

        try {
          await payment.refreshSubscriptions();
        } catch {}
      } catch (restoreError) {
        const rejected = restoreError?.status === 401 || restoreError?.status === 403;
        if (rejected) {
          clearSession();
          if (!cancelled) {
            setSessionToken(null);
            setUser(EMPTY_USER);
            setIsLoggedIn(false);
          }
        } else if (!cancelled && storedSession.user?.id) {
          setSessionToken(storedSession.token);
          setUser(normalizeUser(storedSession.user));
          setIsLoggedIn(true);
        }
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    };
    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const syncUserFromBackend = useCallback(
    async ({ silent = false } = {}) => {
      const storedSession = getStoredSession();
      if (!storedSession?.token) return;
      try {
        const payload = await apiJson('/api/auth/me', {
          headers: authHeaders(storedSession.token),
        });
        if (!payload?.user) return;
        const refreshedUser = normalizeUser(payload.user);
        const previousUser = userRef.current;
        userRef.current = refreshedUser;

        if (previousUser?.id && previousUser.role !== refreshedUser.role) {
          nav.applyRoleChange(refreshedUser.role, { notify: true });
        }
        if (userSignature(previousUser) !== userSignature(refreshedUser)) {
          setUser(refreshedUser);
        }
      } catch {
        if (!silent && import.meta.env?.DEV) {
          console.warn('[syncUserFromBackend] gagal menyegarkan user dari backend.');
        }
      }
    },
    [nav],
  );

  /* Order QRIS yang masih pending ditagih ulang saat sesi aktif dan saat
   * pengguna kembali ke tab — dua momen di mana pembayaran yang terjadi di luar
   * aplikasi baru mungkin sudah mendarat. Sengaja tidak ikut interval 15 detik
   * di bawah: interval itu hanya membaca ulang data pengguna, tidak pernah
   * bertanya ke gateway. */
  useEffect(() => {
    if (!isLoggedIn || !sessionToken) return;

    const reconcile = async () => {
      const hasil = await payment.reconcilePendingPayments();
      if (hasil?.settled) await syncUserFromBackend({ silent: true });
    };

    reconcile();

    const handleReconcile = () => {
      if (typeof document === 'undefined' || !document.hidden) reconcile();
    };
    window.addEventListener('focus', handleReconcile);

    return () => window.removeEventListener('focus', handleReconcile);
  }, [isLoggedIn, sessionToken, payment.reconcilePendingPayments, syncUserFromBackend]);

  useEffect(() => {
    if (!isLoggedIn || !sessionToken) return;

    const handleFocus = () => syncUserFromBackend({ silent: true });
    const handleVisibility = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        syncUserFromBackend({ silent: true });
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleVisibility);

    const intervalId = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        syncUserFromBackend({ silent: true });
      }
    }, 15000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(intervalId);
    };
  }, [isLoggedIn, sessionToken, syncUserFromBackend]);

  useEffect(() => {
    if (isLoggedIn && sessionToken) {
      saveSession({ token: sessionToken, user });
    }
  }, [isLoggedIn, sessionToken, user]);

  const login = useCallback(
    (apiUser, token) => {
      const loggedInUser = normalizeUser(apiUser);
      if (!token) {
        throw new Error('Token sesi tidak ditemukan dari server.');
      }
      setSessionToken(token);
      saveSession({ token, user: loggedInUser });
      setUser(loggedInUser);
      setIsLoggedIn(true);
      setAuthReady(true);

      const destScreen = nav.consumeIntendedScreen();
      nav.navigateTo(destScreen, { replace: true });
    },
    [nav],
  );

  const logout = useCallback(() => {
    clearSession();
    clearVerification();
    clearIntendedLocation();
    setSessionToken(null);
    setUser(EMPTY_USER);
    setIsLoggedIn(false);
    // Minta service worker membuang cache app shell: sesi ini berakhir, dan
    // perangkatnya bisa dipakai orang lain (VULN-21).
    if (typeof navigator !== 'undefined' && navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_APP_SHELL' });
    }
    nav.navigateTo('login', { replace: true });
  }, [clearVerification, nav]);

  const broadcastRoleChange = useCallback((role) => {
    if (typeof BroadcastChannel === 'undefined') return;
    try {
      const channel = new BroadcastChannel('wahidiyah-role-sync');
      channel.postMessage({ role });
      channel.close();
    } catch {}
  }, []);

  const updateUserRole = useCallback(
    (userId, role) => {
      if (userRef.current?.id !== userId) return;
      userRef.current = { ...userRef.current, role };
      setUser((current) => ({ ...current, role }));
      nav.applyRoleChange(role);
      broadcastRoleChange(role);
    },
    [nav, broadcastRoleChange],
  );

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return undefined;
    const channel = new BroadcastChannel('wahidiyah-role-sync');
    channel.onmessage = (event) => {
      const nextRole = event?.data?.role;
      if (nextRole && userRef.current && userRef.current.role !== nextRole) {
        userRef.current = { ...userRef.current, role: nextRole };
        setUser((current) => ({ ...current, role: nextRole }));
        nav.applyRoleChange(nextRole, { notify: true });
      }
    };
    return () => channel.close();
  }, [nav]);

  const value = useMemo(
    () => ({
      currentScreen: nav.currentScreen,
      currentPath: nav.currentPath,
      navigateTo: nav.navigateTo,
      user,
      patchUser,
      isLoggedIn,
      authReady,
      sessionToken,
      login,
      logout,
      verification: verificationState,
      setVerification,
      clearVerification,
      rememberIntendedLocation: nav.rememberIntendedLocation,
      setRouterNavigator: nav.setRouterNavigator,
      syncScreenFromPath: nav.syncScreenFromPath,
      books: catalog.books,
      loadingCatalog: catalog.loadingCatalog,
      catalogError: catalog.catalogError,
      refreshBooks: catalog.refreshBooks,
      activeBook: catalog.activeBook,
      openReader: catalog.openReader,
      selectedPlan: payment.selectedPlan,
      setSelectedPlan: payment.setSelectedPlan,
      selectedPaymentMethod: payment.selectedPaymentMethod,
      setSelectedPaymentMethod: payment.setSelectedPaymentMethod,
      paymentPhone: payment.paymentPhone,
      setPaymentPhone: payment.setPaymentPhone,
      paymentAgreed: payment.paymentAgreed,
      setPaymentAgreed: payment.setPaymentAgreed,
      lastPaymentResult: payment.lastPaymentResult,
      clearLastPaymentResult: payment.clearLastPaymentResult,
      completePayment: payment.completePayment,
      subscriptions: payment.subscriptions,
      refreshSubscriptions: payment.refreshSubscriptions,
      role: user.role,
      events: catalog.events,
      loadingAgenda: catalog.loadingAgenda,
      agendaError: catalog.agendaError,
      setEvents: catalog.setEvents,
      refreshEvents: catalog.refreshEvents,
      carouselSlides: catalog.carouselSlides,
      refreshCarousel: catalog.refreshCarousel,
      updateUserRole,
      isSubscriptionActive: payment.isSubscriptionActive,
    }),
    [
      nav,
      user,
      patchUser,
      isLoggedIn,
      authReady,
      sessionToken,
      login,
      logout,
      verificationState,
      setVerification,
      clearVerification,
      catalog,
      payment,
      updateUserRole,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);
