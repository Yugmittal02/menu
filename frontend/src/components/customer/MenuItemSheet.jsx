import React, { useState } from 'react';
import { LuX, LuPlus, LuMinus, LuClock, LuFlame, LuSparkles } from 'react-icons/lu';

export default function MenuItemSheet({
  item,
  isOpen,
  currency = '₹',
  onClose,
  onAddToCart
}) {
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');

  if (!isOpen || !item) return null;

  const {
    name,
    description,
    price,
    image,
    isVeg = true,
    badge,
    preparationTime,
    spiceLevel = 0,
    calories
  } = item;

  const displayImage =
    image ||
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';

  const totalPrice = price * quantity;

  const handleAdd = () => {
    onAddToCart({
      ...item,
      quantity,
      specialInstructions: specialInstructions.trim()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity p-0 sm:p-4">
      <div
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-[var(--cafe-surface)] shadow-2xl transition-transform max-h-[92vh] overflow-y-auto flex flex-col"
        style={{ border: '1px solid var(--cafe-border)' }}
      >
        {/* Large Food Photography */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100 shrink-0">
          <img
            src={displayImage}
            alt={name}
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80 shadow-md"
            aria-label="Close sheet"
          >
            <LuX className="h-4 w-4" />
          </button>

          {/* Badge */}
          {badge && (
            <span
              className="absolute left-3 top-3 rounded-md px-2.5 py-1 text-xs font-black uppercase tracking-wider text-[var(--cafe-primary)] shadow-md"
              style={{ backgroundColor: 'var(--cafe-accent)' }}
            >
              {badge}
            </span>
          )}

          {/* Title & Veg Indicator over Image Bottom */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-md bg-white shadow-sm border ${
                  isVeg ? 'border-emerald-600' : 'border-amber-900'
                }`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    isVeg ? 'bg-emerald-600' : 'bg-amber-900'
                  }`}
                />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                {isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
              </span>
            </div>

            {preparationTime && (
              <div className="flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-0.5 text-xs font-semibold text-white">
                <LuClock className="h-3.5 w-3.5" />
                <span>{preparationTime} mins</span>
              </div>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 space-y-4">
          <div>
            <h2
              className="text-xl sm:text-2xl font-bold text-[var(--cafe-text)]"
              style={{ fontFamily: 'var(--cafe-font-heading)' }}
            >
              {name}
            </h2>
            <span className="mt-1 text-lg font-black text-[var(--cafe-primary)] block">
              {currency}{price}
            </span>
          </div>

          {description && (
            <p className="text-sm text-[var(--cafe-muted)] leading-relaxed">
              {description}
            </p>
          )}

          {/* Attributes tags (calories, spice) */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {calories > 0 && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--cafe-background)] px-2.5 py-1 text-xs font-medium text-[var(--cafe-secondary)]">
                <LuSparkles className="h-3 w-3 text-[var(--cafe-accent)]" />
                <span>{calories} kcal</span>
              </span>
            )}
            {spiceLevel > 0 && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--cafe-background)] px-2.5 py-1 text-xs font-medium text-amber-700">
                <LuFlame className="h-3 w-3 text-amber-600" />
                <span>{spiceLevel === 1 ? 'Mild' : spiceLevel === 2 ? 'Medium Spicy' : 'Very Spicy'}</span>
              </span>
            )}
          </div>

          {/* Special Instructions Input */}
          <div className="pt-2">
            <label
              htmlFor="special-cooking-notes"
              className="block text-xs font-bold uppercase tracking-wider text-[var(--cafe-muted)] mb-1.5"
            >
              Special Cooking Instructions (Optional)
            </label>
            <textarea
              id="special-cooking-notes"
              rows={2}
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Less spicy, dressing on the side, no onions"
              className="w-full rounded-xl border border-[var(--cafe-border)] bg-[var(--cafe-background)] p-3 text-xs text-[var(--cafe-text)] placeholder-[var(--cafe-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--cafe-primary)]/30"
            />
          </div>
        </div>

        {/* Action Footer: Stepper & Add Button */}
        <div className="border-t border-[var(--cafe-border)] p-4 bg-[var(--cafe-surface)] flex items-center justify-between gap-4 shrink-0">
          {/* Quantity Stepper */}
          <div className="flex items-center gap-3 rounded-xl border border-[var(--cafe-border)] bg-[var(--cafe-background)] p-1.5">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--cafe-primary)] disabled:opacity-30 hover:bg-white transition"
              aria-label="Decrease quantity"
            >
              <LuMinus className="h-4 w-4" />
            </button>
            <span className="w-6 text-center text-sm font-bold text-[var(--cafe-text)]">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--cafe-primary)] hover:bg-white transition"
              aria-label="Increase quantity"
            >
              <LuPlus className="h-4 w-4" />
            </button>
          </div>

          {/* Add to Cart CTA */}
          <button
            type="button"
            onClick={handleAdd}
            className="flex-1 rounded-xl py-3 px-4 text-sm font-bold text-white transition shadow-md hover:opacity-95 active:scale-98 flex items-center justify-between"
            style={{ backgroundColor: 'var(--cafe-primary)' }}
          >
            <span>Add to Order</span>
            <span>{currency}{totalPrice}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
