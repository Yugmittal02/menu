import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LuArmchair,
  LuClock,
  LuUsers,
  LuPlus,
  LuReceipt,
  LuUtensils,
  LuCircleCheck,
  LuX,
  LuLayoutGrid,
  LuCheck,
  LuTrash2,
  LuSparkles
} from "react-icons/lu";

export default function TablesTab({
  cafe = {},
  sessions = [],
  orders = [],
  onOpenSession,
  onSelectTableForBilling,
  onSelectTableForPos,
  onFreeTable,
  onCloseSession,
  onRefresh
}) {
  const [filter, setFilter] = useState("all"); // 'all' | 'available' | 'occupied' | 'billing' | 'settled'
  const [seatingModalTable, setSeatingModalTable] = useState(null);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [pax, setPax] = useState(2);
  const [loading, setLoading] = useState(false);

  // Live timer tick to update 60-second auto-free countdown every second
  const [now, setNow] = useState(Date.now());
  const freedSessionsRef = useRef(new Set());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const tableCount = cafe?.tableCount || 10;
  const currency = cafe?.currency || "₹";

  // Map active / billing / settled sessions by table number
  const sessionMap = useMemo(() => {
    const map = {};
    (sessions || []).forEach((s) => {
      if (s.status === "active" || s.status === "billing" || s.status === "settled") {
        map[s.tableNumber] = s;
      }
    });
    return map;
  }, [sessions]);

  // Generate table status list with 60-second auto-free calculation
  const tables = useMemo(() => {
    const list = [];
    for (let i = 1; i <= tableCount; i++) {
      const session = sessionMap[i];
      let status = "available";
      let secondsLeft = 0;

      if (session) {
        const activeOrders = (session.orders || []).filter(
          (o) => (o.status || "").toLowerCase() !== "cancelled"
        );
        const allOrdersPaid =
          activeOrders.length > 0 &&
          activeOrders.every((o) => (o.paymentStatus || "").toLowerCase() === "paid");

        const isSettled =
          session.status === "settled" ||
          (session.paymentStatus || "").toLowerCase() === "paid" ||
          allOrdersPaid;

        if (isSettled) {
          const settledTimestamp = session.settledAt
            ? new Date(session.settledAt).getTime()
            : session.paidAt
            ? new Date(session.paidAt).getTime()
            : new Date(session.openedAt || Date.now()).getTime();

          const elapsedSec = Math.max(0, Math.floor((now - settledTimestamp) / 1000));
          const remainingSec = Math.max(0, 60 - elapsedSec);

          if (remainingSec <= 0) {
            // Automatically freed after 60 seconds
            status = "available";
            secondsLeft = 0;
            // Notify backend to close the session if not already closed
            if (onFreeTable && session._id && !freedSessionsRef.current.has(session._id)) {
              freedSessionsRef.current.add(session._id);
              onFreeTable(session._id).catch(() => {});
            }
          } else {
            status = "settled";
            secondsLeft = remainingSec;
          }
        } else {
          status = session.status === "billing" ? "billing" : "occupied";
        }
      }

      list.push({
        tableNumber: i,
        status,
        session,
        secondsLeft
      });
    }
    return list;
  }, [tableCount, sessionMap, now, onFreeTable]);

  // Filtered tables
  const filteredTables = useMemo(() => {
    if (filter === "all") return tables;
    return tables.filter((t) => t.status === filter);
  }, [tables, filter]);

  // Counts for KPIs
  const occupiedCount = tables.filter((t) => t.status === "occupied").length;
  const billingCount = tables.filter((t) => t.status === "billing").length;
  const settledCount = tables.filter((t) => t.status === "settled").length;
  const availableCount = tables.filter((t) => t.status === "available").length;
  const occupancyRate =
    tableCount > 0
      ? Math.round(((occupiedCount + billingCount + settledCount) / tableCount) * 100)
      : 0;

  // Seat Guest submit
  const handleSeatGuest = async (e) => {
    e.preventDefault();
    if (!seatingModalTable) return;
    setLoading(true);
    try {
      await onOpenSession({
        tableNumber: seatingModalTable,
        customerName: guestName.trim() || `Table ${seatingModalTable} Guest`,
        customerPhone: guestPhone.trim(),
        pax: parseInt(pax) || 1
      });
      setSeatingModalTable(null);
      setGuestName("");
      setGuestPhone("");
      setPax(2);
    } catch (err) {
      console.error("Open session error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Immediate manual free table action
  const handleManualFree = async (session) => {
    if (!session?._id) return;
    try {
      if (onFreeTable) {
        await onFreeTable(session._id);
      } else if (onCloseSession) {
        await onCloseSession(session._id, { immediate: true });
      }
    } catch (err) {
      console.error("Failed to free table:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Stats Banner */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#11111d] border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold">
            <LuLayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Tables</div>
            <div className="text-xl font-black text-white">{tableCount}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#11111d] border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <LuCircleCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Available</div>
            <div className="text-xl font-black text-emerald-400">{availableCount}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#11111d] border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <LuArmchair className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Occupied</div>
            <div className="text-xl font-black text-amber-400">{occupiedCount}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#11111d] border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
            <LuClock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Settled (60s)</div>
            <div className="text-xl font-black text-teal-400">{settledCount}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#11111d] border border-white/10 flex items-center gap-3 col-span-2 md:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
            <LuReceipt className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Billing / Occupancy</div>
            <div className="text-xl font-black text-rose-400">{occupancyRate}%</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Legend */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#11111d] border border-white/10">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: "all", label: "All Tables", count: tableCount },
            { id: "available", label: "Available", count: availableCount },
            { id: "occupied", label: "Occupied", count: occupiedCount },
            { id: "billing", label: "Billing", count: billingCount },
            { id: "settled", label: "Settled", count: settledCount }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filter === f.id
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400 hidden sm:flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Occupied
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Billing
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400" /> Settled (Auto-free 60s)
          </span>
        </div>
      </div>

      {/* Table Tiles Grid */}
      <div data-tour="tables-grid" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredTables.map((t) => {
          const session = t.session;
          const isSettled = t.status === "settled";
          const isOccupied = t.status === "occupied";
          const isBilling = t.status === "billing";
          const isAvailable = t.status === "available";

          // Duration
          let durationMin = 0;
          if (session?.openedAt) {
            durationMin = Math.max(
              0,
              Math.floor((now - new Date(session.openedAt).getTime()) / 60000)
            );
          }

          // Order count & running total
          const orderCount = session?.orders?.length || 0;
          const runningTotal = session?.grandTotal || session?.subtotal || 0;

          return (
            <div
              key={t.tableNumber}
              className={`relative rounded-2xl border p-4 flex flex-col justify-between transition-all duration-200 shadow-md ${
                isAvailable
                  ? "bg-[#11111d]/90 border-emerald-500/20 hover:border-emerald-500/50 hover:bg-[#151525]"
                  : isSettled
                  ? "bg-gradient-to-b from-[#102422] to-[#12121e] border-teal-500/50 shadow-teal-950/30"
                  : isOccupied
                  ? "bg-gradient-to-b from-[#1a1712] to-[#12121e] border-amber-500/40 shadow-amber-950/20"
                  : "bg-gradient-to-b from-[#1a1216] to-[#12121e] border-rose-500/50 shadow-rose-950/30"
              }`}
            >
              {/* Header: Table Number & Status Indicator */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                      isAvailable
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : isSettled
                        ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                        : isOccupied
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    }`}
                  >
                    T{t.tableNumber}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Table {t.tableNumber}</h4>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider ${
                        isAvailable
                          ? "text-emerald-400"
                          : isSettled
                          ? "text-teal-300"
                          : isOccupied
                          ? "text-amber-400"
                          : "text-rose-400"
                      }`}
                    >
                      {isSettled ? "Settled" : t.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {isSettled && (
                    <span className="font-mono text-[10px] font-bold text-teal-300 bg-teal-500/20 border border-teal-500/30 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                      <LuClock className="w-2.5 h-2.5 animate-spin" />
                      {t.secondsLeft}s
                    </span>
                  )}
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      isAvailable
                        ? "bg-emerald-400"
                        : isSettled
                        ? "bg-teal-400 animate-ping"
                        : isOccupied
                        ? "bg-amber-400 animate-pulse"
                        : "bg-rose-500 animate-pulse"
                    }`}
                  />
                </div>
              </div>

              {/* Body Details */}
              <div className="my-4 space-y-1.5 text-xs">
                {isAvailable ? (
                  <div className="py-3 text-center text-slate-500 text-xs">
                    <p className="text-emerald-400 font-medium">Table is free & ready</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Click below to seat or order</p>
                  </div>
                ) : isSettled ? (
                  <>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Guest:</span>
                      <span className="font-semibold truncate max-w-[110px]">
                        {session?.customerName || "Guest"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400 flex items-center gap-1">
                        <LuCircleCheck className="w-3 h-3 text-teal-400" /> Bill Status:
                      </span>
                      <span className="font-semibold text-teal-300">Paid & Settled</span>
                    </div>

                    <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-[11px] text-teal-300 flex items-center justify-between">
                      <span>Auto-freeing in:</span>
                      <span className="font-mono font-bold text-sm text-teal-200">
                        {t.secondsLeft}s
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Guest:</span>
                      <span className="font-semibold truncate max-w-[110px]">
                        {session?.customerName || "Guest"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400 flex items-center gap-1">
                        <LuClock className="w-3 h-3" /> Time:
                      </span>
                      <span className="font-mono">{durationMin} min</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400 flex items-center gap-1">
                        <LuUsers className="w-3 h-3" /> Pax / Orders:
                      </span>
                      <span className="font-mono">
                        {session?.pax || 1} pax ({orderCount})
                      </span>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Running Total:</span>
                      <span className="font-mono font-black text-emerald-400 text-sm">
                        {currency}{runningTotal}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-white/5">
                {isAvailable ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSeatingModalTable(t.tableNumber)}
                      className="inline-flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
                    >
                      <LuPlus className="w-3.5 h-3.5" />
                      Seat
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectTableForPos(t.tableNumber)}
                      className="inline-flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/30 text-xs font-bold transition-all cursor-pointer"
                      title={`Open POS with Table ${t.tableNumber} pre-selected`}
                    >
                      <LuUtensils className="w-3 h-3" />
                      Order
                    </button>
                  </div>
                ) : isSettled ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleManualFree(session)}
                      className="inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                      title="Free table now without waiting 60 seconds"
                    >
                      <LuCheck className="w-3.5 h-3.5" />
                      Free Now
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectTableForBilling(session)}
                      className="inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <LuReceipt className="w-3 h-3" />
                      Receipt
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectTableForPos(t.tableNumber)}
                        className="inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors cursor-pointer"
                        title={`Add Items to Table ${t.tableNumber} via POS`}
                      >
                        <LuUtensils className="w-3 h-3" />
                        Add Food
                      </button>
                      <button
                        type="button"
                        data-tour="table-settle-action"
                        onClick={() => onSelectTableForBilling(session)}
                        className={`inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          isBilling
                            ? "bg-rose-600 hover:bg-rose-500 text-white shadow-sm"
                            : "bg-amber-600/30 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30"
                        }`}
                      >
                        <LuReceipt className="w-3 h-3" />
                        {isBilling ? "Settle Bill" : "View Bill"}
                      </button>
                    </div>

                    {/* Quick Free Button if table has 0 orders / 0 total */}
                    {orderCount === 0 && runningTotal === 0 && (
                      <button
                        type="button"
                        onClick={() => handleManualFree(session)}
                        className="w-full py-1 rounded-lg text-[10px] text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all flex items-center justify-center gap-1 cursor-pointer"
                        title="Release this empty table session"
                      >
                        <LuTrash2 className="w-2.5 h-2.5" />
                        Clear Empty Table
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Seat Guest Modal */}
      {seatingModalTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#12121e] border border-white/10 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-sm">
                  T{seatingModalTable}
                </div>
                <h3 className="font-bold text-white text-base">Seat Table {seatingModalTable}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSeatingModalTable(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <LuX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSeatGuest} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Customer / Guest Name
                </label>
                <input
                  type="text"
                  placeholder={`e.g. Table ${seatingModalTable} Guest`}
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Party Size (Pax)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={pax}
                  onChange={(e) => setPax(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSeatingModalTable(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Seating..." : "Confirm & Seat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
