import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileBottomNav from './MobileBottomNav';

const DashboardShell = ({
  activeTab,
  onTabChange,
  cafe,
  badges,
  soundOn,
  onToggleSound,
  isDark,
  onToggleTheme,
  refreshing,
  onRefresh,
  lastUpdatedText,
  onLogout,
  onHelpClick,
  activeStaff = null,
  onOpenPinModal,
  refreshToast = null,
  systemModules = {},
  noticesCount = 0,
  onOpenNoticeDrawer,
  children
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row text-[#F8FAFC]"
      style={{ backgroundColor: '#0B0B14' }}
    >
      {/* Global Refresh Floating Toast Notification */}
      {refreshToast && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#1E1B4B]/95 border border-[#8B5CF6]/50 text-white text-xs font-semibold shadow-2xl backdrop-blur-md animate-fadeIn">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
          <span>{refreshToast}</span>
        </div>
      )}

      {/* Desktop Left Sidebar (240px or collapsed 76px) + Mobile Slide-out Drawer */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        cafe={cafe}
        badges={badges}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        onLogout={onLogout}
        onHelpClick={onHelpClick}
        isMobileOpen={isMobileDrawerOpen}
        onCloseMobile={() => setIsMobileDrawerOpen(false)}
        activeStaff={activeStaff}
        onOpenPinModal={onOpenPinModal}
        systemModules={systemModules}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Compact Sticky Topbar */}
        <Topbar
          activeTab={activeTab}
          cafe={cafe}
          soundOn={soundOn}
          onToggleSound={onToggleSound}
          isDark={isDark}
          onToggleTheme={onToggleTheme}
          refreshing={refreshing}
          onRefresh={onRefresh}
          lastUpdatedText={lastUpdatedText}
          activeStaff={activeStaff}
          onOpenPinModal={onOpenPinModal}
          onOpenHelpTour={onHelpClick}
          onMobileMenuOpen={() => setIsMobileDrawerOpen(true)}
          noticesCount={noticesCount}
          onOpenNoticeDrawer={onOpenNoticeDrawer}
        />

        {/* Scrollable Page Viewport */}
        <main className="flex-1 px-3.5 py-4 sm:px-5 sm:py-5 md:px-7 md:py-6 pb-24 md:pb-8 w-full max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Sticky Bottom Navigation (Strictly 4 Items: Overview, Orders, POS, Tables) */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={onTabChange}
        badges={badges}
      />
    </div>
  );
};

export default DashboardShell;
