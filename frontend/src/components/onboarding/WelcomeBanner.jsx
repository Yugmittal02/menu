import React from 'react';
import { useOnboarding } from '../../context/OnboardingContext';
import { LuSparkles, LuX, LuCompass, LuArrowRight } from 'react-icons/lu';

export default function WelcomeBanner({ onOpenQuickGuide }) {
  const { isWelcomeBannerOpen, dismissWelcomeBanner, restartFullTour } = useOnboarding();

  if (!isWelcomeBannerOpen) return null;

  return (
    <div className="relative mb-6 rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-[#1E1B4B] via-[#17172C] to-[#1F1235] border border-violet-500/30 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
      {/* Ambient background glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-violet-600/30 rounded-full blur-2xl pointer-events-none" />

      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-violet-600/30 border border-violet-400/40 text-violet-300 flex items-center justify-center flex-shrink-0 shadow-lg">
            <LuSparkles size={20} className="animate-pulse" />
          </div>

          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Welcome to QR Menu 👋
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Workspace Active
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Your restaurant workspace is ready. Start managing your digital menu, tables, POS, live kitchen orders, and automated tax billing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-shrink-0">
          <button
            onClick={() => {
              dismissWelcomeBanner();
              restartFullTour();
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-violet-300 hover:text-white bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <LuCompass size={14} />
            <span>Tour Guide</span>
          </button>

          <button
            onClick={dismissWelcomeBanner}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-600/30 active:scale-95 transition-all cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
