import React, { useState } from 'react';
import { LuX, LuShieldCheck, LuBuilding, LuCreditCard, LuUser, LuHash, LuCircleAlert, LuLoader } from 'react-icons/lu';
import { connectPaymentAccount } from '../../../services/api';

const CashfreeOnboardingModal = ({ isOpen, onClose, onSuccess, cafe }) => {
  const [formData, setFormData] = useState({
    businessName: cafe?.name || '',
    accountHolderName: cafe?.ownerName || '',
    bankAccount: '',
    confirmBankAccount: '',
    ifsc: '',
    phone: cafe?.phone || '',
    email: cafe?.email || '',
    businessType: 'INDIVIDUAL'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'ifsc' ? value.toUpperCase().trim() : value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.bankAccount !== formData.confirmBankAccount) {
      setError('Bank account numbers do not match');
      return;
    }

    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifsc)) {
      setError('Please enter a valid 11-character IFSC code (e.g. HDFC0001234)');
      return;
    }

    setLoading(true);
    try {
      const res = await connectPaymentAccount({
        businessName: formData.businessName,
        accountHolderName: formData.accountHolderName,
        bankAccount: formData.bankAccount,
        ifsc: formData.ifsc,
        phone: formData.phone,
        email: formData.email,
        businessType: formData.businessType
      });

      if (onSuccess) {
        onSuccess(res.data.data);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to connect payment account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-600/10 via-teal-600/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <LuShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Connect Cashfree Easy Split
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct bank settlement for customer dining payments
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

        {/* Security Notice */}
        <div className="px-6 pt-4">
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
            <LuShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <span>
              <strong>Zero Credential Sharing:</strong> You never need to supply Cashfree API secrets. Krixov directly registers your verified settlement account with Cashfree Easy Split so customer funds route securely into your bank.
            </span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <LuCircleAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Business / Restaurant Name *
              </label>
              <div className="relative">
                <LuBuilding className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  name="businessName"
                  required
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="The Coffee Roasters"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Account Holder Name (as in bank) *
              </label>
              <div className="relative">
                <LuUser className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  name="accountHolderName"
                  required
                  value={formData.accountHolderName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bank Account Number *
              </label>
              <div className="relative">
                <LuCreditCard className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  name="bankAccount"
                  required
                  value={formData.bankAccount}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none tracking-wider"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confirm Account Number *
              </label>
              <div className="relative">
                <LuCreditCard className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  name="confirmBankAccount"
                  required
                  value={formData.confirmBankAccount}
                  onChange={handleChange}
                  placeholder="Enter again to confirm"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none tracking-wider"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bank IFSC Code *
              </label>
              <div className="relative">
                <LuHash className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  name="ifsc"
                  required
                  maxLength={11}
                  value={formData.ifsc}
                  onChange={handleChange}
                  placeholder="HDFC0001234"
                  className="w-full pl-9 pr-3 py-2 text-sm uppercase rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Business Structure
              </label>
              <select
                name="businessType"
                value={formData.businessType}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="INDIVIDUAL">Individual / Sole Proprietorship</option>
                <option value="PROPRIETORSHIP">Proprietorship</option>
                <option value="PARTNERSHIP">Partnership / LLP</option>
                <option value="PRIVATE_LIMITED">Private Limited</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Notification Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="9876543210"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Settlement Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="accounts@mycafe.com"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              {loading ? (
                <>
                  <LuLoader className="w-4 h-4 animate-spin" />
                  Verifying with Cashfree...
                </>
              ) : (
                <>
                  <LuShieldCheck className="w-4 h-4" />
                  Complete Verification & Connect
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CashfreeOnboardingModal;
