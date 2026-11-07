import { ChevronLeft, ChevronRight, X } from 'lucide-react';

/**
 * AdminSidebar — Navigasi datar tanpa logo, badge, kartu info, atau tombol ekspor.
 * Brand cukup tulisan "Admin"; tombol ciutkan ada di sebelahnya di baris atas.
 */
export function AdminSidebar({
  items = [],
  activeTab,
  onSelect,
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
}) {
  const handleSelect = (id) => {
    onSelect?.(id);
    onCloseMobile?.();
  };

  const brandRow = (isMobile) => (
    <div
      className={`flex items-center border-b border-brand-800 ${
        isMobile || !collapsed ? 'justify-between px-5 py-4' : 'justify-center px-0 py-4'
      }`}
    >
      {(isMobile || !collapsed) && <p className="text-sm font-bold text-cream-50">Admin</p>}

      {!isMobile ? (
        <button
          type="button"
          onClick={onToggleCollapse}
          title={collapsed ? 'Bentangkan sidebar' : 'Ciutkan sidebar'}
          aria-label={collapsed ? 'Bentangkan sidebar' : 'Ciutkan sidebar'}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-cream-300 transition hover:bg-brand-800 hover:text-cream-50 cursor-pointer"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      ) : (
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Tutup navigasi"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-cream-300 hover:bg-brand-800 hover:text-cream-50 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  const navList = (isMobile) => (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Navigasi admin">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleSelect(item.id)}
            title={collapsed && !isMobile ? item.label : undefined}
            aria-current={isActive ? 'page' : undefined}
            className={`group relative flex w-full items-center rounded-btn text-left text-sm font-medium transition-colors cursor-pointer ${
              isMobile || !collapsed ? 'gap-3 px-3 py-2.5' : 'justify-center px-0 py-3'
            } ${
              isActive
                ? 'bg-brand-800 text-cream-50'
                : 'text-cream-200/80 hover:bg-brand-800/60 hover:text-cream-50'
            }`}
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-gold-400" />
            )}
            <Icon
              className={`h-[18px] w-[18px] shrink-0 ${
                isActive ? 'text-cream-50' : 'text-cream-300/70'
              }`}
            />
            {(isMobile || !collapsed) && <span className="truncate">{item.label}</span>}
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      <aside
        className={`hidden shrink-0 flex-col border-r border-brand-950/40 bg-brand-900 text-cream-50 transition-[width] duration-300 ease-out lg:flex ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {brandRow(false)}
        {navList(false)}
      </aside>

      <div
        className={`fixed inset-0 z-40 lg:hidden ${
          mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        aria-hidden={!mobileOpen}
      >
        <div
          className={`absolute inset-0 bg-ink-900/50 transition-opacity duration-300 ${
            mobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onCloseMobile}
        />
        <aside
          className={`absolute inset-y-0 left-0 flex w-[272px] flex-col bg-brand-900 text-cream-50 transition-transform duration-300 ease-out ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {brandRow(true)}
          {navList(true)}
        </aside>
      </div>
    </>
  );
}
