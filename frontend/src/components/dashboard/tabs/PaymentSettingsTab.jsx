import React, { useState, useEffect } from 'react';
import {
  LuCreditCard,
  LuShieldCheck,
  LuBuilding,
  LuRefreshCw,
  LuCircleCheck,
  LuTriangleAlert,
  LuPower,
  LuTrendingUp,
  LuIndianRupee,
  LuRotateCcw,
  LuHistory,
  LuWallet,
  LuExternalLink,
  LuArrowUpRight,
  LuBan,
  LuLoader
} from 'react-icons/lu';
import {
  getPaymentAccount,
  reconnectPaymentAccount,
  toggleOnlinePayments,
  getPaymentTransactions,
  getPaymentSettlements,
  refundPayment
} from '../../../services/api';
import CashfreeOnboardingModal from '../modals/CashfreeOnboardingModal';
import DisconnectPaymentModal from '../modals/DisconnectPaymentModal';

const PaymentSettingsTab = ({ cafe, onRefreshCafe }) => {
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview' | 'transactions' | 'settlements'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Modals state
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isDisconnectOpen, setIsDisconnectOpen] = useState(false);

  // Refund state
  const [selectedPaymentForRefund, setSelectedPaymentForRefund] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundError, setRefundError] = useState('');

  const loadPaymentData = async () => {
    try {
      setError('');
      const [accRes, txRes, stRes] = await Promise.allSettled([
        getPaymentAccount(),
        getPaymentTransactions(),
        getPaymentSettlements()
      ]);

      if (accRes.status === 'fulfilled') {
        setAccount(accRes.value.data.data);
      }
      if (txRes.status === 'fulfilled') {
        setTransactions(txRes.value.data.data || []);
      }
      if (stRes.status === 'fulfilled') {
        setSettlements(stRes.value.data.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load payment account details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPaymentData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadPaymentData();
  };

  const handleToggleOnline = async () => {
    if (!account) return;
    const targetState = !account.online_payment_enabled;
    try {
      const res = await toggleOnlinePayments(targetState);
      setAccount(res.data.data);
      if (onRefreshCafe) onRefreshCafe();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update payment status');
    }
  };

  const handleReconnect = async () => {
    try {
      const res = await reconnectPaymentAccount();
      setAccount(res.data.data);
      if (onRefreshCafe) onRefreshCafe();
      loadPaymentData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reconnect account');
    }
  };

  const handleOpenRefund = (payment) => {
    setSelectedPaymentForRefund(payment);
    setRefundAmount((payment.amount_minor / 100).toFixed(2));
    setRefundReason('Customer requested refund');
    setRefundError('');
  };

  const handleProcessRefund = async (e) => {
    e.preventDefault();
    if (!selectedPaymentForRefund) return;

    setIsRefunding(true);
    setRefundError('');
    try {
      await refundPayment(selectedPaymentForRefund._id, {
        amount: parseFloat(refundAmount),
        reason: refundReason
      });
      setSelectedPaymentForRefund(null);
      loadPaymentData();
    } catch (err) {
      setRefundError(err.response?.data?.message || err.message || 'Refund failed');
    } finally {
      setIsRefunding(false);
    }
  };

  const isConnected = account && account.connection_status === 'CONNECTED';
  const isDisconnected = account && account.connection_status === 'DISCONNECTED';
  const isSuspended = account && account.connection_status === 'SUSPENDED';
  const notConnected = !account || account.connection_status === 'NOT_CONNECTED';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <LuLoader className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-sm text-slate-500">Loading payment gateway details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Online Payments & Settlements
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
              Cashfree Easy Split
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Accept UPI, Debit/Credit Cards & NetBanking at tables. Funds settle directly into your bank account.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="Refresh"
          >
            <LuRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          {notConnected && (
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              <LuCreditCard className="w-4 h-4" />
              Connect Cashfree Account
            </button>
          )}

          {isDisconnected && (
            <button
              onClick={handleReconnect}
              className="px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              <LuRotateCcw className="w-4 h-4" />
              Reconnect Online Payments
            </button>
          )}

          {isConnected && (
            <button
              onClick={() => setIsDisconnectOpen(true)}
              className="px-4 py-2.5 text-sm font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 rounded-xl transition-colors flex items-center gap-2"
            >
              <LuPower className="w-4 h-4" />
              Disconnect Payments
            </button>
          )}
        </div>
      </div>

      {/* Subtabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeSubTab === 'overview'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <LuShieldCheck className="w-4 h-4" />
          Account & Status
        </button>
        <button
          onClick={() => setActiveSubTab('transactions')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeSubTab === 'transactions'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <LuHistory className="w-4 h-4" />
          Transactions ({transactions.length})
        </button>
        <button
          onClick={() => setActiveSubTab('settlements')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeSubTab === 'settlements'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <LuWallet className="w-4 h-4" />
          Settlements ({settlements.length})
        </button>
      </div>

      {/* SUBTAB: OVERVIEW & STATUS */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Connection Status Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Connection
                </span>
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isConnected ? 'bg-emerald-500 animate-pulse' : isDisconnected ? 'bg-amber-500' : 'bg-slate-400'
                  }`}
                />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {isConnected ? 'Active & Connected' : isDisconnected ? 'Disconnected' : isSuspended ? 'Suspended' : 'Not Connected'}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isConnected
                  ? 'Vendor settlement account linked'
                  : isDisconnected
                  ? 'Online payments paused safely'
                  : 'Onboard to accept payments'}
              </p>
            </div>

            {/* Master Online Toggle Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Customer QR Online Pay
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(account?.online_payment_enabled)}
                    disabled={!isConnected}
                    onChange={handleToggleOnline}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              <div className="mt-2">
                <span className={`text-sm font-bold ${account?.online_payment_enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                  {account?.online_payment_enabled ? 'Enabled for Dining Bills' : 'Disabled / Offline Only'}
                </span>
              </div>
            </div>

            {/* Vendor ID Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Vendor Identity
              </span>
              <h3 className="text-base font-mono font-bold text-slate-900 dark:text-white mt-3 truncate">
                {account?.provider_vendor_id || '—'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Settlement routing identifier
              </p>
            </div>

            {/* Gateway Environment */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Environment
              </span>
              <div className="mt-3 flex items-center gap-2">
                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {account?.environment || 'TEST'} MODE
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Cashfree Easy Split Gateway
              </p>
            </div>
          </div>

          {/* Not Connected Callout */}
          {notConnected && (
            <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                <LuCreditCard className="w-8 h-8" />
              </div>
              <div className="max-w-lg mx-auto space-y-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Start Accepting Online Table Payments
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Connect your restaurant settlement bank account through Cashfree Easy Split in under 2 minutes. Customers can pay their dining bills online using UPI, Credit/Debit cards, or NetBanking.
                </p>
              </div>
              <div>
                <button
                  onClick={() => setIsOnboardingOpen(true)}
                  className="px-6 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl shadow-lg shadow-emerald-600/20 transition-all inline-flex items-center gap-2"
                >
                  <LuShieldCheck className="w-5 h-5" />
                  Connect Cashfree Easy Split
                </button>
              </div>
            </div>
          )}

          {/* Connected / Disconnected Bank Details Card */}
          {account && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Bank Account Details */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                      <LuBuilding className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Connected Bank Account
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Masked details used for direct settlement deposits
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    Verified Settlement Ready
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Account Holder
                    </span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                      {account.masked_account_holder_name || cafe?.ownerName || '—'}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Account Number
                    </span>
                    <p className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-1">
                      •••• •••• •••• {account.masked_account_last4 || '—'}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Bank IFSC
                    </span>
                    <p className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-1">
                      {account.masked_ifsc || '—'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                  <span>Connected on {new Date(account.connected_at || account.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  {account.disconnected_at && (
                    <span className="text-amber-600 dark:text-amber-400">
                      Disconnected on {new Date(account.disconnected_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Security & Multi-tenant isolation explanation */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                  <LuShieldCheck className="w-5 h-5" />
                  <span>Krixov Easy Split Guarantee</span>
                </div>
                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2.5">
                  <li className="flex items-start gap-2">
                    <LuCircleCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span><strong>Direct Settlement:</strong> Customer payments route directly to your verified vendor ID without intermediary wallet balances.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <LuCircleCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span><strong>Isolated Tenant Ledger:</strong> No cross-cafe access. Historical payments and invoices are cryptographically linked to your restaurant.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <LuCircleCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span><strong>Safe Disconnect:</strong> You can pause or disconnect online payments at any time without corrupting existing order histories.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB: TRANSACTIONS */}
      {activeSubTab === 'transactions' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Online Payment Ledger
            </h3>
            <span className="text-xs text-slate-500">
              Showing recent {transactions.length} transactions
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              <LuHistory className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No transactions recorded yet</p>
              <p className="text-xs mt-1">Transactions will appear here when customers pay dining bills online.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Order / Session</th>
                    <th className="px-5 py-3.5">Gateway Order ID</th>
                    <th className="px-5 py-3.5">Amount</th>
                    <th className="px-5 py-3.5">Method</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-white">
                        {tx.bill_id || 'Table Order'}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {tx.provider_order_id}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                        ₹{(tx.amount_minor / 100).toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 uppercase text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {tx.payment_method || 'ONLINE'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                            tx.status === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : tx.status === 'REFUNDED' || tx.status === 'PARTIALLY_REFUNDED'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-400'
                              : tx.status === 'FAILED'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                        {new Date(tx.paid_at || tx.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {tx.status === 'SUCCESS' && (
                          <button
                            onClick={() => handleOpenRefund(tx)}
                            className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-rose-300 transition-colors"
                          >
                            Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB: SETTLEMENTS */}
      {activeSubTab === 'settlements' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Vendor Bank Settlements
            </h3>
            <span className="text-xs text-slate-500">
              Cashfree direct deposits to your bank
            </span>
          </div>

          {settlements.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              <LuWallet className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No settlements to display</p>
              <p className="text-xs mt-1">Cashfree automated T+1/T+2 bank settlements will be catalogued here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Settlement ID</th>
                    <th className="px-5 py-3.5">Vendor</th>
                    <th className="px-5 py-3.5">Amount</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Settled At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {settlements.map((st) => (
                    <tr key={st._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-900 dark:text-white">
                        {st.provider_settlement_id || st._id}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500">
                        {st.provider_vendor_id}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{(st.amount_minor / 100).toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                          {st.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {new Date(st.settled_at || st.createdAt).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Onboarding Modal */}
      <CashfreeOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        cafe={cafe}
        onSuccess={(updatedAccount) => {
          setAccount(updatedAccount);
          loadPaymentData();
          if (onRefreshCafe) onRefreshCafe();
        }}
      />

      {/* Disconnect Modal */}
      <DisconnectPaymentModal
        isOpen={isDisconnectOpen}
        onClose={() => setIsDisconnectOpen(false)}
        onSuccess={(updatedAccount) => {
          setAccount(updatedAccount);
          loadPaymentData();
          if (onRefreshCafe) onRefreshCafe();
        }}
      />

      {/* Refund Modal */}
      {selectedPaymentForRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Initiate Payment Refund
              </h3>
              <button
                onClick={() => setSelectedPaymentForRefund(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProcessRefund} className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>Order:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedPaymentForRefund.bill_id || selectedPaymentForRefund.provider_order_id}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Original Total:</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{(selectedPaymentForRefund.amount_minor / 100).toFixed(2)}</span>
                </div>
              </div>

              {refundError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-700 dark:text-rose-300">
                  {refundError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Refund Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  max={(selectedPaymentForRefund.amount_minor / 100).toFixed(2)}
                  required
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Refund
                </label>
                <input
                  type="text"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Customer cancelled order / wrong charge"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedPaymentForRefund(null)}
                  disabled={isRefunding}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRefunding}
                  className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-sm flex items-center gap-2"
                >
                  {isRefunding ? 'Processing...' : 'Confirm Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentSettingsTab;
