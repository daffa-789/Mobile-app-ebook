/**
 * Komponen Segmented Tab Switcher untuk Layar Autentikasi Terpadu (Unified Auth).
 * Memungkinkan pengguna beralih antara formulir "Masuk" dan "Daftar" dengan mudah dan aksesibel.
 *
 * @module src/features/auth/AuthSegmentedTabs
 */

/**
 * @param {object} props
 * @param {'login' | 'register'} props.activeTab - Tab aktif saat ini
 * @param {(tab: 'login' | 'register') => void} props.onTabChange - Callback perpindahan tab
 * @returns {import('react').JSX.Element}
 */
export const AuthSegmentedTabs = ({ activeTab, onTabChange }) => {
  return (
    <div
      role="tablist"
      aria-label="Pilihan Autentikasi"
      className="mb-5 grid grid-cols-2 p-1 rounded-xl bg-cream-200/70 border border-cream-300 dark:bg-charcoal-800/80 dark:border-charcoal-700/80"
    >
      <button
        id="tab-login"
        type="button"
        role="tab"
        aria-selected={activeTab === 'login'}
        aria-controls="auth-panel-login"
        onClick={() => onTabChange('login')}
        className={`py-2 text-xs sm:text-sm rounded-lg transition-all duration-200 text-center font-bold ${
          activeTab === 'login'
            ? 'bg-brand-700 text-cream-50 shadow-none'
            : 'text-ink-600 hover:text-ink-900 dark:text-ink-300 dark:hover:text-cream-50 hover:bg-cream-100/50 dark:hover:bg-charcoal-700/40'
        }`}
      >
        Masuk
      </button>

      <button
        id="tab-register"
        type="button"
        role="tab"
        aria-selected={activeTab === 'register'}
        aria-controls="auth-panel-register"
        onClick={() => onTabChange('register')}
        className={`py-2 text-xs sm:text-sm rounded-lg transition-all duration-200 text-center font-bold ${
          activeTab === 'register'
            ? 'bg-brand-700 text-cream-50 shadow-none'
            : 'text-ink-600 hover:text-ink-900 dark:text-ink-300 dark:hover:text-cream-50 hover:bg-cream-100/50 dark:hover:bg-charcoal-700/40'
        }`}
      >
        Daftar Akun
      </button>
    </div>
  );
};
