import React, { useState } from "react";
import {
  LuUserCheck,
  LuPlus,
  LuKeyRound,
  LuTrash2,
  LuPhone,
  LuShieldCheck,
  LuX,
  LuCheck,
  LuUserX,
  LuLock
} from "react-icons/lu";

export default function StaffTab({
  staff = [],
  onCreateStaff,
  onResetPin,
  onToggleStaff,
  onDeleteStaff
}) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [resetPinStaff, setResetPinStaff] = useState(null);
  const [newPin, setNewPin] = useState("");
  const [loading, setLoading] = useState(false);

  // New staff form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    role: "waiter",
    pin: ""
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (formData.pin.length !== 4) {
      alert("PIN must be exactly 4 digits");
      return;
    }
    setLoading(true);
    try {
      await onCreateStaff(formData);
      setIsAddModalOpen(false);
      setFormData({ name: "", phone: "", role: "waiter", pin: "" });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create staff member");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPinSubmit = async (e) => {
    e.preventDefault();
    if (newPin.length !== 4) {
      alert("PIN must be exactly 4 digits");
      return;
    }
    setLoading(true);
    try {
      await onResetPin(resetPinStaff._id, newPin);
      setResetPinStaff(null);
      setNewPin("");
      alert("PIN reset successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reset PIN");
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "manager":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">Manager</span>;
      case "cashier":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Cashier</span>;
      case "kitchen":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">Kitchen Chef</span>;
      case "waiter":
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">Waitstaff</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <LuUserCheck className="w-5 h-5 text-violet-400" />
            Staff Accounts & Roles
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage team members, roles, and 4-digit PIN authentication for rapid POS terminal switching
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          data-tour="staff-add-member-btn"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
        >
          <LuPlus className="w-4 h-4" />
          Add Staff Member
        </button>
      </div>

      {/* Staff Cards Grid */}
      {staff.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-[#131322] border border-white/5">
          <LuUserCheck className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
          <h4 className="text-base font-bold text-white">No Staff Accounts Yet</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Create staff accounts for your managers, cashiers, and waitstaff with 4-digit PINs for quick POS switching.
          </p>
        </div>
      ) : (
        <div data-tour="staff-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((member) => (
            <div
              key={member._id}
              className={`p-5 rounded-2xl bg-[#131322] border transition-all flex flex-col justify-between space-y-4 ${
                member.isActive ? "border-white/5 hover:border-violet-500/30" : "border-rose-500/20 opacity-70"
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold text-base uppercase">
                      {member.name ? member.name.charAt(0) : "S"}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white leading-tight">{member.name}</h3>
                      <div className="mt-1">{getRoleBadge(member.role)}</div>
                    </div>
                  </div>
                  <span
                    className={`inline-block w-2.5 h-2.5 rounded-full ${
                      member.isActive ? "bg-emerald-400 animate-pulse" : "bg-rose-500"
                    }`}
                    title={member.isActive ? "Active" : "Inactive"}
                  />
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs text-slate-300 bg-black/20 p-3 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <LuPhone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="font-mono">{member.phone || "No phone provided"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <LuShieldCheck className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="text-[11px] text-slate-400 capitalize">
                      {(member.permissions || []).length} permissions active
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2 text-xs">
                <button
                  data-tour="staff-pin"
                  onClick={() => setResetPinStaff(member)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-medium transition-colors cursor-pointer"
                >
                  <LuKeyRound className="w-3.5 h-3.5 text-violet-400" />
                  Reset PIN
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onToggleStaff(member._id)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      member.isActive
                        ? "text-slate-400 hover:text-amber-400 hover:bg-amber-500/10"
                        : "text-emerald-400 hover:bg-emerald-500/10"
                    }`}
                    title={member.isActive ? "Deactivate" : "Activate"}
                  >
                    {member.isActive ? <LuUserX className="w-4 h-4" /> : <LuCheck className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => onDeleteStaff(member._id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete Staff"
                  >
                    <LuTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#12121e] border border-white/10 rounded-3xl shadow-2xl p-6 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <LuUserCheck className="w-4 h-4 text-violet-400" />
                Add New Staff Member
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <LuX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Staff Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="waiter">Waitstaff</option>
                    <option value="cashier">Cashier</option>
                    <option value="kitchen">Kitchen Chef</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">4-Digit PIN *</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    pattern="[0-9]{4}"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, "") })}
                    placeholder="1234"
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 font-mono tracking-widest text-center focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
                >
                  {loading ? "Adding..." : "Add Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset PIN Modal */}
      {resetPinStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-[#12121e] border border-white/10 rounded-3xl shadow-2xl p-6 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <LuKeyRound className="w-4 h-4 text-violet-400" />
                Reset PIN for {resetPinStaff.name}
              </h3>
              <button
                onClick={() => setResetPinStaff(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <LuX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Enter New 4-Digit PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  pattern="[0-9]{4}"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-base text-white placeholder-slate-500 font-mono tracking-widest text-center focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setResetPinStaff(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
                >
                  {loading ? "Updating..." : "Save New PIN"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
