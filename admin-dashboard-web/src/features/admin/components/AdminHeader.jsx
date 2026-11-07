import { Bell, ChevronRight, LogOut, Menu, RefreshCw, Wifi, WifiOff } from 'lucide-react';

/**
 * AdminHeader — Header translusen dengan breadcrumbs, indikator status sistem,
 * aksi muat ulang, dan identitas administrator.
 */
export function AdminHeader({
  title = 'Ringkasan',
  user,
  onLogout,
  onOpenMenu,
  onRefresh,
  isLoading = false,
  hasError = false,
}) {
  const displayName = user?.name || user?.email || 'Administrator';
  const initials = displayName.slice(0, 2).toUpperCase();
  const status = hasError
    ? {
        label: 'Perlu Perhatian',
        icon: WifiOff,
        tone: 'text-semantic-danger bg-semantic-dangerLight',
      }
    : isLoading
      ? {
          label: 'Memuat Data',
          icon: RefreshCw,
          tone: 'text-semantic-warning bg-semantic-warningLight',
        }
      : { label: 'Sistem Aktif', icon: Wifi, tone: 'text-brand-700 bg-brand-50' };
  const StatusIcon = status.icon;

  return (
    <header className="sticky top-0 z-30 flex h-[68px] shrink-0 items-center justify-between gap-3 border-b border-cream-200/80 bg-cream-50/85 px-4 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Buka navigasi"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cream-300 bg-ui-card text-ink-600 transition hover:bg-cream-100 lg:hidden cursor-pointer"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="min-w-0">
          <div className="hidden items-center gap-1.5 text-[11px] font-medium text-ink-400 sm:flex">
            <span>Panel Admin</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-brand-700">{title}</span>
          </div>
          <h1 className="truncate font-serif text-base font-bold leading-tight text-brand-900 sm:text-lg">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div
          className={`hidden items-center gap-1.5 rounded-full border border-cream-300/70 px-3 py-1.5 text-[11px] font-bold shadow-sm sm:inline-flex ${status.tone}`}
          title="Status koneksi data dashboard"
        >
          <StatusIcon className={`h-3.5 w-3.5 ${isLoading && !hasError ? 'animate-spin' : ''}`} />
          {status.label}
          {!hasError && !isLoading && (
            <span className="ml-0.5 h-1.5 w-1.5 animate-pulse rounded-full bg-brand-600" />
          )}
        </div>

        <button
          type="button"
          onClick={onRefresh}
          title="Muat ulang data"
          aria-label="Muat ulang data"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-cream-300 bg-ui-card text-ink-500 transition hover:bg-cream-100 hover:text-brand-700 cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
        </button>

        <button
          type="button"
          title="Notifikasi"
          aria-label="Notifikasi"
          className="relative hidden h-9 w-9 items-center justify-center rounded-xl border border-cream-300 bg-ui-card text-ink-500 transition hover:bg-cream-100 hover:text-brand-700 sm:flex cursor-pointer"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-gold-500" />
        </button>

        <span className="hidden h-7 w-px bg-cream-300 sm:block" />

        <div className="flex items-center gap-2.5">
          <div className="hidden text-right md:block">
            <p className="max-w-[150px] truncate text-xs font-bold text-ink-800">{displayName}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-600">
              Administrator
            </p>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-700 to-brand-900 text-xs font-bold text-cream-50 shadow-sm ring-2 ring-gold-400/50">
            {initials}
          </div>
        </div>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            title="Keluar"
            aria-label="Keluar"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-400 transition hover:bg-semantic-dangerLight hover:text-semantic-danger cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </header>
  );
}
