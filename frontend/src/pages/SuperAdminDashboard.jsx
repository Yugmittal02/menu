import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getAllCafes,
  createCafe,
  toggleCafeStatus,
  deleteCafe,
  getAllApplications,
  updateApplicationStatus,
  convertApplicationToCafe,
  deleteApplication,
} from '../services/api';
import {
  FiPlus,
  FiLogOut,
  FiToggleLeft,
  FiToggleRight,
  FiTrash2,
  FiCopy,
  FiCheck,
  FiCoffee,
  FiGrid,
  FiUsers,
  FiFileText,
  FiSearch,
  FiFilter,
  FiEye,
  FiCheckCircle,
  FiX,
  FiPhone,
  FiMail,
  FiMapPin,
  FiCalendar,
  FiArrowRight,
  FiHeadphones,
  FiCreditCard,
  FiSliders,
} from 'react-icons/fi';
import SuperAdminSupportTab from '../components/admin/SuperAdminSupportTab';
import SuperAdminPaymentsTab from '../components/admin/SuperAdminPaymentsTab';
import SuperAdminSystemTab from '../components/admin/SuperAdminSystemTab';
import KrixovBrandMark from '../components/brand/KrixovBrandMark';
import PoweredByKrixov from '../components/brand/PoweredByKrixov';

const SuperAdminDashboard = ({ initialTab }) => {
  const { superAdmin, logoutSuperAdmin } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const defaultTab = initialTab || searchParams.get('tab') || (location.pathname.includes('/support') ? 'support' : 'applications');
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Cafes state
  const [cafes, setCafes] = useState([]);
  const [showCafeForm, setShowCafeForm] = useState(false);
  const [loadingCafes, setLoadingCafes] = useState(true);
  const [copied, setCopied] = useState('');
  const [cafeForm, setCafeForm] = useState({
    name: '',
    ownerName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    tableCount: 10,
    description: '',
  });

  // Applications / Leads state
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [appStatusFilter, setAppStatusFilter] = useState('All');
  const [appSearch, setAppSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [notesInput, setNotesInput] = useState('');
  const [statusInput, setStatusInput] = useState('');
  const [convertingId, setConvertingId] = useState(null);

  const loadCafes = async () => {
    try {
      const { data } = await getAllCafes();
      setCafes(data);
    } catch (e) {
      console.error(e);
    }
    setLoadingCafes(false);
  };

  const loadApplications = async () => {
    setLoadingApps(true);
    try {
      const params = {};
      if (appStatusFilter !== 'All') params.status = appStatusFilter;
      if (appSearch.trim()) params.search = appSearch.trim();
      const { data } = await getAllApplications(params);
      setApplications(data);
    } catch (e) {
      console.error(e);
    }
    setLoadingApps(false);
  };

  useEffect(() => {
    loadCafes();
    loadApplications();
  }, [appStatusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadApplications();
  };

  const handleCreateCafe = async (e) => {
    e.preventDefault();
    try {
      const { data } = await createCafe(cafeForm);
      alert(`Cafe created!\nCafe ID: ${data.cafeId}\n\nShare this Cafe ID with the cafe owner.`);
      setShowCafeForm(false);
      setCafeForm({ name: '', ownerName: '', phone: '', email: '', address: '', city: '', tableCount: 10, description: '' });
      loadCafes();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to create cafe');
    }
  };

  const handleToggleCafe = async (id) => {
    try {
      await toggleCafeStatus(id);
      loadCafes();
    } catch (e) {
      alert('Failed to toggle status');
    }
  };

  const handleDeleteCafe = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteCafe(id);
      loadCafes();
    } catch (e) {
      alert('Failed to delete cafe');
    }
  };

  // Convert application 1-click to active Cafe
  const handleConvertLead = async (appId) => {
    if (!confirm('Convert this application to an active Cafe account?')) return;
    setConvertingId(appId);
    try {
      const { data } = await convertApplicationToCafe(appId);
      alert(`Successfully created Cafe Account!\nCafe ID: ${data.cafeId}\nOwner: ${data.cafe.ownerName}\nPhone: ${data.cafe.phone}`);
      loadApplications();
      loadCafes();
      if (selectedApp && selectedApp._id === appId) {
        setSelectedApp({ ...selectedApp, status: 'Active', convertedCafeId: data.cafeId });
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to convert application');
    } finally {
      setConvertingId(null);
    }
  };

  const handleUpdateStatusAndNotes = async (appId) => {
    try {
      await updateApplicationStatus(appId, {
        status: statusInput,
        adminNotes: notesInput,
      });
      alert('Application updated successfully');
      loadApplications();
      if (selectedApp && selectedApp._id === appId) {
        setSelectedApp({ ...selectedApp, status: statusInput, adminNotes: notesInput });
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update application');
    }
  };

  const handleDeleteApp = async (appId, name) => {
    if (!confirm(`Delete application for "${name}"?`)) return;
    try {
      await deleteApplication(appId);
      if (selectedApp && selectedApp._id === appId) setSelectedApp(null);
      loadApplications();
    } catch (e) {
      alert('Failed to delete application');
    }
  };

  const copyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const openAppDetails = (app) => {
    setSelectedApp(app);
    setStatusInput(app.status);
    setNotesInput(app.adminNotes || '');
  };

  // Compute application metrics
  const totalApps = applications.length;
  const newApps = applications.filter((a) => a.status === 'New').length;
  const contactedApps = applications.filter((a) => a.status === 'Contacted').length;
  const activeConvertedApps = applications.filter((a) => a.status === 'Active').length;
  const thisMonthApps = applications.filter((a) => {
    const created = new Date(a.createdAt);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0B0F19]/90 backdrop-blur-md border-b border-purple-900/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <KrixovBrandMark size={38} />
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Super Admin Console
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase font-mono">
                System Control
              </span>
            </h1>
            <p className="text-xs text-gray-400">{superAdmin?.email}</p>
          </div>
        </div>

        <button onClick={logoutSuperAdmin} className="btn-outline text-xs py-2 px-4 flex items-center gap-2">
          <FiLogOut /> Logout
        </button>
      </header>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('applications')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer shrink-0 ${
              activeTab === 'applications'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <FiFileText /> Customer Applications ({applications.length})
          </button>
          <button
            onClick={() => setActiveTab('cafes')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer shrink-0 ${
              activeTab === 'cafes'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <FiCoffee /> Active Cafes ({cafes.length})
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer shrink-0 ${
              activeTab === 'support'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <FiHeadphones /> Help & Support Tickets
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer shrink-0 ${
              activeTab === 'payments'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <FiCreditCard /> Payments Center
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer shrink-0 ${
              activeTab === 'system'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <FiSliders /> System & Notices
          </button>
        </div>

        {/* TAB 1: CUSTOMER APPLICATIONS / LEADS DASHBOARD */}
        {activeTab === 'applications' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Metric Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="glass-card p-4 rounded-xl border-purple-500/15">
                <p className="text-xs text-gray-400">Total Applications</p>
                <p className="text-2xl font-black text-white mt-1">{totalApps}</p>
              </div>
              <div className="glass-card p-4 rounded-xl border-amber-500/20">
                <p className="text-xs text-gray-400">New Applications</p>
                <p className="text-2xl font-black text-amber-400 mt-1">{newApps}</p>
              </div>
              <div className="glass-card p-4 rounded-xl border-purple-500/20">
                <p className="text-xs text-gray-400">Contacted Leads</p>
                <p className="text-2xl font-black text-purple-400 mt-1">{contactedApps}</p>
              </div>
              <div className="glass-card p-4 rounded-xl border-emerald-500/20">
                <p className="text-xs text-gray-400">Active Restaurants</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">{activeConvertedApps}</p>
              </div>
              <div className="glass-card p-4 rounded-xl border-white/10">
                <p className="text-xs text-gray-400">This Month</p>
                <p className="text-2xl font-black text-indigo-400 mt-1">{thisMonthApps}</p>
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 border-purple-500/15">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto flex-1">
                <div className="relative w-full max-w-md">
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    placeholder="Search restaurant, owner, city, phone or ID..."
                    className="input-field pl-10 text-xs py-2.5"
                    value={appSearch}
                    onChange={(e) => setAppSearch(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-primary text-xs py-2.5 px-4">
                  Search
                </button>
              </form>

              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                  <FiFilter /> Status:
                </span>
                {['All', 'New', 'Contacted', 'Demo Scheduled', 'Onboarding', 'Active', 'Rejected'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setAppStatusFilter(st)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 cursor-pointer ${
                      appStatusFilter === st
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Applications Data Table */}
            {loadingApps ? (
              <div className="text-center text-gray-400 py-16">Loading customer applications...</div>
            ) : applications.length === 0 ? (
              <div className="text-center py-16 glass-card rounded-2xl">
                <FiFileText className="text-4xl text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No applications found matching your criteria.</p>
              </div>
            ) : (
              <div className="glass-card rounded-2xl overflow-hidden border-purple-500/15">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 text-gray-400 font-semibold border-b border-white/10">
                      <tr>
                        <th className="p-4">Ref ID / Applied</th>
                        <th className="p-4">Restaurant</th>
                        <th className="p-4">Owner</th>
                        <th className="p-4">City / Type</th>
                        <th className="p-4">Phone / Email</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-200">
                      {applications.map((app) => (
                        <tr key={app._id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-4">
                            <code className="text-purple-300 font-mono font-bold block">{app.applicationId}</code>
                            <span className="text-[10px] text-gray-500">
                              {new Date(app.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="p-4">
                            <p className="font-bold text-white text-sm">{app.restaurantName}</p>
                            <p className="text-[10px] text-gray-400">{app.tables} Tables • {app.estimatedDailyOrders} orders/day</p>
                          </td>
                          <td className="p-4 font-medium text-gray-300">{app.ownerName}</td>
                          <td className="p-4">
                            <p className="text-white font-medium">{app.city}</p>
                            <span className="text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                              {app.businessType}
                            </span>
                          </td>
                          <td className="p-4 text-gray-300">
                            <p>{app.phone}</p>
                            <p className="text-[10px] text-gray-400">{app.email}</p>
                          </td>
                          <td className="p-4">
                            <span
                              className={`status-badge ${
                                app.status === 'New'
                                  ? 'status-pending'
                                  : app.status === 'Active'
                                  ? 'status-ready'
                                  : app.status === 'Contacted'
                                  ? 'status-confirmed'
                                  : 'status-preparing'
                              }`}
                            >
                              {app.status}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => openAppDetails(app)}
                              className="btn-outline text-[11px] py-1.5 px-3"
                              title="View Details"
                            >
                              <FiEye /> View
                            </button>
                            {app.status !== 'Active' && !app.convertedCafeId ? (
                              <button
                                onClick={() => handleConvertLead(app._id)}
                                disabled={convertingId === app._id}
                                className="btn-primary text-[11px] py-1.5 px-3"
                                title="Create Cafe Account"
                              >
                                {convertingId === app._id ? 'Creating...' : '+ Create Cafe'}
                              </button>
                            ) : (
                              <span className="text-[10px] text-emerald-400 font-bold px-2 py-1 bg-emerald-500/10 rounded border border-emerald-500/20">
                                Cafe Created ({app.convertedCafeId})
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CAFES MANAGEMENT */}
        {activeTab === 'cafes' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="glass-card p-5 text-center">
                <p className="text-3xl font-bold text-white">{cafes.length}</p>
                <p className="text-xs text-gray-400 mt-1">Total Active Cafes</p>
              </div>
              <div className="glass-card p-5 text-center">
                <p className="text-3xl font-bold text-emerald-400">
                  {cafes.filter((c) => c.isActive).length}
                </p>
                <p className="text-xs text-gray-400 mt-1">Active</p>
              </div>
              <div className="glass-card p-5 text-center">
                <p className="text-3xl font-bold text-rose-400">
                  {cafes.filter((c) => !c.isActive).length}
                </p>
                <p className="text-xs text-gray-400 mt-1">Inactive</p>
              </div>
            </div>

            {/* Add Cafe Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Registered Cafes</h2>
              <button onClick={() => setShowCafeForm(!showCafeForm)} className="btn-primary text-xs py-2 px-4">
                <FiPlus /> Create New Cafe
              </button>
            </div>

            {/* Create Form */}
            {showCafeForm && (
              <form onSubmit={handleCreateCafe} className="glass-card p-6 rounded-2xl border-purple-500/20 slide-up">
                <h3 className="text-lg font-bold text-white mb-4">Create New Cafe Account</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    placeholder="Cafe Name *"
                    className="input-field"
                    required
                    value={cafeForm.name}
                    onChange={(e) => setCafeForm({ ...cafeForm, name: e.target.value })}
                  />
                  <input
                    placeholder="Owner Name *"
                    className="input-field"
                    required
                    value={cafeForm.ownerName}
                    onChange={(e) => setCafeForm({ ...cafeForm, ownerName: e.target.value })}
                  />
                  <input
                    placeholder="Phone *"
                    className="input-field"
                    required
                    value={cafeForm.phone}
                    onChange={(e) => setCafeForm({ ...cafeForm, phone: e.target.value })}
                  />
                  <input
                    placeholder="Email"
                    type="email"
                    className="input-field"
                    value={cafeForm.email}
                    onChange={(e) => setCafeForm({ ...cafeForm, email: e.target.value })}
                  />
                  <input
                    placeholder="Number of Tables"
                    type="number"
                    min="1"
                    max="200"
                    className="input-field"
                    value={cafeForm.tableCount}
                    onChange={(e) => setCafeForm({ ...cafeForm, tableCount: parseInt(e.target.value) || 10 })}
                  />
                  <input
                    placeholder="Address"
                    className="input-field"
                    value={cafeForm.address}
                    onChange={(e) => setCafeForm({ ...cafeForm, address: e.target.value })}
                  />
                  <input
                    placeholder="City"
                    className="input-field"
                    value={cafeForm.city}
                    onChange={(e) => setCafeForm({ ...cafeForm, city: e.target.value })}
                  />
                </div>
                <textarea
                  placeholder="Description"
                  className="input-field mt-4"
                  rows={2}
                  value={cafeForm.description}
                  onChange={(e) => setCafeForm({ ...cafeForm, description: e.target.value })}
                />
                <div className="flex gap-3 mt-4">
                  <button type="submit" className="btn-primary text-xs py-2 px-6">
                    Create Cafe
                  </button>
                  <button type="button" onClick={() => setShowCafeForm(false)} className="btn-outline text-xs py-2 px-4">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Cafe List */}
            {loadingCafes ? (
              <div className="text-center text-gray-400 py-16">Loading cafes...</div>
            ) : cafes.length === 0 ? (
              <div className="text-center py-16 glass-card rounded-2xl">
                <FiCoffee className="text-5xl text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No cafes yet. Create your first cafe!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {cafes.map((cafe) => (
                  <div key={cafe._id} className="glass-card p-5 rounded-2xl border-white/10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-white">{cafe.name}</h3>
                          <span className={`status-badge ${cafe.isActive ? 'status-ready' : 'status-cancelled'}`}>
                            {cafe.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-400">
                          <span>👤 {cafe.ownerName}</span>
                          <span>📞 {cafe.phone}</span>
                          <span>🪑 {cafe.tableCount} tables</span>
                          {cafe.city && <span>📍 {cafe.city}</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <code className="text-xs px-3 py-1 rounded-lg font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            {cafe.cafeId}
                          </code>
                          <button
                            onClick={() => copyId(cafe.cafeId)}
                            className="text-gray-400 hover:text-white transition-colors"
                            title="Copy Cafe ID"
                          >
                            {copied === cafe.cafeId ? <FiCheck className="text-emerald-400" /> : <FiCopy />}
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleCafe(cafe._id)}
                          className="btn-outline text-xs py-2 px-3"
                          title={cafe.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {cafe.isActive ? <FiToggleRight className="text-emerald-400 text-lg" /> : <FiToggleLeft className="text-lg" />}
                        </button>
                        <button onClick={() => handleDeleteCafe(cafe._id, cafe.name)} className="btn-danger text-xs py-2 px-3">
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: HELP & SUPPORT TICKETS */}
        {activeTab === 'support' && (
          <div className="animate-in fade-in duration-200">
            <SuperAdminSupportTab />
          </div>
        )}

        {/* TAB 4: PAYMENTS CENTER */}
        {activeTab === 'payments' && (
          <div className="animate-in fade-in duration-200">
            <SuperAdminPaymentsTab />
          </div>
        )}

        {/* TAB 5: SYSTEM & NOTICES */}
        {activeTab === 'system' && (
          <div className="animate-in fade-in duration-200">
            <SuperAdminSystemTab />
          </div>
        )}

        {/* Platform Footer */}
        <div className="pt-8 pb-4 flex justify-center border-t border-white/5">
          <PoweredByKrixov />
        </div>
      </div>

      {/* APPLICATION DETAILS MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-2xl rounded-3xl border-purple-500/30 bg-[#0E1322] p-6 md:p-8 space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedApp(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
            >
              <FiX className="text-xl" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 flex items-center justify-center font-bold">
                <FiFileText className="text-lg" />
              </div>
              <div>
                <span className="text-xs font-mono text-purple-400 font-bold">{selectedApp.applicationId}</span>
                <h3 className="text-xl font-bold text-white">{selectedApp.restaurantName}</h3>
              </div>
            </div>

            {/* Fields Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-white/5 p-4 rounded-2xl border border-white/5">
              <div>
                <span className="text-gray-400 block">Owner / Manager Name:</span>
                <span className="font-bold text-white text-sm">{selectedApp.ownerName}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Business Type:</span>
                <span className="font-bold text-purple-300 text-sm">{selectedApp.businessType}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Phone Number:</span>
                <a href={`tel:${selectedApp.phone}`} className="text-emerald-400 font-bold text-sm hover:underline">
                  {selectedApp.phone}
                </a>
              </div>
              <div>
                <span className="text-gray-400 block">Email Address:</span>
                <a href={`mailto:${selectedApp.email}`} className="text-purple-400 font-bold text-sm hover:underline">
                  {selectedApp.email}
                </a>
              </div>
              <div>
                <span className="text-gray-400 block">City & Address:</span>
                <span className="text-gray-200">{selectedApp.city} — {selectedApp.address}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Tables & Est. Volume:</span>
                <span className="text-gray-200">{selectedApp.tables} tables ({selectedApp.estimatedDailyOrders} orders/day)</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-gray-400 block mb-1">Selected QR Requirements:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedApp.menuRequirements.map((r, i) => (
                    <span key={i} className="px-2.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[11px]">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
              {selectedApp.message && (
                <div className="sm:col-span-2 pt-2 border-t border-white/5">
                  <span className="text-gray-400 block mb-1">Applicant Message:</span>
                  <p className="text-gray-300 italic bg-black/20 p-2.5 rounded-lg">{selectedApp.message}</p>
                </div>
              )}
            </div>

            {/* Status & Admin Notes Editing */}
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Update Status</label>
                  <select
                    className="input-field text-xs"
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value)}
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Demo Scheduled">Demo Scheduled</option>
                    <option value="Onboarding">Onboarding</option>
                    <option value="Active">Active</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Lead Admin Notes</label>
                  <input
                    type="text"
                    placeholder="Notes e.g. Called owner on Monday..."
                    className="input-field text-xs"
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => handleDeleteApp(selectedApp._id, selectedApp.restaurantName)}
                  className="btn-danger text-xs py-2 px-4"
                >
                  Delete Lead
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatusAndNotes(selectedApp._id)}
                    className="btn-outline text-xs py-2 px-4"
                  >
                    Save Notes & Status
                  </button>

                  {!selectedApp.convertedCafeId && selectedApp.status !== 'Active' && (
                    <button
                      type="button"
                      onClick={() => handleConvertLead(selectedApp._id)}
                      disabled={convertingId === selectedApp._id}
                      className="btn-primary text-xs py-2 px-5 font-bold"
                    >
                      {convertingId === selectedApp._id ? 'Converting...' : 'Create Cafe Account'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
