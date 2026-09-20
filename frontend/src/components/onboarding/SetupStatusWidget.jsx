import React from 'react';
import { useOnboarding } from '../../context/OnboardingContext';
import {
  LuCircleCheck,
  LuCircleDashed,
  LuSparkles,
  LuChevronRight,
  LuStore,
  LuReceipt,
  LuLayoutGrid,
  LuQrCode,
  LuUtensils,
  LuCreditCard,
  LuPrinter,
  LuUserCheck
} from 'react-icons/lu';

export default function SetupStatusWidget({
  cafe,
  menu = [],
  staff = [],
  onNavigateTab
}) {
  const { startGuidedTour, restartFullTour } = useOnboarding();

  // Calculate real configuration health
  const checklist = [
    {
      id: 'restaurant',
      label: 'Restaurant Profile',
      completed: Boolean(cafe?.name && cafe?.phone && cafe?.ownerName),
      tab: 'Settings',
      icon: LuStore
    },
    {
      id: 'tax',
      label: 'Tax & GST Settings',
      completed: Boolean(cafe?.taxPercent !== undefined && cafe?.taxLabel),
      tab: 'Settings',
      icon: LuReceipt
    },
    {
      id: 'tables',
      label: 'Tables & Areas',
      completed: Boolean(cafe?.tableCount && cafe.tableCount > 0),
      tab: 'Tables',
      icon: LuLayoutGrid
    },
    {
      id: 'qr',
      label: 'Table QR Codes',
      completed: Boolean(cafe?.cafeId),
      tab: 'QR',
      icon: LuQrCode
    },
    {
      id: 'menu',
      label: 'Menu Catalog',
      completed: Boolean(menu.length > 0),
      tab: 'Menu',
      icon: LuUtensils,
      extra: menu.length > 0 ? `${menu.length} items` : '0 items'
    },
    {
      id: 'billing',
      label: 'Invoice Prefix & Billing',
      completed: Boolean(cafe?.invoicePrefix),
      tab: 'Settings',
      icon: LuCreditCard
    },
    {
      id: 'printer',
      label: 'Thermal Printer Setup',
      completed: true, // Default browser thermal driver available
      tab: 'Settings',
      icon: LuPrinter
    },
    {
      id: 'staff',
      label: 'Staff & Security PINs',
      completed: Boolean(staff.length > 0),
      tab: 'Staff',
      icon: LuUserCheck,
      extra: staff.length > 0 ? `${staff.length} staff` : '0 staff'
    }
  ];

  const completedCount = checklist.filter(c => c.completed).length;
  const isAllComplete = completedCount === checklist.length;
  const percent = Math.round((completedCount / checklist.length) * 100);

  // If 100% complete, render compact success pill or allow folding
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[#11111D] border border-white/[0.08] shadow-lg mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white tracking-tight">Restaurant Setup Status</h2>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                isAllComplete
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}
            >
              {completedCount} / {checklist.length} Completed ({percent}%)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {isAllComplete
              ? 'All core operational modules are active and configured.'
              : 'Complete remaining setup items to unlock full POS, QR ordering, and billing capabilities.'}
          </p>
        </div>

        <button
          onClick={restartFullTour}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-violet-300 bg-violet-600/15 hover:bg-violet-600/25 border border-violet-500/30 transition-all cursor-pointer self-start sm:self-auto"
        >
          <LuSparkles size={13} />
          <span>Launch Tour Guide</span>
        </button>
      </div>

      {/* Checklist items grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3.5">
        {checklist.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigateTab?.(item.tab)}
              className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                item.completed
                  ? 'bg-white/[0.02] border-white/5 hover:border-white/15'
                  : 'bg-amber-950/15 border-amber-500/25 hover:border-amber-500/40'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icon
                  size={15}
                  className={item.completed ? 'text-emerald-400 flex-shrink-0' : 'text-amber-400 flex-shrink-0'}
                />
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-white truncate block">
                    {item.label}
                  </span>
                  {item.extra && (
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {item.extra}
                    </span>
                  )}
                </div>
              </div>

              {item.completed ? (
                <LuCircleCheck size={14} className="text-emerald-400 flex-shrink-0" />
              ) : (
                <LuCircleDashed size={14} className="text-amber-400 flex-shrink-0 animate-spin" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
