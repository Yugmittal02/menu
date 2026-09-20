import React, { useState } from 'react';
import {
  FiShoppingBag,
  FiDollarSign,
  FiActivity,
  FiBook,
  FiTrendingUp,
  FiClock,
  FiCheckCircle,
  FiRefreshCw,
  FiGrid,
  FiStar,
} from 'react-icons/fi';

const DashboardPreview = () => {
  const [activeWidgetTab, setActiveWidgetTab] = useState('orders'); // 'orders', 'menu', 'analytics'

  const recentOrdersMock = [
    { id: '#ORD-9842', table: 'Table 04', items: '2x Iced Latte, 1x Brownie', total: '$14.50', time: '2 mins ago', status: 'Preparing', statusClass: 'status-preparing' },
    { id: '#ORD-9841', table: 'Table 12', items: '1x Club Sandwich, 1x Cola', total: '$11.00', time: '7 mins ago', status: 'Ready', statusClass: 'status-ready' },
    { id: '#ORD-9840', table: 'Table 02', items: '1x Cappuccino, 1x Muffin', total: '$8.20', time: '14 mins ago', status: 'Served', statusClass: 'status-served' },
    { id: '#ORD-9839', table: 'Table 08', items: '2x Cold Brew, 2x Croissant', total: '$16.40', time: '21 mins ago', status: 'Served', statusClass: 'status-served' },
  ];

  const popularItemsMock = [
    { name: 'Iced Hazelnut Latte', category: 'Beverages', orders: '142 orders', price: '$4.50', rating: '4.9' },
    { name: 'Classic Avocado Toast', category: 'Breakfast', orders: '98 orders', price: '$8.90', rating: '4.8' },
    { name: 'Artisan Espresso', category: 'Beverages', orders: '87 orders', price: '$3.50', rating: '4.9' },
  ];

  return (
    <section id="dashboard-preview" className="py-20 bg-[#0B0F19] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <span className="text-xs font-semibold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
            Restaurant Command Center
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            One Dashboard. Complete Control.
          </h2>
          <p className="text-base md:text-lg text-gray-400">
            Manage your restaurant menu, tables and incoming orders from one place.
          </p>
        </div>

        {/* SaaS Dashboard Showcase Box */}
        <div className="rounded-2xl p-4 md:p-6 bg-[#0E1322] border border-purple-500/20 shadow-2xl shadow-purple-950/50">
          {/* Top Control Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold">
                <FiGrid />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Cafe Management Console
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </h3>
                <p className="text-xs text-gray-400">Real-time store telemetry</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setActiveWidgetTab('orders')}
                className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                  activeWidgetTab === 'orders'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Orders & Live Feed
              </button>
              <button
                onClick={() => setActiveWidgetTab('menu')}
                className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                  activeWidgetTab === 'menu'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Popular Items
              </button>
            </div>
          </div>

          {/* 6 Core Dashboard Metric Widgets */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 my-6">
            <div className="p-4 rounded-xl bg-[#13192B] border border-purple-500/15">
              <div className="flex items-center justify-between text-purple-400 text-xs mb-2">
                <span>Today's Orders</span>
                <FiShoppingBag />
              </div>
              <p className="text-2xl font-black text-white">54</p>
              <span className="text-[10px] text-emerald-400 font-medium">+14% vs avg</span>
            </div>

            <div className="p-4 rounded-xl bg-[#13192B] border border-purple-500/15">
              <div className="flex items-center justify-between text-emerald-400 text-xs mb-2">
                <span>Today's Revenue</span>
                <FiDollarSign />
              </div>
              <p className="text-2xl font-black text-white">$1,420</p>
              <span className="text-[10px] text-emerald-400 font-medium">+22% vs yesterday</span>
            </div>

            <div className="p-4 rounded-xl bg-[#13192B] border border-purple-500/15">
              <div className="flex items-center justify-between text-amber-400 text-xs mb-2">
                <span>Active Orders</span>
                <FiActivity />
              </div>
              <p className="text-2xl font-black text-amber-400">4</p>
              <span className="text-[10px] text-amber-300 font-medium">In kitchen</span>
            </div>

            <div className="p-4 rounded-xl bg-[#13192B] border border-purple-500/15">
              <div className="flex items-center justify-between text-indigo-400 text-xs mb-2">
                <span>Total Menu Items</span>
                <FiBook />
              </div>
              <p className="text-2xl font-black text-white">38</p>
              <span className="text-[10px] text-gray-400">6 Categories</span>
            </div>

            <div className="p-4 rounded-xl bg-[#13192B] border border-purple-500/15">
              <div className="flex items-center justify-between text-rose-400 text-xs mb-2">
                <span>Popular Item</span>
                <FiStar />
              </div>
              <p className="text-sm font-bold text-white truncate">Iced Latte</p>
              <span className="text-[10px] text-purple-300">142 sold this week</span>
            </div>

            <div className="p-4 rounded-xl bg-[#13192B] border border-purple-500/15">
              <div className="flex items-center justify-between text-purple-400 text-xs mb-2">
                <span>Table Scans</span>
                <FiTrendingUp />
              </div>
              <p className="text-2xl font-black text-purple-400">188</p>
              <span className="text-[10px] text-gray-400">100% Mobile</span>
            </div>
          </div>

          {/* Table / Details Content */}
          {activeWidgetTab === 'orders' ? (
            <div className="bg-[#111627] rounded-xl border border-white/5 overflow-hidden">
              <div className="px-4 py-3 bg-white/5 flex items-center justify-between text-xs font-semibold text-gray-300">
                <span>Recent Incoming Orders</span>
                <span className="text-purple-400 flex items-center gap-1">
                  <FiRefreshCw className="animate-spin" /> Live Sync Active
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.02] text-gray-400 border-b border-white/5">
                    <tr>
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Table</th>
                      <th className="p-3">Items Summary</th>
                      <th className="p-3">Total</th>
                      <th className="p-3">Time</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-200">
                    {recentOrdersMock.map((ord, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02]">
                        <td className="p-3 font-mono text-purple-300 font-bold">{ord.id}</td>
                        <td className="p-3 font-medium text-white">{ord.table}</td>
                        <td className="p-3 text-gray-300">{ord.items}</td>
                        <td className="p-3 font-bold text-white">{ord.total}</td>
                        <td className="p-3 text-gray-400">{ord.time}</td>
                        <td className="p-3">
                          <span className={`status-badge ${ord.statusClass}`}>
                            {ord.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {popularItemsMock.map((item, idx) => (
                <div key={idx} className="p-4 bg-[#111627] rounded-xl border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-purple-400 uppercase tracking-wider font-semibold">
                      {item.category}
                    </span>
                    <h4 className="text-sm font-bold text-white">{item.name}</h4>
                    <p className="text-xs text-gray-400 mt-1">{item.orders}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-400">{item.price}</p>
                    <span className="text-xs text-amber-400 flex items-center gap-1 mt-1 justify-end">
                      <FiStar /> {item.rating}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DashboardPreview;
