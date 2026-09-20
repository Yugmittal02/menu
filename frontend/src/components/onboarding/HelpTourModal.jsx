import React from 'react';
import { useOnboarding } from '../../context/OnboardingContext';
import {
  LuCompass,
  LuPlay,
  LuPrinter,
  LuExternalLink,
  LuKeyboard,
  LuLifeBuoy,
  LuX,
  LuRotateCcw,
  LuSparkles,
  LuFileText,
  LuHeadphones
} from 'react-icons/lu';

export default function HelpTourModal({
  activeTab,
  onOpenCustomerPreview
}) {
  const {
    isHelpModalOpen,
    setIsHelpModalOpen,
    restartFullTour,
    startModuleTour,
    openWorkflowDemo,
    setIsCustomerPreviewOpen
  } = useOnboarding();

  if (!isHelpModalOpen) return null;

  // Map activeTab to tour module id
  const tabModuleMap = {
    Overview: 'overview',
    POS: 'pos',
    Orders: 'orders',
    Tables: 'tables',
    QR: 'qr_tables',
    Menu: 'menu',
    Coupons: 'offers',
    Inventory: 'inventory',
    CRM: 'customers',
    Reservations: 'reservations',
    Staff: 'staff',
    Analytics: 'analytics',
    Settings: 'settings'
  };

  const currentModuleId = tabModuleMap[activeTab] || 'overview';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#11111E] border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] bg-[#161626] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold">
              <LuLifeBuoy size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Help & Training Center</h2>
              <p className="text-[11px] text-slate-400">Interactive guides and training tools</p>
            </div>
          </div>

          <button
            onClick={() => setIsHelpModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <LuX size={18} />
          </button>
        </div>

        {/* Action Options List */}
        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {/* Restart Full Tour */}
          <button
            onClick={() => {
              setIsHelpModalOpen(false);
              restartFullTour();
            }}
            className="w-full p-3.5 rounded-2xl bg-white/[0.02] hover:bg-violet-950/30 border border-white/5 hover:border-violet-500/30 text-left flex items-center justify-between gap-3 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <LuRotateCcw size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white group-hover:text-violet-300 transition-colors">
                  Restart Full Product Tour (24 Modules)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Step-by-step walkthrough covering every feature and setting from start to finish.
                </p>
              </div>
            </div>
          </button>

          {/* Tour Current Module */}
          <button
            onClick={() => {
              setIsHelpModalOpen(false);
              startModuleTour(currentModuleId);
            }}
            className="w-full p-3.5 rounded-2xl bg-white/[0.02] hover:bg-emerald-950/30 border border-white/5 hover:border-emerald-500/30 text-left flex items-center justify-between gap-3 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <LuCompass size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Tour Current Module ({activeTab})
                </h3>
                <p className="text-[11px] text-slate-400">
                  Focus specifically on the controls, filters, and actions in {activeTab}.
                </p>
              </div>
            </div>
          </button>

          {/* Workflow Simulations */}
          <button
            onClick={() => {
              setIsHelpModalOpen(false);
              openWorkflowDemo('endToEnd');
            }}
            className="w-full p-3.5 rounded-2xl bg-white/[0.02] hover:bg-cyan-950/30 border border-white/5 hover:border-cyan-500/30 text-left flex items-center justify-between gap-3 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <LuPlay size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                  17-Step Dining Lifecycle Simulation
                </h3>
                <p className="text-[11px] text-slate-400">
                  Watch how Table 5 QR scans, POS, KOTs, delta rounds, and billing bind together.
                </p>
              </div>
            </div>
          </button>

          {/* Live Table 1 Customer Preview */}
          <button
            onClick={() => {
              setIsHelpModalOpen(false);
              setIsCustomerPreviewOpen(true);
            }}
            className="w-full p-3.5 rounded-2xl bg-white/[0.02] hover:bg-rose-950/30 border border-white/5 hover:border-rose-500/30 text-left flex items-center justify-between gap-3 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <LuExternalLink size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors">
                  Customer QR Menu Simulator
                </h3>
                <p className="text-[11px] text-slate-400">
                  Experience your live digital menu as customers see it on their smartphones.
                </p>
              </div>
            </div>
          </button>

          {/* Test Thermal Print */}
          <button
            onClick={() => {
              setIsHelpModalOpen(false);
              window.print();
            }}
            className="w-full p-3.5 rounded-2xl bg-white/[0.02] hover:bg-amber-950/30 border border-white/5 hover:border-amber-500/30 text-left flex items-center justify-between gap-3 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <LuPrinter size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                  Thermal Printer Test Print
                </h3>
                <p className="text-[11px] text-slate-400">
                  Send a test thermal slip to verify your 80mm/58mm roll alignment and font sizes.
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Keyboard Shortcuts Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-[#141424] text-xs text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <LuKeyboard size={14} className="text-slate-300" />
            <span>Shortcuts:</span>
            <span className="font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-200">→ Next</span>
            <span className="font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-200">← Back</span>
            <span className="font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-200">Esc Exit</span>
          </div>
          <span className="text-[11px] text-violet-400 font-mono font-semibold">v2.4 Enterprise</span>
        </div>
      </div>
    </div>
  );
}
