import { ChevronRight, LogOut, Menu } from 'lucide-react';

/**
 * AdminHeader — Header datar: breadcrumb "Panel Admin › [halaman]" saja.
 * Tanpa status pill, lonceng, tombol muat ulang, atau judul ganda.
 */
export function AdminHeader({ title = 'Ringkasan', user, onLogout, onOpenMenu }) {
  const displayName = user?.name || user?.email || 'Administrator';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-cream-200 bg-cream-50 px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Buka navigasi"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cream-300 bg-ui-card text-ink-600 transition hover:bg-cream-100 lg:hidden cursor-pointer"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex min-w-0 items-center gap-1.5 text-xs text-ink-500">
          <span className="shrink-0">Panel Admin</span>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="truncate font-semibold text-ink-900">{title}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-[11px] font-bold text-cream-50"
          title={displayName}
        >
          {initials}
        </div>
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            title="Keluar"
            aria-label="Keluar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition hover:bg-cream-100 hover:text-semantic-danger cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </header>
  );
}
