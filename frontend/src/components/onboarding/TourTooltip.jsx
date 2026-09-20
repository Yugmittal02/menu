import React, { useMemo, useState, useEffect } from 'react';
import { useOnboarding } from '../../context/OnboardingContext';
import {
  LuChevronLeft,
  LuChevronRight,
  LuX,
  LuSparkles,
  LuInfo,
  LuLightbulb,
  LuMousePointerClick,
  LuPlay,
  LuPrinter,
  LuExternalLink,
  LuLayers
} from 'react-icons/lu';

export default function TourTooltip({ onTriggerAction }) {
  const {
    phase,
    currentModule,
    currentModuleIndex,
    totalModules,
    tourMode,
    setTourMode,
    targetRect,
    currentSmartState,
    nextStep,
    prevStep,
    skipModule,
    skipTour,
    setIsCustomerPreviewOpen,
    openWorkflowDemo
  } = useOnboarding();

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  // Compute tooltip desktop placement relative to targetRect
  const tooltipStyle = useMemo(() => {
    if (isMobile) {
      return {
        position: 'fixed',
        bottom: '16px',
        left: '16px',
        right: '16px',
        maxHeight: '80vh',
        zIndex: 50
      };
    }

    if (!targetRect || !targetRect.viewportTop) {
      return {
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        width: '420px',
        zIndex: 50
      };
    }

    const cardWidth = 420;
    const cardHeight = 360;
    const padding = 16;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Prefer placing below target
    let top = targetRect.viewportTop + targetRect.height + padding;
    let left = Math.max(padding, targetRect.viewportLeft);

    // If overflows bottom, try placing above
    if (top + cardHeight > viewportHeight - padding) {
      top = Math.max(padding, targetRect.viewportTop - cardHeight - padding);
    }

    // If overflows right, shift left
    if (left + cardWidth > viewportWidth - padding) {
      left = Math.max(padding, viewportWidth - cardWidth - padding);
    }

    return {
      position: 'fixed',
      top: `${Math.round(top)}px`,
      left: `${Math.round(left)}px`,
      width: `${cardWidth}px`,
      zIndex: 50
    };
  }, [isMobile, targetRect]);

  if (phase !== 'guided_tour' || !currentModule) return null;

  const handleAction = () => {
    if (currentModule.demoAction === 'test_print') {
      window.print();
    } else if (
      currentModule.demoAction === 'preview_qr' ||
      currentModule.demoAction === 'open_customer_preview'
    ) {
      setIsCustomerPreviewOpen(true);
    } else if (currentModule.demoAction === 'try_billing') {
      onTriggerAction?.('open_billing');
    } else if (currentModule.demoAction === 'try_pos') {
      onTriggerAction?.('try_pos');
    } else if (currentModule.demoAction === 'view_sample_kot') {
      onTriggerAction?.('sample_kot');
    } else {
      nextStep();
    }
  };

  const percentProgress = Math.round(((currentModuleIndex + 1) / totalModules) * 100);

  return (
    <aside
      style={tooltipStyle}
      className="bg-[#11111E]/95 text-slate-200 border border-white/15 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col transition-all duration-200 animate-in fade-in zoom-in-95"
      role="dialog"
      aria-label="Interactive Tour Guide"
    >
      {/* Top Header & Progress Bar */}
      <div className="w-full bg-white/5 h-1">
        <div
          className="h-1 bg-gradient-to-r from-violet-500 to-emerald-400 transition-all duration-300"
          style={{ width: `${percentProgress}%` }}
        />
      </div>

      <div className="px-5 py-3.5 border-b border-white/[0.08] flex items-center justify-between gap-3 bg-[#161626]/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-6 h-6 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 text-xs font-bold font-mono">
            {currentModuleIndex + 1}
          </span>
          <div className="min-w-0">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-violet-400 block">
              Module {currentModuleIndex + 1} of {totalModules} • {currentModule.module}
            </span>
            <span className="text-xs font-bold text-white truncate block">
              {currentModule.title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Mode Switcher Toggle */}
          <button
            onClick={() => setTourMode(tourMode === 'deep' ? 'overview' : 'deep')}
            className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
              tourMode === 'deep'
                ? 'bg-violet-600/20 text-violet-300 border-violet-500/40'
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
            }`}
            title="Toggle Deep vs Overview Explanations"
          >
            {tourMode === 'deep' ? 'Deep Mode' : 'Quick Overview'}
          </button>

          {/* Skip Tour Button */}
          <button
            onClick={() => skipTour(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Exit Tour"
            aria-label="Exit Tour"
          >
            <LuX size={16} />
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 space-y-3.5 overflow-y-auto max-h-[60vh]">
        {/* Core Explanation */}
        <p className="text-xs md:text-sm text-slate-200 leading-relaxed">
          {currentModule.explanation}
        </p>

        {/* Why it matters callout */}
        <div className="p-3 rounded-xl bg-violet-950/30 border border-violet-500/25 flex items-start gap-2.5">
          <LuSparkles className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-[11px] font-bold text-violet-300 uppercase tracking-wide block">
              Why this matters
            </span>
            <p className="text-xs text-slate-300 leading-normal mt-0.5">
              {currentModule.why}
            </p>
          </div>
        </div>

        {/* Deep Mode Controls: What happens & recommended actions */}
        {tourMode === 'deep' && (
          <div className="space-y-2.5 pt-1">
            <div className="flex items-start gap-2 text-xs text-slate-300">
              <LuMousePointerClick className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Active Control: </strong>
                {currentModule.whatHappens}
              </span>
            </div>

            <div className="flex items-start gap-2 text-xs text-slate-300">
              <LuLightbulb className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Recommended Action: </strong>
                {currentModule.recommendedAction}
              </span>
            </div>
          </div>
        )}

        {/* Smart State Detected Notice */}
        {currentSmartState?.customMessage && (
          <div className="px-3 py-2 rounded-xl bg-emerald-950/30 border border-emerald-500/25 flex items-center gap-2 text-xs text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{currentSmartState.customMessage}</span>
          </div>
        )}
      </div>

      {/* Footer Navigation Bar */}
      <div className="px-5 py-3 border-t border-white/[0.08] bg-[#141424] flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={prevStep}
            disabled={currentModuleIndex === 0}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              currentModuleIndex === 0
                ? 'opacity-40 cursor-not-allowed text-slate-500 bg-white/5'
                : 'text-slate-300 bg-white/5 hover:bg-white/10 hover:text-white'
            }`}
          >
            <LuChevronLeft size={14} />
            <span>Back</span>
          </button>

          <button
            onClick={skipModule}
            className="px-2.5 py-1.5 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            Skip
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Optional Try It button */}
          {currentModule.demoAction && (
            <button
              onClick={handleAction}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 active:scale-95 transition-all cursor-pointer"
            >
              {currentModule.demoAction === 'test_print' ? (
                <>
                  <LuPrinter size={13} />
                  <span>Test Print</span>
                </>
              ) : currentModule.demoAction.includes('preview') ? (
                <>
                  <LuExternalLink size={13} />
                  <span>Try Preview</span>
                </>
              ) : (
                <>
                  <LuPlay size={13} />
                  <span>Try It</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={nextStep}
            className="inline-flex items-center gap-1 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 active:scale-95 shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
          >
            <span>{currentModuleIndex === totalModules - 1 ? 'Finish Tour' : 'Next'}</span>
            <LuChevronRight size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
