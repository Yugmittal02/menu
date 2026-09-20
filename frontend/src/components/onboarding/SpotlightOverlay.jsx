import React from 'react';
import { useOnboarding } from '../../context/OnboardingContext';

export default function SpotlightOverlay() {
  const { phase, targetRect } = useOnboarding();

  if (phase !== 'guided_tour') return null;

  // If no target rect yet (e.g. while switching tabs), render soft dim overlay
  if (!targetRect || !targetRect.width || !targetRect.height) {
    return (
      <div
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-[2px] transition-all duration-300 pointer-events-none"
        aria-hidden="true"
      />
    );
  }

  const pad = 8;
  const x = Math.max(0, targetRect.viewportLeft - pad);
  const y = Math.max(0, targetRect.viewportTop - pad);
  const w = targetRect.width + pad * 2;
  const h = targetRect.height + pad * 2;

  return (
    <>
      {/* SVG Mask Cutout Backdrop */}
      <svg
        className="fixed inset-0 z-40 w-full h-full pointer-events-none transition-all duration-300"
        style={{ width: '100vw', height: '100vh' }}
        aria-hidden="true"
      >
        <defs>
          <mask id="spotlight-cutout-mask">
            {/* White reveals the dark backdrop */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black cuts out the spotlight hole */}
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx="14"
              ry="14"
              fill="black"
              className="transition-all duration-300 ease-out"
            />
          </mask>
        </defs>

        {/* The dim layer with mask applied */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(5, 5, 12, 0.78)"
          mask="url(#spotlight-cutout-mask)"
        />
      </svg>

      {/* Animated Glowing Ring Around the Active Control */}
      <div
        className="fixed z-40 pointer-events-none transition-all duration-300 ease-out"
        style={{
          top: `${y}px`,
          left: `${x}px`,
          width: `${w}px`,
          height: `${h}px`,
          borderRadius: '14px',
          border: '2px solid #A78BFA',
          boxShadow: '0 0 25px rgba(124, 58, 237, 0.55), inset 0 0 12px rgba(124, 58, 237, 0.25)',
          animation: 'spotlightPulse 2s infinite ease-in-out'
        }}
      >
        {/* Subtle corner badge marker */}
        <span className="absolute -top-2.5 -right-2.5 flex h-5 w-5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-5 w-5 bg-violet-600 border border-white/40 items-center justify-center text-[9px] font-bold text-white shadow-md">
            ✦
          </span>
        </span>

        <style>{`
          @keyframes spotlightPulse {
            0%, 100% {
              border-color: #8B5CF6;
              box-shadow: 0 0 20px rgba(124, 58, 237, 0.4), inset 0 0 10px rgba(124, 58, 237, 0.2);
            }
            50% {
              border-color: #C4B5FD;
              box-shadow: 0 0 35px rgba(139, 92, 246, 0.75), inset 0 0 18px rgba(139, 92, 246, 0.4);
            }
          }
        `}</style>
      </div>
    </>
  );
}
