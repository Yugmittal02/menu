import React, { useState, useMemo } from 'react';
import {
  FiClock,
  FiCheck,
  FiX,
  FiCopy,
  FiBellOff,
  FiAlertTriangle
} from 'react-icons/fi';
import { LuPrinter, LuReceipt } from 'react-icons/lu';
import StatusBadge from '../ui/StatusBadge';
import DataToolbar from '../ui/DataToolbar';
import EmptyState from '../ui/EmptyState';

const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(date).toLocaleDateString();
};

const OrdersTab = ({
  orders = [],
  stats = {},
  orderSearch,
  onOrderSearchChange,
  dateFilter,
  onDateFilterChange,
  orderFilter,
  onOrderFilterChange,
  paymentFilter,
  onPaymentFilterChange,
  sourceFilter = 'all',
  onSourceFilterChange,
  typeFilter = 'all',
  onTypeFilterChange,
  onShowKotModal,
  onShowInvoiceModal,
  onStatusUpdate,
  onMarkPaid,
  payingOrderId,
  setPayingOrderId,
  silencedOrders,
  onSilenceOrder,
  elapsedTimer,
  tick,
  onTabChange
}) => {
  const [copiedId, setCopiedId] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'

  const copyOrderNum = (num) => {
    navigator.clipboard.writeText(num);
    setCopiedId(num);
    setTimeout(() => setCopiedId(''), 1500);
  };

  // Filter orders by search, source, and type
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (sourceFilter !== 'all' && (o.orderSource || 'qr') !== sourceFilter) return false;
      if (typeFilter !== 'all' && (o.orderType || 'dine-in') !== typeFilter) return false;
      if (!orderSearch) return true;
      const q = orderSearch.toLowerCase();
      return (
        (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
        (o.kotNumber && o.kotNumber.toLowerCase().includes(q)) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        String(o.tableNumber).includes(q)
      );
    });
  }, [orders, orderSearch, sourceFilter, typeFilter]);

  // Counts for status options
  const statusOptions = useMemo(() => {
    return [
      { value: 'all', label: 'All Orders', count: stats.totalOrders ?? orders.length },
      { value: 'pending', label: 'Pending', count: stats.pendingOrders ?? 0 },
      { value: 'confirmed', label: 'Preparing', count: stats.preparingOrders ?? 0 },
      { value: 'ready', label: 'Ready' },
      { value: 'completed', label: 'Completed', count: stats.completedOrders ?? 0 },
      { value: 'cancelled', label: 'Cancelled' }
    ];
  }, [stats, orders.length]);

  const paymentOptions = [
    { value: 'all', label: 'All Payments' },
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'paid', label: 'Paid' }
  ];

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Unified Filter Toolbar */}
      <div data-tour="orders-filter-bar">
        <DataToolbar
        search={orderSearch}
        onSearchChange={onOrderSearchChange}
        searchPlaceholder="Search order #, KOT #, customer, table..."
        dateFilter={dateFilter}
        onDateFilterChange={onDateFilterChange}
        statusFilter={orderFilter}
        onStatusFilterChange={onOrderFilterChange}
        statusOptions={statusOptions}
        paymentFilter={paymentFilter}
        onPaymentFilterChange={onPaymentFilterChange}
        paymentOptions={paymentOptions}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      </div>

      {/* Source & Type Filter Pills */}
      <div className="flex items-center justify-between gap-4 flex-wrap px-1">
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Source:</span>
          {[
            { id: 'all', label: 'All Sources' },
            { id: 'qr', label: '📱 QR Scan' },
            { id: 'counter', label: '💻 Counter POS' },
            { id: 'takeaway', label: '🛍️ Takeaway' }
          ].map((src) => (
            <button
              key={src.id}
              onClick={() => onSourceFilterChange && onSourceFilterChange(src.id)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                sourceFilter === src.id
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {src.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Type:</span>
          {[
            { id: 'all', label: 'All Types' },
            { id: 'dine-in', label: 'Dine-In' },
            { id: 'takeaway', label: 'Takeaway' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => onTypeFilterChange && onTypeFilterChange(t.id)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                typeFilter === t.id
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Order Content: Cards or Table */}
      {filteredOrders.length === 0 ? (
        <EmptyState
          emoji="📋"
          title="No orders found"
          description={
            orderSearch || orderFilter !== 'all' || paymentFilter !== 'all'
              ? 'No orders match your active filter criteria. Try resetting your search or filter.'
              : 'New customer orders placed from table QR codes will appear here automatically.'
          }
          actionText="View QR Tables"
          onAction={() => onTabChange('QR')}
          secondaryActionText="Preview Menu"
          onSecondaryAction={() => onTabChange('Menu')}
        />
      ) : viewMode === 'table' ? (
        /* Table View */
        <div
          className="rounded-2xl overflow-hidden border border-white/[0.07]"
          style={{ backgroundColor: '#11111D' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr
                  className="border-b border-white/[0.07] text-[11px] font-semibold uppercase tracking-wider text-[#8E8EA8]"
                  style={{ backgroundColor: '#151523' }}
                >
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Time & Table</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredOrders.map((order) => {
                  const elapsedMs = Date.now() - new Date(order.createdAt).getTime();
                  const isLate = order.status === 'pending' && elapsedMs >= 60 * 1000;
                  const isSilenced = silencedOrders.has(order._id);

                  return (
                    <tr
                      key={order._id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => copyOrderNum(order.orderNumber)}
                            className="inline-flex items-center gap-1.5 hover:text-[#A78BFA]"
                            title="Click to copy order #"
                          >
                            {order.orderNumber}
                            {copiedId === order.orderNumber ? (
                              <FiCheck className="text-[#10B981]" size={12} />
                            ) : (
                              <FiCopy className="text-[#707089]" size={11} />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {order.orderSource && (
                            <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                              order.orderSource === 'qr'
                                ? 'bg-violet-500/20 text-violet-300'
                                : order.orderSource === 'takeaway'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-cyan-500/20 text-cyan-300'
                            }`}>
                              {order.orderSource}
                            </span>
                          )}
                          {order.kotNumber && (
                            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 px-1 py-0.2 rounded border border-emerald-800/30">
                              {order.kotNumber}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-white font-medium">
                          {order.tableNumber > 0 ? `Table ${order.tableNumber}` : 'Takeaway'}
                        </div>
                        <div className="text-[11px] text-[#707089]">
                          {timeAgo(order.createdAt)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-white font-medium">{order.customerName}</div>
                        {order.customerPhone && (
                          <div className="text-[11px] text-[#707089]">{order.customerPhone}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-[#A1A1B5]">
                        {order.items?.map((item, idx) => (
                          <span key={idx} className="mr-1">
                            {item.quantity}× {item.name}
                            {idx < order.items.length - 1 ? ',' : ''}
                          </span>
                        ))}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#10B981]">
                        ₹{order.totalAmount}
                      </td>
                      <td className="py-3 px-4">
                        {order.paymentStatus === 'paid' ? (
                          <span className="text-[11px] font-semibold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full border border-[#10B981]/20">
                            Paid ({order.paymentMethod || 'cash'})
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-[#EF4444] bg-[#EF4444]/10 px-2 py-0.5 rounded-full border border-[#EF4444]/20">
                            Unpaid
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={order.status} />
                          {isLate && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-500/20 text-red-400">
                              LATE
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* KOT and Invoice Print buttons */}
                          <button
                            data-tour="orders-kot-btn"
                            onClick={() => onShowKotModal && onShowKotModal(order._id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="Print KOT"
                          >
                            <LuPrinter size={13} />
                          </button>
                          <button
                            onClick={() => onShowInvoiceModal && onShowInvoiceModal(order.sessionId, order._id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="Print Bill"
                          >
                            <LuReceipt size={13} />
                          </button>

                          {order.status === 'pending' && (
                            <button
                              onClick={() => onStatusUpdate(order._id, 'confirmed')}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-[#7C3AED] hover:bg-[#6D28D9]"
                            >
                              Accept
                            </button>
                          )}
                          {order.status === 'confirmed' && (
                            <button
                              onClick={() => onStatusUpdate(order._id, 'completed')}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-[#10B981] hover:bg-[#059669]"
                            >
                              Complete
                            </button>
                          )}
                          {order.status === 'preparing' && (
                            <button
                              onClick={() => onStatusUpdate(order._id, 'ready')}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-[#10B981] hover:bg-[#059669]"
                            >
                              Ready
                            </button>
                          )}
                          {order.status === 'ready' && (
                            <button
                              onClick={() => onStatusUpdate(order._id, 'completed')}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-[#3B82F6] hover:bg-[#2563EB]"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div data-tour="orders-status-pipeline" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.map((order) => {
            const elapsedMs = Date.now() - new Date(order.createdAt).getTime();
            const isLate = order.status === 'pending' && elapsedMs >= 60 * 1000;
            const isSilenced = silencedOrders.has(order._id);
            const isUnpaid = order.paymentStatus !== 'paid' && order.status !== 'cancelled';

            return (
              <div
                key={order._id}
                className={`rounded-2xl p-4 md:p-5 transition-all relative flex flex-col justify-between ${
                  isLate && !isSilenced ? 'border-red-500/50 shadow-lg shadow-red-500/10' : ''
                }`}
                style={{
                  backgroundColor: '#11111D',
                  border: isLate && !isSilenced
                    ? '1.5px solid rgba(239, 68, 68, 0.6)'
                    : '1px solid rgba(255, 255, 255, 0.07)'
                }}
              >
                <div>
                  {/* Top bar of card */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => copyOrderNum(order.orderNumber)}
                          className="font-mono font-bold text-sm text-white hover:text-[#A78BFA] transition-colors inline-flex items-center gap-1.5"
                          title="Copy order number"
                        >
                          <span>{order.orderNumber}</span>
                          {copiedId === order.orderNumber ? (
                            <FiCheck className="text-[#10B981]" size={13} />
                          ) : (
                            <FiCopy className="text-[#707089]" size={12} />
                          )}
                        </button>

                        <StatusBadge status={order.status} />

                        {order.orderSource && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            order.orderSource === 'qr'
                              ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                              : order.orderSource === 'takeaway'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}>
                            {order.orderSource}
                          </span>
                        )}

                        {order.kotNumber && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-emerald-300 border border-white/10">
                            {order.kotNumber}
                          </span>
                        )}

                        {isLate && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-500/20 text-red-400 flex items-center gap-1 animate-pulse border border-red-500/30">
                            <FiAlertTriangle size={11} />
                            <span>LATE ({Math.floor(elapsedMs / 60000)}m)</span>
                          </span>
                        )}

                        {order.paymentStatus === 'paid' ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/25">
                            Paid
                          </span>
                        ) : (
                          order.status !== 'cancelled' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/25">
                              Unpaid
                            </span>
                          )
                        )}
                      </div>

                      {/* Table and Customer Info */}
                      <p className="text-xs md:text-sm mt-1.5 font-medium text-[#A1A1B5]">
                        {order.tableNumber > 0 ? (
                          <>🪑 Table <span className="text-white font-bold">{order.tableNumber}</span></>
                        ) : (
                          <span className="text-amber-300 font-bold">🛍️ Takeaway Order</span>
                        )}
                        {order.customerName && <span> • {order.customerName}</span>}
                        {order.customerPhone && (
                          <span className="text-[#707089]"> • 📞 {order.customerPhone}</span>
                        )}
                      </p>

                      {/* Timers & Elapsed */}
                      <div className="flex items-center gap-3 mt-1 text-xs text-[#707089]">
                        <span className="inline-flex items-center gap-1">
                          <FiClock size={11} />
                          {timeAgo(order.createdAt)}
                        </span>
                        {order.status !== 'served' &&
                          order.status !== 'completed' &&
                          order.status !== 'cancelled' && (
                            <span
                              className="font-mono font-bold px-2 py-0.5 rounded-md"
                              style={{
                                backgroundColor: isLate
                                  ? 'rgba(239, 68, 68, 0.15)'
                                  : 'rgba(245, 158, 11, 0.12)',
                                color: isLate ? '#EF4444' : '#F59E0B'
                              }}
                              key={tick}
                            >
                              ⏱ {elapsedTimer ? elapsedTimer(order.createdAt) : '00:00'}
                            </span>
                          )}
                      </div>
                    </div>

                    {/* Total Amount in ₹ */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg md:text-xl font-bold font-mono text-[#10B981]">
                        ₹{order.totalAmount}
                      </p>
                      {order.discount > 0 && (
                        <p className="text-[10px] font-mono text-[#EF4444]">
                          -₹{order.discount} off ({order.couponCode || 'Coupon'})
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Itemized list */}
                  <div className="space-y-1.5 mb-3 p-3 rounded-xl bg-[#151523] border border-white/[0.04]">
                    {order.items?.map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <span className="text-white font-medium">
                          {item.quantity}× {item.name}
                        </span>
                        <span className="font-mono text-[#8E8EA8]">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Special Instructions note */}
                  {order.specialInstructions && (
                    <div className="mb-3 px-3 py-2 rounded-xl text-xs bg-[#F59E0B]/10 text-[#FBBF24] border border-[#F59E0B]/20">
                      📝 {order.specialInstructions}
                    </div>
                  )}
                </div>

                {/* Card Action Bar */}
                {order.status !== 'cancelled' && (
                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2 flex-wrap">
                    {/* Food status actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {order.status === 'pending' && (
                        <>
                          <button
                            onClick={() => onStatusUpdate(order._id, 'confirmed')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#7C3AED] hover:bg-[#6D28D9] transition-all"
                          >
                            <FiCheck size={13} />
                            <span>Confirm Order</span>
                          </button>
                          <button
                            onClick={() => onStatusUpdate(order._id, 'cancelled')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                          >
                            <FiX size={13} />
                            <span>Reject</span>
                          </button>
                        </>
                      )}
                      {order.status === 'confirmed' && (
                        <button
                          onClick={() => onStatusUpdate(order._id, 'completed')}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#10B981] hover:bg-[#059669] transition-all"
                        >
                          <FiCheck size={13} />
                          <span>Complete</span>
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button
                          onClick={() => onStatusUpdate(order._id, 'ready')}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#10B981] hover:bg-[#059669] transition-all"
                        >
                          <FiCheck size={13} />
                          <span>Mark Ready</span>
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <button
                          onClick={() => onStatusUpdate(order._id, 'completed')}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#3B82F6] hover:bg-[#2563EB] transition-all"
                        >
                          <FiCheck size={13} />
                          <span>Complete Order</span>
                        </button>
                      )}

                      {/* KOT and Invoice quick print buttons */}
                      <button
                        type="button"
                        onClick={() => onShowKotModal && onShowKotModal(order._id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 transition-colors cursor-pointer"
                        title="Print Kitchen Order Ticket (KOT)"
                      >
                        <LuPrinter size={13} />
                        <span>KOT</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onShowInvoiceModal && onShowInvoiceModal(order.sessionId, order._id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 transition-colors cursor-pointer"
                        title="View & Print Bill Receipt"
                      >
                        <LuReceipt size={13} />
                        <span>Bill</span>
                      </button>

                      {/* Silence buzzer for this late order */}
                      {isLate && !isSilenced && (
                        <button
                          onClick={() => onSilenceOrder(order._id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-medium text-[#EF4444] bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/30 transition-colors"
                          title="Silence audio buzzer for this order"
                        >
                          <FiBellOff size={12} />
                          <span>Stop Buzzer</span>
                        </button>
                      )}
                    </div>

                    {/* Payment collection button or badge */}
                    <div>
                      {order.paymentStatus === 'paid' ? (
                        <span className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl font-bold text-[#10B981] bg-[#10B981]/12 border border-[#10B981]/25">
                          ✅ Paid via {order.paymentMethod || 'cash'}
                        </span>
                      ) : payingOrderId === order._id ? (
                        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#151523] border border-white/[0.08]">
                          <span className="text-[11px] text-[#8E8EA8] px-1.5">Method:</span>
                          {['cash', 'upi', 'card', 'other'].map((m) => (
                            <button
                              key={m}
                              onClick={() => onMarkPaid(order._id, m)}
                              className="text-[11px] px-2.5 py-1 rounded-lg font-bold capitalize text-[#10B981] bg-[#10B981]/15 hover:bg-[#10B981]/25 transition-colors border border-[#10B981]/30"
                            >
                              {m}
                            </button>
                          ))}
                          <button
                            onClick={() => setPayingOrderId(null)}
                            className="p-1 text-[#707089] hover:text-white rounded"
                          >
                            <FiX size={13} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setPayingOrderId(order._id)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#10B981] bg-[#10B981]/12 hover:bg-[#10B981]/20 border border-[#10B981]/25 transition-all active:scale-95"
                        >
                          💳 Payment Received
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersTab;
