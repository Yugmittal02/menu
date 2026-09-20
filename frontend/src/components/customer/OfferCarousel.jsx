import React from 'react';
import { LuTag, LuSparkles, LuCheck } from 'react-icons/lu';

export default function OfferCarousel({ offers = [], appliedCoupon, onApplyOffer }) {
  if (!offers || offers.length === 0) return null;

  return (
    <section className="w-full py-4 overflow-hidden">
      <div className="mx-auto max-w-lg px-4 sm:px-6">
        {/* Title */}
        <div className="flex items-center gap-2 mb-3">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--cafe-accent)]/20 text-[var(--cafe-primary)]">
            <LuSparkles className="h-3 w-3" />
          </span>
          <h2
            className="text-xs font-bold uppercase tracking-widest text-[var(--cafe-primary)]"
            style={{ letterSpacing: '0.12em' }}
          >
            Exclusive Offers
          </h2>
        </div>

        {/* Carousel Scroll Container */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
          {offers.map((offer, idx) => {
            const isApplied = appliedCoupon && (appliedCoupon.code === offer.code);
            const discountDisplay =
              offer.type === 'percentage'
                ? `${offer.value}% OFF`
                : `₹${offer.value} OFF`;

            return (
              <div
                key={offer._id || offer.code || idx}
                className="snap-start shrink-0 w-[270px] sm:w-[290px] rounded-2xl p-3.5 flex flex-col justify-between transition-all duration-200 relative overflow-hidden"
                style={{
                  backgroundColor: 'var(--cafe-surface)',
                  border: isApplied
                    ? '2px solid var(--cafe-primary)'
                    : '1px solid var(--cafe-border)',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
                }}
              >
                {/* Subtle decorative background tint */}
                <div
                  className="pointer-events-none absolute right-0 bottom-0 h-24 w-24 translate-x-4 translate-y-4 rounded-full opacity-10"
                  style={{ backgroundColor: 'var(--cafe-accent)' }}
                />

                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-black tracking-wide uppercase"
                      style={{
                        backgroundColor: 'rgba(215, 181, 109, 0.20)',
                        color: 'var(--cafe-primary)'
                      }}
                    >
                      <LuTag className="h-3 w-3" />
                      <span>{discountDisplay}</span>
                    </span>

                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--cafe-secondary)] bg-[var(--cafe-background)] px-2 py-0.5 rounded border border-[var(--cafe-border)]">
                      {offer.code}
                    </span>
                  </div>

                  <h3 className="mt-2 text-sm font-bold text-[var(--cafe-text)] line-clamp-1">
                    {offer.title || `${discountDisplay} on your order`}
                  </h3>

                  <p className="mt-0.5 text-xs text-[var(--cafe-muted)] line-clamp-2 leading-relaxed">
                    {offer.description || (offer.minOrder ? `Valid on orders above ₹${offer.minOrder}` : 'Special promotional discount')}
                  </p>
                </div>

                {/* Apply CTA */}
                <div className="mt-3 pt-2.5 border-t border-[var(--cafe-border)] flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[var(--cafe-muted)]">
                    {offer.minOrder ? `Min order ₹${offer.minOrder}` : 'No minimum spend'}
                  </span>

                  <button
                    type="button"
                    onClick={() => onApplyOffer(offer)}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-bold transition shadow-sm"
                    style={{
                      backgroundColor: isApplied ? 'var(--cafe-primary)' : 'rgba(23, 61, 50, 0.08)',
                      color: isApplied ? '#FFFFFF' : 'var(--cafe-primary)'
                    }}
                  >
                    {isApplied ? (
                      <>
                        <LuCheck className="h-3.5 w-3.5" />
                        <span>APPLIED</span>
                      </>
                    ) : (
                      <span>APPLY</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
