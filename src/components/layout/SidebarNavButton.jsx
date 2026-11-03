export const SidebarNavButton = ({ item, isCollapsed, onNavClick }) => {
  const Icon = item.icon;
  const isDanger = Boolean(item.danger);

  /* Cincin fokus & warna aktif dipakai kedua varian tombol (ikon saja dan
     penuh). Dulu kedua potongan class ditulis ulang, jadi perubahan token tema
     harus disentuh di dua tempat. */
  const focusRing = isDanger
    ? 'focus-visible:ring-semantic-dangerOnDark'
    : 'focus-visible:ring-brand-500';
  const activeState = item.isActive
    ? 'bg-brand-700 text-cream-50 shadow-sm'
    : 'text-semantic-mutedOnDark hover:text-cream-50 hover:bg-cream-50/5';

  if (isCollapsed) {
    return (
      <button
        type="button"
        onClick={() => onNavClick(item.target)}
        title={item.label}
        aria-label={item.label}
        aria-current={item.isActive ? 'page' : undefined}
        className={`relative h-11 w-11 rounded-md flex items-center justify-center transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 ${focusRing} ${activeState}`}
      >
        <Icon className="w-[18px] h-[18px]" strokeWidth={1.9} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onNavClick(item.target)}
      aria-current={item.isActive ? 'page' : undefined}
      className={`group relative w-full h-11 flex items-center gap-3 pl-3 pr-3 rounded-md transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 ${focusRing} ${activeState}`}
    >
      <span
        aria-hidden="true"
        className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-full transition-all duration-200 ${
          item.isActive ? 'h-5 bg-brand-400' : 'h-0 bg-transparent'
        }`}
      />
      <Icon
        className={`w-[18px] h-[18px] shrink-0 transition-colors duration-200 ${
          item.isActive
            ? 'text-cream-50'
            : isDanger
              ? 'text-semantic-dangerOnDark'
              : 'text-semantic-mutedOnDark group-hover:text-cream-100'
        }`}
        strokeWidth={1.9}
      />
      <span className="truncate text-buttonMd font-semibold tracking-tight">{item.label}</span>
    </button>
  );
};

export const SidebarNavSection = ({ items, isCollapsed, onNavClick }) => {
  if (!items?.length) return null;
  return (
    <div className={isCollapsed ? 'flex flex-col items-center gap-1' : 'space-y-0.5'}>
      {items.map((item) => (
        <SidebarNavButton
          key={item.id}
          item={item}
          isCollapsed={isCollapsed}
          onNavClick={onNavClick}
        />
      ))}
    </div>
  );
};
