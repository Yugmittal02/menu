import React, { useState, useMemo } from "react";
import {
  LuUsers,
  LuSearch,
  LuPhone,
  LuStar,
  LuSparkles,
  LuArrowUpDown,
  LuCalendar,
  LuShoppingBag,
  LuIndianRupee,
  LuRefreshCw,
  LuTag,
  LuX,
  LuEye
} from "react-icons/lu";

export default function CRMTab({
  customers = [],
  cafe = {},
  onSyncCustomers,
  onUpdateCustomer,
  onFetchCustomerDetail
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");
  const [sortBy, setSortBy] = useState("spend");
  const [syncing, setSyncing] = useState(false);
  const [activeCustomerDetail, setActiveCustomerDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const currency = cafe?.currency || "₹";

  // Filtered & Sorted customers
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        const matchesSearch =
          !searchQuery ||
          (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.phone || "").includes(searchQuery);

        const matchesTag =
          selectedTag === "all" || (c.tags || []).includes(selectedTag);

        return matchesSearch && matchesTag;
      })
      .sort((a, b) => {
        if (sortBy === "orders") return (b.totalOrders || 0) - (a.totalOrders || 0);
        if (sortBy === "recent") return new Date(b.lastVisit || 0) - new Date(a.lastVisit || 0);
        return (b.totalSpend || 0) - (a.totalSpend || 0);
      });
  }, [customers, searchQuery, selectedTag, sortBy]);

  // Aggregate stats
  const totalCustomers = customers.length;
  const vipCustomersCount = customers.filter((c) => (c.tags || []).includes("VIP")).length;
  const totalLifetimeRevenue = customers.reduce((sum, c) => sum + (c.totalSpend || 0), 0);
  const avgSpendPerCustomer = totalCustomers > 0 ? Math.round(totalLifetimeRevenue / totalCustomers) : 0;

  const handleSync = async () => {
    setSyncing(true);
    try {
      await onSyncCustomers();
    } catch (err) {
      alert("Failed to sync past customer data");
    } finally {
      setSyncing(false);
    }
  };

  const handleViewDetail = async (customerId) => {
    setLoadingDetail(true);
    try {
      const data = await onFetchCustomerDetail(customerId);
      setActiveCustomerDetail(data);
    } catch (err) {
      alert("Failed to load customer profile");
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Sync */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <LuUsers className="w-5 h-5 text-violet-400" />
            Customer CRM & Loyalty
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Guest directory, visit frequencies, lifetime spend, and automated VIP tagging
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-xs font-bold transition-all cursor-pointer"
          title="Analyze and import customers from past orders"
        >
          <LuRefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Sync Past Orders"}
        </button>
      </div>

      {/* KPI Counters */}
      <div data-tour="crm-stats" className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#131322] border border-white/5">
          <span className="text-xs font-medium text-slate-400">Total Customers</span>
          <div className="text-2xl font-black text-white mt-1 font-mono">{totalCustomers}</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#131322] border border-white/5">
          <span className="text-xs font-medium text-amber-400">VIP Guests</span>
          <div className="text-2xl font-black text-amber-400 mt-1 font-mono">{vipCustomersCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#131322] border border-white/5">
          <span className="text-xs font-medium text-emerald-400">Total Guest Spend</span>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
            {currency}{totalLifetimeRevenue.toLocaleString()}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[#131322] border border-white/5">
          <span className="text-xs font-medium text-violet-400">Avg Lifetime Value</span>
          <div className="text-2xl font-black text-violet-400 mt-1 font-mono">
            {currency}{avgSpendPerCustomer.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Toolbar: Search, Filter, Sort */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-[#131322] border border-white/5">
        {/* Search */}
        <div data-tour="crm-search-bar" className="relative w-full md:w-80">
          <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name or phone..."
            className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          {/* Tag Filter */}
          <div className="flex items-center gap-1.5">
            {["all", "VIP", "Regular"].map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedTag === tag
                    ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {tag === "all" ? "All Tags" : tag}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-black/30 border border-white/10 rounded-xl px-2.5 py-1.5">
            <LuArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="spend">Sort by Total Spend</option>
              <option value="orders">Sort by Visit Count</option>
              <option value="recent">Sort by Most Recent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Table / Cards */}
      {filteredCustomers.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-[#131322] border border-white/5">
          <LuUsers className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
          <h4 className="text-base font-bold text-white">No Customers Found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            No guest records match your search. Click "Sync Past Orders" to pull past guests from order history.
          </p>
        </div>
      ) : (
        <div data-tour="crm-detail" className="rounded-2xl bg-[#131322] border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Visits / Orders</th>
                  <th className="py-3 px-4">Total Spend</th>
                  <th className="py-3 px-4">Avg Order</th>
                  <th className="py-3 px-4">Loyalty Tags</th>
                  <th className="py-3 px-4">Last Visit</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                {filteredCustomers.map((cust) => (
                  <tr key={cust._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold text-xs uppercase">
                          {cust.name ? cust.name.charAt(0) : "G"}
                        </div>
                        <span>{cust.name || "Guest"}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      <a href={`tel:${cust.phone}`} className="hover:text-violet-400 transition-colors">
                        {cust.phone}
                      </a>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-white font-mono">{cust.totalOrders || 1}</span> orders
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400 font-mono">
                      {currency}{(cust.totalSpend || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {currency}{(cust.avgOrderValue || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {(cust.tags || []).length > 0 ? (
                          cust.tags.map((t, i) => (
                            <span
                              key={i}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                t === "VIP"
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  : "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                              }`}
                            >
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-500">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-400">
                      {cust.lastVisit ? new Date(cust.lastVisit).toLocaleDateString() : "Recently"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleViewDetail(cust._id)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-violet-600 hover:text-white text-slate-400 transition-all cursor-pointer"
                        title="View Profile & Orders"
                      >
                        <LuEye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Detail Drawer / Modal */}
      {activeCustomerDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-[#12121e] border border-white/10 rounded-3xl shadow-2xl p-6 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg uppercase shadow-lg shadow-violet-600/30">
                  {activeCustomerDetail.customer?.name?.charAt(0) || "G"}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    {activeCustomerDetail.customer?.name}
                  </h3>
                  <span className="text-xs font-mono text-violet-400">
                    {activeCustomerDetail.customer?.phone}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveCustomerDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <LuX className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-black/30 border border-white/5 text-center mb-4">
              <div>
                <span className="text-[11px] text-slate-400">Total Spend</span>
                <p className="text-base font-bold text-emerald-400 font-mono">
                  {currency}{activeCustomerDetail.customer?.totalSpend?.toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-slate-400">Orders</span>
                <p className="text-base font-bold text-white font-mono">
                  {activeCustomerDetail.customer?.totalOrders}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-slate-400">Avg Value</span>
                <p className="text-base font-bold text-violet-400 font-mono">
                  {currency}{activeCustomerDetail.customer?.avgOrderValue}
                </p>
              </div>
            </div>

            {/* Favorite Dishes */}
            {activeCustomerDetail.customer?.favoriteItems?.length > 0 && (
              <div className="mb-4">
                <span className="text-xs font-semibold text-slate-300 block mb-2">Favorite Dishes</span>
                <div className="flex flex-wrap gap-1.5">
                  {activeCustomerDetail.customer.favoriteItems.map((fav, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-violet-600/10 border border-violet-500/20 text-violet-300 text-xs flex items-center gap-1.5"
                    >
                      <LuStar className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span>{fav.name}</span>
                      <strong className="text-white font-mono">({fav.count}x)</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Past Orders Timeline */}
            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-2">Order History</span>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {(activeCustomerDetail.orders || []).length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No past orders recorded yet.</p>
                ) : (
                  activeCustomerDetail.orders.map((ord) => (
                    <div
                      key={ord._id}
                      className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white">{ord.orderNumber}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 uppercase">
                            {ord.orderSource || "POS"}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {new Date(ord.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-400 font-mono block">
                          {currency}{ord.grandTotal || ord.totalAmount}
                        </span>
                        <span className="text-[10px] text-slate-400 capitalize">{ord.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
