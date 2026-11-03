/**
 * Modul pemetaan rute URL dan navigasi layar aplikasi Wahidiyah Book.
 * Mengatur translasi dua arah antara nama layar internal (screen state) dan path browser,
 * serta sub-rute dashboard admin.
 *
 * @module src/lib/navigation
 */

/**
 * Normalisasi path URL browser: lowercase, hapus trailing slash ganda, default ke '/'.
 *
 * @param {string} [pathname='/'] - Path URL mentah
 * @returns {string} Path ternormalisasi
 * @example normalizePath('/Calendar/') // => '/calendar'
 */
export const normalizePath = (pathname) =>
  String(pathname || '/')
    .toLowerCase()
    .replace(/\/+$/, '') || '/';

/**
 * Pemetaan dari identifier layar (screen state) ke path URL yang sesuai.
 * @type {Record<string, string>}
 */
export const SCREEN_TO_PATH = {
  home: '/',
  calendar: '/calendar',
  pro: '/pro',

  'profile-edit': '/profile',
  profile: '/profile',

  'subscription-history': '/riwayat',
  riwayat: '/riwayat',
  'help-center': '/help',
  help: '/help',
  about: '/about',
  'auth-success': '/auth/success',
  reader: '/reader',
  auth: '/auth',
  login: '/login',
  register: '/register',

  'verify-email': '/verify-email',
  'forgot-password': '/forgot-password',

  'auth-callback': '/auth/callback',

  'payment-method': '/payment-method',
  'payment-confirm': '/payment-confirm',
  'payment-success': '/payment-success',
  'admin-dashboard': '/admin',
};

/**
 * Pemetaan dari path URL browser ke identifier layar yang sesuai.
 * @type {Record<string, string>}
 */
export const PATH_TO_SCREEN = {
  '/': 'home',
  '/home': 'home',
  '/calendar': 'calendar',
  '/reader': 'reader',
  '/pro': 'pro',
  '/pengaturan': 'profile-edit',
  '/profile': 'profile-edit',
  '/profile/edit': 'profile-edit',

  '/riwayat': 'subscription-history',
  '/profile/history': 'subscription-history',
  '/pengaturan/riwayat': 'subscription-history',
  '/pengaturan/history': 'subscription-history',
  '/help': 'help-center',
  '/help-center': 'help-center',
  '/about': 'about',
  '/auth': 'login',
  '/login': 'login',
  '/register': 'register',

  '/verify-email': 'verify-email',
  '/forgot-password': 'forgot-password',

  '/auth/callback': 'auth-callback',

  '/auth/success': 'auth-success',
  '/payment-method': 'payment-method',
  '/payment-confirm': 'payment-confirm',
  '/payment-success': 'payment-success',
  '/admin': 'admin-dashboard',
  '/admin-dashboard': 'admin-dashboard',

  '/admin/beranda': 'admin-dashboard',
  '/admin/ringkasan': 'admin-dashboard',
  '/admin/koleksi': 'admin-dashboard',
  '/admin/pengguna': 'admin-dashboard',
  '/admin/agenda': 'admin-dashboard',
  '/admin/carousel': 'admin-dashboard',
  '/admin/log': 'admin-dashboard',
};

/** Tab default saat membuka dashboard admin. */
export const ADMIN_DEFAULT_TAB = 'overview';

const ADMIN_PATH_TO_TAB = {
  '/admin': ADMIN_DEFAULT_TAB,
  '/admin-dashboard': ADMIN_DEFAULT_TAB,
  '/admin/beranda': 'overview',
  '/admin/ringkasan': 'overview',
  '/admin/koleksi': 'books',
  '/admin/pengguna': 'users',
  '/admin/agenda': 'events',
  '/admin/carousel': 'carousel',
  '/admin/log': 'logs',
};

/**
 * Dapatkan ID tab admin berdasarkan path URL browser.
 *
 * @param {string} pathname - Path URL browser saat ini
 * @returns {string} ID tab admin ('overview', 'books', 'users', 'events', 'carousel', 'logs')
 */
export const tabIdFromPath = (pathname) =>
  ADMIN_PATH_TO_TAB[normalizePath(pathname)] || ADMIN_DEFAULT_TAB;

/**
 * Dapatkan path URL kanonikal untuk tab admin tertentu.
 *
 * @param {string} tabId - ID tab admin
 * @returns {string} Path URL admin
 */
export const adminPathForTab = (tabId) =>
  Object.keys(ADMIN_PATH_TO_TAB).find(
    (path) => path.startsWith('/admin/') && ADMIN_PATH_TO_TAB[path] === tabId,
  ) || '/admin';

/** Himpunan slug sub-halaman dashboard admin. */
export const ADMIN_TAB_SLUGS = new Set(
  Object.keys(ADMIN_PATH_TO_TAB)
    .filter((path) => path.startsWith('/admin/'))
    .map((path) => path.slice('/admin/'.length)),
);

/** Himpunan layar yang hanya relevan untuk alur autentikasi tanpa navbar utama. */
export const AUTH_ONLY_SCREENS = new Set([
  'auth',
  'login',
  'register',
  'verify-email',
  'forgot-password',
  'auth-callback',
  'auth-success',
]);

/**
 * Tentukan nama layar aktif saat aplikasi dimuat pertama kali berdasarkan window.location.pathname.
 *
 * @returns {string} Nama layar aktif
 */
export const getScreenFromPath = () => {
  if (typeof window === 'undefined') return 'login';
  return PATH_TO_SCREEN[normalizePath(window.location.pathname)] || 'login';
};
