import React from 'react';

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    bg: 'rgba(245, 158, 11, 0.12)',
    text: '#FBBF24',
    border: 'rgba(245, 158, 11, 0.25)',
    dot: '#F59E0B'
  },
  confirmed: {
    label: 'Confirmed',
    bg: 'rgba(124, 58, 237, 0.12)',
    text: '#A78BFA',
    border: 'rgba(124, 58, 237, 0.25)',
    dot: '#7C3AED'
  },
  preparing: {
    label: 'Preparing',
    bg: 'rgba(249, 115, 22, 0.12)',
    text: '#FB923C',
    border: 'rgba(249, 115, 22, 0.25)',
    dot: '#F97316'
  },
  ready: {
    label: 'Ready',
    bg: 'rgba(16, 185, 129, 0.12)',
    text: '#34D399',
    border: 'rgba(16, 185, 129, 0.25)',
    dot: '#10B981'
  },
  served: {
    label: 'Served',
    bg: 'rgba(34, 197, 94, 0.12)',
    text: '#4ADE80',
    border: 'rgba(34, 197, 94, 0.25)',
    dot: '#22C55E'
  },
  completed: {
    label: 'Completed',
    bg: 'rgba(59, 130, 246, 0.12)',
    text: '#60A5FA',
    border: 'rgba(59, 130, 246, 0.25)',
    dot: '#3B82F6'
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'rgba(239, 68, 68, 0.12)',
    text: '#F87171',
    border: 'rgba(239, 68, 68, 0.25)',
    dot: '#EF4444'
  },
  // Payment statuses
  paid: {
    label: 'Paid',
    bg: 'rgba(16, 185, 129, 0.12)',
    text: '#10B981',
    border: 'rgba(16, 185, 129, 0.28)',
    dot: '#10B981'
  },
  unpaid: {
    label: 'Unpaid',
    bg: 'rgba(239, 68, 68, 0.12)',
    text: '#EF4444',
    border: 'rgba(239, 68, 68, 0.25)',
    dot: '#EF4444'
  },
  // Table statuses
  available: {
    label: 'Available',
    bg: 'rgba(16, 185, 129, 0.12)',
    text: '#34D399',
    border: 'rgba(16, 185, 129, 0.25)',
    dot: '#10B981'
  },
  occupied: {
    label: 'Occupied',
    bg: 'rgba(249, 115, 22, 0.12)',
    text: '#FB923C',
    border: 'rgba(249, 115, 22, 0.25)',
    dot: '#F97316'
  },
  'payment-pending': {
    label: 'Payment Pending',
    bg: 'rgba(245, 158, 11, 0.12)',
    text: '#FBBF24',
    border: 'rgba(245, 158, 11, 0.25)',
    dot: '#F59E0B'
  }
};

const StatusBadge = ({ status, size = 'sm', pulse = false, labelOverride }) => {
  const normStatus = (status || '').toLowerCase().replace(/\s+/g, '-');
  const cfg = STATUS_CONFIG[normStatus] || {
    label: status || 'Unknown',
    bg: 'rgba(255, 255, 255, 0.06)',
    text: '#94A3B8',
    border: 'rgba(255, 255, 255, 0.1)',
    dot: '#94A3B8'
  };

  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${
        isSmall ? 'text-[11px] px-2.5 py-0.5' : 'text-xs px-3 py-1'
      }`}
      style={{
        backgroundColor: cfg.bg,
        color: cfg.text,
        border: `1px solid ${cfg.border}`
      }}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${pulse ? 'animate-pulse' : ''}`}
        style={{ backgroundColor: cfg.dot }}
      />
      <span>{labelOverride || cfg.label}</span>
    </span>
  );
};

export default StatusBadge;
