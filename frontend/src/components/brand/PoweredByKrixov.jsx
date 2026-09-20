import React from 'react';
import KrixovBrandMark from './KrixovBrandMark';
import { BRAND } from './brandConstants';

/**
 * PoweredByKrixov — Subtle, elegant platform badge for customer-facing experiences.
 * Never overpowers the restaurant's identity.
 */
export default function PoweredByKrixov({
  className = '',
  theme = 'inherit' // 'inherit' (uses CSS variables) | 'light' | 'dark'
}) {
  return (
    <div className={`inline-flex items-center justify-center gap-1.5 text-[11px] font-medium transition-opacity ${className}`}>
      <span className="opacity-75">Powered by</span>
      <a
        href={BRAND.COMPANY_WEBSITE}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-semibold opacity-90 hover:opacity-100 hover:underline underline-offset-2 transition-all focus:outline-none"
        title="Powered by Krixov Cloud Restaurant Platform"
      >
        <KrixovBrandMark size={13} className="inline-block opacity-85" />
        <span>{BRAND.COMPANY_NAME}</span>
      </a>
    </div>
  );
}
