export const normalizePath = (pathname) =>
  String(pathname || '/')
    .toLowerCase()
    .replace(/\/+$/, '') || '/';

export const SCREEN_TO_PATH = {
  home: '/',
  catalog: '/catalog',
  katalog: '/catalog',
  reader: '/reader',
  pro: '/pro',
  'payment-method': '/payment-method',
  'payment-confirm': '/payment-confirm',
  'payment-success': '/payment-success',
  login: '/login',
  register: '/register',
  'verify-email': '/verify-email',
  'forgot-password': '/forgot-password',
  'auth-callback': '/auth/callback',
  'auth-success': '/auth/success',
  about: '/about',
  help: '/help',
  'help-center': '/help',
  'subscription-history': '/riwayat',
  riwayat: '/riwayat',
};

export const PATH_TO_SCREEN = {
  '/': 'home',
  '/home': 'home',
  '/catalog': 'catalog',
  '/katalog': 'catalog',
  '/reader': 'reader',
  '/pro': 'pro',
  '/payment-method': 'payment-method',
  '/payment-confirm': 'payment-confirm',
  '/payment-success': 'payment-success',
  '/auth': 'login',
  '/login': 'login',
  '/register': 'register',
  '/verify-email': 'verify-email',
  '/forgot-password': 'forgot-password',
  '/auth/callback': 'auth-callback',
  '/auth/success': 'auth-success',
  '/about': 'about',
  '/help': 'help',
  '/help-center': 'help',
  '/riwayat': 'subscription-history',
};

export const AUTH_ONLY_SCREENS = new Set([
  'auth',
  'login',
  'register',
  'verify-email',
  'forgot-password',
  'auth-callback',
  'auth-success',
]);

export const getScreenFromPath = () => {
  if (typeof window === 'undefined') return 'home';
  return PATH_TO_SCREEN[normalizePath(window.location.pathname)] || 'home';
};
