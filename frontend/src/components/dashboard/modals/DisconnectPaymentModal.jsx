import React, { useState } from 'react';
import { LuTriangleAlert, LuX, LuLoader, LuShieldCheck } from 'react-icons/lu';
import { disconnectPaymentAccount } from '../../../services/api';

const DisconnectPaymentModal = ({ isOpen, onClose, onSuccess }) => {
  const [reason, setReason] = useState('Temporary maintenance / owner request');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleDisconnect = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await disconnectPaymentAccount(reason);
      if (onSuccess) {
        onSuccess(res.data.data);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to disconnect account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-amber-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <LuTriangleAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Disconnect Online Payments
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Safely pause Cashfree Easy Split
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <LuX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-emerald-600 dark:text-emerald-400">
              <LuShieldCheck className="w-4 h-4" />
              <span>Historical Invariant Guarantee</span>
            </div>
            <p>
              Disconnecting will immediately stop customers from paying bills online via QR code.
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              ✓ All past customer payments remain marked as <strong>PAID</strong>.<br />
              ✓ Historical settlements and refund records are <strong>never deleted</strong>.<br />
              ✓ You can reconnect your verified vendor account anytime with one click.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reason for Disconnecting
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="Temporary maintenance / owner request">Temporary maintenance / owner request</option>
              <option value="Switching or updating bank account">Switching or updating bank account</option>
              <option value="Transitioning to cash-only for today">Transitioning to cash-only for today</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Keep Connected
            </button>
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={loading}
              className="px-5 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              {loading ? (
                <>
                  <LuLoader className="w-4 h-4 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                'Confirm Disconnect'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisconnectPaymentModal;
