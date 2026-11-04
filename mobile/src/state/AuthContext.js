import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as SecureStore from '../storage/secureStore';
import { me as apiMe } from '../api/auth';
import { normalizeUser } from '../lib/normalizeUser';
import { setTokenProvider, reconcileProOnce } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const tokenRef = useRef(null);
  const reconciledForSession = useRef(false);

  useEffect(() => {
    setTokenProvider(async () => tokenRef.current);
  }, []);

  const reconcile = useCallback(async () => {
    const settled = await reconcileProOnce(refreshMe);
    return settled;
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const res = await apiMe();
      const u = normalizeUser(res.user || {});
      setUser(u);
      return u;
    } catch (e) {
      if (e?.status === 401) {
        await logout();
      }
      throw e;
    }
  }, []);

  useEffect(() => {
    (async () => {
      const stored = await SecureStore.getToken().catch(() => null);
      tokenRef.current = stored;
      setToken(stored);
      if (stored) {
        try {
          await refreshMe();
        } catch {
          // 401 -> logout() sudah dipanggil di refreshMe via catch-nya
        }
      }
      setReady(true);
    })();
  }, [refreshMe]);

  const loginSession = useCallback(async (tokenValue, rawUser) => {
    tokenRef.current = tokenValue;
    await SecureStore.saveToken(tokenValue);
    setToken(tokenValue);
    setUser(normalizeUser(rawUser || {}));
    reconciledForSession.current = false;
  }, []);

  const logout = useCallback(async () => {
    tokenRef.current = null;
    await SecureStore.clearToken().catch(() => {});
    setToken(null);
    setUser(null);
  }, []);

  // §5.6: reconcile sekali per sesi aktif + saat foreground
  useEffect(() => {
    if (!user) return;
    const doReconcile = () => {
      if (reconciledForSession.current) return;
      reconciledForSession.current = true;
      reconcile().catch(() => {});
    };
    doReconcile();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && user) {
        reconciledForSession.current = false;
        doReconcile();
      }
    });
    return () => sub.remove();
  }, [user, reconcile]);

  return (
    <AuthContext.Provider value={{ token, user, ready, loginSession, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider');
  return ctx;
};
