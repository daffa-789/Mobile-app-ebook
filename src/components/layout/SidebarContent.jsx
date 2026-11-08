import React from 'react';
import { PanelLeft } from 'lucide-react';
import { SidebarNavSection } from './SidebarNavButton';

export const SidebarContent = React.memo(
  ({ onNavClick, isCollapsed = false, sections, setSidebarCollapsed }) => {
    const handleToggleCollapse = React.useCallback(() => {
      setSidebarCollapsed((prev) => !prev);
    }, [setSidebarCollapsed]);

    const collapseToggle = (
      <button
        type="button"
        onClick={handleToggleCollapse}
        title={isCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
        aria-label={isCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-semantic-mutedOnDark transition-colors duration-200 hover:bg-cream-50/5 hover:text-cream-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <PanelLeft className="h-[17px] w-[17px]" strokeWidth={1.9} />
      </button>
    );

    if (isCollapsed) {
      return (
        <div className="flex h-full w-full flex-col items-center">
          <div className="flex flex-col items-center pb-2">{collapseToggle}</div>

          <nav className="flex w-full flex-1 flex-col items-center gap-1 overflow-y-auto thin-scrollbar">
            {sections.map((section) => (
              <SidebarNavSection
                key={section.id}
                items={section.items}
                isCollapsed
                onNavClick={onNavClick}
              />
            ))}
          </nav>
        </div>
      );
    }

    return (
      <div className="flex h-full w-full flex-col">
        <div className="flex items-center justify-between gap-2 pb-4">
          <button
            type="button"
            onClick={() => onNavClick('home')}
            className="flex min-h-9 min-w-0 select-none items-center gap-2 text-left transition-colors duration-200 hover:opacity-80 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg px-0.5"
          >
            <span className="min-w-0 font-display text-base font-bold tracking-tight text-cream-50 whitespace-nowrap">
              E-Book Wahidiyah
            </span>
          </button>
          {collapseToggle}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto thin-scrollbar">
          {sections.map((section) => (
            <SidebarNavSection
              key={section.id}
              items={section.items}
              isCollapsed={false}
              onNavClick={onNavClick}
            />
          ))}
        </nav>
      </div>
    );
  },
);
