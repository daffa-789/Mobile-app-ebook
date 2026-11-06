import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router';
import { useApp } from '@context/AppContext';
import { ServerStatusBanner } from '@ui/ServerStatusBanner';
import { layout } from '@lib/styles';
import { AuthBrandHeader } from './AuthBrandHeader';
import { AuthSegmentedTabs } from './AuthSegmentedTabs';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { GoogleAuthButton } from './GoogleAuthButton';

export const AuthScreen = ({ initialTab = 'login' }) => {
  const { navigateTo } = useApp();
  const location = useLocation();

  const resolveTabFromLocation = useCallback(() => {
    if (location.pathname === '/register') return 'register';
    if (location.pathname === '/login') return 'login';
    return initialTab;
  }, [location.pathname, initialTab]);

  const [activeTab, setActiveTab] = useState(resolveTabFromLocation);
  const [sharedEmail, setSharedEmail] = useState('');
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    const nextTab = resolveTabFromLocation();
    setActiveTab(nextTab);
  }, [resolveTabFromLocation]);

  const handleTabChange = (targetTab) => {
    if (targetTab === activeTab) return;
    setGeneralError('');
    setActiveTab(targetTab);
    navigateTo(targetTab, { replace: true });
  };

  return (
    <main className={layout.authShell}>
      <section className={layout.authCard}>
        <AuthBrandHeader
          title="Wahidiyah Book"
          subtitle={
            activeTab === 'login'
              ? 'Masuk ke akun Anda untuk mengakses koleksi buku'
              : 'Daftar akun baru untuk mulai membaca dan berlangganan'
          }
        />

        <ServerStatusBanner />

        <AuthSegmentedTabs activeTab={activeTab} onTabChange={handleTabChange} />

        {generalError && (
          <div role="alert" className="auth-alert mb-4">
            <span>{generalError}</span>
          </div>
        )}

        <div
          role="tabpanel"
          id={activeTab === 'login' ? 'auth-panel-login' : 'auth-panel-register'}
          aria-labelledby={activeTab === 'login' ? 'tab-login' : 'tab-register'}
          className="transition-opacity duration-200"
        >
          {activeTab === 'login' ? (
            <LoginForm
              email={sharedEmail}
              setEmail={setSharedEmail}
              onForgotPassword={() => navigateTo('forgot-password')}
            />
          ) : (
            <RegisterForm email={sharedEmail} setEmail={setSharedEmail} />
          )}
        </div>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-cream-300" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-cream-50 px-3 font-semibold tracking-wider text-ink-500">atau</span>
          </div>
        </div>

        <GoogleAuthButton mode={activeTab} onError={setGeneralError} />

        <div className="mt-6 border-t border-cream-200 pt-5 text-center text-sm text-ink-500">
          {activeTab === 'login' ? (
            <>
              Belum memiliki akun?{' '}
              <button
                type="button"
                onClick={() => handleTabChange('register')}
                className="auth-link font-bold"
              >
                Daftar sekarang
              </button>
            </>
          ) : (
            <>
              Sudah memiliki akun?{' '}
              <button
                type="button"
                onClick={() => handleTabChange('login')}
                className="auth-link font-bold"
              >
                Masuk
              </button>
            </>
          )}
        </div>
      </section>
    </main>
  );
};
