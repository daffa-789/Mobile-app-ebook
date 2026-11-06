import { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useApp } from '@context/AppContext';

export const ScreenLoading = () => (
  <div
    className="min-h-[400px] w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6"
    aria-label="Memuat halaman..."
  >
    <div className="rounded-3xl bg-cream-100 p-6 animate-pulse border border-cream-200">
      <div className="h-6 w-48 rounded-md bg-cream-200/80 mb-3" />
      <div className="h-4 w-72 max-w-full rounded-md bg-cream-200/60" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="h-28 rounded-2xl bg-cream-100 border border-cream-200 animate-pulse" />
      <div className="h-28 rounded-2xl bg-cream-100 border border-cream-200 animate-pulse" />
      <div className="h-28 rounded-2xl bg-cream-100 border border-cream-200 animate-pulse" />
    </div>
  </div>
);

const AuthBoot = () => (
  <div className="min-h-screen bg-cream-100 flex items-center justify-center px-6">
    <div
      role="status"
      aria-label="Memeriksa sesi pengguna"
      className="flex items-center gap-3 rounded-2xl border border-cream-300 bg-cream-50 px-5 py-4 text-sm font-semibold text-ink-700 shadow-sm"
    >
      <span className="h-4 w-4 rounded-full border-2 border-brand-200 border-t-brand-700 animate-spin" />
      <span>Memeriksa sesi...</span>
    </div>
  </div>
);

export const RequireAuth = ({ children }) => {
  const { isLoggedIn, authReady, rememberIntendedLocation } = useApp();
  const location = useLocation();
  const intendedPath = `${location.pathname}${location.search || ''}`;
  const wasAuthorizedHereRef = useRef(false);

  useEffect(() => {
    if (isLoggedIn) {
      wasAuthorizedHereRef.current = true;
      return;
    }
    if (!authReady || wasAuthorizedHereRef.current) return;
    rememberIntendedLocation(intendedPath);
  }, [authReady, isLoggedIn, intendedPath, rememberIntendedLocation]);

  if (!authReady) return <AuthBoot />;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return children;
};
