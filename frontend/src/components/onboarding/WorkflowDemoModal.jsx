import React, { useState } from 'react';
import { useOnboarding } from '../../context/OnboardingContext';
import { WORKFLOW_DEMO_SCENARIOS } from './tourStepsConfig';
import {
  LuPlay,
  LuPause,
  LuChevronLeft,
  LuChevronRight,
  LuCircleCheck,
  LuSparkles,
  LuArrowRight,
  LuQrCode,
  LuUtensils,
  LuMonitor,
  LuChefHat,
  LuReceipt,
  LuArmchair,
  LuX
} from 'react-icons/lu';

const MODULE_ICONS = {
  'QR & Tables': LuQrCode,
  'Customer QR Menu': LuQrCode,
  'POS': LuMonitor,
  'Orders / POS': LuMonitor,
  'Orders': LuMonitor,
  'KOT / Kitchen': LuChefHat,
  'Kitchen Display': LuChefHat,
  'Tables & Sessions': LuArmchair,
  'Tables Floor View': LuArmchair,
  'Tables & Billing': LuReceipt,
  'Tables': LuArmchair,
  'Billing Drawer': LuReceipt,
  'Billing': LuReceipt,
  'GST & Tax': LuReceipt,
  'GST': LuReceipt,
  'Payments': LuReceipt,
  'Thermal Printers': LuReceipt,
  'Customer CRM': LuReceipt,
  'Coupons & Billing': LuReceipt,
  'Printers': LuReceipt
};

export default function WorkflowDemoModal() {
  const { phase, activeDemoScenario, openWorkflowDemo, closeWorkflowDemo } = useOnboarding();
  const [selectedScenarioKey, setSelectedScenarioKey] = useState(activeDemoScenario || 'endToEnd');
  const [currentStepNum, setCurrentStepNum] = useState(1);

  if (phase !== 'workflow_demo') return null;

  const scenario = WORKFLOW_DEMO_SCENARIOS[selectedScenarioKey] || WORKFLOW_DEMO_SCENARIOS.endToEnd;
  const currentStep = scenario.steps.find((s) => s.step === currentStepNum) || scenario.steps[0];
  const isLastStep = currentStepNum === scenario.steps.length;

  const handleNext = () => {
    if (currentStepNum < scenario.steps.length) {
      setCurrentStepNum((prev) => prev + 1);
    } else {
      closeWorkflowDemo();
    }
  };

  const handlePrev = () => {
    if (currentStepNum > 1) {
      setCurrentStepNum((prev) => prev - 1);
    }
  };

  const IconComponent = MODULE_ICONS[currentStep.module] || LuSparkles;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-3xl bg-[#10101C] border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] bg-[#141424] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <LuPlay size={16} />
            </span>
            <div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                Interactive Restaurant Simulation
              </span>
              <h2 className="text-sm sm:text-base font-bold text-white">
                {scenario.title}
              </h2>
            </div>
          </div>

          <button
            onClick={closeWorkflowDemo}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Skip Simulation to Final Review"
          >
            <LuX size={18} />
          </button>
        </div>

        {/* Scenario Switcher Tabs */}
        <div className="px-6 py-2.5 bg-[#171729] border-b border-white/[0.06] flex items-center gap-2 overflow-x-auto">
          {[
            { key: 'endToEnd', label: '1. Full 17-Step Loop', badge: '17 steps' },
            { key: 'walkIn', label: '2. Walk-In Reception', badge: '7 steps' },
            { key: 'takeaway', label: '3. Quick Takeaway', badge: '6 steps' },
            { key: 'billingFlow', label: '4. Billing & Tax', badge: '5 steps' }
          ].map((sc) => (
            <button
              key={sc.key}
              onClick={() => {
                setSelectedScenarioKey(sc.key);
                setCurrentStepNum(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                selectedScenarioKey === sc.key
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10'
              }`}
            >
              <span>{sc.label}</span>
              <span className="text-[10px] opacity-75 font-mono">({sc.badge})</span>
            </button>
          ))}
        </div>

        {/* Main Simulation Stage */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Visual Step Progress Indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-slate-400">
                Step <strong className="text-white text-sm">{currentStepNum}</strong> of{' '}
                <strong className="text-white text-sm">{scenario.steps.length}</strong>
              </span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <LuSparkles size={13} />
                Live Architecture Demo
              </span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-violet-500 transition-all duration-300 rounded-full"
                style={{ width: `${(currentStepNum / scenario.steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Active Step Presentation Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#18182C] to-[#121222] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 text-violet-400 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <IconComponent size={22} />
                </div>
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-violet-400 block font-semibold">
                    Target Module: {currentStep.module}
                  </span>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {currentStep.title}
                  </h3>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex-shrink-0">
                Phase {currentStepNum}
              </span>
            </div>

            <p className="text-sm sm:text-base text-slate-200 leading-relaxed pl-1">
              {currentStep.action}
            </p>

            {currentStep.highlight && (
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/25 flex items-start gap-2.5">
                <LuCircleCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-300 font-medium">
                  <strong>Why it matters:</strong> {currentStep.highlight}
                </p>
              </div>
            )}
          </div>

          {/* Interactive Steps Mini Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {scenario.steps.map((st) => (
              <button
                key={st.step}
                onClick={() => setCurrentStepNum(st.step)}
                className={`w-7 h-7 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center flex-shrink-0 cursor-pointer ${
                  st.step === currentStepNum
                    ? 'bg-violet-600 text-white scale-110 shadow-md shadow-violet-600/30 ring-2 ring-violet-400/40'
                    : st.step < currentStepNum
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-white/5 text-slate-500 hover:text-slate-300 hover:bg-white/10'
                }`}
                title={st.title}
              >
                {st.step}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="p-6 border-t border-white/[0.08] bg-[#141424] flex items-center justify-between gap-3">
          <button
            onClick={handlePrev}
            disabled={currentStepNum === 1}
            className={`inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              currentStepNum === 1
                ? 'opacity-40 cursor-not-allowed text-slate-500 bg-white/5'
                : 'text-slate-300 bg-white/5 hover:bg-white/10 hover:text-white'
            }`}
          >
            <LuChevronLeft size={16} />
            <span>Previous Action</span>
          </button>

          <button
            onClick={handleNext}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-xl shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer"
          >
            <span>{isLastStep ? 'Complete Simulation & Review' : 'Next Action'}</span>
            <LuArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
