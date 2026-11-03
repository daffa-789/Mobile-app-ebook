import {
  Calendar,
  Home,
  LogOut,
  BookOpen,
  Sparkles,
  ReceiptText,
  HelpCircle,
  Info,
  UserRound,
  LayoutDashboard,
  Users,
  CalendarDays,
  Activity,
  GalleryHorizontalEnd,
} from 'lucide-react';

const SIDEBAR_SECTIONS = [
  {
    id: 'utama',
    title: 'Utama',
    keys: ['home', 'calendar', 'pro'],
  },
  { id: 'akun', title: 'Akun', keys: ['profile', 'logout'] },
];

const ADMIN_SECTION_KEYS = [
  'admin-overview',
  'admin-books',
  'admin-users',
  'admin-events',
  'admin-carousel',
  'admin-logs',
];

const ADMIN_SECTION = {
  id: 'administrasi',
  title: 'Administrasi',
  keys: [...ADMIN_SECTION_KEYS, 'logout'],
};

const SIDEBAR_ITEM_DEFS = {
  home: { label: 'Beranda', icon: Home, target: 'home' },
  calendar: { label: 'Kalender', icon: Calendar, target: 'calendar' },
  'subscription-history': {
    label: 'Riwayat Langganan',
    icon: ReceiptText,
    target: 'subscription-history',
  },
  pro: { label: 'Pro', icon: Sparkles, target: 'pro' },
  'help-center': { label: 'Pusat Bantuan', icon: HelpCircle, target: 'help-center' },
  about: { label: 'Tentang', icon: Info, target: 'about' },
  profile: { label: 'Profil', icon: UserRound, target: 'profile-edit' },
  logout: { label: 'Log Out', icon: LogOut, target: 'logout', danger: true },

  'admin-overview': { label: 'Beranda', icon: LayoutDashboard, target: 'admin:overview' },
  'admin-books': { label: 'Koleksi', icon: BookOpen, target: 'admin:books' },
  'admin-users': { label: 'Pengguna', icon: Users, target: 'admin:users' },
  'admin-events': { label: 'Agenda', icon: CalendarDays, target: 'admin:events' },
  'admin-carousel': { label: 'Carousel', icon: GalleryHorizontalEnd, target: 'admin:carousel' },
  'admin-logs': { label: 'Log Aktivitas', icon: Activity, target: 'admin:logs' },
};

export const ACTIVE_KEYS_BY_SCREEN = {
  home: ['home'],
  calendar: ['calendar'],
  pro: ['pro'],
  'subscription-history': ['subscription-history'],
  riwayat: ['subscription-history'],
  'help-center': ['help-center'],
  help: ['help-center'],
  about: ['about'],
  'profile-edit': ['profile'],
};

export const buildSidebarSections = (isAdmin, activeKeys) => {
  const showAdminNav = isAdmin;
  const source = showAdminNav ? [ADMIN_SECTION] : SIDEBAR_SECTIONS;

  return source
    .map((section) => ({
      id: section.id,
      title: section.title,
      items: section.keys.map((key) => ({
        id: key,
        ...SIDEBAR_ITEM_DEFS[key],
        accent: showAdminNav ? 'admin' : 'user',
        isActive: activeKeys.includes(key),
      })),
    }))
    .filter((section) => section.items.length > 0);
};
