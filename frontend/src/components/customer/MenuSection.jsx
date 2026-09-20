import React from 'react';
import MenuCard from './MenuCard';

export default function MenuSection({
  category,
  title,
  count,
  items = [],
  cartMap = {},
  currency = '₹',
  favorites = new Set(),
  onToggleFavorite,
  onAddToCart,
  onUpdateQuantity,
  onOpenDetail,
  children
}) {
  const displayTitle = title || category || 'Specialties';
  const displayCount = count !== undefined ? count : items.length;

  return (
    <section
      id={`category-${displayTitle.toLowerCase().replace(/\s+/g, '-')}`}
      className="py-2"
    >
      {/* Category Section Header */}
      <div className="mb-3.5 flex items-center justify-between border-b border-[var(--cafe-border,#E7E0D3)] pb-2">
        <h2
          className="text-lg sm:text-xl font-bold tracking-tight text-[var(--cafe-primary,#173D32)] font-serif"
          style={{ fontFamily: 'var(--cafe-font-heading, "Playfair Display", serif)' }}
        >
          {displayTitle}
        </h2>
        {displayCount > 0 && (
          <span className="text-xs font-semibold text-[var(--cafe-muted,#6A746B)]">
            {displayCount} {displayCount === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>

      {/* Render children or internal grid */}
      {children ? (
        children
      ) : (
        <div className="space-y-3.5 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
          {items.map((item) => (
            <MenuCard
              key={item._id}
              item={item}
              cartQuantity={cartMap[item._id] || 0}
              currency={currency}
              isFavorite={favorites.has ? favorites.has(item._id) : false}
              onToggleFavorite={onToggleFavorite}
              onAddToCart={onAddToCart}
              onUpdateQuantity={onUpdateQuantity}
              onOpenDetail={onOpenDetail}
            />
          ))}
        </div>
      )}
    </section>
  );
}
