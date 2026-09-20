import React from 'react';

/**
 * Krixov BrandMark — scalable, high-tech geometric mark
 */
export default function KrixovBrandMark({ size = 24, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="krixov-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      {/* Outer rounded container with subtle glow border */}
      <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#krixov-grad)" />
      {/* Dynamic faceted 'K' geometric emblem */}
      <path
        d="M10 8V24M10 16L18 8M13 13L21 24"
        stroke="#FFFFFF"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="21" cy="9" r="1.5" fill="#A7F3D0" />
    </svg>
  );
}
