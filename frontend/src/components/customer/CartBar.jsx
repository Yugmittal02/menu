import React from 'react';
import { LuShoppingBag, LuArrowRight } from 'react-icons/lu';

export default function CartBar({
  itemCount = 0,
  total = 0,
  currency = '₹',
  onOpenCart,
  onClick
}) {
  if (itemCount <= 0) return null;

  const handleOpen = onOpenCart || onClick;

  return (
    <aside
      aria-label="Shopping cart summary"
      className="fixed bottom-0 left-0 right-0 z-30 p-3 pb-[calc(12px+env(safe-area-inset-bottom))] transition-transform duration-300 animate-slide-up"
    >
      <div className="mx-auto max-w-lg">
        <button
          id="cart-bar-btn"
          type="button"
          onClick={handleOpen}
          className="w-full flex items-center justify-between rounded-2xl px-5 py-3.5 text-white shadow-xl transition-transform active:scale-[0.99] hover:opacity-95 cursor-pointer"
          style={{
            backgroundColor: 'var(--cafe-primary)',
            boxShadow: '0 8px 24px -4px rgba(23, 61, 50, 0.45)'
          }}
        >
          {/* Left: Count & Running Total */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md text-white">
              <LuShoppingBag className="h-4 w-4" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                {itemCount} {itemCount === 1 ? 'ITEM' : 'ITEMS'}
              </span>
              <span className="text-base font-black tracking-tight text-white">
                {currency}{total}
              </span>
            </div>
          </div>

          {/* Right: Action CTA */}
          <div className="flex items-center gap-2 font-extrabold text-xs tracking-wider uppercase text-white bg-white/15 backdrop-blur-md px-3.5 py-2 rounded-xl">
            <span>View Cart</span>
            <LuArrowRight className="h-3.5 w-3.5" />
          </div>
        </button>
      </div>
    </aside>
  );
}
