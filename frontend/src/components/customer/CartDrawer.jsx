import React, { useState } from 'react';
import { LuX, LuPlus, LuMinus, LuTrash2, LuTag, LuUtensils, LuArrowRight, LuCheck } from 'react-icons/lu';

export default function CartDrawer({
  isOpen,
  cart = [],
  subtotal = 0,
  discount = 0,
  taxAmount = 0,
  total = 0,
  currency = '₹',
  tableNo,
  currentRound = 1,
  appliedCoupon = null,
  availableOffers = [],
  specialNotes = '',
  isPlacingOrder = false,
  onClose,
  onUpdateQuantity,
  onApplyCoupon,
  onRemoveCoupon,
  onUpdateNotes,
  onProceedToCheckout
}) {
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  if (!isOpen) return null;

  const handleApplyCoupon = async () => {
    if (!couponCodeInput.trim()) return;
    const code = couponCodeInput.trim().toUpperCase();
    const match = availableOffers.find(
      (o) => o.code && o.code.toUpperCase() === code
    );
    if (match) {
      onApplyCoupon(match);
      setCouponError('');
      setCouponCodeInput('');
      return;
    }

    try {
      setIsApplyingCoupon(true);
      const res = await onApplyCoupon({ code });
      if (res?.error) {
        setCouponError(res.error);
      } else {
        setCouponError('');
        setCouponCodeInput('');
      }
    } catch {
      setCouponError('Invalid coupon code');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity p-0 sm:p-4">
      <div
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-[var(--cafe-surface)] shadow-2xl transition-transform max-h-[95vh] flex flex-col overflow-hidden"
        style={{ border: '1px solid var(--cafe-border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--cafe-border)] p-4 sm:p-5 shrink-0 bg-[var(--cafe-surface)]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--cafe-background)] text-[var(--cafe-primary)]">
              <LuUtensils className="h-4 w-4" />
            </div>
            <div>
              <h2
                className="text-base font-bold text-[var(--cafe-primary)] leading-tight"
                style={{ fontFamily: 'var(--cafe-font-heading)' }}
              >
                Your Dining Order
              </h2>
              <span className="text-[11px] font-semibold text-[var(--cafe-muted)] tracking-wider uppercase">
                {tableNo ? `Table ${tableNo}` : 'Table'} • Order Round {currentRound}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-[var(--cafe-muted)] hover:bg-[var(--cafe-background)] hover:text-[var(--cafe-text)] transition"
            aria-label="Close cart drawer"
          >
            <LuX className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Cart Items & Breakdown */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {cart.length === 0 ? (
            <div className="py-12 text-center text-[var(--cafe-muted)]">
              <p className="font-semibold text-sm">Your order basket is currently empty.</p>
              <p className="text-xs mt-1">Browse our menu and add your favorite dishes.</p>
            </div>
          ) : (
            <>
              {/* Item List */}
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.menuItemId}
                    className="flex items-start justify-between gap-3 rounded-xl border border-[var(--cafe-border)] bg-[var(--cafe-background)]/60 p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-[var(--cafe-text)] truncate">
                        {item.name}
                      </h3>
                      <span className="text-xs font-bold text-[var(--cafe-primary)]">
                        {currency}{item.price * item.quantity}
                      </span>
                      {item.specialInstructions && (
                        <p className="text-[10px] text-[var(--cafe-secondary)] italic mt-0.5 truncate">
                          "{item.specialInstructions}"
                        </p>
                      )}
                    </div>

                    {/* Stepper & Trash */}
                    <div className="flex items-center gap-1.5 shrink-0 bg-white rounded-lg border border-[var(--cafe-border)] p-1 shadow-sm">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.menuItemId, -1)}
                        className="flex h-6 w-6 items-center justify-center rounded hover:bg-stone-100 text-[var(--cafe-primary)] transition"
                        aria-label="Decrease quantity"
                      >
                        {item.quantity === 1 ? (
                          <LuTrash2 className="h-3 w-3 text-rose-500" />
                        ) : (
                          <LuMinus className="h-3 w-3" />
                        )}
                      </button>

                      <span className="w-5 text-center text-xs font-bold text-[var(--cafe-text)]">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.menuItemId, 1)}
                        className="flex h-6 w-6 items-center justify-center rounded hover:bg-stone-100 text-[var(--cafe-primary)] transition"
                        aria-label="Increase quantity"
                      >
                        <LuPlus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Section */}
              <div className="rounded-xl border border-[var(--cafe-border)] bg-[var(--cafe-surface)] p-3.5 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--cafe-primary)]">
                  <LuTag className="h-3.5 w-3.5" />
                  <span>Offers & Coupons</span>
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between rounded-lg bg-[var(--cafe-primary)]/10 p-2.5 border border-[var(--cafe-primary)]/20">
                    <div>
                      <span className="text-xs font-bold text-[var(--cafe-primary)] block">
                        Code: {appliedCoupon.code}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700">
                        ₹{discount} savings applied to your order!
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={onRemoveCoupon}
                      className="text-xs font-bold text-rose-600 hover:underline px-2"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="ENTER COUPON CODE"
                      value={couponCodeInput}
                      onChange={(e) => {
                        setCouponCodeInput(e.target.value.toUpperCase());
                        setCouponError('');
                      }}
                      className="flex-1 rounded-lg border border-[var(--cafe-border)] bg-[var(--cafe-background)] px-3 py-2 text-xs font-mono font-bold uppercase placeholder-[var(--cafe-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--cafe-primary)]/30"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon}
                      className="rounded-lg px-4 py-2 text-xs font-bold text-white shadow-sm transition disabled:opacity-50"
                      style={{ backgroundColor: 'var(--cafe-primary)' }}
                    >
                      {isApplyingCoupon ? 'APPLYING...' : 'APPLY'}
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="text-[11px] font-medium text-rose-600">{couponError}</p>
                )}
              </div>

              {/* Special Cooking Notes for this Round */}
              <div>
                <label
                  htmlFor="cart-order-notes"
                  className="block text-[11px] font-bold uppercase tracking-wider text-[var(--cafe-muted)] mb-1"
                >
                  Table Notes / Special Instructions
                </label>
                <textarea
                  id="cart-order-notes"
                  rows={2}
                  value={specialNotes}
                  onChange={(e) => onUpdateNotes(e.target.value)}
                  placeholder="e.g. Please bring water first, separate plates"
                  className="w-full rounded-xl border border-[var(--cafe-border)] bg-[var(--cafe-background)] p-2.5 text-xs text-[var(--cafe-text)] placeholder-[var(--cafe-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--cafe-primary)]/30"
                />
              </div>

              {/* Bill Breakdown */}
              <div className="rounded-xl border border-[var(--cafe-border)] bg-[var(--cafe-background)]/50 p-3.5 space-y-2 text-xs text-[var(--cafe-muted)]">
                <div className="flex justify-between">
                  <span>Item Subtotal</span>
                  <span className="font-semibold text-[var(--cafe-text)]">{currency}{subtotal}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Coupon Discount</span>
                    <span>- {currency}{discount}</span>
                  </div>
                )}

                {taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Taxes & GST (5%)</span>
                    <span className="font-semibold text-[var(--cafe-text)]">{currency}{taxAmount}</span>
                  </div>
                )}

                <div className="border-t border-[var(--cafe-border)] pt-2 flex justify-between text-sm font-black text-[var(--cafe-primary)]">
                  <span>Grand Total</span>
                  <span>{currency}{total}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Place Order CTA */}
        {cart.length > 0 && (
          <div className="border-t border-[var(--cafe-border)] p-4 bg-[var(--cafe-surface)] shrink-0">
            <button
              id="cart-proceed-btn"
              type="button"
              disabled={isPlacingOrder}
              onClick={onProceedToCheckout}
              className="w-full flex items-center justify-between rounded-xl py-3.5 px-5 text-sm font-bold text-white shadow-lg transition active:scale-[0.99] hover:opacity-95 disabled:opacity-60 cursor-pointer"
              style={{ backgroundColor: 'var(--cafe-primary)' }}
            >
              <span>
                {isPlacingOrder
                  ? 'Sending to Kitchen...'
                  : `Place Order (Round ${currentRound})`}
              </span>
              <div className="flex items-center gap-1.5 font-black">
                <span>{currency}{total}</span>
                <LuArrowRight className="h-4 w-4" />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
