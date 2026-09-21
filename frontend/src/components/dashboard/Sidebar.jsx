import React from 'react';
import {
  LuLayoutDashboard,
  LuShoppingBag,
  LuUtensils,
  LuTicket,
  LuQrCode,
  LuChartColumn,
  LuSettings,
  LuLifeBuoy,
  LuLogOut,
  LuChevronLeft,
  LuChevronRight,
  LuMonitor,
  LuLayoutGrid,
  LuCalendar,
  LuUsers,
  LuBoxes,
  LuUserCheck,
  LuCreditCard
} from 'react-icons/lu';

const NAV_ITEMS = [
  { id: 'Overview', label: 'Overview', icon: LuLayoutDashboard },
  { id: 'Orders', label: 'Orders', icon: LuShoppingBag, badgeKey: 'orders', moduleKey: 'kot' },
  { id: 'POS', label: 'POS Billing', icon: LuMonitor },
  { id: 'Tables', label: 'Tables', icon: LuLayoutGrid, badgeKey: 'activeTables' },
  { id: 'Reservations', label: 'Reservations', icon: LuCalendar, badgeKey: 'reservations', moduleKey: 'reservations' },
  { id: 'Menu', label: 'Menu', icon: LuUtensils, badgeKey: 'menu' },
  { id: 'Inventory', label: 'Inventory', icon: LuBoxes, badgeKey: 'inventoryAlerts', moduleKey: 'inventory' },
  { id: 'CRM', label: 'Customer CRM', icon: LuUsers, moduleKey: 'crm' },
  { id: 'Staff', label: 'Staff & Roles', icon: LuUserCheck },
  { id: 'Coupons', label: 'Coupons', icon: LuTicket, badgeKey: 'coupons', moduleKey: 'coupons' },
  { id: 'QR', label: 'QR Codes', icon: LuQrCode },
  { id: 'Analytics', label: 'Analytics', icon: LuChartColumn },
  { id: 'Payments', label: 'Payments', icon: LuCreditCard, moduleKey: 'payments' },
  { id: 'Settings', label: 'Settings', icon: LuSettings },
  { id: 'Support', label: 'Help & Support', icon: LuLifeBuoy }
];

import PoweredByKrixov from '../brand/PoweredByKrixov';

const Sidebar = ({
  activeTab,
  onTabChange,
  cafe,
  badges = {},
  isCollapsed = false,
  onToggleCollapse,
  onLogout,
  onHelpClick,
  isMobileOpen = false,
  onCloseMobile,
  activeStaff = null,
  onOpenPinModal,
  systemModules = {}
}) => {
  // Close mobile drawer on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMobileOpen && onCloseMobile) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  return (
    <>
      {/* ======================================================== */}
      {/* 1. Mobile Slide-Out Drawer (Upper-Left Hamburger Menu)   */}
      {/* ======================================================== */}
      <div
        className={`md:hidden fixed inset-0 z-50 transition-all duration-300 ${
          isMobileOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
        }`}
        aria-hidden={!isMobileOpen}
      >
        {/* Dark Dimmed Backdrop */}
        <div
          className={`fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300 ${
            isMobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onCloseMobile}
        />

        {/* Sliding Panel */}
        <aside
          className={`fixed top-0 bottom-0 left-0 w-[290px] sm:w-[320px] max-w-[85vw] bg-[#11111D] border-r border-white/10 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out z-10 ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ backgroundColor: '#11111D' }}
        >
          {/* Mobile Drawer Header: Cafe Identity + Close Button */}
          <div className="p-4 border-b border-white/[0.08] flex items-center justify-between gap-3 h-16 bg-[#151523]">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0 shadow-md text-base"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
                }}
              >
                {cafe?.name ? cafe.name.charAt(0).toUpperCase() : '☕'}
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-bold text-white truncate leading-tight">
                  {cafe?.name || 'Cafe Dashboard'}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  <span className="text-[11px] font-mono text-[#A1A1B5]">
                    {cafe?.cafeId || 'CAFE'}
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[#A1A1B5] hover:text-white bg-white/5 hover:bg-white/10 active:scale-95 transition-all border border-white/5 cursor-pointer"
              title="Close Navigation"
              aria-label="Close Navigation"
            >
              <LuChevronLeft size={20} />
            </button>
          </div>

          {/* Active Staff PIN Badge in Mobile Drawer */}
          {activeStaff ? (
            <div className="mx-3 mt-3 px-3 py-2 rounded-xl bg-[#7C3AED]/15 border border-[#7C3AED]/30 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-white truncate">{activeStaff.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-[#7C3AED]/30 text-[#C4B5FD] uppercase">
                  {activeStaff.role}
                </span>
              </div>
              {onOpenPinModal && (
                <button
                  onClick={() => {
                    onCloseMobile?.();
                    onOpenPinModal();
                  }}
                  className="text-[11px] text-[#A78BFA] hover:text-white underline cursor-pointer"
                >
                  Switch
                </button>
              )}
            </div>
          ) : null}

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-3 space-y-1.5 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;
              const mod = item.moduleKey ? systemModules[item.moduleKey] : null;
              const isInactive = mod && mod.status && mod.status !== 'active';

              const handleNavClick = () => {
                if (isInactive) {
                  const statusLabel = mod.status === 'maintenance' ? 'Under Maintenance' : mod.status === 'soon' ? 'Coming Soon' : 'Disabled';
                  alert(`[${item.label}] is currently ${statusLabel}.\n\n${mod.message || 'System features undergo scheduled enhancements. Backend services continue operating uninterrupted.'}`);
                  return;
                }
                onTabChange(item.id);
                onCloseMobile?.();
              };

              return (
                <button
                  key={item.id}
                  data-tour={`nav-mobile-${item.id}`}
                  onClick={handleNavClick}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    active
                      ? 'text-white bg-[#7C3AED]/20 border border-[#7C3AED]/40 shadow-sm font-semibold'
                      : isInactive
                      ? 'text-[#64748B] hover:text-[#94A3B8] opacity-75'
                      : 'text-[#A1A1B5] hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      size={19}
                      className="flex-shrink-0"
                      style={{ color: active ? '#A78BFA' : isInactive ? '#475569' : '#94A3B8' }}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Module Status Pill */}
                    {isInactive && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border ${
                        mod.status === 'maintenance'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/25'
                          : mod.status === 'soon'
                          ? 'bg-purple-500/15 text-purple-300 border-purple-500/25'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {mod.status === 'maintenance' ? 'Maint' : mod.status === 'soon' ? 'Soon' : 'Off'}
                      </span>
                    )}

                    {/* Badge Counter */}
                    {badgeCount > 0 && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                          item.id === 'Orders'
                            ? 'bg-[#EF4444] text-white shadow-sm animate-pulse'
                            : 'bg-[#7C3AED]/30 text-[#A78BFA]'
                        }`}
                      >
                        {badgeCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Bottom section: Help & Support, Logout */}
          <div className="p-3 border-t border-white/[0.08] space-y-1.5 bg-[#0D0D17]">
            <button
              data-tour="nav-mobile-help"
              onClick={() => {
                onTabChange?.('Support');
                onCloseMobile?.();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'Support'
                  ? 'bg-purple-600/20 text-purple-300 font-bold'
                  : 'text-[#A1A1B5] hover:text-white hover:bg-white/5'
              }`}
            >
              <LuLifeBuoy size={17} className="flex-shrink-0" />
              <span>Help & Support</span>
            </button>

            <button
              onClick={() => {
                onLogout?.();
                onCloseMobile?.();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors cursor-pointer"
            >
              <LuLogOut size={17} className="flex-shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </aside>
      </div>

      {/* ======================================================== */}
      {/* 2. Desktop Left Sidebar (240px or collapsed 76px)        */}
      {/* ======================================================== */}
      <aside
        className={`hidden md:flex flex-col flex-shrink-0 transition-all duration-300 select-none z-30 sticky top-0 h-screen`}
        style={{
          width: isCollapsed ? '76px' : '240px',
          backgroundColor: '#11111D',
          borderRight: '1px solid rgba(255, 255, 255, 0.07)'
        }}
      >
        {/* Brand & Cafe Identity */}
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between gap-3 h-16">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0 shadow-md"
              style={{
                background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
              }}
            >
              {cafe?.name ? cafe.name.charAt(0).toUpperCase() : '☕'}
            </div>

            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-bold text-white truncate leading-tight">
                  {cafe?.name || 'Cafe Dashboard'}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  <span className="text-[10px] font-mono" style={{ color: '#A1A1B5' }}>
                    {cafe?.cafeId || 'CAFE'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Collapse button on tablet/laptop */}
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded-lg text-[#707089] hover:text-white hover:bg-white/5 transition-colors hidden lg:flex"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <LuChevronRight size={16} /> : <LuChevronLeft size={16} />}
          </button>
        </div>

        {/* Main Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;
            const mod = item.moduleKey ? systemModules[item.moduleKey] : null;
            const isInactive = mod && mod.status && mod.status !== 'active';

            const handleDesktopNavClick = () => {
              if (isInactive) {
                const statusLabel = mod.status === 'maintenance' ? 'Under Maintenance' : mod.status === 'soon' ? 'Coming Soon' : 'Disabled';
                alert(`[${item.label}] is currently ${statusLabel}.\n\n${mod.message || 'System features undergo scheduled enhancements. Backend services continue operating uninterrupted.'}`);
                return;
              }
              onTabChange(item.id);
            };

            return (
              <button
                key={item.id}
                data-tour={`nav-${item.id}`}
                onClick={handleDesktopNavClick}
                title={isCollapsed ? (isInactive ? `${item.label} (${mod.status})` : item.label) : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all relative group cursor-pointer ${
                  active
                    ? 'text-white'
                    : isInactive
                    ? 'text-[#64748B] hover:text-[#94A3B8] opacity-75'
                    : 'text-[#A1A1B5] hover:text-white hover:bg-[#1A1A2A]'
                }`}
                style={{
                  backgroundColor: active ? 'rgba(124, 58, 237, 0.14)' : 'transparent',
                  border: active ? '1px solid rgba(124, 58, 237, 0.28)' : '1px solid transparent'
                }}
              >
                {/* Active thin indicator line */}
                {active && (
                  <div
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full"
                    style={{ backgroundColor: '#7C3AED' }}
                  />
                )}

                <Icon
                  size={18}
                  className="flex-shrink-0 transition-colors"
                  style={{ color: active ? '#A78BFA' : isInactive ? '#475569' : 'inherit' }}
                />

                {!isCollapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}

                {/* Module Status Pill */}
                {isInactive && !isCollapsed && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase border ${
                    mod.status === 'maintenance'
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/25'
                      : mod.status === 'soon'
                      ? 'bg-purple-500/15 text-purple-300 border-purple-500/25'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {mod.status === 'maintenance' ? 'Maint' : mod.status === 'soon' ? 'Soon' : 'Off'}
                  </span>
                )}

                {/* Badge Counter */}
                {badgeCount > 0 && !isCollapsed && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono ${
                      item.id === 'Orders'
                        ? 'bg-[#EF4444] text-white shadow-sm animate-pulse'
                        : 'bg-[#7C3AED]/30 text-[#A78BFA]'
                    }`}
                  >
                    {badgeCount}
                  </span>
                )}

                {badgeCount > 0 && isCollapsed && (
                  <span
                    className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#EF4444]"
                    title={`${badgeCount} new orders`}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom section: Help & Support, Logout */}
        <div className="p-3 border-t border-white/[0.06] space-y-1">
          <button
            data-tour="nav-help"
            onClick={() => onTabChange?.('Support')}
            title={isCollapsed ? 'Help & Support' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeTab === 'Support'
                ? 'bg-purple-600/20 text-purple-300 font-bold'
                : 'text-[#707089] hover:text-white hover:bg-[#1A1A2A]'
            }`}
          >
            <LuLifeBuoy size={17} className="flex-shrink-0" />
            {!isCollapsed && <span className="truncate">Help & Support</span>}
          </button>

          <button
            onClick={onLogout}
            title={isCollapsed ? 'Logout' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
          >
            <LuLogOut size={17} className="flex-shrink-0" />
            {!isCollapsed && <span className="truncate">Logout</span>}
          </button>

          {!isCollapsed && (
            <div className="pt-2 flex justify-center text-slate-500">
              <PoweredByKrixov className="text-slate-500 hover:text-slate-300 text-[10px]" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
