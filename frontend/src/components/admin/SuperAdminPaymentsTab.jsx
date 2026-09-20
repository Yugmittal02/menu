import React, { useState, useEffect } from 'react';
import {
  FiCreditCard,
  FiTrendingUp,
  FiUsers,
  FiAlertCircle,
  FiRefreshCw,
  FiCheckCircle,
  FiShield,
  FiSlash,
  FiActivity,
  FiDatabase,
  FiLock,
  FiSearch
} from 'react-icons/fi';
import {
  getAdminPaymentOverview,
  getAdminPaymentAccounts,
  getAdminPaymentTransactions,
  getAdminPaymentWebhooks,
  getAdminPaymentReconciliation,
  adminSuspendPaymentAccount
} from '../../services/api';

const SuperAdminPaymentsTab = () => {
  const [overview, setOverview] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [reconciliation, setReconciliation] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview' | 'accounts' | 'transactions' | 'webhooks' | 'reconciliation'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // Suspend modal state
  const [selectedAccountForSuspend, setSelectedAccountForSuspend] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [isProcessingSuspend, setIsProcessingSuspend] = useState(false);

  const loadData = async () => {
    try {
      const [ovRes, accRes, txRes, whRes] = await Promise.allSettled([
        getAdminPaymentOverview(),
        getAdminPaymentAccounts(),
        getAdminPaymentTransactions(),
        getAdminPaymentWebhooks()
      ]);

      if (ovRes.status === 'fulfilled') setOverview(ovRes.value.data.data);
      if (accRes.status === 'fulfilled') setAccounts(accRes.value.data.data || []);
      if (txRes.status === 'fulfilled') setTransactions(txRes.value.data.data || []);
      if (whRes.status === 'fulfilled') setWebhooks(whRes.value.data.data || []);
    } catch (err) {
      console.error('Failed to load admin payment data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleRunReconciliation = async () => {
    try {
      const res = await getAdminPaymentReconciliation();
      setReconciliation(res.data.data);
    } catch (err) {
      alert('Failed to run reconciliation: ' + err.message);
    }
  };

  const handleToggleSuspend = async (account) => {
    const isCurrentlySuspended = account.connection_status === 'SUSPENDED';
    if (!isCurrentlySuspended) {
      setSelectedAccountForSuspend(account);
      setSuspendReason('Compliance / Risk review');
    } else {
      // Resume immediately
      if (window.confirm(`Resume payment account for ${account.restaurant_id?.name}?`)) {
        try {
          await adminSuspendPaymentAccount(account._id, { suspend: false });
          loadData();
        } catch (err) {
          alert('Failed to resume account: ' + err.message);
        }
      }
    }
  };

  const confirmSuspend = async () => {
    if (!selectedAccountForSuspend) return;
    setIsProcessingSuspend(true);
    try {
      await adminSuspendPaymentAccount(selectedAccountForSuspend._id, {
        suspend: true,
        reason: suspendReason
      });
      setSelectedAccountForSuspend(null);
      loadData();
    } catch (err) {
      alert('Failed to suspend account: ' + err.message);
    } finally {
      setIsProcessingSuspend(false);
    }
  };

  const filteredAccounts = accounts.filter(a => {
    const name = a.restaurant_id?.name || '';
    const code = a.restaurant_id?.cafeId || '';
    const vendor = a.provider_vendor_id || '';
    return name.toLowerCase().includes(search.toLowerCase()) ||
      code.toLowerCase().includes(search.toLowerCase()) ||
      vendor.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-400">
        <FiRefreshCw className="w-8 h-8 mx-auto animate-spin mb-3 text-purple-400" />
        <p>Loading Payments Center...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="glass-card p-4 rounded-xl border-purple-500/15">
          <p className="text-xs text-gray-400">Gross Online Revenue</p>
          <p className="text-2xl font-black text-white mt-1">
            ₹{(overview?.grossRevenueRupees || 0).toLocaleString('en-IN')}
          </p>
        </div>

        <div className="glass-card p-4 rounded-xl border-emerald-500/20">
          <p className="text-xs text-gray-400">Paid Transactions</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">
            {overview?.successPayments || 0}
          </p>
        </div>

        <div className="glass-card p-4 rounded-xl border-blue-500/20">
          <p className="text-xs text-gray-400">Total Gateway Orders</p>
          <p className="text-2xl font-black text-blue-400 mt-1">
            {overview?.totalPayments || 0}
          </p>
        </div>

        <div className="glass-card p-4 rounded-xl border-purple-500/20">
          <p className="text-xs text-gray-400">Connected Accounts</p>
          <p className="text-2xl font-black text-purple-400 mt-1">
            {overview?.activeAccounts || 0} / {overview?.totalAccounts || 0}
          </p>
        </div>

        <div className={`glass-card p-4 rounded-xl ${
          (overview?.quarantinedWebhooks || 0) > 0 ? 'border-rose-500/40 bg-rose-950/20' : 'border-gray-700'
        }`}>
          <p className="text-xs text-gray-400">Quarantined Webhooks</p>
          <p className={`text-2xl font-black mt-1 ${
            (overview?.quarantinedWebhooks || 0) > 0 ? 'text-rose-400' : 'text-gray-300'
          }`}>
            {overview?.quarantinedWebhooks || 0}
          </p>
        </div>
      </div>

      {/* Action Header & Subtab Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'overview'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            Accounts ({accounts.length})
          </button>
          <button
            onClick={() => setActiveSubTab('transactions')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'transactions'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            Transactions ({transactions.length})
          </button>
          <button
            onClick={() => setActiveSubTab('webhooks')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'webhooks'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            Webhook Ingress ({webhooks.length})
          </button>
          <button
            onClick={() => {
              setActiveSubTab('reconciliation');
              if (!reconciliation) handleRunReconciliation();
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'reconciliation'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <FiActivity className="w-3.5 h-3.5" />
            Reconciliation
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs flex items-center gap-1.5 transition-colors"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: ACCOUNTS LIST */}
      {activeSubTab === 'overview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <FiSearch className="absolute left-3 top-2.5 text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by restaurant name or vendor ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            <span className="text-xs text-gray-400">{filteredAccounts.length} accounts found</span>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-gray-400 uppercase font-semibold border-b border-white/10">
                  <tr>
                    <th className="px-5 py-3">Restaurant</th>
                    <th className="px-5 py-3">Vendor ID</th>
                    <th className="px-5 py-3">Connection</th>
                    <th className="px-5 py-3">Verification</th>
                    <th className="px-5 py-3">Online Mode</th>
                    <th className="px-5 py-3">Masked Bank</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredAccounts.map((acc) => (
                    <tr key={acc._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-bold text-white">{acc.restaurant_id?.name || 'Unknown Cafe'}</p>
                        <p className="text-[10px] text-gray-400">{acc.restaurant_id?.cafeId} • {acc.restaurant_id?.city || 'N/A'}</p>
                      </td>
                      <td className="px-5 py-3 font-mono text-purple-300">
                        {acc.provider_vendor_id}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                          acc.connection_status === 'CONNECTED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : acc.connection_status === 'SUSPENDED'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {acc.connection_status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded-md font-semibold text-[10px] bg-blue-500/20 text-blue-300">
                          {acc.verification_status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`font-semibold ${acc.online_payment_enabled ? 'text-emerald-400' : 'text-gray-500'}`}>
                          {acc.online_payment_enabled ? 'ENABLED' : 'DISABLED'}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-gray-400">
                        •••• {acc.masked_account_last4 || '—'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => handleToggleSuspend(acc)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                            acc.connection_status === 'SUSPENDED'
                              ? 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30'
                              : 'bg-rose-600/20 text-rose-300 hover:bg-rose-600/30'
                          }`}
                        >
                          {acc.connection_status === 'SUSPENDED' ? 'Resume' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: TRANSACTIONS LIST */}
      {activeSubTab === 'transactions' && (
        <div className="glass-card rounded-2xl overflow-hidden border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-gray-400 uppercase font-semibold border-b border-white/10">
                <tr>
                  <th className="px-5 py-3">Gateway Order ID</th>
                  <th className="px-5 py-3">Restaurant</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3 font-mono text-purple-300">{tx.provider_order_id}</td>
                    <td className="px-5 py-3 font-semibold text-white">{tx.restaurant_id?.name || 'Cafe'}</td>
                    <td className="px-5 py-3 font-bold text-white">₹{(tx.amount_minor / 100).toFixed(2)}</td>
                    <td className="px-5 py-3 uppercase text-gray-400">{tx.payment_method || 'ONLINE'}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                        tx.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{new Date(tx.createdAt).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: WEBHOOK INGRESS LOG */}
      {activeSubTab === 'webhooks' && (
        <div className="glass-card rounded-2xl overflow-hidden border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-gray-400 uppercase font-semibold border-b border-white/10">
                <tr>
                  <th className="px-5 py-3">Event Type</th>
                  <th className="px-5 py-3">Signature Valid</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Payload SHA256</th>
                  <th className="px-5 py-3">Message</th>
                  <th className="px-5 py-3">Received At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {webhooks.map((wh) => (
                  <tr key={wh._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3 font-mono text-purple-300">{wh.event_type}</td>
                    <td className="px-5 py-3">
                      {wh.signature_valid ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                          <FiCheckCircle className="w-3.5 h-3.5" /> Valid
                        </span>
                      ) : (
                        <span className="text-rose-400 flex items-center gap-1 font-semibold">
                          <FiAlertCircle className="w-3.5 h-3.5" /> Invalid
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                        wh.processing_status === 'PROCESSED'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : wh.processing_status === 'DUPLICATE'
                          ? 'bg-blue-500/20 text-blue-300'
                          : wh.processing_status === 'QUARANTINED'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {wh.processing_status}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-[10px] text-gray-500 truncate max-w-xs">
                      {wh.payload_sha256}
                    </td>
                    <td className="px-5 py-3 text-gray-400">{wh.error_message || 'OK'}</td>
                    <td className="px-5 py-3 text-gray-500">{new Date(wh.createdAt).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 4: RECONCILIATION */}
      {activeSubTab === 'reconciliation' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Reconciliation & Integrity Audit</h3>
            <button
              onClick={handleRunReconciliation}
              className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors flex items-center gap-2"
            >
              <FiActivity className="w-3.5 h-3.5" /> Run Audit Scan
            </button>
          </div>

          {reconciliation ? (
            <div className="glass-card p-6 rounded-2xl border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-xs text-gray-400">Scan Results</span>
                  <p className="text-sm font-bold text-white mt-0.5">
                    Found {reconciliation.totalIssuesFound} integrity issues
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  Last run: {new Date(reconciliation.timestamp).toLocaleTimeString()}
                </span>
              </div>

              {reconciliation.issues.length === 0 ? (
                <div className="p-8 text-center text-emerald-400">
                  <FiCheckCircle className="w-10 h-10 mx-auto mb-2" />
                  <p className="font-bold">All Financial Invariants Satisfied</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Every successful payment has an exact split record, no orphaned webhooks, and vendor mappings are 100% verified.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {reconciliation.issues.map((iss, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start justify-between gap-3 text-xs">
                      <div>
                        <span className="font-bold text-amber-400">{iss.type}</span>
                        <p className="text-gray-300 mt-0.5">{iss.message}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        iss.severity === 'HIGH' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {iss.severity}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card p-12 text-center text-gray-400 rounded-2xl border-white/10">
              <FiDatabase className="w-10 h-10 mx-auto mb-2 text-purple-400" />
              <p>Click "Run Audit Scan" to execute automated platform integrity verification.</p>
            </div>
          )}
        </div>
      )}

      {/* Suspend Modal */}
      {selectedAccountForSuspend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f1422] rounded-2xl border border-white/10 p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white">
              Suspend Payment Account
            </h3>
            <p className="text-xs text-gray-400">
              This will disable online payments for <strong>{selectedAccountForSuspend.restaurant_id?.name}</strong>. Historical payments will remain intact.
            </p>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Reason for suspension</label>
              <input
                type="text"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setSelectedAccountForSuspend(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={confirmSuspend}
                disabled={isProcessingSuspend}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl disabled:opacity-50"
              >
                {isProcessingSuspend ? 'Suspending...' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminPaymentsTab;
