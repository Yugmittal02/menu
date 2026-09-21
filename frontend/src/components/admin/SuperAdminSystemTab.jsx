import React, { useState, useEffect } from 'react';
import {
  getSystemModules,
  updateSystemModules,
  getAllNoticesAdmin,
  createAdminNotice,
  toggleAdminNotice,
  deleteAdminNotice,
  getAllCafes
} from '../../services/api';
import {
  LuSlidersHorizontal as LuSliders,
  LuMegaphone,
  LuWrench,
  LuClock,
  LuCircleCheck as LuCheckCircle,
  LuBan,
  LuSend,
  LuTrash2,
  LuToggleLeft,
  LuToggleRight,
  LuRefreshCw,
  LuCheck,
  LuShieldAlert,
  LuUsers,
  LuTriangleAlert as LuAlertTriangle,
  LuFlame,
  LuInfo
} from 'react-icons/lu';

const MODULE_DEFINITIONS = [
  { key: 'payments', label: 'Online Payments', desc: 'Cashfree PG, UPI split, and online checkout' },
  { key: 'inventory', label: 'Inventory & Stock', desc: 'Recipe ingredients, 86 stock toggles, and restock' },
  { key: 'coupons', label: 'Coupons & Offers', desc: 'Promo codes, discounts, and public campaigns' },
  { key: 'reservations', label: 'Table Reservations', desc: 'Dine-in booking system and guest schedule' },
  { key: 'crm', label: 'Customer CRM', desc: 'Guest database, visit history, and loyalty records' },
  { key: 'kot', label: 'Kitchen & KOT', desc: 'Kitchen order tickets and chef display engine' }
];

export default function SuperAdminSystemTab() {
  const [activeSection, setActiveSection] = useState('modules'); // 'modules' | 'notices'

  // Modules State
  const [modules, setModules] = useState({});
  const [loadingModules, setLoadingModules] = useState(true);
  const [savingModules, setSavingModules] = useState(false);
  const [moduleSavedToast, setModuleSavedToast] = useState(false);

  // Notices State
  const [notices, setNotices] = useState([]);
  const [loadingNotices, setLoadingNotices] = useState(true);
  const [cafes, setCafes] = useState([]);
  const [creatingNotice, setCreatingNotice] = useState(false);

  // Notice Form State
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    message: '',
    priority: 'info',
    targetType: 'all',
    targetCafes: [],
    isPopup: true
  });

  // Load modules
  const loadModules = async () => {
    setLoadingModules(true);
    try {
      const res = await getSystemModules();
      if (res.data?.modules) {
        setModules(res.data.modules);
      }
    } catch (err) {
      console.error('Failed to load modules:', err);
    } finally {
      setLoadingModules(false);
    }
  };

  // Load notices and cafes list for targeting
  const loadNoticesAndCafes = async () => {
    setLoadingNotices(true);
    try {
      const [noticesRes, cafesRes] = await Promise.allSettled([
        getAllNoticesAdmin(),
        getAllCafes()
      ]);
      if (noticesRes.status === 'fulfilled') {
        setNotices(noticesRes.value.data?.notices || []);
      }
      if (cafesRes.status === 'fulfilled') {
        setCafes(cafesRes.value.data || []);
      }
    } catch (err) {
      console.error('Failed to load notices/cafes:', err);
    } finally {
      setLoadingNotices(false);
    }
  };

  useEffect(() => {
    loadModules();
    loadNoticesAndCafes();
  }, []);

  // Handle module status change in local state
  const handleStatusChange = (moduleKey, newStatus) => {
    setModules((prev) => ({
      ...prev,
      [moduleKey]: {
        ...(prev[moduleKey] || {}),
        status: newStatus
      }
    }));
  };

  // Handle module message change
  const handleMessageChange = (moduleKey, newMsg) => {
    setModules((prev) => ({
      ...prev,
      [moduleKey]: {
        ...(prev[moduleKey] || {}),
        message: newMsg
      }
    }));
  };

  // Save module statuses to server
  const handleSaveModules = async () => {
    setSavingModules(true);
    try {
      await updateSystemModules({ modules });
      setModuleSavedToast(true);
      setTimeout(() => setModuleSavedToast(false), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update system module settings');
    } finally {
      setSavingModules(false);
    }
  };

  // Toggle cafe selection in specific targeting
  const toggleCafeSelection = (cafeId) => {
    setNoticeForm((prev) => {
      const exists = prev.targetCafes.includes(cafeId);
      return {
        ...prev,
        targetCafes: exists
          ? prev.targetCafes.filter((id) => id !== cafeId)
          : [...prev.targetCafes, cafeId]
      };
    });
  };

  // Submit new notice
  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!noticeForm.title.trim() || !noticeForm.message.trim()) {
      alert('Please provide both title and message.');
      return;
    }

    if (noticeForm.targetType === 'specific' && noticeForm.targetCafes.length === 0) {
      alert('Please select at least one cafe for targeted notice.');
      return;
    }

    setCreatingNotice(true);
    try {
      const res = await createAdminNotice(noticeForm);
      if (res.data?.notice) {
        setNotices((prev) => [res.data.notice, ...prev]);
        setNoticeForm({
          title: '',
          message: '',
          priority: 'info',
          targetType: 'all',
          targetCafes: [],
          isPopup: true
        });
        alert('Announcement successfully broadcasted!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to broadcast announcement.');
    } finally {
      setCreatingNotice(false);
    }
  };

  // Toggle notice active status
  const handleToggleNotice = async (id) => {
    try {
      const res = await toggleAdminNotice(id);
      if (res.data?.notice) {
        setNotices((prev) =>
          prev.map((n) => (n._id === id ? { ...n, active: res.data.notice.active } : n))
        );
      }
    } catch (err) {
      alert('Failed to toggle notice status.');
    }
  };

  // Delete notice
  const handleDeleteNotice = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete notice: "${title}"?`)) return;
    try {
      await deleteAdminNotice(id);
      setNotices((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      alert('Failed to delete notice.');
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'warning':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'maintenance':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#121226] via-[#1A1A38] to-[#251A40] border border-white/10 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-200 shadow-lg">
            <LuSliders size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-white tracking-tight">System & Notice Controller</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                Admin Center
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Toggle module maintenance & coming soon states, or broadcast pop-up notices to cafes.
            </p>
          </div>
        </div>

        {/* Section Switcher Tabs */}
        <div className="flex items-center gap-2 bg-[#0F0F1D] p-1.5 rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() => setActiveSection('modules')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSection === 'modules'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LuWrench size={14} />
            <span>Module Maintenance</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('notices')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSection === 'notices'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LuMegaphone size={14} />
            <span>Notice Board & Pop-ups</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: MODULE MAINTENANCE CONTROLLER */}
      {activeSection === 'modules' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Platform Feature Control</h2>
              <p className="text-xs text-slate-400">
                Mark modules as Under Maintenance or Coming Soon. Frontend UI will disable them safely while backend remains operational.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {moduleSavedToast && (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 animate-fadeIn">
                  <LuCheck size={14} />
                  <span>Saved!</span>
                </span>
              )}
              <button
                type="button"
                onClick={handleSaveModules}
                disabled={savingModules}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/30 transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <LuCheck size={14} />
                <span>{savingModules ? 'Saving...' : 'Save Module Settings'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MODULE_DEFINITIONS.map((def) => {
              const current = modules[def.key] || { status: 'active', message: '' };
              const status = current.status || 'active';

              return (
                <div
                  key={def.key}
                  className={`p-5 rounded-3xl bg-[#121226] border transition-all space-y-4 shadow-xl ${
                    status === 'active'
                      ? 'border-emerald-500/30 hover:border-emerald-500/50'
                      : status === 'maintenance'
                      ? 'border-amber-500/40 bg-amber-950/10'
                      : status === 'soon'
                      ? 'border-purple-500/40 bg-purple-950/10'
                      : 'border-white/10 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-white">{def.label}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">{def.desc}</p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : status === 'maintenance'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : status === 'soon'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {status === 'soon' ? 'Coming Soon' : status}
                    </span>
                  </div>

                  {/* Status Selection Buttons */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-400">Target State:</label>
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      {[
                        { id: 'active', label: 'Active', icon: <LuCheckCircle size={12} />, color: 'hover:border-emerald-500' },
                        { id: 'maintenance', label: 'Maintenance', icon: <LuWrench size={12} />, color: 'hover:border-amber-500' },
                        { id: 'soon', label: 'Coming Soon', icon: <LuClock size={12} />, color: 'hover:border-purple-500' },
                        { id: 'disabled', label: 'Disabled', icon: <LuBan size={12} />, color: 'hover:border-slate-500' }
                      ].map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => handleStatusChange(def.key, st.id)}
                          className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold transition text-[11px] border cursor-pointer ${
                            status === st.id
                              ? 'bg-white/15 text-white border-white/40 shadow-sm'
                              : 'bg-white/5 text-slate-400 border-transparent hover:text-white ' + st.color
                          }`}
                        >
                          {st.icon}
                          <span>{st.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Message input */}
                  {status !== 'active' && (
                    <div className="space-y-1 pt-1">
                      <label className="text-[10px] font-semibold text-slate-400">Notice for Cafe Staff:</label>
                      <input
                        type="text"
                        placeholder="e.g. Under scheduled upgrade..."
                        value={current.message || ''}
                        onChange={(e) => handleMessageChange(def.key, e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-600 outline-none focus:border-purple-500"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: NOTICE BOARD & POP-UPS */}
      {activeSection === 'notices' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Notice Creation Form */}
          <div className="p-6 rounded-3xl bg-[#121226] border border-white/10 shadow-2xl space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                <LuMegaphone size={16} />
              </div>
              <h2 className="text-base font-bold text-white">Broadcast New Announcement</h2>
            </div>

            <form onSubmit={handleCreateNotice} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Notice Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Scheduled System Upgrade at 2 AM"
                    value={noticeForm.title}
                    onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-600 outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Priority Level</label>
                  <select
                    value={noticeForm.priority}
                    onChange={(e) => setNoticeForm({ ...noticeForm, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#1A1A36] border border-white/10 text-xs text-white outline-none focus:border-purple-500"
                  >
                    <option value="info">Info (Standard)</option>
                    <option value="warning">Warning (Important)</option>
                    <option value="urgent">Urgent (Immediate Action)</option>
                    <option value="maintenance">Maintenance Notification</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Announcement Message</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Type the announcement message that will appear on the cafe dashboard..."
                  value={noticeForm.message}
                  onChange={(e) => setNoticeForm({ ...noticeForm, message: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-600 outline-none focus:border-purple-500"
                />
              </div>

              {/* Target Selection: All vs Specific Cafes */}
              <div className="p-4 rounded-2xl bg-[#171732] border border-white/5 space-y-3">
                <label className="block text-xs font-semibold text-slate-300">Audience Targeting</label>
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="targetType"
                      checked={noticeForm.targetType === 'all'}
                      onChange={() => setNoticeForm({ ...noticeForm, targetType: 'all', targetCafes: [] })}
                      className="accent-purple-600"
                    />
                    <span className="text-white font-medium">All Cafes (Global Broadcast)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="targetType"
                      checked={noticeForm.targetType === 'specific'}
                      onChange={() => setNoticeForm({ ...noticeForm, targetType: 'specific' })}
                      className="accent-purple-600"
                    />
                    <span className="text-white font-medium">Selected Cafe(s) Only</span>
                  </label>
                </div>

                {/* Cafe Checkboxes if specific */}
                {noticeForm.targetType === 'specific' && (
                  <div className="pt-2 border-t border-white/5 space-y-2">
                    <p className="text-[11px] text-slate-400">Select which cafes will receive this notice:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                      {cafes.map((c) => {
                        const isChecked = noticeForm.targetCafes.includes(c._id);
                        return (
                          <label
                            key={c._id}
                            className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition ${
                              isChecked
                                ? 'bg-purple-600/20 border-purple-500 text-white font-bold'
                                : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleCafeSelection(c._id)}
                              className="accent-purple-600 rounded"
                            />
                            <span className="truncate">{c.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Pop-up Checkbox & Submit */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noticeForm.isPopup}
                    onChange={(e) => setNoticeForm({ ...noticeForm, isPopup: e.target.checked })}
                    className="accent-purple-600 rounded w-4 h-4"
                  />
                  <span>Show as Pop-up Modal when cafe owner loads dashboard</span>
                </label>

                <button
                  type="submit"
                  disabled={creatingNotice}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/30 transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <LuSend size={14} />
                  <span>{creatingNotice ? 'Broadcasting...' : 'Broadcast Notice'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* List of Sent Notices */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Broadcasted Announcements ({notices.length})</h3>
              <button
                type="button"
                onClick={loadNoticesAndCafes}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
              >
                <LuRefreshCw size={12} className={loadingNotices ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>

            {loadingNotices ? (
              <div className="py-12 text-center text-slate-500 text-xs">Loading announcements...</div>
            ) : notices.length === 0 ? (
              <div className="p-8 text-center glass-card rounded-2xl text-slate-500 text-xs">
                No notices sent yet.
              </div>
            ) : (
              <div className="space-y-3">
                {notices.map((n) => {
                  const targetLabel =
                    n.targetType === 'all'
                      ? 'All Cafes (Global)'
                      : `${(n.targetCafes || []).length} Selected Cafe(s)`;

                  return (
                    <div
                      key={n._id}
                      className="p-5 rounded-3xl bg-[#121226] border border-white/5 space-y-3 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getPriorityBadge(n.priority)}`}>
                            {n.priority}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/5">
                            🎯 {targetLabel}
                          </span>
                          {n.isPopup && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/25">
                              Pop-up Enabled
                            </span>
                          )}
                          <span className="text-[11px] text-slate-500">
                            {new Date(n.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white leading-snug">{n.title}</h4>
                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{n.message}</p>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleNotice(n._id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer bg-white/5 border-white/10 hover:bg-white/10 text-slate-300"
                        >
                          {n.active ? (
                            <>
                              <LuToggleRight className="text-emerald-400 text-lg" />
                              <span className="text-emerald-300">Active</span>
                            </>
                          ) : (
                            <>
                              <LuToggleLeft className="text-slate-500 text-lg" />
                              <span className="text-slate-400">Inactive</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteNotice(n._id, n.title)}
                          className="p-2 rounded-xl text-rose-400 hover:text-white hover:bg-rose-500/20 transition cursor-pointer border border-transparent hover:border-rose-500/30"
                          title="Delete Notice"
                        >
                          <LuTrash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
