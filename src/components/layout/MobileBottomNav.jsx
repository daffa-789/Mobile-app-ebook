import React from 'react';
import { Home, Calendar, Sparkles, UserRound } from 'lucide-react';

export const MobileBottomNav = React.memo(({ activeKeys, onNavClick }) => {
  const items = [
    {
      id: 'home',
      label: 'Beranda',
      icon: Home,
      target: 'home',
      isActive: activeKeys.includes('home'),
    },
    {
      id: 'calendar',
      label: 'Kalender',
      icon: Calendar,
      target: 'calendar',
      isActive: activeKeys.includes('calendar'),
    },
    {
      id: 'pro',
      label: 'Pro',
      icon: Sparkles,
      target: 'pro',
      isActive: activeKeys.includes('pro'),
    },
    {
      id: 'profile',
      label: 'Profil',
      icon: UserRound,
      target: 'profile-edit',
      isActive: activeKeys.includes('profile'),
    },
  ];

  return (
    <nav
      aria-label="Navigasi bawah mobile"
      className="fixed bottom-0 inset-x-0 z-40 flex items-center justify-around border-t border-cream-300/80 bg-cream-50/95 px-2 py-1 shadow-[0_-4px_24px_rgba(20,82,58,0.06)] backdrop-blur-md md:hidden pb-safe"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.isActive;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavClick(item.target)}
            aria-current={isActive ? 'page' : undefined}
            className={`group relative flex flex-1 flex-col items-center justify-center min-h-[50px] py-1 px-1 rounded-2xl transition-all duration-200 cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
              isActive
                ? 'text-brand-900 bg-brand-100/70 font-bold'
                : 'text-ink-400 hover:text-ink-700 font-medium'
            }`}
          >
            <div className="relative">
              <Icon
                className={`h-5 w-5 transition-transform duration-200 ${
                  isActive ? 'scale-110' : 'group-hover:scale-105'
                } ${isActive ? 'text-brand-700' : 'text-ink-400'}`}
                strokeWidth={isActive ? 2.3 : 1.8}
              />
            </div>
            <span className="mt-0.5 text-caption leading-tight tracking-tight truncate max-w-full">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
});
