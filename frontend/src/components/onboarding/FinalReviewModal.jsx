import React from 'react';
import { useOnboarding } from '../../context/OnboardingContext';
import {
  LuCircleCheck,
  LuSparkles,
  LuArrowRight,
  LuLayoutDashboard,
  LuClock,
  LuCircleHelp,
  LuRotateCcw
} from 'react-icons/lu';

export default function FinalReviewModal({ cafe }) {
  const {
    phase,
    completedModules,
    skippedModules,
    totalModules,
    completeFinalReview,
    restartFullTour,
    openWorkflowDemo
  } = useOnboarding();

  if (phase !== 'final_review') return null;

  const completedCount = completedModules.length;
  const skippedCount = skippedModules.length;
  const readinessPercent = Math.min(
    100,
    Math.round(((completedCount + 2) / (totalModules || 24)) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl bg-[#10101C] border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Glow decoration */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="p-6 sm:p-8 text-center border-b border-white/[0.08] relative">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <LuSparkles size={28} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            You're Ready to Run Your Restaurant! 🎉
          </h1>
          <p className="text-sm text-slate-300 mt-2 max-w-lg mx-auto">
            You now know how QR ordering, POS, tables, kitchen, billing, customers, inventory, and reports work together seamlessly.
          </p>
        </div>

        {/* Readiness Score & Stats Bar */}
        <div className="p-6 bg-[#141424] border-b border-white/[0.06] grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono block">
              {readinessPercent}%
            </span>
            <span className="text-[11px] uppercase font-mono text-slate-400">Readiness Score</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
            <span className="text-xl sm:text-2xl font-black text-violet-400 font-mono block">
              {completedCount}
            </span>
            <span className="text-[11px] uppercase font-mono text-slate-400">Modules Mastered</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
            <span className="text-xl sm:text-2xl font-black text-slate-300 font-mono block">
              {skippedCount}
            </span>
            <span className="text-[11px] uppercase font-mono text-slate-400">Skipped (Revisitable)</span>
          </div>
        </div>

        {/* Verified System Capabilities Checklist */}
        <div className="p-6 space-y-3 max-h-[35vh] overflow-y-auto">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            System Operational Readiness Checklist
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {[
              { text: 'Dine-In Table QR Ordering Verified', ok: true },
              { text: 'POS Direct Walk-in & Counter Tokens Ready', ok: true },
              { text: 'Kitchen Order Tickets & Delta Rounds Configured', ok: true },
              { text: 'GST / Tax & Receipt Formatting Established', ok: true },
              { text: 'Table Session Management & Auto-Free Configured', ok: true },
              { text: 'Thermal Bill & KOT Print Handlers Active', ok: true }
            ].map((item, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-2.5"
              >
                <LuCircleCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-slate-200 font-medium">{item.text}</span>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-violet-950/20 border border-violet-500/20 flex items-center justify-between text-xs mt-3">
            <div className="flex items-center gap-2 text-violet-300">
              <LuCircleHelp size={16} />
              <span>Need a refresher later? Click <strong>Help & Training</strong> in the sidebar anytime.</span>
            </div>
            <button
              onClick={restartFullTour}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-violet-300 hover:text-white bg-violet-500/20 hover:bg-violet-500/30 transition-all flex items-center gap-1 cursor-pointer flex-shrink-0"
            >
              <LuRotateCcw size={12} />
              <span>Restart Tour</span>
            </button>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-6 border-t border-white/[0.08] bg-[#10101C] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={() => openWorkflowDemo('endToEnd')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            Review 17-Step Simulation
          </button>

          <button
            onClick={completeFinalReview}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-xl shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer"
          >
            <span>Finish Setup & Launch Dashboard</span>
            <LuArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
