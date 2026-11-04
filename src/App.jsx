/**
 * Komponen Utama Router Aplikasi Wahidiyah Book.
 * Mengoordinasikan deklarasi rute halaman, pengalihan URL, dan pemuatan kode asinkron (code-splitting).
 *
 * @module src/App
 */

import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { ScrollRestoration } from '@ui/ScrollRestoration';
import { PwaInstallBanner } from './components/PwaInstallBanner';
import { layout } from '@lib/styles';

import { AuthScreen } from '@features/auth/AuthScreen';
import { LoginScreen } from '@features/auth/LoginScreen';
import { RegisterScreen } from '@features/auth/RegisterScreen';
import { HomeScreen } from '@features/home/HomeScreen';
import { CalendarScreen } from '@features/calendar/CalendarScreen';
import { ProScreen } from '@features/subscription/ProScreen';
import { PaymentMethodScreen } from '@features/payment/PaymentMethodScreen';

import {
  ScreenLoading,
  RequireAuth,
  Framed,
  UserOnly,
  shellPage,
  AdminRoute,
} from './components/routing/RouteGuards';
import { RouterBridge, ProfileRoutePreloader } from './components/routing/RouterBridge';

// Layar Pemuatan Asinkron (Code-Splitting via React.lazy)
const VerifyEmailScreen = lazy(() =>
  import('@features/auth/VerifyEmailScreen').then((m) => ({ default: m.VerifyEmailScreen })),
);
const AuthCallbackScreen = lazy(() =>
  import('@features/auth/AuthCallbackScreen').then((m) => ({ default: m.AuthCallbackScreen })),
);
const GoogleSuccessScreen = lazy(() =>
  import('@features/auth/GoogleSuccessScreen').then((m) => ({ default: m.GoogleSuccessScreen })),
);
const ForgotPasswordScreen = lazy(() =>
  import('@features/auth/ForgotPasswordScreen').then((m) => ({ default: m.ForgotPasswordScreen })),
);
const PdfReaderScreen = lazy(() =>
  import('@features/reader/PdfReaderScreen').then((m) => ({ default: m.PdfReaderScreen })),
);
const PaymentConfirmScreen = lazy(() =>
  import('@features/payment/PaymentConfirmScreen').then((m) => ({
    default: m.PaymentConfirmScreen,
  })),
);
const PaymentSuccessScreen = lazy(() =>
  import('@features/payment/PaymentSuccessScreen').then((m) => ({
    default: m.PaymentSuccessScreen,
  })),
);

const loadEditProfileScreen = () =>
  import('@features/profile/EditProfileScreen').then((m) => ({ default: m.EditProfileScreen }));
const loadSubscriptionHistoryScreen = () =>
  import('@features/profile/SubscriptionHistoryScreen').then((m) => ({
    default: m.SubscriptionHistoryScreen,
  }));
const loadHelpCenterScreen = () =>
  import('@features/help/HelpCenterScreen').then((m) => ({ default: m.HelpCenterScreen }));
const loadAboutScreen = () =>
  import('@features/about/AboutScreen').then((m) => ({ default: m.AboutScreen }));

const EditProfileScreen = lazy(loadEditProfileScreen);
const SubscriptionHistoryScreen = lazy(loadSubscriptionHistoryScreen);
const HelpCenterScreen = lazy(loadHelpCenterScreen);
const AboutScreen = lazy(loadAboutScreen);
const AdminDashboard = lazy(() =>
  import('@features/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })),
);

const PROFILE_LOADERS = [
  loadEditProfileScreen,
  loadSubscriptionHistoryScreen,
  loadHelpCenterScreen,
  loadAboutScreen,
];

const authPage = (node) => <div className={layout.screen}>{node}</div>;
const subscriptionHistoryPage = shellPage(<SubscriptionHistoryScreen />);
const helpCenterPage = shellPage(<HelpCenterScreen />);
const editProfilePage = shellPage(<EditProfileScreen />);

const adminPortalPage = (
  <Framed>
    <AdminRoute>
      <Suspense fallback={<ScreenLoading />}>
        <AdminDashboard />
      </Suspense>
    </AdminRoute>
  </Framed>
);

/**
 * Komponen root aplikasi.
 *
 * @returns {import('react').JSX.Element}
 */
function App() {
  return (
    <>
      <RouterBridge />
      <ScrollRestoration />
      <ProfileRoutePreloader loaders={PROFILE_LOADERS} />
      <PwaInstallBanner />
      <Suspense fallback={<ScreenLoading />}>
        <Routes>
          <Route path="/" element={shellPage(<HomeScreen />)} />
          <Route path="/home" element={shellPage(<HomeScreen />)} />
          <Route path="/calendar" element={shellPage(<CalendarScreen />)} />

          <Route
            path="/reader"
            element={
              <UserOnly>
                <RequireAuth>
                  <PdfReaderScreen />
                </RequireAuth>
              </UserOnly>
            }
          />

          <Route path="/pro" element={shellPage(<ProScreen />)} />
          <Route path="/payment-method" element={shellPage(<PaymentMethodScreen />)} />
          <Route path="/payment-confirm" element={shellPage(<PaymentConfirmScreen />)} />
          <Route path="/payment-success" element={shellPage(<PaymentSuccessScreen />)} />

          <Route path="/pengaturan" element={<Navigate to="/profile" replace />} />
          <Route path="/profile" element={editProfilePage} />
          <Route path="/profile/edit" element={editProfilePage} />

          <Route path="/riwayat" element={subscriptionHistoryPage} />
          <Route path="/pengaturan/riwayat" element={subscriptionHistoryPage} />
          <Route path="/pengaturan/history" element={subscriptionHistoryPage} />
          <Route path="/profile/history" element={subscriptionHistoryPage} />

          <Route path="/help" element={helpCenterPage} />
          <Route path="/help-center" element={helpCenterPage} />
          <Route path="/about" element={shellPage(<AboutScreen />)} />

          <Route path="/auth" element={authPage(<AuthScreen />)} />
          <Route path="/login" element={authPage(<LoginScreen />)} />
          <Route path="/register" element={authPage(<RegisterScreen />)} />
          <Route
            path="/verify-email"
            element={authPage(
              <Suspense fallback={<ScreenLoading />}>
                <VerifyEmailScreen />
              </Suspense>,
            )}
          />
          <Route
            path="/forgot-password"
            element={authPage(
              <Suspense fallback={<ScreenLoading />}>
                <ForgotPasswordScreen />
              </Suspense>,
            )}
          />

          <Route
            path="/auth/callback"
            element={authPage(
              <Suspense fallback={<ScreenLoading />}>
                <AuthCallbackScreen />
              </Suspense>,
            )}
          />

          <Route
            path="/auth/success"
            element={authPage(
              <Suspense fallback={<ScreenLoading />}>
                <GoogleSuccessScreen />
              </Suspense>,
            )}
          />

          <Route path="/admin" element={adminPortalPage} />
          <Route path="/admin-dashboard" element={adminPortalPage} />
          <Route path="/admin/:tab" element={adminPortalPage} />

          <Route path="*" element={authPage(<LoginScreen />)} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
