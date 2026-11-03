/**
 * Komponen pelindung rute navigasi (Route Guards), fallback pemuatan sesi,
 * dan pembungkus bingkai perangkat (Shell / Framed Layout).
 *
 * @module src/components/routing/RouteGuards
 */

import { Suspense, useRef, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '@context/AppContext';
import { DeviceFrame } from '@ui/DeviceFrame';
import { InAppReminders } from '@ui/InAppReminders';

/**
 * Skeleton placeholder saat halaman lazy dipersiapkan.
 *
 * @returns {import('react').JSX.Element}
 */
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

/**
 * Tampilan boot saat inisialisasi sesi otentikasi awal.
 *
 * @returns {import('react').JSX.Element}
 */
const AuthBoot = () => (
  <div className="min-h-screen bg-cream-100 flex items-center justify-center px-6">
    <div
      role="status"
      aria-label="Memeriksa sesi pengguna"
      className="flex items-center gap-3 rounded-2xl border border-cream-300 bg-cream-50 px-5 py-4 text-body font-semibold text-ink-700 shadow-sm"
    >
      <span className="h-4 w-4 rounded-full border-2 border-brand-200 border-t-brand-700 animate-spin" />
    </div>
  </div>
);

/**
 * Guard otentikasi: Memastikan pengguna sudah login.
 * Jika belum, arahkan ke /login dan simpan URL target untuk redirect pasca-login.
 *
 * @param {object} props - Properti komponen
 * @param {import('react').ReactNode} props.children - Komponen anak yang dilindungi
 * @returns {import('react').JSX.Element}
 */
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

/**
 * Pembungkus tata letak bingkai perangkat.
 *
 * @param {object} props - Properti komponen
 * @param {import('react').ReactNode} props.children - Komponen anak
 * @returns {import('react').JSX.Element}
 */
export const Framed = ({ children }) => <DeviceFrame>{children}</DeviceFrame>;

/**
 * Shell aplikasi: menggabungkan proteksi autentikasi dan bingkai perangkat.
 *
 * @param {object} props - Properti komponen
 * @param {import('react').ReactNode} props.children - Komponen anak
 * @returns {import('react').JSX.Element}
 */
const Shell = ({ children }) => (
  <RequireAuth>
    <Framed>{children}</Framed>
  </RequireAuth>
);

/**
 * Guard rute khusus pengguna reguler (mengalihkan admin ke portal /admin).
 *
 * @param {object} props - Properti komponen
 * @param {import('react').ReactNode} props.children - Komponen anak
 * @returns {import('react').JSX.Element}
 */
export const UserOnly = ({ children }) => {
  const { authReady, user } = useApp();
  if (!authReady) return <AuthBoot />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  return children;
};

/**
 * Pembungkus halaman pengguna berbingkai lengkap dengan Suspense dan pengingat.
 *
 * @param {import('react').ReactNode} node - Halaman anak
 * @returns {import('react').JSX.Element}
 */
export const shellPage = (node) => (
  <UserOnly>
    <Shell>
      <Suspense fallback={<ScreenLoading />}>{node}</Suspense>
      <InAppReminders />
    </Shell>
  </UserOnly>
);

/**
 * Guard rute khusus role Admin (mengalihkan pengguna non-admin ke beranda).
 *
 * @param {object} props - Properti komponen
 * @param {import('react').ReactNode} props.children - Komponen anak
 * @returns {import('react').JSX.Element}
 */
export const AdminRoute = ({ children }) => {
  const { isLoggedIn, authReady, user } = useApp();
  if (!authReady) return <AuthBoot />;

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};
