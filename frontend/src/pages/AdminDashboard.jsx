import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaUtensils } from "react-icons/fa";

import AdminLayout from "../components/admin/AdminLayout";
import AdminOrders from "../components/admin/AdminOrders";
import AdminMenu from "../components/admin/AdminMenu";
import AdminCustomers from "../components/admin/AdminCustomers";
import AdminStats from "../components/admin/AdminStats";
import AdminCategories from "../components/admin/AdminCategories";
import AdminSettings from "../components/admin/AdminSettings";
import AdminOffers from "../components/admin/AdminOffers";
import ProductFormModal from "../components/admin/ProductFormModal";

import {
  deleteProduct,
  toggleProductAvailability,
  deleteAllProducts,
  fetchProducts,
  updateOrderStatus,
  fetchAllOrders,
  manualVerifyPayment,
  acceptOrder,
  getStoreSettings,
  updateStoreSettings,
} from "../services/api";

import { useAuth } from "../context/AuthContext";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { admin, logoutAdmin } = useAuth();

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "orders";
  const setActiveTab = (tab) => setSearchParams({ tab });

  // Data
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  // Modals
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showStockConfirm, setShowStockConfirm] = useState(null);


  // Settings
  const [storeSettings, setStoreSettings] = useState({ isOpen: true });

  useEffect(() => {
    loadOrders();
    loadProducts();
    loadStoreSettings();
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      const { data } = await fetchAllOrders();
      setOrders(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) { console.error(err); }
  };

  const loadProducts = async () => {
    try {
      const { data } = await fetchProducts();
      setProducts(data);
    } catch (err) { console.error(err); }
  };


  const loadStoreSettings = async () => {
    try {
      const { data } = await getStoreSettings();
      setStoreSettings(data);
    } catch (err) { console.error(err); }
  };


  const handleUpdateStatus = async (id, status) => {
    try {
      await updateOrderStatus(id, status);
      loadOrders();
      // Auto-switch to customers tab when order is delivered
      if (status === 'Delivered') {
        setActiveTab('customers');
      }
    }
    catch (err) { alert("Failed to update status"); }
  };

  const handleAcceptOrder = async (id) => {
    try { await acceptOrder(id); loadOrders(); }
    catch (err) { alert("Failed to accept order"); }
  };

  const handleManualVerifyPayment = async (orderId) => {
    if (window.confirm("Verify this payment manually?")) {
      try {
        await manualVerifyPayment(orderId, { verificationNote: "Admin manual verify" });
        loadOrders();
      } catch (err) { alert("Verification failed"); }
    }
  };

  // Product handlers
  const confirmToggleStock = async () => {
    if (showStockConfirm) {
      try {
        await toggleProductAvailability(showStockConfirm._id);
        loadProducts();
        setShowStockConfirm(null);
      } catch (err) { alert("Failed to toggle stock"); }
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Delete product?")) {
      await deleteProduct(id);
      loadProducts();
    }
  };

  const handleClearAll = async () => {
    try { await deleteAllProducts(); loadProducts(); }
    catch (err) { alert('Failed to clear menu'); }
  };

  // Settings
  const handleUpdateStore = async () => {
    const password = prompt("Enter settings password to save:");
    if (!password) return;
    try { await updateStoreSettings({ ...storeSettings, password }); alert("Settings updated!"); }
    catch (e) { alert(e.response?.data?.message || "Error updating settings"); }
  };

  const handleLogout = () => {
    logoutAdmin();
    window.location.href = "/";
  };

  // Stats
  const todayOrders = useMemo(() =>
    orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()),
    [orders]);

  const todayRevenue = useMemo(() =>
    todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    [todayOrders]);

  const pendingOrders = orders.filter(o => o.status === 'Pending').length;

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout}>
      {/* Header */}
      <header className="sticky top-0 z-40 px-4 py-4"
        style={{ background: '#FFFFFF', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px' }}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #C97B4B 0%, #E8956A 100%)' }}>
              <FaUtensils className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight" style={{ color: '#C97B4B' }}>Admin Panel</h1>
              <p className="text-xs" style={{ color: '#A0998F' }}>{admin?.name || 'Admin'}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Content */}
      {activeTab === 'orders' && (
        <AdminOrders
          orders={orders}
          onUpdateStatus={handleUpdateStatus}
          onAcceptOrder={handleAcceptOrder}
          onManualVerifyPayment={handleManualVerifyPayment}
        />
      )}

      {activeTab === 'menu' && (
        <AdminMenu
          products={products}
          onAdd={() => { setEditingProduct(null); setShowProductForm(true); }}
          onEdit={(p) => { setEditingProduct(p); setShowProductForm(true); }}
          onDelete={handleDeleteProduct}
          onToggleAvailability={(p) => setShowStockConfirm(p)}
          onClearAll={handleClearAll}
        />
      )}

      {activeTab === 'categories' && (
        <AdminCategories />
      )}

      {activeTab === 'offers' && (
        <AdminOffers />
      )}

      {activeTab === 'customers' && (
        <AdminCustomers orders={orders} />
      )}


      {activeTab === 'revenue' && (
        <AdminStats
          todayOrders={todayOrders}
          todayRevenue={todayRevenue}
          pendingOrders={pendingOrders}
          allOrders={orders}
          products={products}
        />
      )}

      {activeTab === 'settings' && (
        <AdminSettings
          storeSettings={storeSettings}
          setStoreSettings={setStoreSettings}
          onUpdateStore={handleUpdateStore}
        />
      )}

      {/* Product Form Modal */}
      {showProductForm && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => { setShowProductForm(false); setEditingProduct(null); }}
          onSave={() => { loadProducts(); setShowProductForm(false); setEditingProduct(null); }}
        />
      )}


      {/* Stock Toggle Confirmation */}
      {showStockConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4`}
                style={{ background: showStockConfirm.isAvailable ? '#FEE2E2' : '#DCFCE7' }}>
                <span className="text-3xl">{showStockConfirm.isAvailable ? "⚠️" : "✅"}</span>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: '#1C1C1C' }}>
                {showStockConfirm.isAvailable ? "Mark as Out of Stock?" : "Mark as In Stock?"}
              </h3>
              <p className="text-sm" style={{ color: '#7E7E7E' }}>
                Confirm for <span className="font-bold" style={{ color: '#1C1C1C' }}>"{showStockConfirm.name}"</span>
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowStockConfirm(null)}
                className="flex-1 py-3 font-bold rounded-xl"
                style={{ background: '#FAF7F2', color: '#7E7E7E', border: '2px solid #E8E3DB' }}>
                Cancel
              </button>
              <button onClick={confirmToggleStock}
                className="flex-1 py-3 font-bold rounded-xl text-white active:scale-[0.98]"
                style={{
                  background: showStockConfirm.isAvailable ? '#DC2626' : '#16A34A',
                  boxShadow: showStockConfirm.isAvailable ? '0 4px 12px rgba(220,38,38,0.3)' : '0 4px 12px rgba(22,163,74,0.3)'
                }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
};

export default AdminDashboard;
