import React from 'react';

const COLOR_MAP = {
  purple: {
    iconBg: 'rgba(124, 58, 237, 0.12)',
    iconColor: '#A78BFA',
    border: 'rgba(124, 58, 237, 0.25)',
    bar: '#7C3AED'
  },
  green: {
    iconBg: 'rgba(16, 185, 129, 0.12)',
    iconColor: '#34D399',
    border: 'rgba(16, 185, 129, 0.25)',
    bar: '#10B981'
  },
  orange: {
    iconBg: 'rgba(245, 158, 11, 0.12)',
    iconColor: '#FBBF24',
    border: 'rgba(245, 158, 11, 0.25)',
    bar: '#F59E0B'
  },
  blue: {
    iconBg: 'rgba(59, 130, 246, 0.12)',
    iconColor: '#60A5FA',
    border: 'rgba(59, 130, 246, 0.25)',
    bar: '#3B82F6'
  },
  red: {
    iconBg: 'rgba(239, 68, 68, 0.12)',
    iconColor: '#F87171',
    border: 'rgba(239, 68, 68, 0.25)',
    bar: '#EF4444'
  }
};

const KpiCard = ({
  label,
  value,
  icon: Icon,
  color = 'purple',
  subtitle,
  badge,
  onClick
}) => {
  const c = COLOR_MAP[color] || COLOR_MAP.purple;

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-[14px] p-3.5 sm:p-4 md:p-5 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5 active:scale-[0.98]' : ''
      }`}
      style={{
        backgroundColor: '#11111D',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.35)'
      }}
    >
      {/* Top row: Label + Icon */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-[#CBD5E1] truncate">
          {label}
        </span>
        {Icon && (
          <div
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: c.iconBg, color: c.iconColor }}
          >
            <Icon size={17} />
          </div>
        )}
      </div>

      {/* Main value display with tabular numbers */}
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <div className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white font-mono">
          {value}
        </div>
        {badge && (
          <span
            className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: c.iconBg, color: c.iconColor }}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Subtitle / note with high contrast */}
      {subtitle && (
        <p className="text-[11px] sm:text-xs mt-1 truncate text-[#94A3B8]">
          {subtitle}
        </p>
      )}

      {/* Subtle bottom accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2.5px] opacity-90"
        style={{
          background: `linear-gradient(90deg, transparent 5%, ${c.bar} 50%, transparent 95%)`
        }}
      />
    </div>
  );
};

export default KpiCard;
