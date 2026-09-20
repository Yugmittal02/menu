import React, { useMemo } from 'react';
import {
  LuShoppingBag,
  LuIndianRupee,
  LuClock,
  LuCircleCheck,
  LuArrowRight,
  LuQrCode,
  LuUtensils,
  LuCheck,
  LuX,
  LuMonitor,
  LuLayoutGrid,
  LuReceipt
} from 'react-icons/lu';
import KpiCard from '../ui/KpiCard';
import StatusBadge from '../ui/StatusBadge';
import EmptyState from '../ui/EmptyState';
import SetupStatusWidget from '../../onboarding/SetupStatusWidget';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const OverviewTab = ({
  cafe,
  stats,
  orders = [],
  sessions = [],
  menu = [],
  staff = [],
  onTabChange,
  onStatusUpdate,
  onMarkPaid,
  elapsedTimer,
  tick
}) => {
  const greeting = getGreeting();
  const cafeName = cafe?.name || 'Cafe Owner';

  // Extract live pending and preparing orders
  const activeQueueOrders = useMemo(() => {
    return orders.filter(
      (o) => o.status === 'pending' || o.status === 'confirmed' || o.status === 'preparing' || o.status === 'ready'
    );
  }, [orders]);

  // Active dining sessions count
  const activeSessionsCount = useMemo(() => {
    if (stats?.activeSessionsCount !== undefined) return stats.activeSessionsCount;
    return (sessions || []).filter((s) => s.status === 'active' || s.status === 'billing').length;
  }, [stats, sessions]);

  // Compute table status occupancy map
  const tableCount = Math.max(1, cafe?.tableCount || 10);
  const tableStatusMap = useMemo(() => {
    const map = {};
    for (let i = 1; i <= tableCount; i++) {
      map[i] = { status: 'available', activeOrder: null };
    }
    orders.forEach((o) => {
      const t = o.tableNumber;
      if (t && map[t]) {
        if (o.status === 'pending') {
          map[t] = { status: 'occupied', label: 'Ordering', activeOrder: o };
        } else if (o.status === 'confirmed' || o.status === 'preparing' || o.status === 'ready') {
          map[t] = { status: 'occupied', label: 'In Kitchen', activeOrder: o };
        } else if ((o.status === 'served' || o.status === 'completed') && o.paymentStatus !== 'paid') {
          map[t] = { status: 'payment-pending', label: 'Unpaid', activeOrder: o };
        }
      }
    });
    return map;
  }, [orders, tableCount]);

  // Compute popular items from today's orders
  const popularItems = useMemo(() => {
    const itemMap = {};
    orders.forEach((o) => {
      if (o.status !== 'cancelled' && Array.isArray(o.items)) {
        o.items.forEach((item) => {
          if (!itemMap[item.name]) {
            itemMap[item.name] = {
              name: item.name,
              ordersCount: 0,
              revenue: 0,
              isVeg: item.isVeg
            };
          }
          itemMap[item.name].ordersCount += item.quantity || 1;
          itemMap[item.name].revenue += (item.price || 0) * (item.quantity || 1);
        });
      }
    });

    return Object.values(itemMap)
      .sort((a, b) => b.ordersCount - a.ordersCount)
      .slice(0, 5);
  }, [orders]);

  // Quick action helper
  const handleQuickStatus = (orderId, nextStatus) => {
    if (onStatusUpdate) {
      onStatusUpdate(orderId, nextStatus);
    }
  };

  const avgOrderValue =
    stats.paidOrderCount > 0
      ? Math.round((stats.totalRevenue || 0) / stats.paidOrderCount)
      : 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Restaurant Setup Status Widget */}
      <SetupStatusWidget
        cafe={cafe}
        menu={menu}
        staff={staff}
        onNavigateTab={onTabChange}
      />

      {/* Welcome Banner + Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            {greeting}, {cafeName}
          </h2>
          <p className="text-xs md:text-sm mt-0.5" style={{ color: '#8E8EA8' }}>
            Unified Restaurant POS, QR orders, and live dining operations.
          </p>
        </div>

        <div data-tour="quick-actions" className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onTabChange('POS')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-all hover:brightness-110 active:scale-95 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
            }}
          >
            <LuMonitor size={14} />
            <span>Open POS Terminal</span>
          </button>

          <button
            onClick={() => onTabChange('Tables')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#A1A1B5] hover:text-white bg-[#151523] border border-white/[0.08] hover:bg-[#1A1A2A] transition-colors cursor-pointer"
          >
            <LuLayoutGrid size={14} />
            <span>Table Map ({activeSessionsCount})</span>
          </button>

          <button
            onClick={() => onTabChange('Orders')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#A1A1B5] hover:text-white bg-[#151523] border border-white/[0.08] hover:bg-[#1A1A2A] transition-colors cursor-pointer"
          >
            <LuShoppingBag size={14} />
            <span>Orders</span>
          </button>
        </div>
      </div>

      {/* 6 Primary KPI Cards */}
      <div data-tour="overview-kpis" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          label="Today's Revenue"
          value={`₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`}
          icon={LuIndianRupee}
          color="green"
          subtitle={`${stats.paidOrderCount ?? 0} paid`}
          onClick={() => onTabChange('Orders')}
        />
        <KpiCard
          label="Total Orders"
          value={stats.totalOrders ?? 0}
          icon={LuShoppingBag}
          color="purple"
          subtitle={`${stats.completedOrders ?? 0} completed`}
          onClick={() => onTabChange('Orders')}
        />
        <KpiCard
          label="Active Tables"
          value={`${activeSessionsCount}/${tableCount}`}
          icon={LuLayoutGrid}
          color="purple"
          subtitle="Currently dining"
          onClick={() => onTabChange('Tables')}
        />
        <KpiCard
          label="Takeaway Orders"
          value={stats.takeawayOrders ?? 0}
          icon={LuShoppingBag}
          color="blue"
          subtitle="Counter takeaway"
          onClick={() => onTabChange('Orders')}
        />
        <KpiCard
          label="Pending Queue"
          value={stats.pendingOrders ?? 0}
          icon={LuClock}
          color="orange"
          badge={stats.pendingOrders > 0 ? 'Action' : null}
          subtitle={stats.pendingOrders > 0 ? 'Awaiting kitchen' : 'Queue clear'}
          onClick={() => onTabChange('Orders')}
        />
        <KpiCard
          label="Avg Bill Value"
          value={`₹${avgOrderValue}`}
          icon={LuReceipt}
          color="green"
          subtitle="Per paid order"
          onClick={() => onTabChange('Analytics')}
        />
      </div>

      {/* 12-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left 7-8 Columns: Live Orders Queue & Table Activity */}
        <div className="lg:col-span-8 space-y-5">
          {/* Live Orders Queue Card */}
          <div
            data-tour="live-orders"
            className="rounded-2xl p-4 md:p-5"
            style={{
              backgroundColor: '#11111D',
              border: '1px solid rgba(255, 255, 255, 0.07)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm md:text-base font-bold text-white">Live Orders Queue</h3>
                {activeQueueOrders.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#7C3AED]/20 text-[#A78BFA] font-bold font-mono">
                    {activeQueueOrders.length} active
                  </span>
                )}
              </div>
              <button
                onClick={() => onTabChange('Orders')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#A78BFA] hover:text-[#C4B5FD] transition-colors"
              >
                <span>View All Orders</span>
                <LuArrowRight size={13} />
              </button>
            </div>

            {/* Queue items list */}
            {activeQueueOrders.length === 0 ? (
              <EmptyState
                compact
                emoji="☕"
                title="Kitchen queue is clear"
                description="New customer table orders will appear here automatically with live timers and quick status controls."
                actionText="View Menu"
                onAction={() => onTabChange('Menu')}
                secondaryActionText="View Tables"
                onSecondaryAction={() => onTabChange('QR')}
              />
            ) : (
              <div className="space-y-3">
                {activeQueueOrders.slice(0, 5).map((order) => {
                  const elapsed = elapsedTimer ? elapsedTimer(order.createdAt) : '00:00';
                  const isPending = order.status === 'pending';
                  const isPreparing = order.status === 'preparing' || order.status === 'confirmed';
                  const isReady = order.status === 'ready';

                  return (
                    <div
                      key={order._id}
                      className="p-3.5 rounded-xl transition-all border border-white/[0.06] hover:border-white/[0.12]"
                      style={{ backgroundColor: '#151523' }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono font-bold text-xs md:text-sm text-white">
                            {order.orderNumber}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-[#7C3AED]/15 text-[#A78BFA] border border-[#7C3AED]/25">
                            🪑 Table {order.tableNumber}
                          </span>
                          <StatusBadge status={order.status} />
                          {order.paymentStatus === 'paid' ? (
                            <span className="text-[11px] font-semibold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-md border border-[#10B981]/20">
                              Paid
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-[#EF4444] bg-[#EF4444]/10 px-2 py-0.5 rounded-md border border-[#EF4444]/20">
                              Unpaid
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <span
                            className="text-xs font-mono font-bold px-2 py-0.5 rounded-md"
                            style={{
                              backgroundColor: 'rgba(245, 158, 11, 0.1)',
                              color: '#F59E0B'
                            }}
                            key={tick}
                          >
                            ⏱ {elapsed}
                          </span>
                          <span className="font-mono font-bold text-sm text-[#10B981]">
                            ₹{order.totalAmount}
                          </span>
                        </div>
                      </div>

                      {/* Items row */}
                      <div className="text-xs text-[#A1A1B5] mb-3 truncate">
                        {order.items?.map((item, idx) => (
                          <span key={idx} className="mr-2">
                            {item.quantity}× {item.name}
                            {idx < order.items.length - 1 ? ',' : ''}
                          </span>
                        ))}
                      </div>

                      {/* Quick action buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-white/[0.05] flex-wrap">
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleQuickStatus(order._id, 'confirmed')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#7C3AED] hover:bg-[#6D28D9] transition-colors"
                            >
                              <LuCheck size={13} />
                              <span>Accept Order</span>
                            </button>
                            <button
                              onClick={() => handleQuickStatus(order._id, 'cancelled')}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                            >
                              <LuX size={13} />
                              <span>Reject</span>
                            </button>
                          </>
                        )}
                        {isPreparing && (
                          <button
                            onClick={() => handleQuickStatus(order._id, 'ready')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#10B981] hover:bg-[#059669] transition-colors"
                          >
                            <LuCheck size={13} />
                            <span>Mark Ready</span>
                          </button>
                        )}
                        {isReady && (
                          <button
                            onClick={() => handleQuickStatus(order._id, 'completed')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#3B82F6] hover:bg-[#2563EB] transition-colors"
                          >
                            <LuCheck size={13} />
                            <span>Complete Order</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Table Activity Grid */}
          <div
            data-tour="table-activity"
            className="rounded-2xl p-4 md:p-5"
            style={{
              backgroundColor: '#11111D',
              border: '1px solid rgba(255, 255, 255, 0.07)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm md:text-base font-bold text-white">Table Activity</h3>
                <p className="text-xs text-[#8E8EA8]">Real-time dining table status overview</p>
              </div>
              <button
                onClick={() => onTabChange('QR')}
                className="text-xs font-semibold text-[#A78BFA] hover:text-[#C4B5FD] transition-colors"
              >
                Manage Tables
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
              {Array.from({ length: tableCount }, (_, i) => i + 1).map((tableNo) => {
                const info = tableStatusMap[tableNo] || { status: 'available' };
                const isOccupied = info.status === 'occupied';
                const isUnpaid = info.status === 'payment-pending';

                return (
                  <div
                    key={tableNo}
                    onClick={() => onTabChange('QR')}
                    className="p-2.5 rounded-xl text-center cursor-pointer transition-all hover:scale-105"
                    style={{
                      backgroundColor: isOccupied
                        ? 'rgba(249, 115, 22, 0.12)'
                        : isUnpaid
                        ? 'rgba(245, 158, 11, 0.12)'
                        : 'rgba(255, 255, 255, 0.03)',
                      border: isOccupied
                        ? '1px solid rgba(249, 115, 22, 0.3)'
                        : isUnpaid
                        ? '1px solid rgba(245, 158, 11, 0.3)'
                        : '1px solid rgba(255, 255, 255, 0.06)'
                    }}
                  >
                    <div className="text-xs font-bold text-white">T-{tableNo}</div>
                    <div
                      className="text-[10px] font-medium mt-0.5 truncate"
                      style={{
                        color: isOccupied
                          ? '#FB923C'
                          : isUnpaid
                          ? '#FBBF24'
                          : '#10B981'
                      }}
                    >
                      {info.label || 'Free'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 4-5 Columns: Performance Breakdown & Popular Items */}
        <div className="lg:col-span-4 space-y-5">
          {/* Setup Status Checklist Widget */}
          <SetupStatusWidget
            cafe={cafe}
            menu={menu}
            staff={staff}
            onNavigateTab={onTabChange}
          />

          {/* Today's Performance Card */}
          <div
            className="rounded-2xl p-4 md:p-5"
            style={{
              backgroundColor: '#11111D',
              border: '1px solid rgba(255, 255, 255, 0.07)'
            }}
          >
            <h3 className="text-sm md:text-base font-bold text-white mb-3">
              Today's Performance
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#151523] border border-white/[0.05]">
                <span className="text-xs text-[#8E8EA8]">Average Order Value</span>
                <span className="text-sm font-bold font-mono text-white">
                  ₹{avgOrderValue}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#151523] border border-white/[0.05]">
                <span className="text-xs text-[#8E8EA8]">Unpaid Orders</span>
                <span
                  className="text-sm font-bold font-mono"
                  style={{ color: stats.unpaidOrders > 0 ? '#EF4444' : '#10B981' }}
                >
                  {stats.unpaidOrders || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#151523] border border-white/[0.05]">
                <span className="text-xs text-[#8E8EA8]">Total Discounts Given</span>
                <span className="text-sm font-bold font-mono text-[#F59E0B]">
                  ₹{(stats.totalDiscount || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-xs text-[#8E8EA8]">Detailed analytics</span>
              <button
                onClick={() => onTabChange('Analytics')}
                className="text-xs font-semibold text-[#7C3AED] hover:text-[#8B5CF6] transition-colors"
              >
                Open Analytics →
              </button>
            </div>
          </div>

          {/* Popular Items Card */}
          <div
            className="rounded-2xl p-4 md:p-5"
            style={{
              backgroundColor: '#11111D',
              border: '1px solid rgba(255, 255, 255, 0.07)'
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm md:text-base font-bold text-white">Popular Dishes</h3>
              <span className="text-[11px] text-[#707089]">Today</span>
            </div>

            {popularItems.length === 0 ? (
              <div className="text-center py-6 text-xs text-[#707089]">
                No items ordered yet today
              </div>
            ) : (
              <div className="space-y-2.5">
                {popularItems.map((item, i) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#151523] border border-white/[0.04]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xs font-mono font-bold text-[#707089] w-4">
                        #{i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-[#8E8EA8]">
                          {item.ordersCount} {item.ordersCount === 1 ? 'order' : 'orders'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono text-[#10B981]">
                      ₹{item.revenue}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
