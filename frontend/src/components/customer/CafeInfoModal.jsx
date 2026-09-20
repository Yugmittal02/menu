import React from 'react';
import { LuX, LuMapPin, LuPhone, LuClock, LuExternalLink, LuWifi, LuCar, LuShieldCheck, LuSparkles, LuCheck } from 'react-icons/lu';
import PoweredByKrixov from '../brand/PoweredByKrixov';

export default function CafeInfoModal({ cafe, isOpen, onClose }) {
  if (!isOpen || !cafe) return null;

  const facilities = [
    { label: 'Free Wi-Fi', icon: LuWifi },
    { label: 'Air Conditioned', icon: LuSparkles },
    { label: 'Dine-In Available', icon: LuCheck },
    { label: 'Outdoor Seating', icon: LuSparkles }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity p-0 sm:p-4">
      <div
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-[var(--cafe-surface)] p-6 shadow-2xl transition-transform max-h-[90vh] overflow-y-auto"
        style={{ border: '1px solid var(--cafe-border)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--cafe-border)] pb-4">
          <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
            {cafe.logo ? (
              <img
                src={cafe.logo}
                alt={cafe.name}
                className="h-11 w-11 rounded-full object-cover shadow-sm ring-2 ring-[var(--cafe-primary)]/15 shrink-0 bg-white"
              />
            ) : (
              <div
                className="flex h-11 w-11 items-center justify-center rounded-full text-white shadow-sm font-bold text-base font-serif shrink-0"
                style={{ backgroundColor: 'var(--cafe-primary, #173D32)' }}
              >
                {(cafe.name || 'C').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h2
                className="text-lg sm:text-xl font-bold text-[var(--cafe-primary)] truncate"
                style={{ fontFamily: 'var(--cafe-font-heading)' }}
              >
                {cafe.name}
              </h2>
              <p className="text-xs text-[var(--cafe-muted)] tracking-wider uppercase mt-0.5 truncate">
                {cafe.tagline || 'Restaurant Information'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[var(--cafe-muted)] hover:bg-[var(--cafe-background)] hover:text-[var(--cafe-text)] transition shrink-0"
            aria-label="Close modal"
          >
            <LuX className="h-5 w-5" />
          </button>
        </div>

        {/* Description / Story (if set) */}
        {cafe.description && (
          <div className="mt-3.5 p-3 rounded-2xl bg-[var(--cafe-background)]/60 border border-[var(--cafe-border)] text-xs text-[var(--cafe-text)] leading-relaxed italic">
            "{cafe.description}"
          </div>
        )}

        {/* Details list */}
        <div className="mt-5 space-y-4 text-sm text-[var(--cafe-text)]">
          {/* Address */}
          {cafe.address && (
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--cafe-background)] text-[var(--cafe-primary)]">
                <LuMapPin className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-semibold uppercase text-[var(--cafe-muted)]">Address</span>
                <p className="mt-0.5 font-medium">{cafe.address}{cafe.city ? `, ${cafe.city}` : ''}</p>
                {cafe.socialLinks?.mapsUrl && (
                  <a
                    href={cafe.socialLinks.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[var(--cafe-primary)] hover:underline mt-1"
                  >
                    <span>Get Directions</span>
                    <LuExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Phone */}
          {cafe.phone && (
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--cafe-background)] text-[var(--cafe-primary)]">
                <LuPhone className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-semibold uppercase text-[var(--cafe-muted)]">Contact</span>
                <p className="mt-0.5 font-medium">{cafe.phone}</p>
                <a
                  href={`tel:${cafe.phone.replace(/[^0-9+]/g, '')}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[var(--cafe-primary)] hover:underline mt-1"
                >
                  <span>Call Restaurant</span>
                  <LuExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

          {/* Operating Hours */}
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--cafe-background)] text-[var(--cafe-primary)]">
              <LuClock className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <span className="text-xs font-semibold uppercase text-[var(--cafe-muted)]">Operating Hours</span>
              <p className="mt-0.5 font-medium">
                {cafe.openTime || '09:00'} — {cafe.closeTime || '23:00'} (Daily)
              </p>
            </div>
          </div>

          {/* Cuisine Tags */}
          {cafe.cuisine && cafe.cuisine.length > 0 && (
            <div className="pt-2">
              <span className="text-xs font-semibold uppercase text-[var(--cafe-muted)]">Cuisine</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {cafe.cuisine.map((c, idx) => (
                  <span
                    key={idx}
                    className="rounded-lg bg-[var(--cafe-background)] px-2.5 py-1 text-xs font-medium text-[var(--cafe-secondary)]"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Amenities & Facilities */}
          <div className="pt-2">
            <span className="text-xs font-semibold uppercase text-[var(--cafe-muted)]">Amenities</span>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {facilities.map((f, idx) => {
                const Icon = f.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-xl bg-[var(--cafe-background)] p-2.5 text-xs font-medium"
                  >
                    <Icon className="h-3.5 w-3.5 text-[var(--cafe-primary)]" />
                    <span>{f.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Close CTA */}
        <div className="mt-6 pt-4 border-t border-[var(--cafe-border)]">
          <button
            onClick={onClose}
            className="w-full rounded-xl py-3 text-sm font-bold text-white transition shadow-sm"
            style={{ backgroundColor: 'var(--cafe-primary)' }}
          >
            Back to Menu
          </button>
          <div className="mt-3 flex justify-center text-[var(--cafe-muted)]">
            <PoweredByKrixov className="text-[var(--cafe-muted)] hover:text-[var(--cafe-primary)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
