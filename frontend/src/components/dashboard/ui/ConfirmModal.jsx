import React from 'react';
import { FiAlertTriangle, FiX } from 'react-icons/fi';

const ConfirmModal = ({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  danger = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-md rounded-2xl p-6 shadow-2xl transition-all scale-100"
        style={{
          backgroundColor: '#151523',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: danger ? 'rgba(239, 68, 68, 0.15)' : 'rgba(124, 58, 237, 0.15)',
                color: danger ? '#EF4444' : '#A78BFA'
              }}
            >
              <FiAlertTriangle size={20} />
            </div>
            <h3 className="text-base font-bold text-white">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-[#707089] hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        <p className="text-sm mb-6" style={{ color: '#A1A1B5' }}>
          {message}
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition-colors hover:bg-white/5"
            style={{ color: '#A1A1B5', border: '1px solid rgba(255, 255, 255, 0.1)' }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold text-white transition-all shadow-md active:scale-95 ${
              danger ? 'bg-[#EF4444] hover:bg-[#DC2626]' : 'bg-[#7C3AED] hover:bg-[#6D28D9]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
