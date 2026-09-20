import React from 'react';
import { FiSearch, FiX, FiCalendar, FiGrid, FiList } from 'react-icons/fi';

const DataToolbar = ({
  search,
  onSearchChange,
  searchPlaceholder = 'Search orders...',
  dateFilter,
  onDateFilterChange,
  dateOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'all', label: 'All Time' }
  ],
  statusFilter,
  onStatusFilterChange,
  statusOptions = [],
  paymentFilter,
  onPaymentFilterChange,
  paymentOptions = [],
  viewMode,
  onViewModeChange
}) => {
  return (
    <div
      className="p-3 md:p-4 rounded-2xl mb-5 space-y-3"
      style={{
        backgroundColor: '#11111D',
        border: '1px solid rgba(255, 255, 255, 0.07)'
      }}
    >
      {/* Top row: Search input + Date selector + View Mode switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Search input */}
        <div className="relative flex-1">
          <FiSearch
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: '#707089' }}
            size={15}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-8 py-2 rounded-xl text-xs md:text-sm text-white placeholder-[#707089] outline-none transition-all"
            style={{
              backgroundColor: '#151523',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-0.5"
            >
              <FiX size={14} />
            </button>
          )}
        </div>

        {/* Date Filter selector */}
        {onDateFilterChange && (
          <div className="relative flex-shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-[#151523] border border-white/[0.08]">
              <FiCalendar className="text-[#A78BFA]" size={13} />
              <select
                value={dateFilter}
                onChange={(e) => onDateFilterChange(e.target.value)}
                className="bg-transparent text-white text-xs font-medium outline-none cursor-pointer pr-1"
              >
                {dateOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#11111D] text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* View Mode Switcher (Card vs Table) */}
        {onViewModeChange && (
          <div className="flex items-center gap-1 bg-[#151523] p-1 rounded-xl border border-white/[0.08] self-end sm:self-auto">
            <button
              onClick={() => onViewModeChange('cards')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'cards'
                  ? 'bg-[#7C3AED] text-white'
                  : 'text-[#8E8EA8] hover:text-white'
              }`}
              title="Card View"
            >
              <FiGrid size={14} />
            </button>
            <button
              onClick={() => onViewModeChange('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-[#7C3AED] text-white'
                  : 'text-[#8E8EA8] hover:text-white'
              }`}
              title="Table View"
            >
              <FiList size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Filter Pills row: Status + Payment */}
      {(statusOptions.length > 0 || paymentOptions.length > 0) && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.05]">
          {/* Status filter pills */}
          {statusOptions.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-medium mr-1 uppercase tracking-wider" style={{ color: '#707089' }}>
                Status:
              </span>
              {statusOptions.map((opt) => {
                const active = statusFilter === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => onStatusFilterChange(opt.value)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      active
                        ? 'bg-[#7C3AED] text-white font-semibold shadow-sm'
                        : 'bg-[#151523] text-[#A1A1B5] hover:text-white hover:bg-[#1A1A2A]'
                    }`}
                    style={{
                      border: active
                        ? '1px solid rgba(124, 58, 237, 0.4)'
                        : '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <span>{opt.label}</span>
                    {typeof opt.count === 'number' && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          active ? 'bg-white/20 text-white' : 'bg-white/5 text-[#707089]'
                        }`}
                      >
                        {opt.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Payment filter pills */}
          {paymentOptions.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-medium mr-1 uppercase tracking-wider" style={{ color: '#707089' }}>
                Payment:
              </span>
              {paymentOptions.map((opt) => {
                const active = paymentFilter === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => onPaymentFilterChange(opt.value)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      active
                        ? 'bg-[#10B981] text-white font-semibold'
                        : 'bg-[#151523] text-[#A1A1B5] hover:text-white hover:bg-[#1A1A2A]'
                    }`}
                    style={{
                      border: active
                        ? '1px solid rgba(16, 185, 129, 0.4)'
                        : '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataToolbar;
