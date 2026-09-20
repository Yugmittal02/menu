import React from 'react';
import KrixovBrandMark from './KrixovBrandMark';
import { BRAND } from './brandConstants';

/**
 * Reusable Krixov Logo component with typography
 */
export default function KrixovLogo({
  size = 'md', // 'sm' | 'md' | 'lg'
  variant = 'light', // 'light' (white text) | 'dark' (slate text)
  showTagline = false,
  className = '',
  linkToWebsite = true
}) {
  const iconSizes = {
    sm: 20,
    md: 26,
    lg: 34
  };

  const textSizes = {
    sm: 'text-sm font-bold tracking-wider',
    md: 'text-base font-extrabold tracking-widest',
    lg: 'text-xl font-black tracking-widest'
  };

  const textColor = variant === 'light' ? 'text-white' : 'text-slate-900';
  const taglineColor = variant === 'light' ? 'text-slate-400' : 'text-slate-500';

  const content = (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <KrixovBrandMark size={iconSizes[size] || 26} />
      <div className="flex flex-col">
        <span className={`${textSizes[size] || textSizes.md} uppercase leading-none ${textColor}`}>
          {BRAND.COMPANY_NAME}
        </span>
        {showTagline && (
          <span className={`text-[9px] font-medium tracking-normal mt-0.5 ${taglineColor}`}>
            Enterprise Cloud Technology
          </span>
        )}
      </div>
    </div>
  );

  if (linkToWebsite) {
    return (
      <a
        href={BRAND.COMPANY_WEBSITE}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block transition-opacity hover:opacity-90 focus:outline-none"
        title="Visit Krixov"
      >
        {content}
      </a>
    );
  }

  return content;
}
