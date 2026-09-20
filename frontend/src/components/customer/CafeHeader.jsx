import React, { useState } from 'react';
import { LuInfo, LuMapPin, LuUtensils, LuSparkles } from 'react-icons/lu';

export default function CafeHeader({
  cafe,
  tableNo,
  onOpenInfo,
  activeOrderCount = 0,
  onViewOrders
}) {
  const [logoError, setLogoError] = useState(false);
  const name = cafe?.name || 'The Garden Café';
  const tagline = cafe?.tagline?.trim() || cafe?.description?.trim() || (cafe?.city ? `${cafe.city} • Open Daily` : '');
  const logo = cafe?.logo;
  const initial = (name || 'C').charAt(0).toUpperCase();

  return (
    <header className="relative w-full overflow-hidden border-b border-[var(--cafe-border)] bg-[var(--cafe-surface)] shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-colors duration-300">
      {/* Botanical subtle decorative background motif */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 opacity-10"
        aria-hidden="true"
      >
        <svg viewBox="0 0 100 100" fill="currentColor" className="text-[var(--cafe-primary)]">
          <path d="M50 0 C20 30 20 70 50 100 C80 70 80 30 50 0 Z" />
          <path d="M0 50 C30 20 70 20 100 50 C70 80 30 80 0 50 Z" />
        </svg>
      </div>

      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3 sm:px-6">
        {/* Left: Logo & Identity */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 mr-2">
          {logo && !logoError ? (
            <img
              src={logo}
              alt={`${name} logo`}
              onError={() => setLogoError(true)}
              className="h-10 w-10 sm:h-11 sm:w-11 rounded-full object-cover shadow-sm ring-2 ring-[var(--cafe-primary)]/20 shrink-0 bg-white"
            />
          ) : (
            <div
              className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full text-white shadow-sm font-bold text-base sm:text-lg font-serif shrink-0 ring-2 ring-black/5"
              style={{ backgroundColor: 'var(--cafe-primary, #173D32)' }}
            >
              {initial}
            </div>
          )}

          <div className="flex flex-col min-w-0 flex-1">
            <h1
              className="text-base sm:text-xl font-bold tracking-tight text-[var(--cafe-primary)] truncate"
              style={{ fontFamily: 'var(--cafe-font-heading)' }}
              title={name}
            >
              {name}
            </h1>
            {tagline ? (
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-[var(--cafe-muted)] truncate">
                {tagline}
              </span>
            ) : null}
          </div>
        </div>

        {/* Right: Table Indicator & Info Action */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {tableNo && (
            <div
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-sm"
              style={{
                backgroundColor: 'rgba(23, 61, 50, 0.08)',
                color: 'var(--cafe-primary)',
                border: '1px solid var(--cafe-border)'
              }}
            >
              <LuUtensils className="h-3 w-3" />
              <span>Table {tableNo}</span>
            </div>
          )}

          {activeOrderCount > 0 && (
            <button
              type="button"
              onClick={onViewOrders}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm transition animate-pulse"
              style={{
                backgroundColor: 'var(--cafe-primary)',
                color: '#FFFFFF'
              }}
              title="View live order status"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{activeOrderCount} {activeOrderCount === 1 ? 'Order' : 'Orders'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenInfo}
            aria-label="View restaurant information"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--cafe-border)] bg-[var(--cafe-background)] text-[var(--cafe-primary)] transition hover:bg-[var(--cafe-primary)] hover:text-white"
          >
            <LuInfo className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
