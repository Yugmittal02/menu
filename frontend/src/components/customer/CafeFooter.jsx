import React, { useState } from 'react';
import {
  LuSparkles,
  LuMapPin,
  LuPhone,
  LuClock,
  LuExternalLink,
  LuInstagram,
  LuFacebook,
  LuGlobe
} from 'react-icons/lu';
import PoweredByKrixov from '../brand/PoweredByKrixov';

export default function CafeFooter({ cafe }) {
  const [logoError, setLogoError] = useState(false);
  const year = new Date().getFullYear();

  const name = cafe?.name || 'The Garden Café';
  const tagline = cafe?.tagline?.trim() || cafe?.description?.trim();
  const logo = cafe?.logo;
  const initial = (name || 'C').charAt(0).toUpperCase();

  const hasSocials =
    cafe?.socialLinks?.instagram ||
    cafe?.socialLinks?.facebook ||
    cafe?.socialLinks?.website ||
    cafe?.socialLinks?.mapsUrl;

  const mapsUrl =
    cafe?.socialLinks?.mapsUrl ||
    (cafe?.address ? `https://maps.google.com/?q=${encodeURIComponent(`${cafe.name} ${cafe.address} ${cafe.city || ''}`)}` : null);

  return (
    <footer className="w-full border-t border-[var(--cafe-border)] bg-[var(--cafe-surface)] text-center transition-colors duration-300 pt-8 pb-[calc(88px+env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-lg px-4 sm:px-6 space-y-5">
        {/* 1. Brand Emblem / Logo & Identity */}
        <div className="flex flex-col items-center justify-center">
          {logo && !logoError ? (
            <img
              src={logo}
              alt={`${name} logo`}
              onError={() => setLogoError(true)}
              className="h-12 w-12 rounded-full object-cover shadow-sm ring-2 ring-[var(--cafe-primary)]/20 mb-2.5 bg-white"
            />
          ) : (
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full text-white shadow-sm font-bold text-base font-serif mb-2.5"
              style={{ backgroundColor: 'var(--cafe-primary, #173D32)' }}
            >
              {initial}
            </div>
          )}

          <h3
            className="text-lg font-bold text-[var(--cafe-primary)] tracking-tight"
            style={{ fontFamily: 'var(--cafe-font-heading)' }}
          >
            {name}
          </h3>

          {tagline && (
            <p className="mt-1 text-xs font-medium text-[var(--cafe-muted)] max-w-xs leading-relaxed">
              {tagline}
            </p>
          )}
        </div>

        {/* 2. Hospitality / Experience Note (if set) */}
        {cafe?.footerText && (
          <div className="rounded-2xl border border-[var(--cafe-border)] bg-[var(--cafe-background)]/60 p-3 text-center">
            <p className="text-xs text-[var(--cafe-text)] italic leading-relaxed">
              "{cafe.footerText}"
            </p>
          </div>
        )}

        {/* 3. Essential Details: Address, Hours, Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-left">
          {/* Operating Hours */}
          <div className="rounded-xl border border-[var(--cafe-border)] bg-[var(--cafe-background)]/40 p-2.5 flex items-start gap-2">
            <LuClock className="h-4 w-4 text-[var(--cafe-primary)] shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold text-[var(--cafe-muted)] tracking-wider block">Hours</span>
              <span className="text-[11px] font-semibold text-[var(--cafe-text)] block truncate">
                {cafe?.openTime || '09:00'} — {cafe?.closeTime || '22:00'}
              </span>
            </div>
          </div>

          {/* Contact Phone */}
          {cafe?.phone ? (
            <a
              href={`tel:${cafe.phone.replace(/[^0-9+]/g, '')}`}
              className="rounded-xl border border-[var(--cafe-border)] bg-[var(--cafe-background)]/40 p-2.5 flex items-start gap-2 hover:bg-[var(--cafe-background)] transition-colors group"
            >
              <LuPhone className="h-4 w-4 text-[var(--cafe-primary)] shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-[var(--cafe-muted)] tracking-wider block">Contact</span>
                <span className="text-[11px] font-semibold text-[var(--cafe-primary)] group-hover:underline block truncate">
                  {cafe.phone}
                </span>
              </div>
            </a>
          ) : (
            <div className="rounded-xl border border-[var(--cafe-border)] bg-[var(--cafe-background)]/40 p-2.5 flex items-start gap-2">
              <LuSparkles className="h-4 w-4 text-[var(--cafe-accent)] shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-[var(--cafe-muted)] tracking-wider block">Dine In</span>
                <span className="text-[11px] font-semibold text-[var(--cafe-text)] block">Fresh & Made to Order</span>
              </div>
            </div>
          )}

          {/* Location & Directions */}
          {cafe?.address ? (
            <a
              href={mapsUrl || '#'}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-[var(--cafe-border)] bg-[var(--cafe-background)]/40 p-2.5 flex items-start gap-2 hover:bg-[var(--cafe-background)] transition-colors group"
            >
              <LuMapPin className="h-4 w-4 text-[var(--cafe-primary)] shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-[var(--cafe-muted)] tracking-wider block">Location</span>
                <span className="text-[11px] font-semibold text-[var(--cafe-text)] group-hover:text-[var(--cafe-primary)] block truncate" title={`${cafe.address}${cafe.city ? `, ${cafe.city}` : ''}`}>
                  {cafe.city || cafe.address}
                </span>
              </div>
            </a>
          ) : (
            <div className="rounded-xl border border-[var(--cafe-border)] bg-[var(--cafe-background)]/40 p-2.5 flex items-start gap-2">
              <LuSparkles className="h-4 w-4 text-[var(--cafe-accent)] shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-[var(--cafe-muted)] tracking-wider block">Kitchen</span>
                <span className="text-[11px] font-semibold text-[var(--cafe-text)] block">100% Hygienic</span>
              </div>
            </div>
          )}
        </div>

        {/* 4. Social Links (if configured) */}
        {hasSocials && (
          <div className="flex items-center justify-center gap-2 pt-1">
            {cafe.socialLinks?.instagram && (
              <a
                href={
                  cafe.socialLinks.instagram.startsWith('http')
                    ? cafe.socialLinks.instagram
                    : `https://instagram.com/${cafe.socialLinks.instagram.replace('@', '')}`
                }
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--cafe-border)] bg-[var(--cafe-background)] text-[var(--cafe-muted)] hover:text-[var(--cafe-primary)] hover:border-[var(--cafe-primary)] transition"
              >
                <LuInstagram className="h-4 w-4" />
              </a>
            )}
            {cafe.socialLinks?.facebook && (
              <a
                href={
                  cafe.socialLinks.facebook.startsWith('http')
                    ? cafe.socialLinks.facebook
                    : `https://facebook.com/${cafe.socialLinks.facebook}`
                }
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--cafe-border)] bg-[var(--cafe-background)] text-[var(--cafe-muted)] hover:text-[var(--cafe-primary)] hover:border-[var(--cafe-primary)] transition"
              >
                <LuFacebook className="h-4 w-4" />
              </a>
            )}
            {cafe.socialLinks?.website && (
              <a
                href={
                  cafe.socialLinks.website.startsWith('http')
                    ? cafe.socialLinks.website
                    : `https://${cafe.socialLinks.website}`
                }
                target="_blank"
                rel="noreferrer"
                aria-label="Website"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--cafe-border)] bg-[var(--cafe-background)] text-[var(--cafe-muted)] hover:text-[var(--cafe-primary)] hover:border-[var(--cafe-primary)] transition"
              >
                <LuGlobe className="h-4 w-4" />
              </a>
            )}
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Google Maps Directions"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--cafe-border)] bg-[var(--cafe-background)] text-[var(--cafe-muted)] hover:text-[var(--cafe-primary)] hover:border-[var(--cafe-primary)] transition"
              >
                <LuMapPin className="h-4 w-4" />
              </a>
            )}
          </div>
        )}

        {/* 5. Clean Divider, Copyright & Powered by Krixov */}
        <div className="pt-2 border-t border-[var(--cafe-border)] space-y-2">
          <p className="text-[10px] font-semibold tracking-wider uppercase text-[var(--cafe-muted)]">
            © {year} {name}. All rights reserved.
          </p>
          <div className="flex items-center justify-center">
            <PoweredByKrixov className="text-[var(--cafe-muted)] hover:text-[var(--cafe-primary)]" />
          </div>
        </div>
      </div>
    </footer>
  );
}
