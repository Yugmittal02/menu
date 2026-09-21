import React, { useState } from 'react';
import { LuMegaphone, LuX, LuTriangleAlert as LuAlertTriangle, LuInfo, LuFlame, LuWrench, LuCheck } from 'react-icons/lu';

export default function CafeNoticeModal({ notice, onClose }) {
  if (!notice) return null;

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'urgent':
        return {
          bg: 'bg-rose-950/40 border-rose-600/40 text-rose-300',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          icon: <LuFlame className="text-rose-400" size={24} />
        };
      case 'warning':
        return {
          bg: 'bg-amber-950/40 border-amber-600/40 text-amber-300',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          icon: <LuAlertTriangle className="text-amber-400" size={24} />
        };
      case 'maintenance':
        return {
          bg: 'bg-purple-950/40 border-purple-600/40 text-purple-300',
          badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          icon: <LuWrench className="text-purple-400" size={24} />
        };
      default:
        return {
          bg: 'bg-blue-950/40 border-blue-600/40 text-blue-300',
          badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          icon: <LuInfo className="text-blue-400" size={24} />
        };
    }
  };

  const style = getPriorityStyle(notice.priority);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl bg-[#121226] border border-white/10 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-start justify-between bg-[#171730]">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg ${style.bg}`}>
              {style.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${style.badge}`}>
                  {notice.priority}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(notice.createdAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1 leading-snug">
                {notice.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
            aria-label="Close"
          >
            <LuX size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-sm text-slate-200 leading-relaxed max-h-[60vh] overflow-y-auto whitespace-pre-wrap bg-[#0F0F1D]">
          {notice.message}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#16162E] flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <LuMegaphone size={13} className="text-purple-400" />
            <span>Krixov Platform Notice</span>
          </span>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/25 transition active:scale-95 cursor-pointer"
          >
            <LuCheck size={14} />
            <span>Acknowledge & Dismiss</span>
          </button>
        </div>
      </div>
    </div>
  );
}
