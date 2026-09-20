import React, { useState, useEffect } from "react";
import {
  LuX,
  LuReceipt,
  LuPrinter,
  LuBanknote,
  LuCreditCard,
  LuQrCode,
  LuCircleCheck,
  LuClock,
  LuUsers,
  LuIndianRupee
} from "react-icons/lu";

export default function BillingDrawer({
  isOpen,
  session,
  cafe,
  onClose,
  onMoveToBilling,
  onCloseSession,
  onViewInvoice
}) {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discountInput, setDiscountInput] = useState(session?.discount || 0);
  const [notes, setNotes] = useState(session?.notes || "");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session) {
      setDiscountInput(session.discount || 0);
      setPaymentMethod(session.paymentMethod || "cash");
      setNotes(session.notes || "");
    }
  }, [session]);

  if (!isOpen || !session) return null;

  const currency = cafe?.currency || "₹";
  const taxPercent = cafe?.taxPercent || 0;
  const taxLabel = cafe?.taxLabel || "GST";

  // Calculate live numbers
  const validOrders = (session.orders || []).filter((o) => o.status !== "cancelled");
  const subtotal = validOrders.reduce((sum, o) => sum + (o.subtotal || o.totalAmount || 0), 0);
  const discount = Math.min(subtotal, Math.max(0, parseFloat(discountInput) || 0));
  const taxable = Math.max(0, subtotal - discount);
  const taxAmount = Math.round((taxable * taxPercent) / 100);
  const grandTotal = taxable + taxAmount;

  // Session duration
  const startTime = new Date(session.openedAt);
  const minutesActive = Math.max(0, Math.floor((new Date() - startTime) / 60000));

  const handleSettle = async () => {
    setSubmitting(true);
    try {
      await onCloseSession(session._id, {
        paymentMethod,
        discount,
        notes
      });
      onClose();
    } catch (err) {
      console.error("Settle session error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyBilling = async () => {
    setSubmitting(true);
    try {
      await onMoveToBilling(session._id, { discount });
    } catch (err) {
      console.error("Move to billing error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="w-full max-w-lg bg-[#0f0f1b] border-l border-white/10 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-white/10 bg-[#151525] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-black text-lg">
              T{session.tableNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Table {session.tableNumber} Billing</h3>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                  session.status === 'billing'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}>
                  {session.status}
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                <span>Code: <span className="font-mono text-slate-300">{session.sessionCode}</span></span>
                <span className="flex items-center gap-1"><LuClock className="w-3 h-3" /> {minutesActive}m</span>
                <span className="flex items-center gap-1"><LuUsers className="w-3 h-3" /> {session.pax} pax</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <LuX className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Customer info card */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs">
            <div>
              <div className="text-slate-400 font-medium">Customer</div>
              <div className="font-semibold text-white mt-0.5">{session.customerName || "Guest"}</div>
            </div>
            {session.customerPhone && (
              <div className="text-right">
                <div className="text-slate-400 font-medium">Contact</div>
                <div className="font-mono text-slate-300 mt-0.5">{session.customerPhone}</div>
              </div>
            )}
          </div>

          {/* Orders Breakdown */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
              <span>Orders ({validOrders.length})</span>
              <span className="text-[11px] text-slate-500 font-mono">Consolidated View</span>
            </div>
            <div className="space-y-3">
              {validOrders.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs italic bg-white/[0.02] rounded-xl border border-white/5">
                  No active orders recorded for this session yet.
                </div>
              ) : (
                validOrders.map((ord, idx) => (
                  <div
                    key={ord._id || idx}
                    className="p-3.5 rounded-xl bg-[#151525] border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs pb-2 mb-2 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-mono">{ord.orderNumber}</span>
                        {ord.kotNumber && (
                          <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-800/40">
                            {ord.kotNumber}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] uppercase font-semibold text-amber-300/80 px-2 py-0.5 rounded bg-amber-500/10">
                        {ord.status}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {(ord.items || []).map((it, itemIdx) => (
                        <div key={itemIdx} className="flex items-center justify-between text-xs">
                          <span className="text-slate-300">
                            <span className="font-bold text-white mr-1.5">×{it.quantity}</span>
                            {it.name}
                          </span>
                          <span className="font-mono text-slate-400">
                            {currency}{it.price * it.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bill Calculation Card */}
          <div className="p-4 rounded-xl bg-gradient-to-b from-[#18182a] to-[#121220] border border-white/10 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span>Subtotal:</span>
              <span className="font-mono font-medium">{currency}{subtotal}</span>
            </div>

            {/* Discount input */}
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/5">
              <span className="text-slate-300">Discount ({currency}):</span>
              <div className="w-28">
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  className="w-full text-right px-2.5 py-1 rounded bg-[#0b0b14] border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-violet-500"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Tax */}
            {taxPercent > 0 && (
              <div className="flex items-center justify-between text-slate-300">
                <span>{taxLabel} ({taxPercent}%):</span>
                <span className="font-mono font-medium">{currency}{taxAmount}</span>
              </div>
            )}

            {/* Grand Total */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-base font-black text-white">
              <span className="tracking-wide uppercase">Final Total:</span>
              <span className="text-xl font-mono text-emerald-400">{currency}{grandTotal}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Select Settlement Mode
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: "cash", label: "Cash", icon: LuBanknote },
                { id: "upi", label: "UPI / QR", icon: LuQrCode },
                { id: "card", label: "Card", icon: LuCreditCard },
              ].map((mode) => {
                const Icon = mode.icon;
                const isSelected = paymentMethod === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setPaymentMethod(mode.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-violet-600/20 border-violet-500 text-white shadow-lg shadow-violet-600/20 font-bold"
                        : "bg-[#151525] border-white/5 text-slate-400 hover:text-white hover:border-white/15"
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? "text-violet-400" : ""}`} />
                    <span className="text-xs">{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Settlement / Bill Remarks (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Split cash 300, UPI 200"
              className="w-full px-3 py-2 rounded-xl bg-[#151525] border border-white/10 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-white/10 bg-[#151525] flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5">
            {session.status === "active" && (
              <button
                type="button"
                onClick={handleApplyBilling}
                disabled={submitting || validOrders.length === 0}
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                Move to Billing
              </button>
            )}

            <button
              type="button"
              onClick={() => onViewInvoice(session._id)}
              disabled={validOrders.length === 0}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <LuPrinter className="w-3.5 h-3.5" />
              Print Invoice
            </button>
          </div>

          <button
            type="button"
            onClick={handleSettle}
            disabled={submitting || validOrders.length === 0}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-900/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <LuCircleCheck className="w-4 h-4" />
            {submitting ? "Settling..." : `Complete & Settle (${currency}${grandTotal})`}
          </button>
        </div>
      </div>
    </div>
  );
}
