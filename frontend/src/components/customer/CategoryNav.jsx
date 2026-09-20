import React, { useRef, useEffect } from 'react';

export default function CategoryNav({
  categories = [],
  activeCategory = 'All',
  onSelectCategory,
  vegOnly = false,
  onToggleVegOnly
}) {
  const scrollRef = useRef(null);

  // Auto-center active pill when activeCategory changes
  useEffect(() => {
    if (scrollRef.current) {
      const activeBtn = scrollRef.current.querySelector('[data-active="true"]');
      if (activeBtn) {
        const containerLeft = scrollRef.current.getBoundingClientRect().left;
        const btnLeft = activeBtn.getBoundingClientRect().left;
        const offset = btnLeft - containerLeft - 60;
        scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
      }
    }
  }, [activeCategory]);

  return (
    <nav
      className="sticky top-0 z-20 w-full border-b border-[var(--cafe-border)] bg-[var(--cafe-surface)]/95 backdrop-blur-md transition-all"
      aria-label="Menu categories"
    >
      <div className="mx-auto max-w-lg px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-2">
          {/* Categories Pills Carousel */}
          <div
            ref={scrollRef}
            className="flex flex-1 items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none"
          >
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  data-active={isActive}
                  onClick={() => onSelectCategory(cat)}
                  className="shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition-all shadow-sm"
                  style={{
                    backgroundColor: isActive ? 'var(--cafe-primary)' : 'var(--cafe-background)',
                    color: isActive ? '#FFFFFF' : 'var(--cafe-text)',
                    border: isActive
                      ? '1px solid var(--cafe-primary)'
                      : '1px solid var(--cafe-border)',
                    boxShadow: isActive ? '0 2px 8px rgba(23, 61, 50, 0.2)' : 'none'
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Veg Only Quick Filter */}
          <div className="shrink-0 pl-1 border-l border-[var(--cafe-border)]">
            <button
              type="button"
              onClick={onToggleVegOnly}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition border ${
                vegOnly
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-[var(--cafe-background)] text-[var(--cafe-muted)] border-[var(--cafe-border)] hover:text-[var(--cafe-text)]'
              }`}
              title="Show vegetarian items only"
            >
              <span className="flex h-3 w-3 items-center justify-center rounded-sm border border-emerald-500 bg-white p-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              </span>
              <span>VEG</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
