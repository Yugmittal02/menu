import React from 'react';
import {
  LuLayoutDashboard,
  LuShoppingBag,
  LuMonitor,
  LuLayoutGrid
} from 'react-icons/lu';

const PRIMARY_MOBILE_ITEMS = [
  { id: 'Overview', label: 'Overview', icon: LuLayoutDashboard },
  { id: 'Orders', label: 'Orders', icon: LuShoppingBag, badgeKey: 'orders' },
  { id: 'POS', label: 'POS', icon: LuMonitor },
  { id: 'Tables', label: 'Tables', icon: LuLayoutGrid, badgeKey: 'activeTables' }
];

const MobileBottomNav = ({
  activeTab,
  onTabChange,
  badges = {}
}) => {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 border-t px-1 grid grid-cols-4 items-center"
      style={{
        backgroundColor: '#11111D',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.4)'
      }}
    >
      {PRIMARY_MOBILE_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = activeTab === item.id;
        const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;

        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center justify-center h-full py-1 text-[11px] font-medium transition-all relative select-none cursor-pointer ${
              active ? 'text-white font-semibold' : 'text-[#94A3B8] hover:text-white'
            }`}
            aria-label={item.label}
          >
            <div className="relative flex items-center justify-center">
              <Icon
                size={21}
                style={{ color: active ? '#A78BFA' : 'currentColor' }}
                className="transition-transform active:scale-90"
              />
              {badgeCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] rounded-full bg-[#EF4444] text-white text-[9px] font-bold flex items-center justify-center px-1 animate-pulse font-mono shadow-sm">
                  {badgeCount}
                </span>
              )}
            </div>
            <span className="mt-1 leading-none text-[11px] tracking-tight">{item.label}</span>
            {active && (
              <div
                className="w-5 h-0.5 rounded-full mt-1"
                style={{
                  backgroundColor: '#8B5CF6',
                  boxShadow: '0 0 8px rgba(139, 92, 246, 0.8)'
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;

