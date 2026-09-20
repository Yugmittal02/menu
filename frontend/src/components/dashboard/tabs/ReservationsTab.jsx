import React, { useState, useMemo } from "react";
import {
  LuCalendar,
  LuClock,
  LuUsers,
  LuPhone,
  LuMail,
  LuPlus,
  LuCheck,
  LuX,
  LuArmchair,
  LuFilter,
  LuTrash2
} from "react-icons/lu";

export default function ReservationsTab({
  reservations = [],
  cafe = {},
  onCreateReservation,
  onUpdateStatus,
  onSeatGuest,
  onDeleteReservation
}) {
  const [selectedDateFilter, setSelectedDateFilter] = useState("all"); // 'today' | 'tomorrow' | 'all'
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Modal Form State
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    pax: 2,
    reservationDate: new Date().toISOString().slice(0, 10),
    timeSlot: "19:00",
    tableNumber: "",
    specialRequests: ""
  });

  const tableCount = cafe?.tableCount || 10;

  // Filtered reservations
  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;

      if (selectedDateFilter === "today") {
        const todayStr = new Date().toISOString().slice(0, 10);
        return (r.reservationDate || "").slice(0, 10) === todayStr;
      } else if (selectedDateFilter === "tomorrow") {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().slice(0, 10);
        return (r.reservationDate || "").slice(0, 10) === tomorrowStr;
      }
      return true;
    });
  }, [reservations, selectedDateFilter, statusFilter]);

  // Counts
  const totalCount = reservations.length;
  const confirmedCount = reservations.filter((r) => r.status === "confirmed").length;
  const seatedCount = reservations.filter((r) => r.status === "seated").length;
  const cancelledCount = reservations.filter((r) => r.status === "cancelled").length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onCreateReservation({
        ...formData,
        pax: parseInt(formData.pax) || 2,
        tableNumber: formData.tableNumber ? parseInt(formData.tableNumber) : null
      });
      setIsModalOpen(false);
      setFormData({
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        pax: 2,
        reservationDate: new Date().toISOString().slice(0, 10),
        timeSlot: "19:00",
        tableNumber: "",
        specialRequests: ""
      });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create reservation");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "confirmed":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20">Confirmed</span>;
      case "seated":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">Seated</span>;
      case "cancelled":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/20">Cancelled</span>;
      case "no-show":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">No Show</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-300">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <LuCalendar className="w-5 h-5 text-violet-400" />
            Table Reservations
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage advance table bookings and assign arriving guests directly to tables
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          data-tour="reservations-new-btn"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
        >
          <LuPlus className="w-4 h-4" />
          New Reservation
        </button>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#131322] border border-white/5">
          <span className="text-xs font-medium text-slate-400">Total Bookings</span>
          <div className="text-2xl font-black text-white mt-1 font-mono">{totalCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#131322] border border-white/5">
          <span className="text-xs font-medium text-blue-400">Confirmed</span>
          <div className="text-2xl font-black text-blue-400 mt-1 font-mono">{confirmedCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#131322] border border-white/5">
          <span className="text-xs font-medium text-emerald-400">Seated</span>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">{seatedCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#131322] border border-white/5">
          <span className="text-xs font-medium text-rose-400">Cancelled / No-show</span>
          <div className="text-2xl font-black text-rose-400 mt-1 font-mono">{cancelledCount}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#131322] border border-white/5">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {["today", "tomorrow", "all"].map((f) => (
            <button
              key={f}
              onClick={() => setSelectedDateFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                selectedDateFilter === f
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {f === "today" ? "Today" : f === "tomorrow" ? "Tomorrow" : "All Dates"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <LuFilter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="seated">Seated</option>
            <option value="cancelled">Cancelled</option>
            <option value="no-show">No Show</option>
          </select>
        </div>
      </div>

      {/* Reservations Grid */}
      {filteredReservations.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-[#131322] border border-white/5">
          <LuCalendar className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
          <h4 className="text-base font-bold text-white">No Reservations Found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            There are no table reservations matching your current filters. Add a new reservation to get started.
          </p>
        </div>
      ) : (
        <div data-tour="res-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReservations.map((res) => (
            <div
              key={res._id}
              className="p-5 rounded-2xl bg-[#131322] border border-white/5 hover:border-violet-500/30 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-base font-bold text-white leading-snug">{res.customerName}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1 font-mono">
                        <LuClock className="w-3.5 h-3.5 text-violet-400" />
                        {res.timeSlot}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <LuUsers className="w-3.5 h-3.5 text-slate-400" />
                        {res.pax} Guests
                      </span>
                    </div>
                  </div>
                  <div>{getStatusBadge(res.status)}</div>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs text-slate-300 bg-black/20 p-3 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <LuPhone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <a href={`tel:${res.customerPhone}`} className="hover:text-violet-300 transition-colors font-mono">
                      {res.customerPhone}
                    </a>
                  </div>
                  {res.customerEmail && (
                    <div className="flex items-center gap-2 truncate">
                      <LuMail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{res.customerEmail}</span>
                    </div>
                  )}
                  <div data-tour="res-table" className="flex items-center gap-2">
                    <LuArmchair className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>
                      {res.tableNumber ? `Assigned Table: Table ${res.tableNumber}` : "No table pre-assigned"}
                    </span>
                  </div>
                  {res.specialRequests && (
                    <div className="text-[11px] text-amber-300/90 italic pt-1 border-t border-white/5">
                      "{res.specialRequests}"
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                {res.status === "confirmed" && (
                  <button
                    data-tour="res-seat-btn"
                    onClick={() => {
                      let target = res.tableNumber;
                      if (!target) {
                        const entered = window.prompt(`Assign a table number for ${res.customerName} (1 to ${tableCount}):`, "1");
                        if (!entered) return;
                        target = parseInt(entered, 10);
                        if (isNaN(target) || target < 1) {
                          alert("Please enter a valid table number");
                          return;
                        }
                      }
                      onSeatGuest(res._id, target);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    <LuArmchair className="w-3.5 h-3.5" />
                    Seat Guest
                  </button>
                )}
                {res.status === "confirmed" && (
                  <button
                    onClick={() => onUpdateStatus(res._id, "cancelled")}
                    className="px-3 py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition-all cursor-pointer"
                    title="Cancel Reservation"
                  >
                    <LuX className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => onDeleteReservation(res._id)}
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-white/5 transition-all cursor-pointer ml-auto"
                  title="Delete"
                >
                  <LuTrash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Reservation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#12121e] border border-white/10 rounded-3xl shadow-2xl p-6 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <LuCalendar className="w-4 h-4 text-violet-400" />
                Add New Table Reservation
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <LuX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="e.g. Rahul Verma"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Guest Count (Pax)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={formData.pax}
                    onChange={(e) => setFormData({ ...formData, pax: e.target.value })}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.reservationDate}
                    onChange={(e) => setFormData({ ...formData, reservationDate: e.target.value })}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Time Slot *</label>
                  <input
                    type="time"
                    required
                    value={formData.timeSlot}
                    onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assign Table (Optional)</label>
                <select
                  value={formData.tableNumber}
                  onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="">No table assigned yet</option>
                  {[...Array(tableCount)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Table {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Special Requests</label>
                <textarea
                  rows="2"
                  value={formData.specialRequests}
                  onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                  placeholder="e.g. Window side, birthday celebration setup..."
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
                >
                  {loading ? "Saving..." : "Create Reservation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
