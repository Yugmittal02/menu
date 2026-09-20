import React from 'react';
import {
  LuClock,
  LuCircleCheck,
  LuCookingPot,
  LuConciergeBell,
  LuUtensils,
  LuPlus,
  LuReceipt,
  LuRefreshCw,
  LuSparkles
} from 'react-icons/lu';

export default function OrderStatusView({
  session,
  cafe,
  tableNo,
  currency = '₹',
  orderMode = 'dine-in',
  pickupToken = '',
  onOrderMore,
  onRequestBill,
  onRefresh
}) {
  const orders = session?.orders || [];
  const latestOrder = orders.length > 0 ? orders[orders.length - 1] : null;

  // Status mapping
  const STATUS_STEPS = [
    { key: 'pending', label: 'Received', icon: LuClock },
    { key: 'confirmed', label: 'Confirmed', icon: LuCircleCheck },
    { key: 'preparing', label: 'Preparing', icon: LuCookingPot },
    { key: 'ready', label: 'Ready', icon: LuSparkles },
    { key: 'served', label: 'Served', icon: LuConciergeBell }
  ];

  const currentStatus = (latestOrder?.status || 'pending').toLowerCase();
  const getStepIndex = (status) => {
    switch (status) {
      case 'pending':
        return 0;
      case 'confirmed':
        return 1;
      case 'preparing':
        return 2;
      case 'ready':
        return 3;
      case 'served':
      case 'completed':
        return 4;
      default:
        return 0;
    }
  };

  const activeStepIdx = getStepIndex(currentStatus);

  // Total amount across all rounds
  const grandTotal = orders.reduce((sum, o) => sum + (o.grandTotal || o.totalAmount || 0), 0);

  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:px-6 space-y-6">
      {/* Table Session Banner */}
      <div
        className="rounded-3xl p-6 text-white shadow-xl relative overflow-hidden"
        style={{
          backgroundColor: 'var(--cafe-primary)',
          boxShadow: '0 10px 30px -5px rgba(23, 61, 50, 0.4)'
        }}
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            {orderMode === 'takeaway' || pickupToken ? (
              <span className="rounded-full bg-amber-400 text-slate-950 font-black px-3 py-1 text-xs uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                <span>Pickup Token:</span>
                <span className="font-mono text-sm tracking-widest">{pickupToken || 'TKW'}</span>
              </span>
            ) : (
              <span className="rounded-full bg-white/15 backdrop-blur-md px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                {tableNo ? `Table ${tableNo} • Live Dining` : 'Live Dining'}
              </span>
            )}
            <button
              type="button"
              onClick={onRefresh}
              className="flex items-center gap-1 text-xs font-semibold text-white/80 hover:text-white transition"
              title="Refresh order status"
            >
              <LuRefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          <h2
            className="mt-3 text-2xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--cafe-font-heading)' }}
          >
            {cafe?.name || 'The Garden Café'}
          </h2>

          <p className="mt-1 text-xs text-white/80 font-medium">
            Your order is with our kitchen team. Relax and enjoy your time.
          </p>

          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs font-medium text-white/90">
            <span>Running Bill ({orders.length} {orders.length === 1 ? 'Round' : 'Rounds'})</span>
            <span className="text-base font-black text-white">{currency}{grandTotal}</span>
          </div>
        </div>

        {/* Botanical watermark */}
        <div
          className="pointer-events-none absolute right-0 bottom-0 h-40 w-40 translate-x-10 translate-y-10 opacity-10"
          aria-hidden="true"
        >
          <svg viewBox="0 0 100 100" fill="currentColor" className="text-white">
            <circle cx="50" cy="50" r="40" />
          </svg>
        </div>
      </div>

      {/* Live Timeline Tracker */}
      <div className="rounded-3xl border border-[var(--cafe-border)] bg-[var(--cafe-surface)] p-5 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--cafe-muted)] mb-4">
          Current Order Status (Latest Round)
        </h3>

        <div className="flex items-center justify-between relative">
          {/* Connector Line */}
          <div
            className="absolute left-4 right-4 top-4 h-0.5 -translate-y-1/2 bg-[var(--cafe-border)] z-0"
            aria-hidden="true"
          />

          {STATUS_STEPS.map((step, idx) => {
            const isCompleted = idx <= activeStepIdx;
            const isCurrent = idx === activeStepIdx;
            const Icon = step.icon;

            return (
              <div key={step.key} className="relative z-10 flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${
                    isCompleted
                      ? 'bg-[var(--cafe-primary)] text-white shadow-md'
                      : 'bg-[var(--cafe-background)] text-[var(--cafe-muted)] border border-[var(--cafe-border)]'
                  } ${isCurrent ? 'ring-4 ring-[var(--cafe-primary)]/20 scale-110' : ''}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span
                  className={`mt-2 text-[10px] font-bold uppercase tracking-wider ${
                    isCompleted ? 'text-[var(--cafe-primary)]' : 'text-[var(--cafe-muted)]'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Rounds Summary List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--cafe-muted)] px-1">
          Items Ordered During Your Visit
        </h3>

        {orders.map((order, roundIdx) => (
          <div
            key={order._id || roundIdx}
            className="rounded-2xl border border-[var(--cafe-border)] bg-[var(--cafe-surface)] p-4 shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-[var(--cafe-border)] pb-2 mb-3">
              <span className="text-xs font-bold text-[var(--cafe-primary)]">
                Round {roundIdx + 1} • {order.orderNumber || `ORD-${roundIdx + 1}`}
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                style={{
                  backgroundColor: 'rgba(23, 61, 50, 0.08)',
                  color: 'var(--cafe-primary)'
                }}
              >
                {order.status || 'Pending'}
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              {(order.items || []).map((it, i) => (
                <div key={i} className="flex justify-between text-[var(--cafe-text)]">
                  <span>
                    {it.quantity}x {it.name}
                  </span>
                  <span className="font-semibold text-[var(--cafe-primary)]">
                    {currency}{(it.price || 0) * (it.quantity || 1)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-2 border-t border-[var(--cafe-border)] flex justify-between text-xs font-bold text-[var(--cafe-text)]">
              <span className="text-[var(--cafe-muted)]">Round Total</span>
              <span>{currency}{order.grandTotal || order.totalAmount || 0}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Takeaway Pickup Guidance Card */}
      {(orderMode === 'takeaway' || pickupToken) && (
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-center">
          <p className="text-xs font-bold text-amber-900">
            Pickup at Counter with Token #{pickupToken || 'TKW'}
          </p>
          <p className="text-[11px] text-amber-800/80 mt-1">
            Please show this token and collect your fresh order at the counter.
          </p>
        </div>
      )}

      {/* Dual Actions: Order More & Request Bill */}
      <div className={orderMode === 'takeaway' ? 'space-y-3 pt-2' : 'grid grid-cols-2 gap-3 pt-2'}>
        <button
          type="button"
          onClick={onOrderMore}
          className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 px-4 text-xs font-bold text-[var(--cafe-primary)] border-2 border-[var(--cafe-primary)] bg-[var(--cafe-surface)] shadow-sm hover:bg-[var(--cafe-primary)] hover:text-white transition active:scale-[0.99] min-h-[44px]"
        >
          <LuPlus className="h-4 w-4" />
          <span>{orderMode === 'takeaway' ? 'Add More Items' : 'Order More Items'}</span>
        </button>

        {orderMode !== 'takeaway' && (
          <button
            type="button"
            onClick={onRequestBill}
            className="flex items-center justify-center gap-2 rounded-2xl py-3.5 px-4 text-xs font-bold text-white shadow-md transition hover:opacity-95 active:scale-[0.99] min-h-[44px]"
            style={{ backgroundColor: 'var(--cafe-primary)' }}
          >
            <LuReceipt className="h-4 w-4" />
            <span>Request Final Bill</span>
          </button>
        )}
      </div>
    </div>
  );
}
