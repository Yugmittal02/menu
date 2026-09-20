import React, { useState, useEffect } from 'react';
import {
  getAdminSupportStats,
  getAdminSupportTickets,
  getAdminTicketDetail,
  adminReplySupportTicket,
  updateSupportTicketStatus,
  updateSupportTicketPriority,
  assignSupportTicket
} from '../../services/api';
import {
  LuLifeBuoy,
  LuTicket,
  LuClock,
  LuTriangleAlert,
  LuCircleCheck,
  LuHourglass,
  LuSearch,
  LuFilter,
  LuRefreshCw,
  LuUser,
  LuSend,
  LuLock,
  LuMessageSquare,
  LuPaperclip,
  LuShieldAlert,
  LuX,
  LuExternalLink
} from 'react-icons/lu';
import KrixovLogo from '../brand/KrixovLogo';
import { BRAND } from '../brand/brandConstants';

const CATEGORIES = [
  'All',
  'Login',
  'QR Menu',
  'Orders',
  'Tables',
  'Billing',
  'GST',
  'Payments',
  'Printer',
  'Inventory',
  'Reservations',
  'Menu',
  'Technical Issue',
  'Other'
];

const STATUSES = [
  'All',
  'Open',
  'Acknowledged',
  'In Progress',
  'Waiting for Customer',
  'Resolved',
  'Closed',
  'Reopened'
];

const PRIORITIES = ['All', 'Low', 'Medium', 'High', 'Urgent'];

export default function SuperAdminSupportTab() {
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected ticket modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  // Quick edit status/priority/assign
  const [agentNameInput, setAgentNameInput] = useState('');

  // Fetch KPI Stats
  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const res = await getAdminSupportStats();
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load support stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch Tickets
  const loadTickets = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (priorityFilter !== 'All') params.priority = priorityFilter;
      if (categoryFilter !== 'All') params.category = categoryFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await getAdminSupportTickets(params);
      setTickets(res.data || []);
    } catch (err) {
      console.error('Failed to load admin support tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadTickets();
  }, [statusFilter, priorityFilter, categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadTickets();
  };

  // Open ticket detail
  const handleOpenTicket = async (t) => {
    try {
      const res = await getAdminTicketDetail(t._id || t.ticketId);
      setSelectedTicket(res.data || t);
      setAgentNameInput(res.data?.assignedTo?.name || '');
    } catch (err) {
      setSelectedTicket(t);
      setAgentNameInput(t.assignedTo?.name || '');
    }
  };

  // Post Admin Reply or Internal Note
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;
    setSubmittingReply(true);
    try {
      const res = await adminReplySupportTicket(selectedTicket._id || selectedTicket.ticketId, {
        message: replyMessage.trim(),
        isInternalNote
      });
      setSelectedTicket(res.data?.ticket || selectedTicket);
      setReplyMessage('');
      setIsInternalNote(false);
      loadTickets();
      loadStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post reply.');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Change Status
  const handleUpdateStatus = async (newStatus) => {
    if (!selectedTicket) return;
    try {
      const res = await updateSupportTicketStatus(selectedTicket._id || selectedTicket.ticketId, {
        status: newStatus
      });
      setSelectedTicket(res.data?.ticket || { ...selectedTicket, status: newStatus });
      loadTickets();
      loadStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    }
  };

  // Change Priority
  const handleUpdatePriority = async (newPriority) => {
    if (!selectedTicket) return;
    try {
      const res = await updateSupportTicketPriority(selectedTicket._id || selectedTicket.ticketId, {
        priority: newPriority
      });
      setSelectedTicket(res.data?.ticket || { ...selectedTicket, priority: newPriority });
      loadTickets();
      loadStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update priority.');
    }
  };

  // Assign Agent
  const handleAssignAgent = async () => {
    if (!selectedTicket || !agentNameInput.trim()) return;
    try {
      const res = await assignSupportTicket(selectedTicket._id || selectedTicket.ticketId, {
        agentName: agentNameInput.trim(),
        agentEmail: `${agentNameInput.toLowerCase().replace(/\s+/g, '')}@krixov.com`
      });
      setSelectedTicket(res.data?.ticket || selectedTicket);
      loadTickets();
      alert('Ticket assigned successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign ticket.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner: Krixov Support Center */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#121226] via-[#1A1A38] to-[#251A40] border border-white/10 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-200 shadow-lg">
            <LuLifeBuoy size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-white tracking-tight">Krixov Support Center</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Global Operations
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Centralized support ticketing, incident management, and tenant communications.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            loadStats();
            loadTickets();
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 border border-white/10 transition"
        >
          <LuRefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh All</span>
        </button>
      </div>

      {/* KPI Dashboard Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-[#121222] border border-white/5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Open Tickets</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-amber-400">{stats?.openTickets ?? '-'}</span>
            <LuHourglass className="text-amber-400/60" size={18} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#121222] border border-rose-900/30 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300">Urgent Tickets</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-rose-400">{stats?.urgentTickets ?? '-'}</span>
            <LuTriangleAlert className="text-rose-400/60" size={18} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#121222] border border-white/5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">In Progress</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-blue-400">{stats?.inProgressTickets ?? '-'}</span>
            <LuClock className="text-blue-400/60" size={18} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#121222] border border-white/5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">Waiting Customer</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-purple-400">{stats?.waitingForCustomer ?? '-'}</span>
            <LuMessageSquare className="text-purple-400/60" size={18} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#121222] border border-white/5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Resolved Today</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-emerald-400">{stats?.resolvedToday ?? '-'}</span>
            <LuCheckCircle2 className="text-emerald-400/60" size={18} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#121222] border border-white/5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg Resolution</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-white">{stats?.averageResolutionTimeHours ?? '2.5'}h</span>
            <LuClock className="text-slate-400" size={18} />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-[#121222] border border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 shrink-0">
            <LuFilter size={13} />
            <span>Filter:</span>
          </span>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white outline-none focus:border-purple-500"
          >
            {STATUSES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white outline-none focus:border-purple-500"
          >
            {PRIORITIES.map(p => <option key={p} value={p}>{p === 'All' ? 'All Priorities' : p}</option>)}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white outline-none focus:border-purple-500"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
          </select>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-72">
          <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ticket, restaurant, subject..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 outline-none focus:border-purple-500"
          />
        </form>
      </div>

      {/* Tickets Table */}
      <div className="rounded-3xl bg-[#121222] border border-white/5 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Ticket ID</th>
                <th className="py-3.5 px-4">Restaurant</th>
                <th className="py-3.5 px-4">Subject</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Assigned To</th>
                <th className="py-3.5 px-4">Created</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <LuRefreshCw className="animate-spin mx-auto mb-2 text-purple-400" size={20} />
                    <span>Loading tickets...</span>
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <LuTicket size={24} className="mx-auto mb-2 opacity-40" />
                    <span>No support tickets match the selected filters.</span>
                  </td>
                </tr>
              ) : (
                tickets.map((t) => {
                  const isUrgent = t.priority === 'Urgent';
                  const isResolved = t.status === 'Resolved' || t.status === 'Closed';

                  return (
                    <tr
                      key={t._id || t.ticketId}
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                      onClick={() => handleOpenTicket(t)}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-purple-300">
                        {t.ticketId}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {t.restaurantName || 'Cafe'}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-200">
                        {t.subject}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-semibold border border-white/5">
                          {t.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                          isUrgent
                            ? 'bg-rose-900/40 text-rose-300 border-rose-700'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isResolved
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                            : t.status === 'In Progress'
                            ? 'bg-blue-950/60 text-blue-300 border border-blue-800'
                            : 'bg-amber-950/60 text-amber-300 border border-amber-800'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {t.assignedTo?.name || 'Unassigned'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTicket(t);
                          }}
                          className="px-3 py-1 rounded-lg text-xs font-bold text-purple-300 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 transition"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SUPER ADMIN TICKET DETAIL & ACTION MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-3xl max-h-[92vh] rounded-3xl bg-[#121226] border border-white/10 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#16162E]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-purple-300">
                    {selectedTicket.ticketId}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-bold text-white">
                    {selectedTicket.restaurantName || 'Restaurant'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/5 text-slate-300 border border-white/10">
                    {selectedTicket.category}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  {selectedTicket.subject}
                </h3>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
              >
                <LuX size={18} />
              </button>
            </div>

            {/* Quick Status, Priority & Assignment Bar */}
            <div className="px-5 py-3 border-b border-white/5 bg-[#141428] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-semibold">Status:</span>
                <select
                  value={selectedTicket.status}
                  onChange={(e) => handleUpdateStatus(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-[#1F1F38] border border-white/10 text-white font-bold outline-none"
                >
                  {STATUSES.filter(s => s !== 'All').map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-semibold">Priority:</span>
                <select
                  value={selectedTicket.priority}
                  onChange={(e) => handleUpdatePriority(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-[#1F1F38] border border-white/10 text-white font-bold outline-none"
                >
                  {PRIORITIES.filter(p => p !== 'All').map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-semibold">Assignee:</span>
                <input
                  type="text"
                  value={agentNameInput}
                  onChange={(e) => setAgentNameInput(e.target.value)}
                  placeholder="Agent Name"
                  className="px-2.5 py-1 rounded-lg bg-[#1F1F38] border border-white/10 text-white text-xs w-28 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAssignAgent}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-purple-300 bg-purple-600/20 hover:bg-purple-600/30 transition"
                >
                  Assign
                </button>
              </div>
            </div>

            {/* Conversation Messages Thread */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#0F0F1D]">
              {(selectedTicket.conversation || []).map((msg, idx) => {
                const isInternal = msg.isInternalNote;
                const isSuperAdmin = msg.sender?.role === 'superadmin' && !isInternal;
                const isCafe = !isInternal && !isSuperAdmin;

                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${
                      isInternal
                        ? 'items-center'
                        : isSuperAdmin
                        ? 'items-end'
                        : 'items-start'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                      {isInternal ? (
                        <span className="font-bold text-amber-300 flex items-center gap-1">
                          <LuLock size={10} />
                          <span>Internal Admin Note</span>
                        </span>
                      ) : (
                        <span className="font-semibold text-slate-300">
                          {msg.sender?.name || (isSuperAdmin ? 'Krixov Support' : 'Cafe Staff')}
                        </span>
                      )}
                      <span>•</span>
                      <span>{new Date(msg.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>

                    <div
                      className={`max-w-[88%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isInternal
                          ? 'bg-amber-950/40 border border-amber-600/40 text-amber-200 w-full'
                          : isSuperAdmin
                          ? 'bg-purple-600 text-white rounded-tr-none'
                          : 'bg-[#1E1E34] text-slate-200 border border-white/10 rounded-tl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Admin Response Box (Public Reply vs Internal Note) */}
            <div className="p-4 border-t border-white/10 bg-[#16162E] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInternalNote(false)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      !isInternalNote
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-400 hover:text-white bg-white/5'
                    }`}
                  >
                    Reply to Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsInternalNote(true)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      isInternalNote
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-amber-400/80 hover:text-amber-300 bg-amber-950/30'
                    }`}
                  >
                    <LuLock size={12} />
                    <span>Internal Note (Private)</span>
                  </button>
                </div>

                <span className="text-[10px] text-slate-400">
                  {isInternalNote
                    ? '🔒 Visible only to SuperAdmin team'
                    : '🌐 Visible to customer on cafe dashboard'}
                </span>
              </div>

              <form onSubmit={handleSendReply} className="space-y-2">
                <textarea
                  rows={3}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder={
                    isInternalNote
                      ? 'Add private diagnostic note, server log references or escalation notes...'
                      : 'Type official response to the restaurant owner...'
                  }
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs outline-none focus:ring-2 resize-y ${
                    isInternalNote
                      ? 'bg-amber-950/20 border border-amber-500/30 text-amber-200 placeholder:text-amber-500/50 focus:ring-amber-500/30'
                      : 'bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500'
                  }`}
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="submit"
                    disabled={submittingReply || !replyMessage.trim()}
                    className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5 disabled:opacity-50 ${
                      isInternalNote
                        ? 'bg-amber-600 hover:bg-amber-500 text-slate-950'
                        : 'bg-purple-600 hover:bg-purple-500'
                    }`}
                  >
                    <span>{isInternalNote ? 'Save Internal Note' : 'Send Reply'}</span>
                    <LuSend size={12} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
