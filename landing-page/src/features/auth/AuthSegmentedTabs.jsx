export const AuthSegmentedTabs = ({ activeTab, onTabChange }) => {
  return (
    <div
      role="tablist"
      aria-label="Pilihan Autentikasi"
      className="mb-5 grid grid-cols-2 p-1 rounded-xl bg-cream-200/70 border border-cream-300"
    >
      <button
        id="tab-login"
        type="button"
        role="tab"
        aria-selected={activeTab === 'login'}
        aria-controls="auth-panel-login"
        onClick={() => onTabChange('login')}
        className={`py-2 text-xs sm:text-sm rounded-lg transition-all duration-200 text-center font-bold cursor-pointer ${
          activeTab === 'login'
            ? 'bg-brand-700 text-cream-50 shadow-none'
            : 'text-ink-600 hover:text-ink-900 hover:bg-cream-100/50'
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
        className={`py-2 text-xs sm:text-sm rounded-lg transition-all duration-200 text-center font-bold cursor-pointer ${
          activeTab === 'register'
            ? 'bg-brand-700 text-cream-50 shadow-none'
            : 'text-ink-600 hover:text-ink-900 hover:bg-cream-100/50'
        }`}
      >
        Daftar Akun
      </button>
    </div>
  );
};

export default AuthSegmentedTabs;
