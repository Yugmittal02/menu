import React from 'react';
import { useOnboarding } from '../../context/OnboardingContext';
import {
  LuSparkles,
  LuCompass,
  LuLayoutDashboard,
  LuMonitor,
  LuUtensils,
  LuPrinter,
  LuShieldCheck,
  LuArrowRight,
  LuX
} from 'react-icons/lu';

export default function WelcomeModal({ cafe }) {
  const { phase, startGuidedTour, skipTour, skipConfirmationOpen, setSkipConfirmationOpen } = useOnboarding();

  if (phase !== 'welcome') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl bg-[#10101C] border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Subtle decorative glow banner */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-violet-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative p-6 sm:p-8 text-center border-b border-white/[0.08]">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-xl bg-gradient-to-tr from-violet-600 via-purple-500 to-rose-500 text-white font-black text-2xl border border-white/20">
            {cafe?.name ? cafe.name.charAt(0).toUpperCase() : '☕'}
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/15 border border-violet-500/30 text-violet-300 mb-2">
            <LuSparkles size={13} className="animate-spin text-violet-400" />
            <span>Interactive Onboarding & Implementation Specialist</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Welcome to QR Menu 👋
          </h1>
          <p className="text-sm sm:text-base font-medium text-slate-300 mt-2 max-w-lg mx-auto">
            Let's set up your restaurant and show you how everything works.
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            We'll walk through your restaurant profile, tables, QR menu, POS, orders, kitchen, billing, inventory, reports, and security using your real dashboard interface.
          </p>
        </div>

        {/* 6 Core Modules Covered Grid */}
        <div className="p-6 sm:p-8 bg-[#131322]/60 grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[45vh] overflow-y-auto">
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center flex-shrink-0">
              <LuCompass size={17} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white">1. Essential Setup</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Configure profile, tax rates (GST/VAT), floor tables, and customer theme.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <LuMonitor size={17} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white">2. POS & Order Taking</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Take walk-in dine-in, takeaway, and counter orders directly.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
              <LuUtensils size={17} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white">3. Kitchen KOT & Delta Rounds</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Send tickets to kitchen, track timers, and dispatch delta orders accurately.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0">
              <LuPrinter size={17} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white">4. Billing & Thermal Receipts</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Manage running table bills, split payments, and print 80mm invoices.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
              <LuLayoutDashboard size={17} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white">5. 17-Step Live Simulation</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Demonstrates how QR scans, sessions, KOTs, and table releases bind together.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
              <LuShieldCheck size={17} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white">6. Security & Staff PINs</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Configure role permissions, 4-digit switch PINs, and tenant protection.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-6 border-t border-white/[0.08] bg-[#10101C] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={() => setSkipConfirmationOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            Skip Tour for Now
          </button>

          <button
            onClick={startGuidedTour}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-xl shadow-violet-600/30 active:scale-95 transition-all cursor-pointer"
          >
            <span>Start Guided Tour</span>
            <LuArrowRight size={16} />
          </button>
        </div>

        {/* Skip Tour Confirmation Dialog */}
        {skipConfirmationOpen && (
          <div className="absolute inset-0 bg-[#0E0E1A]/95 backdrop-blur-md flex items-center justify-center p-6 z-20 animate-in fade-in">
            <div className="max-w-md text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                <LuCompass size={24} />
              </div>
              <h2 className="text-lg font-bold text-white">Skip the Guided Setup Tour?</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                You can explore on your own. We will save your restaurant profile, and you can restart this interactive tour anytime by clicking <strong>"Help & Training"</strong> in the sidebar.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setSkipConfirmationOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Resume Tour
                </button>
                <button
                  onClick={() => skipTour(true)}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors shadow-lg shadow-rose-600/30 cursor-pointer"
                >
                  Yes, Skip Tour
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
