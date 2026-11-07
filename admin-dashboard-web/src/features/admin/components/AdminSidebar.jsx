import {
  BookOpenCheck,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  PanelLeftClose,
  Sparkles,
  X,
} from 'lucide-react';

/**
 * AdminSidebar — Navigasi utama panel administrasi Wahidiyah Book.
 *
 * Tiga mode tampilan:
 *  - Desktop expanded  : 256px (w-64)
 *  - Desktop compact   : 72px  (w-18 -> w-[72px])
 *  - Mobile            : drawer overlay dengan backdrop
 *
 * Komponen ini murni presentasional: seluruh aksi (pindah tab, ekspor, logout)
 * tetap dikendalikan oleh AdminDashboardContent di App.jsx.
 */
export function AdminSidebar({
  items = [],
  activeTab,
  onSelect,
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
  onExportFull,
  bookCount = 0,
}) {
  const handleSelect = (id) => {
    onSelect?.(id);
    onCloseMobile?.();
  };

  const navList = (isMobile) => (
    <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 pb-4" aria-label="Navigasi admin">
      {!isMobile && !collapsed && (
        <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cream-300/60">
          Menu Utama
        </p>
      )}
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
            className={`group relative flex w-full items-center rounded-btn text-left text-sm font-medium transition-all duration-200 cursor-pointer ${
              isMobile || !collapsed ? 'gap-3 px-3 py-2.5' : 'justify-center px-0 py-3'
            } ${
              isActive
                ? 'bg-gradient-to-r from-brand-700/90 to-brand-800/70 text-cream-50 shadow-sm ring-1 ring-gold-400/20'
                : 'text-cream-200/80 hover:bg-brand-800/60 hover:text-cream-50'
            }`}
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-gold-400" />
            )}
            <Icon
              className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                isActive ? 'text-gold-300' : 'text-cream-300/70 group-hover:text-gold-300'
              }`}
            />
            {(isMobile || !collapsed) && <span className="truncate">{item.label}</span>}
          </button>
        );
      })}
    </nav>
  );

  const brand = (isMobile) => (
    <div
      className={`flex items-center border-b border-brand-800/70 ${
        isMobile || !collapsed ? 'gap-3 px-5 py-5' : 'justify-center px-0 py-5'
      }`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-brand-950 shadow-md shadow-brand-950/40">
        <BookOpenCheck className="h-5 w-5" strokeWidth={2.2} />
      </div>
      {(isMobile || !collapsed) && (
        <div className="min-w-0">
          <p className="truncate font-serif text-[15px] font-bold leading-tight tracking-wide text-cream-50">
            Wahidiyah Book
          </p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-300/90">
            Admin Console
          </p>
        </div>
      )}
    </div>
  );

  const footer = (isMobile) => (
    <div className={`border-t border-brand-800/70 ${isMobile || !collapsed ? 'p-4' : 'p-3'}`}>
      {(isMobile || !collapsed) && (
        <div className="mb-3 rounded-2xl border border-gold-400/20 bg-brand-950/50 p-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-gold-300">
            <Sparkles className="h-3.5 w-3.5" />
            Katalog Digital
          </div>
          <p className="mt-1 text-xs text-cream-200/80">
            <strong className="text-cream-50">{bookCount}</strong> koleksi buku tersedia
          </p>
        </div>
      )}
      <button
        type="button"
        onClick={onExportFull}
        title="Ekspor seluruh data ke Excel"
        className={`flex w-full items-center rounded-xl text-xs font-bold text-gold-300 transition hover:bg-brand-800/70 hover:text-gold-200 cursor-pointer ${
          isMobile || !collapsed ? 'gap-2 px-3 py-2.5' : 'justify-center px-0 py-2.5'
        }`}
      >
        <FileSpreadsheet className="h-4 w-4 shrink-0" />
        {(isMobile || !collapsed) && <span>Unduh Laporan Lengkap</span>}
      </button>

      {!isMobile && (
        <button
          type="button"
          onClick={onToggleCollapse}
          className="mt-1.5 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-[11px] font-medium text-cream-300/70 transition hover:bg-brand-800/70 hover:text-cream-50 cursor-pointer"
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <>
              <PanelLeftClose className="h-3.5 w-3.5" />
              <span>Ciutkan sidebar</span>
              <ChevronLeft className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        className={`hidden shrink-0 flex-col border-r border-brand-950/40 bg-gradient-to-b from-brand-900 via-brand-900 to-brand-950 text-cream-50 shadow-xl shadow-brand-950/10 transition-[width] duration-300 ease-out lg:flex ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {brand(false)}
        {navList(false)}
        {footer(false)}
      </aside>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!mobileOpen}
      >
        <div
          className={`absolute inset-0 bg-ink-900/50 backdrop-blur-[2px] transition-opacity duration-300 ${
            mobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onCloseMobile}
        />
        <aside
          className={`absolute inset-y-0 left-0 flex w-[272px] flex-col bg-gradient-to-b from-brand-900 to-brand-950 text-cream-50 shadow-2xl transition-transform duration-300 ease-out ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Tutup navigasi"
            className="absolute right-3 top-4 rounded-lg p-1.5 text-cream-200 hover:bg-brand-800 hover:text-cream-50 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
          {brand(true)}
          {navList(true)}
          {footer(true)}
        </aside>
      </div>
    </>
  );
}
