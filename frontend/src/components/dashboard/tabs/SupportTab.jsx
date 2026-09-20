import React, { useState, useEffect } from 'react';
import {
  getMySupportTickets,
  createSupportTicket,
  getSupportTicketDetail,
  replySupportTicket,
  resolveSupportTicket,
  reopenSupportTicket,
  getSystemStatus
} from '../../../services/api';
import {
  LuLifeBuoy,
  LuPlus,
  LuTicket,
  LuCircleCheck as LuCheckCircle,
  LuClock,
  LuCircleAlert as LuAlertCircle,
  LuSend,
  LuRefreshCw,
  LuSearch,
  LuPaperclip,
  LuCircleHelp as LuHelpCircle,
  LuExternalLink,
  LuActivity,
  LuShield,
  LuPrinter,
  LuReceipt,
  LuQrCode,
  LuChevronDown,
  LuChevronUp,
  LuX
} from 'react-icons/lu';
import KrixovLogo from '../../brand/KrixovLogo';
import { BRAND } from '../../brand/brandConstants';

const CATEGORIES = [
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

const PRIORITIES = [
  { key: 'Low', label: 'Low', color: 'bg-slate-800 text-slate-300 border-slate-700', desc: 'General question or suggestion' },
  { key: 'Medium', label: 'Medium', color: 'bg-blue-900/40 text-blue-300 border-blue-800', desc: 'Normal issue with workaround' },
  { key: 'High', label: 'High', color: 'bg-amber-900/40 text-amber-300 border-amber-800', desc: 'Major operational problem' },
  { key: 'Urgent', label: 'Urgent', color: 'bg-rose-900/50 text-rose-300 border-rose-700', desc: 'Critical outage or payment blockage' }
];

const FAQS = [
  {
    q: 'How do I connect and test my 58mm or 80mm ESC/POS Thermal Printer?',
    icon: LuPrinter,
    a: 'Navigate to Settings > Hardware & Printers. Ensure your Bluetooth or USB thermal printer is paired with your tablet or PC. Click "Test Print". The system supports standard 58mm and 80mm thermal paper widths without requiring external driver software.'
  },
  {
    q: 'How does GST breakdown (CGST & SGST) calculate on bills?',
    icon: LuReceipt,
    a: 'Under Settings > Taxes & Invoicing, set your GST tax percentage (e.g. 5%). The billing engine automatically calculates 50% as CGST (2.5%) and 50% as SGST (2.5%) with decimal-safe precision. All finalized invoices retain historical tax snapshots.'
  },
  {
    q: 'Can customers place repeated order rounds at the same table?',
    icon: LuQrCode,
    a: 'Yes! When customers scan the QR code for their table, a live table session is created. Subsequent order rounds (beverages, mains, desserts) are linked automatically to the same running session and unified bill.'
  },
  {
    q: 'How do Takeaway orders work without a table assignment?',
    icon: LuTicket,
    a: 'Customers can toggle "Takeaway" at the top of the menu. No table is assigned; instead, the platform issues an order token (e.g. #TKW-4821) for pickup at your counter.'
  },
  {
    q: 'What should I do if a dish runs out of ingredients during service?',
    icon: LuAlertCircle,
    a: 'Go to Menu or Inventory tab, and toggle the "86" or "Out of Stock" switch next to the item. The item immediately turns unavailable across all customer QR menus in real time.'
  }
];

export default function SupportTab({ cafe, user }) {
  const [activeSection, setActiveSection] = useState('tickets'); // 'tickets' | 'create' | 'help' | 'status'
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create ticket form
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Technical Issue');
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createSuccess, setCreateSuccess] = useState('');
  const [createError, setCreateError] = useState('');

  // Selected ticket drawer/modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replying, setReplying] = useState(false);

  // System status
  const [systemStatus, setSystemStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  // FAQ accordion
  const [openFaq, setOpenFaq] = useState(0);

  // Load tickets
  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await getMySupportTickets();
      setTickets(res.data || []);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load system status
  const fetchSystemStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await getSystemStatus();
      setSystemStatus(res.data);
    } catch (err) {
      console.error('Failed to load system status:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchSystemStatus();
  }, []);

  // Handle ticket creation
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    setSubmitting(true);

    try {
      const attachments = attachmentUrl.trim()
        ? [{ fileName: 'Attachment', fileUrl: attachmentUrl.trim(), fileType: 'link' }]
        : [];

      const payload = {
        subject: subject.trim(),
        category,
        priority,
        description: description.trim(),
        attachments,
        context: {
          restaurantName: cafe?.name || 'Cafe',
          browser: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
          module: 'Cafe Dashboard'
        }
      };

      const res = await createSupportTicket(payload);
      setCreateSuccess(`Ticket #${res.data?.ticket?.ticketId || 'TCK'} submitted successfully.`);
      setSubject('');
      setDescription('');
      setAttachmentUrl('');
      fetchTickets();
      setTimeout(() => {
        setActiveSection('tickets');
        setCreateSuccess('');
      }, 1500);
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to submit support ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle open ticket details
  const handleOpenTicket = async (ticket) => {
    try {
      const res = await getSupportTicketDetail(ticket._id || ticket.ticketId);
      setSelectedTicket(res.data || ticket);
    } catch (err) {
      setSelectedTicket(ticket);
    }
  };

  // Handle reply
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;
    setReplying(true);
    try {
      const res = await replySupportTicket(selectedTicket._id || selectedTicket.ticketId, {
        message: replyMessage.trim()
      });
      setSelectedTicket(res.data?.ticket || selectedTicket);
      setReplyMessage('');
      fetchTickets();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post reply.');
    } finally {
      setReplying(false);
    }
  };

  // Handle mark resolved
  const handleResolve = async () => {
    if (!selectedTicket) return;
    try {
      const res = await resolveSupportTicket(selectedTicket._id || selectedTicket.ticketId);
      setSelectedTicket(res.data?.ticket || { ...selectedTicket, status: 'Resolved' });
      fetchTickets();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark resolved.');
    }
  };

  // Handle reopen
  const handleReopen = async () => {
    if (!selectedTicket) return;
    try {
      const res = await reopenSupportTicket(selectedTicket._id || selectedTicket.ticketId);
      setSelectedTicket(res.data?.ticket || { ...selectedTicket, status: 'Reopened' });
      fetchTickets();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reopen ticket.');
    }
  };

  // Filtered tickets
  const filteredTickets = tickets.filter(t => {
    if (statusFilter !== 'All' && (t.status || '').toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSub = (t.subject || '').toLowerCase().includes(q);
      const matchId = (t.ticketId || '').toLowerCase().includes(q);
      const matchCat = (t.category || '').toLowerCase().includes(q);
      if (!matchSub && !matchId && !matchCat) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: Krixov Support Identity */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-[#121226] via-[#171732] to-[#1F1635] border border-white/10 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
            <LuLifeBuoy size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Krixov Support & Help Center</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                24/7 Priority
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Assistance for POS hardware, QR tables, GST billing, and technical operations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href={BRAND.COMPANY_WEBSITE}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 border border-white/10 transition-colors"
          >
            <span>Visit {BRAND.COMPANY_NAME}.com</span>
            <LuExternalLink size={13} />
          </a>

          <button
            onClick={() => setActiveSection('create')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
          >
            <LuPlus size={15} />
            <span>Create New Ticket</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSection('tickets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSection === 'tickets'
              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <LuTicket size={14} />
          <span>My Tickets ({tickets.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('create')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSection === 'create'
              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <LuPlus size={14} />
          <span>Create Ticket</span>
        </button>

        <button
          onClick={() => setActiveSection('help')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSection === 'help'
              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <LuHelpCircle size={14} />
          <span>Help Center & Guides</span>
        </button>

        <button
          onClick={() => {
            setActiveSection('status');
            fetchSystemStatus();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSection === 'status'
              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <LuActivity size={14} />
          <span>System Status</span>
        </button>
      </div>

      {/* SECTION 1: MY TICKETS */}
      {activeSection === 'tickets' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#121222] border border-white/5">
            <div className="flex items-center gap-2 overflow-x-auto">
              {['All', 'Open', 'In Progress', 'Waiting for Customer', 'Resolved', 'Closed'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    statusFilter === s
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="relative">
              <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket ID or subject..."
                className="w-full sm:w-64 pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Tickets List */}
          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <LuRefreshCw className="animate-spin mx-auto mb-2 text-purple-400" size={24} />
              <p className="text-xs">Loading support tickets...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#121222] border border-white/5 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-slate-500">
                <LuTicket size={24} />
              </div>
              <h3 className="text-sm font-bold text-white">No tickets found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'All'
                  ? 'No tickets match the current filter criteria.'
                  : 'You have no open tickets. Need help with POS, QR Menu, or Hardware? Create a ticket anytime.'}
              </p>
              <button
                onClick={() => setActiveSection('create')}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition"
              >
                <LuPlus size={14} />
                <span>Create Support Ticket</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredTickets.map((t) => {
                const isUrgent = t.priority === 'Urgent';
                const isResolved = t.status === 'Resolved' || t.status === 'Closed';

                return (
                  <div
                    key={t._id || t.ticketId}
                    onClick={() => handleOpenTicket(t)}
                    className="p-4 rounded-2xl bg-[#121222] border border-white/5 hover:border-purple-500/40 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300 shrink-0 mt-0.5">
                        <LuTicket size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-black text-purple-300">
                            {t.ticketId}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/5 text-slate-300 border border-white/10">
                            {t.category}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                            isUrgent
                              ? 'bg-rose-900/40 text-rose-300 border-rose-700'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            {t.priority}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white mt-1 group-hover:text-purple-300 transition-colors truncate">
                          {t.subject}
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                          {t.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end border-t md:border-t-0 border-white/5 pt-2 md:pt-0">
                      <div className="text-left md:text-right">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isResolved
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                            : t.status === 'In Progress'
                            ? 'bg-blue-950/60 text-blue-300 border border-blue-800'
                            : 'bg-amber-950/60 text-amber-300 border border-amber-800'
                        }`}>
                          {t.status}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 md:justify-end">
                          <LuClock size={11} />
                          <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: CREATE TICKET */}
      {activeSection === 'create' && (
        <div className="max-w-2xl mx-auto p-6 rounded-3xl bg-[#121222] border border-white/10 shadow-xl space-y-5">
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-lg font-bold text-white">Create Support Request</h2>
            <p className="text-xs text-slate-400 mt-1">
              Direct dispatch to Krixov Support Engineering. We respond promptly.
            </p>
          </div>

          {createSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
              <LuCheckCircle size={16} />
              <span>{createSuccess}</span>
            </div>
          )}

          {createError && (
            <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <LuAlertCircle size={16} />
              <span>{createError}</span>
            </div>
          )}

          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Subject <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. 80mm Bluetooth printer prints blank receipts"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Category <span className="text-rose-400">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#1A1A30] border border-white/10 text-xs text-white outline-none focus:border-purple-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Priority <span className="text-rose-400">*</span>
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#1A1A30] border border-white/10 text-xs text-white outline-none focus:border-purple-500"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.key} value={p.key}>{p.label} - {p.desc}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Detailed Description <span className="text-rose-400">*</span>
              </label>
              <textarea
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue in detail. What occurred, what steps were taken, and any error messages seen."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 outline-none focus:border-purple-500 resize-y"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Attachment URL (Screenshot / Document)
              </label>
              <div className="relative">
                <LuPaperclip className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input
                  type="url"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Safe Auto-Context Transparency Box */}
            <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-800/30 text-[11px] text-slate-400 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-purple-300">
                <LuShield size={13} />
                <span>Automatic Diagnostic Context (Safe Privacy Mode)</span>
              </div>
              <p>
                To resolve your issue faster, we automatically include your restaurant ID ({cafe?.cafeId || 'CAFE'}), application version (v2.5.0), and device environment.
              </p>
              <p className="text-slate-500 text-[10px]">
                🔒 Sensitive credentials, passwords, tokens, and payment secrets are strictly excluded.
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setActiveSection('tickets')}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 shadow-md shadow-purple-600/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                {submitting ? 'Submitting...' : 'Submit Ticket'}
                <LuSend size={13} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 3: HELP CENTER & FAQS */}
      {activeSection === 'help' && (
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="p-5 rounded-3xl bg-[#121222] border border-white/10 space-y-1.5 text-center">
            <h2 className="text-base font-bold text-white">Frequently Asked Operations Questions</h2>
            <p className="text-xs text-slate-400">
              Quick answers for common setup, printing, tax, and order workflows.
            </p>
          </div>

          <div className="space-y-2.5">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              const Icon = faq.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-[#121222] border border-white/5 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300 shrink-0">
                        <Icon size={16} />
                      </div>
                      <span className="text-xs font-bold text-white">{faq.q}</span>
                    </div>
                    {isOpen ? <LuChevronUp size={16} className="text-slate-400" /> : <LuChevronDown size={16} className="text-slate-400" />}
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-slate-300 leading-relaxed border-t border-white/5 pl-14">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-800/40 text-center space-y-2">
            <p className="text-xs font-bold text-purple-300">Need personalized walkthroughs or custom integration?</p>
            <p className="text-[11px] text-slate-400">Our engineering team can assist via ticket or live screen share.</p>
            <button
              onClick={() => setActiveSection('create')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition shadow-sm"
            >
              <LuPlus size={13} />
              <span>Contact Krixov Support</span>
            </button>
          </div>
        </div>
      )}

      {/* SECTION 4: SYSTEM STATUS */}
      {activeSection === 'status' && (
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="p-5 rounded-3xl bg-[#121222] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-base font-bold text-white">{systemStatus?.status || 'All Systems Operational'}</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Krixov Cloud Realtime Node Network • Checked: {new Date(systemStatus?.timestamp || Date.now()).toLocaleTimeString()}
              </p>
            </div>

            <button
              onClick={fetchSystemStatus}
              disabled={loadingStatus}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 transition"
            >
              <LuRefreshCw size={13} className={loadingStatus ? 'animate-spin' : ''} />
              <span>Refresh Status</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(systemStatus?.services || []).map((srv, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-[#121222] border border-white/5 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">{srv.name}</h4>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                    <span>Latency: {srv.latency}</span>
                    <span>•</span>
                    <span>Uptime: {srv.uptime}</span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-800">
                  {srv.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TICKET CONVERSATION DRAWER / MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] rounded-3xl bg-[#121224] border border-white/10 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#15152A]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-purple-300">
                    {selectedTicket.ticketId}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/5 text-slate-300 border border-white/10">
                    {selectedTicket.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                    selectedTicket.priority === 'Urgent'
                      ? 'bg-rose-900/40 text-rose-300 border-rose-700'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {selectedTicket.priority}
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

            {/* Conversation Messages Scroll View */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#0F0F1D]">
              {(selectedTicket.conversation || []).map((msg, idx) => {
                const isCafeSender = msg.sender?.role === 'cafeowner' || msg.sender?.role === 'staff';

                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isCafeSender ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                      <span className="font-semibold text-slate-300">{msg.sender?.name || (isCafeSender ? 'You' : 'Krixov Support')}</span>
                      <span>•</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isCafeSender
                          ? 'bg-purple-600 text-white rounded-tr-none'
                          : 'bg-[#1E1E34] text-slate-200 border border-white/10 rounded-tl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.message}</p>

                      {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
                          {msg.attachments.map((att, i) => (
                            <a
                              key={i}
                              href={att.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-purple-200 hover:underline"
                            >
                              <LuPaperclip size={11} />
                              <span>{att.fileName || 'View Attachment'}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Input Bar & Status Controls */}
            <div className="p-4 border-t border-white/10 bg-[#15152A] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px]">Status:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {selectedTicket.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {selectedTicket.status !== 'Resolved' && selectedTicket.status !== 'Closed' ? (
                    <button
                      type="button"
                      onClick={handleResolve}
                      className="px-3 py-1 rounded-lg text-xs font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-800 hover:bg-emerald-900/60 transition"
                    >
                      Mark Resolved
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleReopen}
                      className="px-3 py-1 rounded-lg text-xs font-bold text-amber-300 bg-amber-950/60 border border-amber-800 hover:bg-amber-900/60 transition"
                    >
                      Reopen Ticket
                    </button>
                  )}
                </div>
              </div>

              {selectedTicket.status !== 'Closed' && (
                <form onSubmit={handleSendReply} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your response to support..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 outline-none focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={replying || !replyMessage.trim()}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 transition flex items-center gap-1.5"
                  >
                    <span>Send</span>
                    <LuSend size={12} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
