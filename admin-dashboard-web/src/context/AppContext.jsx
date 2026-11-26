import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { apiJson, authHeaders, clearSession, getStoredSession, saveSession } from '@lib/api';
import { EMPTY_USER, normalizeUser, userSignature } from '@lib/normalizers';
import { useCatalogSlice } from './slices/useCatalogSlice';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
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

  const catalog = useCatalogSlice();

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

  const syncUserFromBackend = useCallback(async ({ silent = false } = {}) => {
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

      if (userSignature(previousUser) !== userSignature(refreshedUser)) {
        setUser(refreshedUser);
      }
    } catch {
      if (!silent && import.meta.env?.DEV) {
        console.warn('[syncUserFromBackend] gagal menyegarkan user dari backend.');
      }
    }
  }, []);

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

  const login = useCallback((apiUser, token) => {
    const loggedInUser = normalizeUser(apiUser);
    if (!token) {
      throw new Error('Token sesi tidak ditemukan dari server.');
    }
    setSessionToken(token);
    saveSession({ token, user: loggedInUser });
    setUser(loggedInUser);
    setIsLoggedIn(true);
    setAuthReady(true);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSessionToken(null);
    setUser(EMPTY_USER);
    setIsLoggedIn(false);
  }, []);

  const updateUserRole = useCallback((userId, role) => {
    if (userRef.current?.id !== userId) return;
    userRef.current = { ...userRef.current, role };
    setUser((current) => ({ ...current, role }));
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoggedIn,
      authReady,
      sessionToken,
      login,
      logout,
      updateUserRole,
      books: catalog.books,
      loadingCatalog: catalog.loadingCatalog,
      catalogError: catalog.catalogError,
      refreshBooks: catalog.refreshBooks,
      events: catalog.events,
      loadingAgenda: catalog.loadingAgenda,
      agendaError: catalog.agendaError,
      refreshEvents: catalog.refreshEvents,
    }),
    [user, isLoggedIn, authReady, sessionToken, login, logout, updateUserRole, catalog],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);
