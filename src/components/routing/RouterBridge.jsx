/**
 * Penjembatan integrasi antara React Router v7 dan state navigasi global AppContext,
 * serta optimasi preloading aset profil pada saat peramban senggang (requestIdleCallback).
 *
 * @module src/components/routing/RouterBridge
 */

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useApp } from '@context/AppContext';

/**
 * Komponen penjembatan React Router dengan konteks aplikasi.
 *
 * @returns {null}
 */
export const RouterBridge = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setRouterNavigator, syncScreenFromPath } = useApp();

  useEffect(() => {
    setRouterNavigator(navigate);
  }, [navigate, setRouterNavigator]);

  useEffect(() => {
    syncScreenFromPath(location.pathname);
  }, [location.pathname, syncScreenFromPath]);

  return null;
};

/**
 * Komponen preloader untuk memuat chunk rute profil secara asinkron saat peramban idle.
 *
 * @param {object} props - Properti komponen
 * @param {Array<() => Promise<any>>} props.loaders - Array fungsi dynamic import
 * @returns {null}
 */
export const ProfileRoutePreloader = ({ loaders = [] }) => {
  const { authReady, isLoggedIn } = useApp();

  useEffect(() => {
    if (!authReady || !isLoggedIn || loaders.length === 0) {
      return undefined;
    }

    let cancelled = false;
    const preloadRoutes = () => {
      if (cancelled) return;
      void Promise.allSettled(loaders.map((load) => load()));
    };

    if (typeof window.requestIdleCallback === 'function') {
      const handle = window.requestIdleCallback(preloadRoutes, { timeout: 3000 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(handle);
      };
    }

    const timer = setTimeout(preloadRoutes, 1500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [authReady, isLoggedIn, loaders]);

  return null;
};
