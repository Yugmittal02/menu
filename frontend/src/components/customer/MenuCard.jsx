import React from 'react';
import { LuPlus, LuMinus, LuHeart, LuClock } from 'react-icons/lu';

export default function MenuCard({
  item,
  cartQuantity = 0,
  currency = '₹',
  isFavorite = false,
  onToggleFavorite,
  onAddToCart,
  onUpdateQuantity,
  onOpenDetail
}) {
  const {
    _id,
    name,
    description,
    price,
    image,
    isVeg = true,
    badge,
    preparationTime,
    isAvailable = true
  } = item;

  // Placeholder food image if missing
  const displayImage =
    image ||
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';

  return (
    <article
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[var(--cafe-surface)] border border-[var(--cafe-border)] shadow-[0_2px_14px_rgba(23,61,50,0.04)] transition-all hover:shadow-[0_6px_20px_rgba(23,61,50,0.08)]"
      style={{ opacity: isAvailable ? 1 : 0.6 }}
    >
      {/* Clickable Card Body */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => isAvailable && onOpenDetail(item)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            isAvailable && onOpenDetail(item);
          }
        }}
        className="cursor-pointer focus:outline-none"
      >
        {/* Large Food Photography */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
          <img
            src={displayImage}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src =
                'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';
            }}
          />

          {/* Gradient protection scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

          {/* Top Left: Veg Indicator & Badge */}
          <div className="absolute left-3 top-3 flex items-center gap-1.5">
            {/* Veg / Non-Veg Marker */}
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-md bg-white shadow-sm border ${
                isVeg ? 'border-emerald-600' : 'border-amber-900'
              }`}
              title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isVeg ? 'bg-emerald-600' : 'bg-amber-900'
                }`}
              />
            </div>

            {/* Special Badge (e.g. Bestseller, Chef's Pick) */}
            {badge && (
              <span
                className="rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider shadow-sm text-[var(--cafe-primary)]"
                style={{
                  backgroundColor: 'var(--cafe-accent)',
                  color: '#18211D'
                }}
              >
                {badge}
              </span>
            )}
          </div>

          {/* Top Right: Favorite Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(_id);
            }}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-stone-600 transition hover:bg-white hover:text-rose-500 shadow-sm"
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <LuHeart
              className={`h-4 w-4 transition-colors ${
                isFavorite ? 'fill-rose-500 text-rose-500' : 'text-stone-600'
              }`}
            />
          </button>

          {/* Bottom Left on Image: Preparation Time */}
          {preparationTime && (
            <div className="absolute bottom-2.5 left-3 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-semibold text-white/90">
              <LuClock className="h-3 w-3" />
              <span>{preparationTime} mins</span>
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="p-3.5">
          <h3
            className="text-base font-bold text-[var(--cafe-text)] leading-snug line-clamp-2 group-hover:text-[var(--cafe-primary)] transition-colors"
            style={{ fontFamily: 'var(--cafe-font-heading)' }}
            title={name}
          >
            {name}
          </h3>

          {description && (
            <p className="mt-1 text-xs text-[var(--cafe-muted)] line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Footer: Price & Add / Quantity Stepper */}
      <div className="flex items-center justify-between border-t border-[var(--cafe-border)] px-3.5 py-3 mt-auto bg-[var(--cafe-surface)]">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--cafe-muted)]">Price</span>
          <span className="text-base font-black text-[var(--cafe-primary)]">
            {currency}{price}
          </span>
        </div>

        <div>
          {!isAvailable ? (
            <span className="rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-bold text-stone-400">
              Sold Out
            </span>
          ) : cartQuantity > 0 ? (
            /* Quantity Stepper when item is in cart */
            <div
              className="flex items-center gap-1.5 rounded-xl p-1 shadow-sm text-white"
              style={{ backgroundColor: 'var(--cafe-primary)' }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateQuantity(-1);
                }}
                className="flex h-8 w-8 min-h-[32px] min-w-[32px] items-center justify-center rounded-lg hover:bg-black/20 transition active:scale-95 cursor-pointer"
                aria-label="Decrease quantity"
              >
                <LuMinus className="h-3.5 w-3.5" />
              </button>

              <span className="w-6 text-center font-bold text-xs">{cartQuantity}</span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateQuantity(1);
                }}
                className="flex h-8 w-8 min-h-[32px] min-w-[32px] items-center justify-center rounded-lg hover:bg-black/20 transition active:scale-95 cursor-pointer"
                aria-label="Increase quantity"
              >
                <LuPlus className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            /* Primary Add Button */
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(item);
              }}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 min-h-[38px] text-xs font-bold text-white shadow-sm transition active:scale-95 hover:opacity-95 cursor-pointer"
              style={{ backgroundColor: 'var(--cafe-primary)' }}
            >
              <LuPlus className="h-3.5 w-3.5" />
              <span>ADD</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
