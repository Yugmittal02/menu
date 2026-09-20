import React, { useState, useMemo } from 'react';
import {
  LuChartColumn,
  LuIndianRupee,
  LuShoppingBag,
  LuTrendingUp,
  LuCircleCheck,
  LuClock,
  LuCalendar
} from 'react-icons/lu';
import { FiXCircle } from 'react-icons/fi';
import KpiCard from '../ui/KpiCard';
import EmptyState from '../ui/EmptyState';

const AnalyticsTab = ({ orders = [], stats = {}, onTabChange }) => {
  const [timeRange, setTimeRange] = useState('7d'); // 'today', '7d', '30d', 'all'

  // Filter orders by selected time range
  const filteredOrders = useMemo(() => {
    const now = Date.now();
    return orders.filter((o) => {
      const orderTime = new Date(o.createdAt).getTime();
      if (timeRange === 'today') {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        return orderTime >= startOfDay.getTime();
      }
      if (timeRange === '7d') {
        return now - orderTime <= 7 * 24 * 60 * 60 * 1000;
      }
      if (timeRange === '30d') {
        return now - orderTime <= 30 * 24 * 60 * 60 * 1000;
      }
      return true; // 'all'
    });
  }, [orders, timeRange]);

  // Genuine Metric Calculations
  const metrics = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const activeOrders = filteredOrders.filter((o) => o.status !== 'cancelled');
    const completedOrders = filteredOrders.filter(
      (o) => o.status === 'completed' || o.status === 'served'
    ).length;
    const cancelledOrders = filteredOrders.filter((o) => o.status === 'cancelled').length;
    const paidOrders = filteredOrders.filter((o) => o.paymentStatus === 'paid');

    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const aov = paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0;
    const completionRate =
      totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;
    const cancellationRate =
      totalOrders > 0 ? Math.round((cancelledOrders / totalOrders) * 100) : 0;

    // Item popularity
    const itemMap = {};
    activeOrders.forEach((o) => {
      if (Array.isArray(o.items)) {
        o.items.forEach((item) => {
          if (!itemMap[item.name]) {
            itemMap[item.name] = { name: item.name, count: 0, revenue: 0 };
          }
          itemMap[item.name].count += item.quantity || 1;
          itemMap[item.name].revenue += (item.price || 0) * (item.quantity || 1);
        });
      }
    });

    const topItems = Object.values(itemMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Hourly distribution
    const hourly = Array.from({ length: 24 }, () => 0);
    activeOrders.forEach((o) => {
      const h = new Date(o.createdAt).getHours();
      hourly[h] = (hourly[h] || 0) + 1;
    });

    let peakHourIndex = 0;
    let peakHourOrders = 0;
    hourly.forEach((count, h) => {
      if (count > peakHourOrders) {
        peakHourOrders = count;
        peakHourIndex = h;
      }
    });

    const formatHour = (h) => {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const formatted = h % 12 || 12;
      return `${formatted}:00 ${ampm}`;
    };

    // Payment method breakdown
    const paymentMethods = { cash: 0, upi: 0, card: 0, other: 0 };
    paidOrders.forEach((o) => {
      const method = (o.paymentMethod || 'cash').toLowerCase();
      if (paymentMethods[method] !== undefined) {
        paymentMethods[method] += 1;
      } else {
        paymentMethods.other += 1;
      }
    });

    return {
      totalOrders,
      totalRevenue,
      aov,
      paidCount: paidOrders.length,
      completionRate,
      cancellationRate,
      topItem: topItems[0] ? topItems[0].name : '—',
      topItems,
      peakHour: peakHourOrders > 0 ? formatHour(peakHourIndex) : '—',
      peakHourOrders,
      hourly,
      paymentMethods
    };
  }, [filteredOrders]);

  const hasData = metrics.totalOrders > 0;

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Top Header & Range Filters */}
      <div
        className="p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
        style={{
          backgroundColor: '#11111D',
          border: '1px solid rgba(255, 255, 255, 0.07)'
        }}
      >
        <div>
          <h2 className="text-base md:text-lg font-bold text-white">Analytics & Performance</h2>
          <p className="text-xs text-[#8E8EA8] mt-0.5">
            Operational metrics calculated from real restaurant orders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Action Buttons for Expenses & Reports */}
          <button
            data-tour="analytics-expenses-btn"
            onClick={() => alert("Operational expenses tracking & shift reconciliation")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            Expense Log
          </button>
          <button
            data-tour="reports-export-card"
            onClick={() => alert("Exporting Daily Sales Z-Report...")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30 transition-all cursor-pointer"
          >
            Export Report
          </button>

          {/* Date Filter Buttons */}
          <div data-tour="analytics-time-filter" className="flex items-center gap-1.5 p-1 rounded-xl bg-[#151523] border border-white/[0.08]">
            {[
              { id: 'today', label: 'Today' },
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: 'all', label: 'All Time' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeRange(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  timeRange === t.id
                    ? 'bg-[#7C3AED] text-white shadow-sm'
                    : 'text-[#8E8EA8] hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!hasData ? (
        <EmptyState
          emoji="📊"
          title="Analytics will appear here"
          description="Start receiving and completing customer table orders to see genuine revenue trends, popular item rankings, and peak dining hours."
          actionText="View Live Orders"
          onAction={() => onTabChange('Orders')}
          secondaryActionText="Manage Menu"
          onSecondaryAction={() => onTabChange('Menu')}
        />
      ) : (
        <>
          {/* Key Metric Cards */}
          <div data-tour="analytics-kpi-grid" className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <KpiCard
              label="Total Revenue"
              value={`₹${metrics.totalRevenue.toLocaleString('en-IN')}`}
              icon={LuIndianRupee}
              color="green"
              subtitle={`${metrics.paidCount} paid orders`}
            />
            <KpiCard
              label="Total Orders"
              value={metrics.totalOrders}
              icon={LuShoppingBag}
              color="purple"
              subtitle={`${metrics.completionRate}% completion rate`}
            />
            <KpiCard
              label="Average Order Value"
              value={`₹${metrics.aov}`}
              icon={LuTrendingUp}
              color="blue"
              subtitle="Per paid dining party"
            />
            <KpiCard
              label="Peak Dining Hour"
              value={metrics.peakHour}
              icon={LuClock}
              color="orange"
              subtitle={
                metrics.peakHourOrders > 0
                  ? `${metrics.peakHourOrders} orders during peak`
                  : 'Insufficient data'
              }
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Hourly Order Distribution (8 cols) */}
            <div
              className="lg:col-span-8 rounded-2xl p-5"
              style={{
                backgroundColor: '#11111D',
                border: '1px solid rgba(255, 255, 255, 0.07)'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Orders by Hour of Day</h3>
                  <p className="text-xs text-[#8E8EA8]">
                    Dining volume breakdown across operational hours
                  </p>
                </div>
              </div>

              {/* Responsive SVG Bar Chart */}
              <div className="h-48 w-full flex items-end gap-1.5 pt-4 pb-2">
                {metrics.hourly.map((count, hour) => {
                  const maxOrders = Math.max(...metrics.hourly, 1);
                  const heightPercent = Math.max(8, Math.round((count / maxOrders) * 100));
                  const isPeak = count > 0 && count === metrics.peakHourOrders;

                  return (
                    <div
                      key={hour}
                      className="flex-1 flex flex-col items-center h-full justify-end group relative"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#151523] border border-white/10 text-[10px] text-white font-mono px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        {hour}:00 — {count} {count === 1 ? 'order' : 'orders'}
                      </div>

                      {/* Bar fill */}
                      <div
                        className="w-full rounded-t-md transition-all duration-300"
                        style={{
                          height: `${heightPercent}%`,
                          backgroundColor: isPeak
                            ? '#7C3AED'
                            : count > 0
                            ? 'rgba(124, 58, 237, 0.45)'
                            : 'rgba(255, 255, 255, 0.04)'
                        }}
                      />

                      {/* Hour label */}
                      {hour % 3 === 0 && (
                        <span className="text-[9px] text-[#707089] mt-1 font-mono">
                          {hour}h
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Method Breakdown (4 cols) */}
            <div
              className="lg:col-span-4 rounded-2xl p-5 flex flex-col justify-between"
              style={{
                backgroundColor: '#11111D',
                border: '1px solid rgba(255, 255, 255, 0.07)'
              }}
            >
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Payment Breakdown</h3>
                <p className="text-xs text-[#8E8EA8] mb-4">
                  Methods used by customers for completed orders
                </p>

                <div className="space-y-3">
                  {[
                    { key: 'cash', label: 'Cash Payment', color: '#10B981' },
                    { key: 'upi', label: 'UPI / Online', color: '#7C3AED' },
                    { key: 'card', label: 'Credit / Debit Card', color: '#3B82F6' },
                    { key: 'other', label: 'Other Methods', color: '#F59E0B' }
                  ].map((m) => {
                    const count = metrics.paymentMethods[m.key] || 0;
                    const pct =
                      metrics.paidCount > 0
                        ? Math.round((count / metrics.paidCount) * 100)
                        : 0;

                    return (
                      <div key={m.key} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-white font-medium">{m.label}</span>
                          <span className="font-mono text-[#8E8EA8]">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: m.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.06] text-[11px] text-[#707089]">
                Total paid transactions: <span className="text-white font-bold">{metrics.paidCount}</span>
              </div>
            </div>

            {/* Top 5 Dishes by Order Volume (12 cols) */}
            <div
              data-tour="analytics-top-items"
              className="lg:col-span-12 rounded-2xl p-5"
              style={{
                backgroundColor: '#11111D',
                border: '1px solid rgba(255, 255, 255, 0.07)'
              }}
            >
              <h3 className="text-sm font-bold text-white mb-1">Top Performing Menu Items</h3>
              <p className="text-xs text-[#8E8EA8] mb-4">
                Ranked by volume ordered during this period
              </p>

              {metrics.topItems.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#707089]">
                  No item sales data for this period
                </div>
              ) : (
                <div className="space-y-3">
                  {metrics.topItems.map((item, idx) => {
                    const maxCount = metrics.topItems[0].count || 1;
                    const pct = Math.round((item.count / maxCount) * 100);

                    return (
                      <div
                        key={item.name}
                        className="p-3 rounded-xl bg-[#151523] border border-white/[0.04] space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#A78BFA]">
                              #{idx + 1}
                            </span>
                            <span className="text-white font-semibold">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-3 font-mono">
                            <span className="text-[#8E8EA8]">
                              {item.count} {item.count === 1 ? 'order' : 'orders'}
                            </span>
                            <span className="font-bold text-[#10B981]">₹{item.revenue}</span>
                          </div>
                        </div>

                        <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A78BFA]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsTab;
