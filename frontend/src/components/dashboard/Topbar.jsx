import React, { useState, useEffect } from 'react';
import {
  FiMenu,
  FiVolume2,
  FiVolumeX,
  FiRefreshCw,
  FiSun,
  FiMoon,
  FiDownload,
  FiShare,
  FiX
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
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Check if running in standalone PWA mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setInstallPrompt(null);
    } else {
      alert("To install this app on your device:\n\n1. Open your browser menu (⋮)\n2. Tap 'Add to Home screen' or 'Install App'");
    }
  };
  return (
    <header
      className="sticky top-0 z-20 h-16 px-3 sm:px-4 md:px-6 flex items-center justify-between transition-colors duration-300"
      style={{
        backgroundColor: 'var(--dash-glass)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--dash-border)'
      }}
    >
      {/* Left: Mobile hamburger + Active Section + Online status */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile menu trigger - upper left slide bar toggle */}
        <button
          onClick={onMobileMenuOpen}
          className="md:hidden flex items-center justify-center w-10 h-10 -ml-1 rounded-xl active:scale-95 transition-all shadow-sm cursor-pointer"
          style={{
            color: 'var(--dash-text)',
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            border: '1px solid var(--dash-border-light)'
          }}
          title="Open Navigation Menu"
          aria-label="Open Navigation Menu"
        >
          <FiMenu size={22} />
        </button>

        {/* Section title & breadcrumb */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1
              className="text-sm sm:text-base font-bold tracking-tight truncate max-w-[120px] sm:max-w-none"
              style={{ color: 'var(--dash-text)' }}
            >
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
            className="h-9 flex items-center justify-center gap-1.5 px-2 sm:px-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            style={{
              color: 'var(--dash-topbar-icon)',
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
              border: '1px solid var(--dash-border-light)'
            }}
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
              : ''
          }`}
          style={!soundOn ? {
            color: 'var(--dash-topbar-icon)',
            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            border: '1px solid var(--dash-border-light)'
          } : undefined}
          title={soundOn ? 'Order sound & buzzer active (click to mute)' : 'Sound muted (click to enable)'}
          aria-label={soundOn ? 'Mute buzzer' : 'Enable sound'}
        >
          {soundOn ? <FiVolume2 size={17} /> : <FiVolumeX size={17} />}
        </button>

        {/* Theme Toggle (Dark/Light) */}
        <button
          onClick={onToggleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors cursor-pointer"
          style={{
            color: 'var(--dash-topbar-icon)',
            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            border: '1px solid var(--dash-border-light)'
          }}
          title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          aria-label="Toggle theme"
        >
          {isDark ? <FiSun size={17} className="text-[#FBBF24]" /> : <FiMoon size={17} className="text-[#7C3AED]" />}
        </button>

        {/* Whole System Refresh Button */}
        <button
          data-tour="topbar-refresh"
          onClick={onRefresh}
          disabled={refreshing}
          className={`h-9 flex items-center justify-center gap-1.5 px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            refreshing
              ? 'bg-[#7C3AED]/25 border border-[#7C3AED]/50 text-[#C4B5FD]'
              : ''
          }`}
          style={!refreshing ? {
            color: 'var(--dash-topbar-icon)',
            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            border: '1px solid var(--dash-border-light)'
          } : undefined}
          title="Refresh Entire System (orders, tables, menu, inventory, stats)"
          aria-label="Refresh Entire System"
        >
          <FiRefreshCw
            size={15}
            className={`${refreshing ? 'animate-spin text-purple-400' : ''}`}
            style={!refreshing ? { color: 'var(--dash-topbar-icon)' } : undefined}
          />
          <span className="hidden md:inline text-[11px] font-mono" style={{ color: 'var(--dash-text-secondary)' }}>
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

        {/* Install PWA Button for Phone / Tablet / Desktop */}
        {!isInstalled && (
          <button
            onClick={handleInstallClick}
            className="h-9 flex items-center justify-center gap-1.5 px-2 sm:px-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 active:scale-95 transition-all cursor-pointer shadow-sm"
            title="Install Cafe Dashboard as App on Phone or Desktop"
            aria-label="Install App"
          >
            <FiDownload size={14} />
            <span className="hidden xs:inline">Install App</span>
          </button>
        )}

        {/* Notice Board Bell Button */}
        <button
          onClick={onOpenNoticeDrawer}
          className="relative h-9 w-9 flex items-center justify-center rounded-xl transition-colors cursor-pointer"
          style={{
            color: 'var(--dash-topbar-icon)',
            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            border: '1px solid var(--dash-border-light)'
          }}
          title="Notice Board & Announcements"
          aria-label="Notice Board & Announcements"
        >
          <LuBell size={17} className={noticesCount > 0 ? "text-amber-400" : ""} style={noticesCount <= 0 ? { color: 'var(--dash-topbar-icon)' } : undefined} />
          {noticesCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-black font-extrabold text-[9px] flex items-center justify-center shadow-md animate-pulse">
              {noticesCount}
            </span>
          )}
        </button>

        {/* Cafe Profile Chip */}
        <div
          className="hidden sm:flex items-center gap-2 pl-2"
          style={{ borderLeft: '1px solid var(--dash-border)' }}
          title={cafe?.name}
        >
          <div className="text-right">
            <p className="text-xs font-semibold leading-tight truncate max-w-[110px]" style={{ color: 'var(--dash-text)' }}>
              {cafe?.ownerName || cafe?.name || 'Owner'}
            </p>
            <p className="text-[10px] truncate max-w-[110px] font-mono" style={{ color: 'var(--dash-text-muted)' }}>
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

      {/* iOS Safari PWA Install Modal Guide */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div
            className="w-full max-w-sm rounded-2xl p-6 shadow-2xl relative"
            style={{
              backgroundColor: 'var(--dash-surface)',
              border: '1px solid var(--dash-border-light)',
              color: 'var(--dash-text)'
            }}
          >
            <button
              onClick={() => setShowIosGuide(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white"
            >
              <FiX size={18} />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center">
                <FiDownload size={22} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Install on iPhone / iPad</h3>
                <p className="text-xs text-gray-400">Run Cafe Dashboard like a native app</p>
              </div>
            </div>
            <ol className="space-y-3 text-xs text-gray-300">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-[10px]">1</span>
                <span>Tap the <strong className="text-white">Share</strong> button <FiShare className="inline text-violet-400 mx-0.5" /> in Safari’s bottom bar.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-[10px]">2</span>
                <span>Scroll down and select <strong className="text-white">Add to Home Screen</strong>.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-[10px]">3</span>
                <span>Tap <strong className="text-white">Add</strong> in top-right corner. It will appear on your home screen!</span>
              </li>
            </ol>
            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Topbar;
