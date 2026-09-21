import React, { useState } from 'react';
import { LuX, LuMegaphone, LuBell, LuInfo, LuTriangleAlert as LuAlertTriangle, LuFlame, LuWrench, LuCalendar } from 'react-icons/lu';

export default function NoticeDrawer({ isOpen, onClose, notices = [] }) {
  const [filter, setFilter] = useState('All');

  if (!isOpen) return null;

  const filteredNotices = filter === 'All'
    ? notices
    : notices.filter(n => n.priority === filter.toLowerCase());

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
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#121226] border-l border-white/10 shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="p-5 border-b border-white/10 bg-[#171730] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                <LuMegaphone size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Notice Board
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                    {notices.length}
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">Announcements from Super Admin</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
            >
              <LuX size={18} />
            </button>
          </div>

          {/* Filter Pills */}
          <div className="px-5 py-3 border-b border-white/5 bg-[#141428] flex items-center gap-2 overflow-x-auto text-xs">
            {['All', 'Urgent', 'Warning', 'Maintenance', 'Info'].map((p) => (
              <button
                key={p}
                onClick={() => setFilter(p)}
                className={`px-3 py-1 rounded-lg font-bold transition text-xs shrink-0 cursor-pointer ${
                  filter === p
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Notice List */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#0F0F1D]">
            {filteredNotices.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <LuBell size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">No notices in this category.</p>
              </div>
            ) : (
              filteredNotices.map((n) => (
                <div
                  key={n._id}
                  className="p-4 rounded-2xl bg-[#17172E] border border-white/5 space-y-2 hover:border-purple-500/30 transition shadow-lg"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getPriorityBadge(n.priority)}`}>
                      {n.priority}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <LuCalendar size={11} />
                      {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white leading-snug">
                    {n.title}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {n.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
