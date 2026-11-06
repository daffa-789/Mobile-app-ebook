import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { AppProvider } from '@context/AppContext';
import { RouterBridge } from './components/routing/RouterBridge';
import { ScreenLoading, RequireAuth } from './components/routing/RouteGuards';
import { ScrollRestoration } from '@ui/ScrollRestoration';
import { LandingShell } from './components/layout/LandingShell';

// Feature screens
import { HomeScreen } from '@features/home/HomeScreen';
import { ProScreen } from '@features/subscription/ProScreen';
import { PaymentMethodScreen } from '@features/payment/PaymentMethodScreen';
import { PaymentConfirmScreen } from '@features/payment/PaymentConfirmScreen';
import { PaymentSuccessScreen } from '@features/payment/PaymentSuccessScreen';
import { PdfReaderScreen } from '@features/reader/PdfReaderScreen';
import { AboutScreen } from '@features/about/AboutScreen';
import { HelpCenterScreen } from '@features/help/HelpCenterScreen';
import { LoginScreen } from '@features/auth/LoginScreen';
import { RegisterScreen } from '@features/auth/RegisterScreen';
import { VerifyEmailScreen } from '@features/auth/VerifyEmailScreen';
import { ForgotPasswordScreen } from '@features/auth/ForgotPasswordScreen';
import { AuthCallbackScreen } from '@features/auth/AuthCallbackScreen';
import { GoogleSuccessScreen } from '@features/auth/GoogleSuccessScreen';

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-cream-50 text-ink-800 text-ink-900 flex flex-col justify-between font-sans antialiased selection:bg-brand-100 selection:text-brand-900">
        <RouterBridge />
        <ScrollRestoration />
        <Suspense fallback={<ScreenLoading />}>
          <Routes>
            {/* Public Portal Layout */}
            <Route
              path="/"
              element={
                <LandingShell>
                  <HomeScreen />
                </LandingShell>
              }
            />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route
              path="/catalog"
              element={
                <LandingShell>
                  <HomeScreen />
                </LandingShell>
              }
            />
            <Route
              path="/katalog"
              element={
                <LandingShell>
                  <HomeScreen />
                </LandingShell>
              }
            />
            <Route
              path="/pro"
              element={
                <LandingShell>
                  <ProScreen />
                </LandingShell>
              }
            />
            <Route
              path="/payment-method"
              element={
                <LandingShell>
                  <PaymentMethodScreen />
                </LandingShell>
              }
            />
            <Route
              path="/payment-confirm"
              element={
                <LandingShell>
                  <PaymentConfirmScreen />
                </LandingShell>
              }
            />
            <Route
              path="/payment-success"
              element={
                <LandingShell>
                  <PaymentSuccessScreen />
                </LandingShell>
              }
            />
            <Route
              path="/about"
              element={
                <LandingShell>
                  <AboutScreen />
                </LandingShell>
              }
            />
            <Route
              path="/help"
              element={
                <LandingShell>
                  <HelpCenterScreen />
                </LandingShell>
              }
            />
            <Route
              path="/help-center"
              element={
                <LandingShell>
                  <HelpCenterScreen />
                </LandingShell>
              }
            />

            {/* Standalone Fullscreen Document Reader */}
            <Route
              path="/reader"
              element={
                <RequireAuth>
                  <PdfReaderScreen />
                </RequireAuth>
              }
            />

            {/* Authentication Screens */}
            <Route path="/auth" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/register" element={<RegisterScreen />} />
            <Route path="/verify-email" element={<VerifyEmailScreen />} />
            <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
            <Route path="/auth/callback" element={<AuthCallbackScreen />} />
            <Route path="/auth/success" element={<GoogleSuccessScreen />} />

            {/* 404 Fallback */}
            <Route
              path="*"
              element={
                <LandingShell>
                  <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex flex-col items-center justify-center text-center">
                    <div className="max-w-2xl bg-cream-100/80 rounded-card p-8 border border-cream-200 shadow-md">
                      <span className="text-xs bg-gold-500 text-ink-900 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        404 Halaman Tidak Ditemukan
                      </span>
                      <h1 className="mt-4 text-4xl sm:text-5xl font-serif font-bold text-brand-900 tracking-tight leading-tight">
                        Halaman yang Anda Cari Tidak Ada
                      </h1>
                      <p className="mt-4 text-lg text-ink-600 leading-relaxed">
                        Silakan kembali ke beranda perpustakaan digital untuk menjelajahi katalog
                        buku dan khazanah keilmuan.
                      </p>
                      <div className="mt-8 flex flex-wrap gap-4 justify-center">
                        <a
                          href="/"
                          className="bg-brand-700 hover:bg-brand-800 text-white px-6 py-3 rounded-btn font-medium shadow transition inline-flex items-center gap-2"
                        >
                          Kembali ke Beranda
                        </a>
                        <a
                          href="/pro"
                          className="border border-brand-700 text-brand-700 hover:bg-brand-50 px-6 py-3 rounded-btn font-medium transition inline-flex items-center gap-2"
                        >
                          Pelajari Fitur Pro
                        </a>
                      </div>
                    </div>
                  </div>
                </LandingShell>
              }
            />
          </Routes>
        </Suspense>
      </div>
    </AppProvider>
  );
}
