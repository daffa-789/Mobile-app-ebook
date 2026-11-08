import {
  Calendar,
  Home,
  LogOut,
  Sparkles,
  ReceiptText,
  HelpCircle,
  Info,
  UserRound,
} from 'lucide-react';

const SIDEBAR_SECTIONS = [
  {
    id: 'utama',
    title: 'Utama',
    keys: ['home', 'calendar', 'pro'],
  },
  { id: 'akun', title: 'Akun', keys: ['profile', 'logout'] },
];

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

export const buildSidebarSections = (activeKeys) =>
  SIDEBAR_SECTIONS.map((section) => ({
    id: section.id,
    title: section.title,
    items: section.keys.map((key) => ({
      id: key,
      ...SIDEBAR_ITEM_DEFS[key],
      isActive: activeKeys.includes(key),
    })),
  })).filter((section) => section.items.length > 0);
