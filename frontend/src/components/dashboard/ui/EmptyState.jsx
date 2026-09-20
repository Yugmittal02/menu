import React from 'react';

const EmptyState = ({
  icon: Icon,
  emoji,
  title,
  description,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  compact = false
}) => {
  return (
    <div
      className={`rounded-2xl flex flex-col items-center justify-center text-center ${
        compact ? 'py-10 px-4' : 'py-16 px-6'
      }`}
      style={{
        backgroundColor: 'rgba(17, 17, 29, 0.7)',
        border: '1px dashed rgba(255, 255, 255, 0.08)'
      }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-2xl"
        style={{
          backgroundColor: 'rgba(124, 58, 237, 0.08)',
          border: '1px solid rgba(124, 58, 237, 0.18)',
          color: '#A78BFA'
        }}
      >
        {Icon ? <Icon size={26} /> : emoji || '📋'}
      </div>

      <h3 className="text-base md:text-lg font-semibold text-white mb-1.5">{title}</h3>
      {description && (
        <p className="text-xs md:text-sm max-w-md mx-auto mb-5" style={{ color: '#8E8EA8' }}>
          {description}
        </p>
      )}

      {(actionText || secondaryActionText) && (
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {actionText && (
            <button
              onClick={onAction}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold text-white transition-all duration-150 hover:brightness-110 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)'
              }}
            >
              {actionText}
            </button>
          )}
          {secondaryActionText && (
            <button
              onClick={onSecondaryAction}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all duration-150 hover:bg-white/5"
              style={{
                color: '#A78BFA',
                border: '1px solid rgba(124, 58, 237, 0.3)'
              }}
            >
              {secondaryActionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
