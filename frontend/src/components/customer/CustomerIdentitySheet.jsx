import React, { useState } from 'react';
import { LuX, LuUser, LuPhone, LuUtensils, LuShieldCheck } from 'react-icons/lu';

export default function CustomerIdentitySheet({
  isOpen,
  initialName = '',
  initialPhone = '',
  tableNo,
  isPlacingOrder = false,
  onClose,
  onSubmit
}) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone && cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number or leave blank');
      return;
    }

    setError('');
    onSubmit({ name: name.trim(), phone: cleanPhone });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 transition-opacity">
      <div
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[var(--cafe-surface)] p-6 shadow-2xl transition-transform"
        style={{ border: '1px solid var(--cafe-border)' }}
      >
        <div className="flex items-start justify-between border-b border-[var(--cafe-border)] pb-3">
          <div>
            <h2
              className="text-lg font-bold text-[var(--cafe-primary)]"
              style={{ fontFamily: 'var(--cafe-font-heading)' }}
            >
              Guest Details
            </h2>
            <p className="text-xs text-[var(--cafe-muted)] tracking-wide">
              {tableNo ? `Table ${tableNo} • ` : ''}Required for kitchen order delivery & live tracking
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-[var(--cafe-muted)] hover:bg-[var(--cafe-background)] hover:text-[var(--cafe-text)] transition"
            aria-label="Close modal"
          >
            <LuX className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label
              htmlFor="guest-name"
              className="block text-[11px] font-bold uppercase tracking-wider text-[var(--cafe-muted)] mb-1"
            >
              Your Name *
            </label>
            <div className="relative flex items-center">
              <LuUser className="absolute left-3.5 h-4 w-4 text-[var(--cafe-muted)]" />
              <input
                id="guest-name"
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="Enter your name"
                className="w-full rounded-xl border border-[var(--cafe-border)] bg-[var(--cafe-background)] py-2.5 pl-10 pr-3 text-sm text-[var(--cafe-text)] placeholder-[var(--cafe-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--cafe-primary)]/30"
              />
            </div>
          </div>

          {/* Mobile Number */}
          <div>
            <label
              htmlFor="guest-phone"
              className="block text-[11px] font-bold uppercase tracking-wider text-[var(--cafe-muted)] mb-1"
            >
              Mobile Number (Optional)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-xs font-bold text-[var(--cafe-muted)]">+91</span>
              <input
                id="guest-phone"
                type="tel"
                required={false}
                maxLength={10}
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setError('');
                }}
                placeholder="9876543210"
                className="w-full rounded-xl border border-[var(--cafe-border)] bg-[var(--cafe-background)] py-2.5 pl-12 pr-3 text-sm font-mono text-[var(--cafe-text)] placeholder-[var(--cafe-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--cafe-primary)]/30"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-[var(--cafe-muted)] pt-1">
            <LuShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Saved securely for this visit so you only enter it once.</span>
          </div>

          <button
            id="confirm-guest-btn"
            type="submit"
            disabled={isPlacingOrder}
            className="w-full rounded-xl py-3 text-sm font-bold text-white shadow-md transition hover:opacity-95 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            style={{ backgroundColor: 'var(--cafe-primary)' }}
          >
            {isPlacingOrder ? 'Sending to Kitchen...' : 'Confirm & Send to Kitchen'}
          </button>
        </form>
      </div>
    </div>
  );
}
