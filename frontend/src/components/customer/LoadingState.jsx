import React from 'react';

export default function LoadingState({ cafeName = 'The Café' }) {
  return (
    <div className="min-h-screen bg-[var(--cafe-background,#F7F4EC)] text-[var(--cafe-text,#222522)] pb-20 animate-pulse">
      {/* Skeleton Top Bar */}
      <header className="sticky top-0 z-30 bg-[var(--cafe-surface,#FFFFFF)]/90 backdrop-blur-md border-b border-[var(--cafe-border,#E7E0D3)] px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-stone-200/70" />
            <div className="space-y-1.5">
              <div className="h-4 w-32 bg-stone-200/80 rounded" />
              <div className="h-3 w-20 bg-stone-200/60 rounded" />
            </div>
          </div>
          <div className="h-7 w-16 bg-stone-200/70 rounded-full" />
        </div>
      </header>

      {/* Skeleton Hero / Offers */}
      <div className="max-w-md mx-auto px-4 pt-5">
        <div className="flex items-center justify-between mb-3">
          <div className="h-3.5 w-28 bg-stone-200/80 rounded" />
          <div className="h-3 w-12 bg-stone-200/60 rounded" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          <div className="min-w-[280px] h-28 rounded-2xl bg-stone-200/70 p-4 flex flex-col justify-between" />
          <div className="min-w-[280px] h-28 rounded-2xl bg-stone-200/50 p-4 flex flex-col justify-between" />
        </div>
      </div>

      {/* Skeleton Search */}
      <div className="max-w-md mx-auto px-4 pt-4">
        <div className="h-11 rounded-xl bg-stone-200/70" />
      </div>

      {/* Skeleton Category Pills */}
      <div className="max-w-md mx-auto px-4 pt-4 flex gap-2 overflow-hidden">
        <div className="h-8 w-20 rounded-full bg-stone-200/80 shrink-0" />
        <div className="h-8 w-24 rounded-full bg-stone-200/60 shrink-0" />
        <div className="h-8 w-24 rounded-full bg-stone-200/60 shrink-0" />
        <div className="h-8 w-20 rounded-full bg-stone-200/60 shrink-0" />
      </div>

      {/* Skeleton Menu Items Grid */}
      <div className="max-w-md mx-auto px-4 pt-6 space-y-4">
        <div className="h-5 w-32 bg-stone-200/80 rounded mb-3" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-3.5 rounded-2xl bg-[var(--cafe-surface,#FFFFFF)] border border-[var(--cafe-border,#E7E0D3)] shadow-sm flex gap-3.5 items-center"
          >
            <div className="w-24 h-24 rounded-xl bg-stone-200/80 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-3/4 bg-stone-200/80 rounded" />
              <div className="h-3 w-full bg-stone-200/50 rounded" />
              <div className="flex items-center justify-between pt-2">
                <div className="h-4 w-14 bg-stone-200/80 rounded" />
                <div className="h-7 w-16 bg-stone-200/70 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Subtle loader text */}
      <div className="mt-8 text-center text-xs tracking-wider uppercase text-[var(--cafe-muted,#6A746B)] font-medium">
        Loading {cafeName} Menu...
      </div>
    </div>
  );
}
