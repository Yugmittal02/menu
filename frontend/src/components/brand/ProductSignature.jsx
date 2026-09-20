import React from 'react';
import KrixovBrandMark from './KrixovBrandMark';
import { BRAND } from './brandConstants';

/**
 * ProductSignature — "QR Menu" primary product branding + "A Krixov Product"
 * Used on Login pages, Onboarding, Sidebar headers, and Admin shells.
 */
export default function ProductSignature({
  align = 'left', // 'left' | 'center'
  showBadge = true,
  className = ''
}) {
  const isCenter = align === 'center';

  return (
    <div className={`flex flex-col ${isCenter ? 'items-center text-center' : 'items-start text-left'} ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-xl font-black tracking-tight text-white">
          {BRAND.PRODUCT_NAME}
        </span>
        {showBadge && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-purple-200 border border-white/10">
            PRO
          </span>
        )}
      </div>

      <a
        href={BRAND.COMPANY_WEBSITE}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 mt-1 text-[11px] font-medium text-slate-400 hover:text-white transition-colors group"
      >
        <KrixovBrandMark size={14} className="opacity-80 group-hover:opacity-100 transition-opacity" />
        <span>A <strong className="font-semibold text-slate-300 group-hover:text-purple-300">{BRAND.COMPANY_NAME}</strong> Product</span>
      </a>
    </div>
  );
}
