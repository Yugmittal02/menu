import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getMyCafe,
  getMyMenu,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
  getCafeOrders,
  updateOrderStatus,
  getCafeStats,
  uploadImage,
  updateMyCafe,
  getMyCoupons,
  createCoupon,
  deleteCoupon,
  toggleCouponStatus,
  markOrderPaid,
  openSession,
  getActiveSessions,
  moveSessionToBilling,
  closeSession,
  cancelSession,
  placePosOrder,
  quickTakeaway,
  getKotData,
  getInvoiceData,
  getReservations,
  createReservation,
  updateReservationStatus,
  seatReservation,
  deleteReservation,
  getStaff,
  createStaff,
  resetStaffPin,
  toggleStaffStatus,
  deleteStaff,
  staffPinLogin,
  getCustomers,
  getCustomerDetail,
  updateCustomer,
  syncCustomers,
  getInventory,
  updateItemStock,
  toggle86Item,
  bulkRestockInventory,
  addInventoryItem
} from '../services/api';

import DashboardShell from '../components/dashboard/DashboardShell';
import OverviewTab from '../components/dashboard/tabs/OverviewTab';
import OrdersTab from '../components/dashboard/tabs/OrdersTab';
import POSTab from '../components/dashboard/tabs/POSTab';
import TablesTab from '../components/dashboard/tabs/TablesTab';
import MenuTab from '../components/dashboard/tabs/MenuTab';
import ReservationsTab from '../components/dashboard/tabs/ReservationsTab';
import InventoryTab from '../components/dashboard/tabs/InventoryTab';
import CRMTab from '../components/dashboard/tabs/CRMTab';
import StaffTab from '../components/dashboard/tabs/StaffTab';
import CouponsTab from '../components/dashboard/tabs/CouponsTab';
import QRTablesTab from '../components/dashboard/tabs/QRTablesTab';
import AnalyticsTab from '../components/dashboard/tabs/AnalyticsTab';
import SettingsTab from '../components/dashboard/tabs/SettingsTab';
import SupportTab from '../components/dashboard/tabs/SupportTab';
import PaymentSettingsTab from '../components/dashboard/tabs/PaymentSettingsTab';
import BillingDrawer from '../components/dashboard/ui/BillingDrawer';
import KOTView from '../components/dashboard/ui/KOTView';
import InvoiceView from '../components/dashboard/ui/InvoiceView';
import StaffPinModal from '../components/dashboard/ui/StaffPinModal';
import { playOrderChime, playBuzzer } from '../components/dashboard/ui/AudioAlerts';

// Onboarding & Interactive Tour Components
import { OnboardingProvider, useOnboarding } from '../context/OnboardingContext';
import SpotlightOverlay from '../components/onboarding/SpotlightOverlay';
import TourTooltip from '../components/onboarding/TourTooltip';
import WelcomeModal from '../components/onboarding/WelcomeModal';
import EssentialSetupModal from '../components/onboarding/EssentialSetupModal';
import WorkflowDemoModal from '../components/onboarding/WorkflowDemoModal';
import FinalReviewModal from '../components/onboarding/FinalReviewModal';
import WelcomeBanner from '../components/onboarding/WelcomeBanner';
import HelpTourModal from '../components/onboarding/HelpTourModal';
import CustomerPreviewModal from '../components/onboarding/CustomerPreviewModal';

// Live elapsed timer helper: returns "MM:SS" format
const elapsedTimer = (date) => {
  if (!date) return '00:00';
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 0) return '00:00';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

// Onboarding Consumer Layer to access OnboardingContext inside the Provider
const OnboardingConsumerLayer = ({
  activeTab,
  onTabChange,
  cafe,
  badges,
  soundOn,
  onToggleSound,
  isDark,
  onToggleTheme,
  refreshing,
  onRefresh,
  lastUpdatedText,
  activeStaff,
  onOpenPinModal,
  onLogout,
  refreshToast,
  menu,
  onRefreshData,
  children
}) => {
  const {
    setIsHelpModalOpen,
    setIsCustomerPreviewOpen
  } = useOnboarding();

  const handleTriggerTourAction = (action) => {
    if (action === 'try_pos') {
      onTabChange('POS');
    } else if (action === 'try_table' || action === 'try_billing') {
      onTabChange('Tables');
    } else if (action === 'preview_qr' || action === 'open_customer_preview') {
      setIsCustomerPreviewOpen(true);
    } else if (action === 'view_sample_kot') {
      onTabChange('Orders');
    } else if (action === 'test_print') {
      window.print();
    }
  };

  return (
    <DashboardShell
      activeTab={activeTab}
      onTabChange={onTabChange}
      cafe={cafe}
      badges={badges}
      soundOn={soundOn}
      onToggleSound={onToggleSound}
      isDark={isDark}
      onToggleTheme={onToggleTheme}
      refreshing={refreshing}
      onRefresh={onRefresh}
      lastUpdatedText={lastUpdatedText}
      activeStaff={activeStaff}
      onOpenPinModal={onOpenPinModal}
      onLogout={onLogout}
      onHelpClick={() => setIsHelpModalOpen(true)}
      refreshToast={refreshToast}
    >
      {/* Onboarding Welcome Banner above tab content */}
      <WelcomeBanner onOpenQuickGuide={() => setIsHelpModalOpen(true)} />

      {children}

      {/* Interactive Tour Overlays */}
      <SpotlightOverlay />
      <TourTooltip onTriggerAction={handleTriggerTourAction} />

      {/* Onboarding & Guided Setup Modals */}
      <WelcomeModal cafe={cafe} />
      <EssentialSetupModal cafe={cafe} onRefreshData={onRefreshData} />
      <WorkflowDemoModal />
      <FinalReviewModal cafe={cafe} />
      <HelpTourModal
        activeTab={activeTab}
        onOpenCustomerPreview={() => setIsCustomerPreviewOpen(true)}
      />
      <CustomerPreviewModal cafe={cafe} menu={menu} />
    </DashboardShell>
  );
};

const CafeDashboard = () => {
  const { cafeUser, logoutCafeOwner } = useAuth();

  // Navigation state (supports direct /dashboard/support or ?tab=support deep links)
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname.includes('/support') || window.location.search.toLowerCase().includes('tab=support')) {
        return 'Support';
      }
    }
    return 'Overview';
  });

  // Core data states
  const [cafe, setCafe] = useState(null);
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [staff, setStaff] = useState([]);
  const [activeStaff, setActiveStaff] = useState(() => {
    try {
      const s = localStorage.getItem('activeStaff');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });
  const [customers, setCustomers] = useState([]);
  const [inventoryData, setInventoryData] = useState({ summary: {}, items: [] });
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalDiscount: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    completedOrders: 0,
    unpaidOrders: 0,
    paidOrderCount: 0,
    takeawayOrders: 0,
    dineInOrders: 0,
    avgOrderValue: 0,
    activeSessionsCount: 0,
    period: 'today'
  });

  // UI / Filter states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdatedText, setLastUpdatedText] = useState('Live');
  const [refreshToast, setRefreshToast] = useState(null);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('week');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [payingOrderId, setPayingOrderId] = useState(null);
  const [adminTheme, setAdminTheme] = useState(
    () => localStorage.getItem('adminTheme') || 'dark'
  );
  const [soundOn, setSoundOn] = useState(true);
  const [silencedOrders, setSilencedOrders] = useState(new Set());
  const [tick, setTick] = useState(0);

  // Modals & Panels state
  const [selectedBillingSession, setSelectedBillingSession] = useState(null);
  const [posDefaultTable, setPosDefaultTable] = useState(1);
  const [activeKotData, setActiveKotData] = useState(null);
  const [activeInvoiceData, setActiveInvoiceData] = useState(null);

  const prevOrderCount = useRef(0);

  const orderQuery = useMemo(() => ({
    status: orderFilter === 'all' ? undefined : orderFilter,
    date: dateFilter,
    payment: paymentFilter === 'all' ? undefined : paymentFilter,
    source: sourceFilter === 'all' ? undefined : sourceFilter,
    type: typeFilter === 'all' ? undefined : typeFilter
  }), [orderFilter, dateFilter, paymentFilter, sourceFilter, typeFilter]);

  const categories = useMemo(() => {
    return [...new Set((menu || []).map((i) => i.category).filter(Boolean))];
  }, [menu]);

  // Main data loader - performs true full system parallel refresh across all modules
  const loadData = useCallback(async (isManualRefresh = false) => {
    try {
      const [
        cafeRes,
        menuRes,
        orderRes,
        statsRes,
        sessRes,
        couponRes,
        resRes,
        staffRes,
        custRes,
        invRes
      ] = await Promise.allSettled([
        getMyCafe(),
        getMyMenu(),
        getCafeOrders(orderQuery),
        getCafeStats({ date: dateFilter }),
        getActiveSessions(),
        getMyCoupons(),
        getReservations(),
        getStaff(),
        getCustomers(),
        getInventory()
      ]);

      if (cafeRes.status === 'fulfilled' && cafeRes.value?.data) {
        setCafe(cafeRes.value.data);
      }
      if (menuRes.status === 'fulfilled' && menuRes.value?.data) {
        setMenu(menuRes.value.data);
      }
      if (orderRes.status === 'fulfilled' && orderRes.value?.data) {
        setOrders(orderRes.value.data);
      }
      if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
        setStats(statsRes.value.data);
      }
      if (sessRes.status === 'fulfilled' && sessRes.value?.data) {
        setSessions(sessRes.value.data);
      }
      if (couponRes.status === 'fulfilled' && couponRes.value?.data) {
        setCoupons(couponRes.value.data);
      }
      if (resRes.status === 'fulfilled' && resRes.value?.data) {
        setReservations(resRes.value.data);
      }
      if (staffRes.status === 'fulfilled' && staffRes.value?.data) {
        setStaff(staffRes.value.data);
      }
      if (custRes.status === 'fulfilled' && custRes.value?.data) {
        setCustomers(custRes.value.data);
      }
      if (invRes.status === 'fulfilled' && invRes.value?.data) {
        setInventoryData(invRes.value.data);
      }

      const nowFormatted = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setLastUpdatedText(nowFormatted);

      if (isManualRefresh) {
        setRefreshToast('System Refreshed: Orders, Tables, Menu, Inventory & CRM synced');
        setTimeout(() => setRefreshToast(null), 3500);
      }
    } catch (err) {
      console.error('System data load error:', err);
    } finally {
      setLoading(false);
    }
  }, [orderQuery, dateFilter]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Background polling (every 3 seconds) without screen flashes
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const results = await Promise.allSettled([
          getCafeOrders(orderQuery),
          getCafeStats({ date: dateFilter }),
          getActiveSessions()
        ]);

        const [orderResult, statsResult, sessResult] = results;

        if (orderResult.status === 'fulfilled' && orderResult.value?.data) {
          const newOrders = orderResult.value.data;
          // Play chime if new order arrived
          if (
            soundOn &&
            newOrders.length > prevOrderCount.current &&
            prevOrderCount.current > 0
          ) {
            playOrderChime();
          }

          prevOrderCount.current = newOrders.length;
          setOrders(newOrders);
        }

        if (statsResult.status === 'fulfilled' && statsResult.value?.data) {
          setStats(statsResult.value.data);
        }

        if (sessResult.status === 'fulfilled' && sessResult.value?.data) {
          setSessions(sessResult.value.data);
        }
      } catch (e) {
        // Silently preserve existing data on background network failure
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [orderQuery, dateFilter, soundOn]);

  // 1-second tick for live order timers
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Buzzer for late pending orders (> 1 minute)
  useEffect(() => {
    if (!soundOn) return;

    const hasActiveLateOrder = orders.some((order) => {
      if (order.status !== 'pending') return false;
      if (silencedOrders.has(order._id)) return false;
      const elapsedMs = Date.now() - new Date(order.createdAt).getTime();
      return elapsedMs >= 60 * 1000;
    });

    if (hasActiveLateOrder && tick % 5 === 0) {
      playBuzzer();
    }
  }, [tick, orders, silencedOrders, soundOn]);

  // Manual full-system refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  // Theme toggle
  const toggleTheme = () => {
    const next = adminTheme === 'dark' ? 'light' : 'dark';
    setAdminTheme(next);
    localStorage.setItem('adminTheme', next);
  };

  // Order workflow handlers
  const handleStatusUpdate = async (orderId, status) => {
    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) => (o._id === orderId ? { ...o, status } : o))
    );
    try {
      await updateOrderStatus(orderId, status);
      loadData();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update order status');
      loadData();
    }
  };

  const handleMarkPaid = async (orderId, paymentMethod) => {
    setPayingOrderId(null);
    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) =>
        o._id === orderId
          ? { ...o, paymentStatus: 'paid', paymentMethod, paidAt: new Date() }
          : o
      )
    );
    try {
      await markOrderPaid(orderId, paymentMethod);
      loadData();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to mark payment');
      loadData();
    }
  };

  const handleSilenceOrder = (orderId) => {
    setSilencedOrders((prev) => new Set(prev).add(orderId));
  };

  // POS & Sessions Handlers
  const handlePlacePosOrder = async (payload) => {
    try {
      const res = await placePosOrder(payload);
      loadData();
      if (soundOn) playOrderChime();
      return res.data;
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to place POS order');
      throw e;
    }
  };

  const handleQuickTakeaway = async (payload) => {
    try {
      const res = await quickTakeaway(payload);
      loadData();
      if (soundOn) playOrderChime();
      return res.data;
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to process takeaway');
      throw e;
    }
  };

  const handleOpenSession = async (payload) => {
    try {
      const res = await openSession(payload);
      loadData();
      return res.data;
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to start table session');
      throw e;
    }
  };

  const handleMoveToBilling = async (sessionId, payload) => {
    try {
      const res = await moveSessionToBilling(sessionId, payload);
      loadData();
      if (selectedBillingSession && selectedBillingSession._id === sessionId) {
        setSelectedBillingSession(res.data?.session);
      }
      return res.data;
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to move session to billing');
      throw e;
    }
  };

  const handleCloseSession = async (sessionId, payload) => {
    try {
      const res = await closeSession(sessionId, payload);
      loadData();
      return res.data;
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to settle and close session');
      throw e;
    }
  };

  const handleCancelSession = async (sessionId) => {
    try {
      await cancelSession(sessionId);
      loadData();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to free table');
    }
  };

  const handleSelectTableForPos = (tableNumber) => {
    if (tableNumber) setPosDefaultTable(Number(tableNumber));
    setActiveTab('POS');
  };

  const handleShowKotModal = async (orderId) => {
    try {
      const res = await getKotData(orderId);
      setActiveKotData(res.data);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to load KOT');
    }
  };

  const handleShowInvoiceModal = async (sessionId, orderId) => {
    try {
      const targetId = sessionId || 'order';
      const res = await getInvoiceData(targetId, orderId ? { orderId } : undefined);
      setActiveInvoiceData(res.data);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to load receipt invoice');
    }
  };

  // Menu Handlers
  const handleAddItem = async (payload) => {
    try {
      await addMenuItem(payload);
      loadData();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to add menu item');
    }
  };

  const handleUpdateItem = async (id, payload) => {
    try {
      await updateMenuItem(id, payload);
      loadData();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update menu item');
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await deleteMenuItem(id);
      loadData();
    } catch (e) {
      alert('Failed to delete menu item');
    }
  };

  const handleToggleItem = async (id) => {
    try {
      await toggleMenuItemAvailability(id);
      loadData();
    } catch (e) {
      alert('Failed to toggle availability');
    }
  };

  // Coupon Handlers
  const handleCreateCoupon = async (data) => {
    try {
      await createCoupon(data);
      loadData();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to create coupon');
    }
  };

  const handleDeleteCoupon = async (id) => {
    try {
      await deleteCoupon(id);
      loadData();
    } catch (e) {
      alert('Failed to delete coupon');
    }
  };

  const handleToggleCoupon = async (id) => {
    try {
      await toggleCouponStatus(id);
      loadData();
    } catch (e) {
      alert('Failed to toggle coupon status');
    }
  };

  // Settings Handlers
  const handleSaveSettings = async (data) => {
    try {
      await updateMyCafe(data);
      loadData();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update cafe settings');
    }
  };

  const handleUpdateTableCount = async (newCount) => {
    try {
      await updateMyCafe({ ...cafe, tableCount: newCount });
      loadData();
    } catch (e) {
      alert('Failed to update table count');
    }
  };

  // Phase 2: Reservations Handlers
  const handleCreateReservation = async (data) => {
    try {
      await createReservation(data);
      loadData();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to create reservation');
      throw e;
    }
  };

  const handleUpdateReservationStatus = async (id, status) => {
    try {
      await updateReservationStatus(id, { status });
      loadData();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update reservation');
    }
  };

  const handleSeatReservation = async (id, data) => {
    try {
      await seatReservation(id, data);
      await loadData();
      setActiveTab('Tables');
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to seat guest');
      throw e;
    }
  };

  const handleDeleteReservation = async (id) => {
    try {
      await deleteReservation(id);
      loadData();
    } catch (e) {
      alert('Failed to delete reservation');
    }
  };

  // Phase 2: Staff & Roles Handlers
  const handleCreateStaff = async (data) => {
    try {
      await createStaff(data);
      loadData();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to add staff member');
      throw e;
    }
  };

  const handleResetStaffPin = async (id, data) => {
    try {
      await resetStaffPin(id, data);
      loadData();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to reset PIN');
      throw e;
    }
  };

  const handleToggleStaff = async (id) => {
    try {
      await toggleStaffStatus(id);
      loadData();
    } catch (e) {
      alert('Failed to toggle staff status');
    }
  };

  const handleDeleteStaff = async (id) => {
    try {
      await deleteStaff(id);
      loadData();
    } catch (e) {
      alert('Failed to delete staff member');
    }
  };

  const handleStaffPinSubmit = async (pin) => {
    try {
      const res = await staffPinLogin({ pin });
      setActiveStaff(res.data.staff);
      localStorage.setItem('activeStaff', JSON.stringify(res.data.staff));
      return res.data;
    } catch (e) {
      throw e;
    }
  };

  const handleLogoutStaff = () => {
    setActiveStaff(null);
    localStorage.removeItem('activeStaff');
  };

  // Phase 2: Customer CRM Handlers
  const handleSyncCustomers = async () => {
    try {
      const res = await syncCustomers();
      loadData();
      return res.data;
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to sync customers');
      throw e;
    }
  };

  const handleUpdateCustomer = async (id, data) => {
    try {
      await updateCustomer(id, data);
      loadData();
    } catch (e) {
      alert('Failed to update customer');
    }
  };

  const handleFetchCustomerDetail = async (id) => {
    try {
      const res = await getCustomerDetail(id);
      return res.data;
    } catch (e) {
      alert('Failed to fetch customer details');
      throw e;
    }
  };

  // Phase 2: Inventory Handlers
  const handleUpdateStock = async (itemId, data) => {
    try {
      await updateItemStock(itemId, data);
      loadData();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update stock');
    }
  };

  const handleToggle86 = async (itemId) => {
    try {
      await toggle86Item(itemId);
      loadData();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to toggle item availability');
    }
  };

  const handleBulkRestock = async (items) => {
    try {
      await bulkRestockInventory({ items });
      loadData();
    } catch (e) {
      alert('Failed to bulk restock');
      throw e;
    }
  };

  const handleAddInventoryItem = async (data) => {
    try {
      await addInventoryItem(data);
      loadData();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to add inventory item');
      throw e;
    }
  };

  // Initial loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen flex" style={{ backgroundColor: '#0B0B14' }}>
        {/* Skeleton Sidebar */}
        <div
          className="hidden md:block w-60 h-screen p-4 border-r space-y-4"
          style={{
            backgroundColor: '#11111D',
            borderColor: 'rgba(255, 255, 255, 0.07)'
          }}
        >
          <div className="skeleton h-10 rounded-xl" />
          <div className="space-y-2 pt-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="skeleton h-9 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Skeleton Main View */}
        <div className="flex-1 p-6 space-y-5">
          <div className="skeleton h-14 w-full rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-2xl" />
            ))}
          </div>
          <div className="skeleton h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Active badges for navigation
  const badges = {
    orders: stats.pendingOrders,
    activeTables: sessions.filter((s) => s.status === 'active' || s.status === 'billing').length,
    reservations: reservations.filter((r) => r.status === 'pending' || r.status === 'confirmed').length,
    inventoryAlerts: inventoryData.summary?.outOfStockCount || 0,
    menu: menu.length,
    coupons: coupons.filter((c) => c.isActive).length
  };

  return (
    <OnboardingProvider
      cafe={cafe}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      activeStaff={activeStaff}
      menu={menu}
      orders={orders}
      sessions={sessions}
      inventoryData={inventoryData}
      staff={staff}
      coupons={coupons}
      stats={stats}
      onRefreshData={loadData}
    >
      <OnboardingConsumerLayer
        activeTab={activeTab}
        onTabChange={setActiveTab}
        cafe={cafe}
        badges={badges}
        soundOn={soundOn}
        onToggleSound={() => setSoundOn(!soundOn)}
        isDark={adminTheme === 'dark'}
        onToggleTheme={toggleTheme}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        lastUpdatedText={lastUpdatedText}
        activeStaff={activeStaff}
        onOpenPinModal={() => setIsPinModalOpen(true)}
        onLogout={logoutCafeOwner}
        refreshToast={refreshToast}
        menu={menu}
        onRefreshData={loadData}
      >
        {/* OVERVIEW TAB */}
        {activeTab === 'Overview' && (
          <OverviewTab
            cafe={cafe}
            stats={stats}
            orders={orders}
            sessions={sessions}
            menu={menu}
            staff={staff}
            onTabChange={setActiveTab}
            onStatusUpdate={handleStatusUpdate}
            onMarkPaid={handleMarkPaid}
            elapsedTimer={elapsedTimer}
            tick={tick}
          />
        )}

      {/* ORDERS TAB */}
      {activeTab === 'Orders' && (
        <OrdersTab
          orders={orders}
          stats={stats}
          orderSearch={orderSearch}
          onOrderSearchChange={setOrderSearch}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          orderFilter={orderFilter}
          onOrderFilterChange={setOrderFilter}
          paymentFilter={paymentFilter}
          onPaymentFilterChange={setPaymentFilter}
          sourceFilter={sourceFilter}
          onSourceFilterChange={setSourceFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          onShowKotModal={handleShowKotModal}
          onShowInvoiceModal={handleShowInvoiceModal}
          onStatusUpdate={handleStatusUpdate}
          onMarkPaid={handleMarkPaid}
          payingOrderId={payingOrderId}
          setPayingOrderId={setPayingOrderId}
          silencedOrders={silencedOrders}
          onSilenceOrder={handleSilenceOrder}
          elapsedTimer={elapsedTimer}
          tick={tick}
          onTabChange={setActiveTab}
        />
      )}

      {/* POS BILLING TAB */}
      {activeTab === 'POS' && (
        <POSTab
          menu={menu}
          categories={categories}
          sessions={sessions}
          cafe={cafe}
          defaultTable={posDefaultTable}
          onPlacePosOrder={handlePlacePosOrder}
          onQuickTakeaway={handleQuickTakeaway}
          onShowKotModal={handleShowKotModal}
          onShowInvoiceModal={handleShowInvoiceModal}
        />
      )}

      {/* TABLES TAB */}
      {activeTab === 'Tables' && (
        <TablesTab
          cafe={cafe}
          sessions={sessions}
          orders={orders}
          onOpenSession={handleOpenSession}
          onSelectTableForBilling={(session) => setSelectedBillingSession(session)}
          onSelectTableForPos={handleSelectTableForPos}
          onFreeTable={handleCancelSession}
          onCloseSession={handleCloseSession}
          onRefresh={loadData}
        />
      )}

      {/* RESERVATIONS TAB */}
      {activeTab === 'Reservations' && (
        <ReservationsTab
          reservations={reservations}
          cafe={cafe}
          onCreateReservation={handleCreateReservation}
          onUpdateStatus={handleUpdateReservationStatus}
          onSeatGuest={handleSeatReservation}
          onDeleteReservation={handleDeleteReservation}
        />
      )}

      {/* MENU TAB */}
      {activeTab === 'Menu' && (
        <MenuTab
          menu={menu}
          onAddItem={handleAddItem}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
          onToggleItem={handleToggleItem}
          uploadImage={uploadImage}
        />
      )}

      {/* INVENTORY TAB */}
      {activeTab === 'Inventory' && (
        <InventoryTab
          inventoryData={inventoryData}
          cafe={cafe}
          menu={menu}
          onUpdateStock={handleUpdateStock}
          onToggle86={handleToggle86}
          onBulkRestock={handleBulkRestock}
          onAddInventoryItem={handleAddInventoryItem}
          onAddItem={handleAddItem}
          onRefresh={loadData}
        />
      )}

      {/* CUSTOMER CRM TAB */}
      {activeTab === 'CRM' && (
        <CRMTab
          customers={customers}
          cafe={cafe}
          onSyncCustomers={handleSyncCustomers}
          onUpdateCustomer={handleUpdateCustomer}
          onFetchCustomerDetail={handleFetchCustomerDetail}
        />
      )}

      {/* STAFF & ROLES TAB */}
      {activeTab === 'Staff' && (
        <StaffTab
          staff={staff}
          onCreateStaff={handleCreateStaff}
          onResetPin={handleResetStaffPin}
          onToggleStaff={handleToggleStaff}
          onDeleteStaff={handleDeleteStaff}
        />
      )}

      {/* COUPONS TAB */}
      {activeTab === 'Coupons' && (
        <CouponsTab
          coupons={coupons}
          onCreateCoupon={handleCreateCoupon}
          onDeleteCoupon={handleDeleteCoupon}
          onToggleCoupon={handleToggleCoupon}
        />
      )}

      {/* QR CODES TAB */}
      {activeTab === 'QR' && (
        <QRTablesTab
          cafe={cafe}
          orders={orders}
          onUpdateTableCount={handleUpdateTableCount}
        />
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'Analytics' && (
        <AnalyticsTab
          orders={orders}
          stats={stats}
          onTabChange={setActiveTab}
        />
      )}

      {/* PAYMENTS TAB */}
      {activeTab === 'Payments' && (
        <PaymentSettingsTab
          cafe={cafe}
          onRefreshCafe={loadData}
        />
      )}

      {/* SETTINGS TAB */}
      {activeTab === 'Settings' && (
        <SettingsTab
          cafe={cafe}
          onSaveSettings={handleSaveSettings}
          soundOn={soundOn}
          onToggleSound={() => setSoundOn(!soundOn)}
        />
      )}

      {/* HELP & SUPPORT TAB */}
      {activeTab === 'Support' && (
        <SupportTab
          cafe={cafe}
          user={cafeUser}
        />
      )}

      {/* BILLING DRAWER (Slide-out panel for table settlement) */}
      <BillingDrawer
        isOpen={!!selectedBillingSession}
        session={selectedBillingSession}
        cafe={cafe}
        onClose={() => setSelectedBillingSession(null)}
        onMoveToBilling={handleMoveToBilling}
        onCloseSession={handleCloseSession}
        onViewInvoice={(sessId) => handleShowInvoiceModal(sessId)}
      />

      {/* KOT MODAL (Kitchen Order Ticket with thermal print) */}
      {activeKotData && (
        <KOTView
          kotData={activeKotData}
          onClose={() => setActiveKotData(null)}
        />
      )}

      {/* INVOICE MODAL (Tax receipt with thermal 80mm print) */}
      {activeInvoiceData && (
        <InvoiceView
          invoiceData={activeInvoiceData}
          onClose={() => setActiveInvoiceData(null)}
        />
      )}

      {/* STAFF PIN AUTH MODAL */}
      <StaffPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onPinSubmit={handleStaffPinSubmit}
        activeStaff={activeStaff}
        onLogoutStaff={handleLogoutStaff}
      />
      </OnboardingConsumerLayer>
    </OnboardingProvider>
  );
};

export default CafeDashboard;
