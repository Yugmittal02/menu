import React, { useState } from 'react';
import { LuX, LuCircleCheck, LuPrinter, LuReceipt, LuCreditCard, LuLoader, LuShieldCheck } from 'react-icons/lu';
import { createPaymentSession, verifyPaymentSession } from '../../services/api';

export default function CustomerBillModal({
  isOpen,
  session,
  cafe,
  currency = '₹',
  onClose,
  onPaymentSuccess
}) {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(session?.paymentStatus === 'paid');
  const [paymentError, setPaymentError] = useState('');

  if (!isOpen || !session) return null;

  const orders = session.orders || [];
  const subtotal = orders.reduce((s, o) => s + (o.subtotal || o.itemTotal || 0), 0);
  const discount = orders.reduce((s, o) => s + (o.discount || 0), 0);
  const tax = orders.reduce((s, o) => s + (o.taxAmount || 0), 0);
  const grandTotal = orders.reduce((s, o) => s + (o.grandTotal || o.totalAmount || 0), 0);

  const isOnlinePaymentAllowed = cafe?.orderingConfig?.allowOnlinePayment !== false;
  const isAlreadyPaid = paymentSuccess || session.paymentStatus === 'paid';

  const handlePrint = () => {
    window.print();
  };

  const handlePayOnline = async () => {
    setIsProcessingPayment(true);
    setPaymentError('');

    try {
      // 1. Create payment session with backend
      const res = await createPaymentSession({
        sessionId: session._id,
        customerDetails: {
          name: session.guestName || 'Dine-in Customer'
        }
      });

      const { paymentSessionId, providerOrderId, environment } = res.data.data;

      // 2. Load Cashfree Checkout SDK if not already loaded
      const loadCashfreeSdk = () => {
        return new Promise((resolve, reject) => {
          if (window.Cashfree) return resolve(window.Cashfree);
          const script = document.createElement('script');
          script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
          script.onload = () => resolve(window.Cashfree);
          script.onerror = () => reject(new Error('Failed to load Cashfree payment SDK'));
          document.body.appendChild(script);
        });
      };

      try {
        const CashfreeSDK = await loadCashfreeSdk();
        const cashfree = CashfreeSDK({
          mode: (environment || 'TEST').toUpperCase() === 'PROD' || (environment || 'TEST').toUpperCase() === 'PRODUCTION'
            ? 'production'
            : 'sandbox'
        });

        // 3. Open Cashfree Checkout Modal
        await cashfree.checkout({
          paymentSessionId,
          redirectTarget: '_modal'
        });

        // Polling check after modal finishes
        const verifyRes = await verifyPaymentSession(providerOrderId);
        if (verifyRes.data.data?.isPaid) {
          setPaymentSuccess(true);
          if (onPaymentSuccess) onPaymentSuccess(verifyRes.data.data);
        }
      } catch (sdkErr) {
        // Fallback for sandbox / local mock mode: verify directly
        console.warn('Cashfree SDK checkout note:', sdkErr.message);
        const verifyRes = await verifyPaymentSession(providerOrderId);
        if (verifyRes.data.data?.isPaid) {
          setPaymentSuccess(true);
          if (onPaymentSuccess) onPaymentSuccess(verifyRes.data.data);
        } else {
          setPaymentError('Payment could not be confirmed. Please check with the counter.');
        }
      }
    } catch (err) {
      setPaymentError(err.response?.data?.message || err.message || 'Payment initiation failed');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity animate-fadeIn">
      <div
        className="w-full max-w-md rounded-3xl bg-[var(--cafe-surface)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ border: '1px solid var(--cafe-border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--cafe-border)] p-4 shrink-0 bg-[var(--cafe-surface)]">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--cafe-primary)]">
            <LuReceipt className="h-4 w-4" />
            <span>Digital Dining Bill</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-[var(--cafe-muted)] hover:bg-[var(--cafe-background)] hover:text-[var(--cafe-text)] transition"
            aria-label="Close bill modal"
          >
            <LuX className="h-5 w-5" />
          </button>
        </div>

        {/* Paid Status Banner */}
        {isAlreadyPaid && (
          <div className="bg-emerald-600 text-white px-4 py-2.5 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider">
            <LuCircleCheck className="w-4 h-4" />
            <span>Bill Paid Successfully</span>
          </div>
        )}

        {paymentError && (
          <div className="bg-rose-50 border-b border-rose-200 text-rose-700 px-4 py-2 text-xs text-center font-medium">
            {paymentError}
          </div>
        )}

        {/* Thermal Bill Body */}
        <div className="flex-1 overflow-y-auto p-6 text-stone-800 space-y-4 bg-white font-sans">
          {/* Cafe Header */}
          <div className="text-center pb-3 border-b border-dashed border-stone-300">
            <h2
              className="text-xl font-bold tracking-tight text-[var(--cafe-primary)]"
              style={{ fontFamily: 'var(--cafe-font-heading)' }}
            >
              {cafe?.name || 'The Garden Café'}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">{cafe?.address || 'Civil Lines, Jaipur'}</p>
            <p className="text-xs text-stone-500">Phone: {cafe?.phone || '+91 98290 12345'}</p>
            {cafe?.taxLabel && (
              <p className="text-[11px] font-mono text-stone-400 mt-1 uppercase">
                {cafe.taxLabel} REG: 08AAACR1234F1Z5
              </p>
            )}
          </div>

          {/* Table & Session Reference */}
          <div className="flex justify-between text-xs font-mono text-stone-600 border-b border-dashed border-stone-300 pb-3">
            <div>
              <p>TABLE: <span className="font-bold text-stone-900">{session.tableNumber || 1}</span></p>
              <p>SESSION: <span className="font-bold text-stone-900">{session.sessionCode || 'SES-01'}</span></p>
            </div>
            <div className="text-right">
              <p>GUEST: <span className="font-bold text-stone-900">{session.guestName || 'Guest'}</span></p>
              <p>STATUS: <span className={`font-bold ${isAlreadyPaid ? 'text-emerald-600' : 'text-amber-600'}`}>{isAlreadyPaid ? 'PAID' : 'UNPAID'}</span></p>
            </div>
          </div>

          {/* Itemized list by Rounds */}
          <div className="space-y-3 border-b border-dashed border-stone-300 pb-3 text-xs">
            {orders.map((ord, idx) => (
              <div key={idx} className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Round {idx + 1}
                </span>
                {(ord.items || []).map((it, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="font-medium text-stone-700">
                      {it.quantity}x {it.name}
                    </span>
                    <span className="font-mono text-stone-900 font-bold">
                      {currency}{(it.price || 0) * (it.quantity || 1)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Totals Breakdown */}
          <div className="space-y-1.5 text-xs text-stone-600 pt-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono font-bold text-stone-800">{currency}{subtotal}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Discount / Offer</span>
                <span className="font-mono">- {currency}{discount}</span>
              </div>
            )}

            {tax > 0 && (
              <div className="flex justify-between">
                <span>GST (5%)</span>
                <span className="font-mono font-bold text-stone-800">{currency}{tax}</span>
              </div>
            )}

            <div className="border-t-2 border-stone-800 pt-2 flex justify-between text-base font-black text-stone-900">
              <span>GRAND TOTAL</span>
              <span className="font-mono text-[var(--cafe-primary)]">{currency}{grandTotal}</span>
            </div>
          </div>

          {/* Bill Footer Message */}
          <div className="text-center pt-3 text-[11px] text-stone-500 border-t border-dashed border-stone-300 italic">
            {cafe?.footerText || 'Thank you for dining with us! Please visit again.'}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-[var(--cafe-border)] p-4 bg-[var(--cafe-surface)] flex flex-col gap-2 shrink-0">
          {!isAlreadyPaid && isOnlinePaymentAllowed && (
            <button
              type="button"
              disabled={isProcessingPayment}
              onClick={handlePayOnline}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all"
            >
              {isProcessingPayment ? (
                <>
                  <LuLoader className="w-4 h-4 animate-spin" />
                  <span>Connecting to Gateway...</span>
                </>
              ) : (
                <>
                  <LuCreditCard className="w-4 h-4" />
                  <span>Pay Online (UPI / Card / NetBanking)</span>
                </>
              )}
            </button>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[var(--cafe-border)] bg-[var(--cafe-background)] py-2.5 text-xs font-bold text-[var(--cafe-text)] hover:bg-stone-100 transition"
            >
              <LuPrinter className="h-4 w-4" />
              <span>Print Receipt</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold text-white shadow-sm transition"
              style={{ backgroundColor: 'var(--cafe-primary)' }}
            >
              <LuCircleCheck className="h-4 w-4" />
              <span>Done</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
