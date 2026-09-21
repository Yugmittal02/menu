import React from 'react';
import {
  FiMenu,
  FiVolume2,
  FiVolumeX,
  FiRefreshCw,
  FiSun,
  FiMoon
} from 'react-icons/fi';
import { LuLock, LuUserCheck, LuBell } from 'react-icons/lu';

const Topbar = ({
  activeTab,
  cafe,
  soundOn,
  onToggleSound,
  isDark,
  onToggleTheme,
  refreshing,
  onRefresh,
  lastUpdatedText = 'Live',
  onMobileMenuOpen,
  activeStaff = null,
  onOpenPinModal,
  onOpenHelpTour,
  noticesCount = 0,
  onOpenNoticeDrawer
}) => {
  return (
    <header
      className="sticky top-0 z-20 h-16 px-3 sm:px-4 md:px-6 flex items-center justify-between border-b"
      style={{
        backgroundColor: 'rgba(17, 17, 29, 0.92)',
        backdropFilter: 'blur(16px)',
        borderColor: 'rgba(255, 255, 255, 0.08)'
      }}
    >
      {/* Left: Mobile hamburger + Active Section + Online status */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile menu trigger - upper left slide bar toggle */}
        <button
          onClick={onMobileMenuOpen}
          className="md:hidden flex items-center justify-center w-10 h-10 -ml-1 rounded-xl text-white bg-white/[0.08] hover:bg-white/[0.15] active:scale-95 transition-all border border-white/10 shadow-sm cursor-pointer"
          title="Open Navigation Menu"
          aria-label="Open Navigation Menu"
        >
          <FiMenu size={22} className="text-white" />
        </button>

        {/* Section title & breadcrumb */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate max-w-[120px] sm:max-w-none">
              {activeTab === 'QR' ? 'QR Codes & Tables' : activeTab}
            </h1>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0"
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: '#10B981',
                border: '1px solid rgba(16, 185, 129, 0.25)'
              }}
              title="Online & Accepting Orders"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span className="hidden xs:inline">Accepting Orders</span>
            </span>
          </div>
        </div>
      </div>

      {/* Right: Staff PIN switcher, Sound toggle, Theme toggle, Refresh, Profile chip */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* Staff Switcher Button */}
        {activeStaff ? (
          <button
            data-tour="topbar-staff-btn"
            onClick={onOpenPinModal}
            className="h-9 flex items-center gap-1.5 px-2 sm:px-2.5 rounded-xl text-xs font-semibold bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#C4B5FD] hover:bg-[#7C3AED]/30 transition-all shadow-sm cursor-pointer"
            title={`Staff Active: ${activeStaff.name} (${activeStaff.role}). Click to switch user.`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="max-w-[65px] sm:max-w-[100px] truncate">{activeStaff.name}</span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] uppercase font-mono bg-[#7C3AED]/30 text-white">
              {activeStaff.role}
            </span>
          </button>
        ) : (
          <button
            data-tour="topbar-staff-btn"
            onClick={onOpenPinModal}
            className="h-9 flex items-center justify-center gap-1.5 px-2 sm:px-2.5 rounded-xl text-xs font-medium text-[#CBD5E1] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors cursor-pointer"
            title="Switch / Authenticate Staff PIN"
          >
            <LuLock size={15} className="text-[#A78BFA]" />
            <span className="hidden sm:inline font-medium">Staff PIN</span>
          </button>
        )}

        {/* Audio Alerts & Buzzer Toggle */}
        <button
          data-tour="topbar-sound"
          onClick={onToggleSound}
          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
            soundOn
              ? 'text-[#C4B5FD] bg-[#7C3AED]/20 border border-[#7C3AED]/40 shadow-sm'
              : 'text-[#94A3B8] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10'
          }`}
          title={soundOn ? 'Order sound & buzzer active (click to mute)' : 'Sound muted (click to enable)'}
          aria-label={soundOn ? 'Mute buzzer' : 'Enable sound'}
        >
          {soundOn ? <FiVolume2 size={17} /> : <FiVolumeX size={17} />}
        </button>

        {/* Theme Toggle (Dark/Light) */}
        <button
          onClick={onToggleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-[#CBD5E1] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors cursor-pointer"
          title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          aria-label="Toggle theme"
        >
          {isDark ? <FiSun size={17} className="text-[#FBBF24]" /> : <FiMoon size={17} className="text-[#A78BFA]" />}
        </button>

        {/* Whole System Refresh Button */}
        <button
          data-tour="topbar-refresh"
          onClick={onRefresh}
          disabled={refreshing}
          className={`h-9 flex items-center justify-center gap-1.5 px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            refreshing
              ? 'bg-[#7C3AED]/25 border border-[#7C3AED]/50 text-[#C4B5FD]'
              : 'text-[#CBD5E1] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10'
          }`}
          title="Refresh Entire System (orders, tables, menu, inventory, stats)"
          aria-label="Refresh Entire System"
        >
          <FiRefreshCw
            size={15}
            className={`${refreshing ? 'animate-spin text-purple-400' : 'text-[#CBD5E1]'}`}
          />
          <span className="hidden md:inline text-[11px] font-mono text-[#A1A1B5]">
            {refreshing ? 'Syncing...' : lastUpdatedText}
          </span>
        </button>

        {/* Persistent Help & Tour Button */}
        <button
          data-tour="topbar-help"
          onClick={onOpenHelpTour}
          className="h-9 flex items-center justify-center gap-1.5 px-2 sm:px-2.5 rounded-xl text-xs font-semibold text-violet-300 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 transition-all cursor-pointer shadow-sm"
          title="Tour Guide & Help Center"
          aria-label="Tour Guide & Help Center"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          <span className="hidden xs:inline">Tour Guide</span>
        </button>

        {/* Notice Board Bell Button */}
        <button
          onClick={onOpenNoticeDrawer}
          className="relative h-9 w-9 flex items-center justify-center rounded-xl text-[#CBD5E1] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors cursor-pointer"
          title="Notice Board & Announcements"
          aria-label="Notice Board & Announcements"
        >
          <LuBell size={17} className={noticesCount > 0 ? "text-amber-400" : "text-[#CBD5E1]"} />
          {noticesCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-black font-extrabold text-[9px] flex items-center justify-center shadow-md animate-pulse">
              {noticesCount}
            </span>
          )}
        </button>

        {/* Cafe Profile Chip */}
        <div
          className="hidden sm:flex items-center gap-2 pl-2 border-l border-white/[0.08]"
          title={cafe?.name}
        >
          <div className="text-right">
            <p className="text-xs font-semibold text-white leading-tight truncate max-w-[110px]">
              {cafe?.ownerName || cafe?.name || 'Owner'}
            </p>
            <p className="text-[10px] text-[#94A3B8] truncate max-w-[110px] font-mono">
              {cafe?.cafeId}
            </p>
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
            style={{ backgroundColor: '#7C3AED' }}
          >
            {cafe?.name ? cafe.name.charAt(0).toUpperCase() : 'C'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
