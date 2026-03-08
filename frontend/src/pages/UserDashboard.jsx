import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchMyOrders, fetchProducts } from '../services/api';
import {
    FaArrowLeft, FaReceipt, FaClock, FaCheckCircle, FaSpinner, FaUtensils,
    FaBoxOpen, FaMapMarkerAlt, FaHeart, FaCrown, FaStar,
    FaGift, FaPercent, FaBell, FaChevronRight, FaShoppingBag, FaSignOutAlt,
    FaTimes, FaPlus, FaEdit, FaTrash, FaHome, FaBriefcase
} from 'react-icons/fa';

// localStorage helpers
const ADDR_KEY = 'sewashubham_addresses';
const FAV_KEY = 'sewashubham_favorites';

const getSavedAddresses = () => {
    try { return JSON.parse(localStorage.getItem(ADDR_KEY)) || []; } catch { return []; }
};
const saveAddresses = (list) => localStorage.setItem(ADDR_KEY, JSON.stringify(list));

const getFavoriteIds = () => {
    try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch { return []; }
};
const saveFavoriteIds = (ids) => localStorage.setItem(FAV_KEY, JSON.stringify(ids));

const UserDashboard = () => {
    const navigate = useNavigate();
    const { customer, logout } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loaded, setLoaded] = useState(false);

    // Active section: null = default view, 'notifications' | 'addresses' | 'favorites'
    const [activeSection, setActiveSection] = useState(null);

    // Addresses state
    const [addresses, setAddresses] = useState(() => getSavedAddresses());
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [addressForm, setAddressForm] = useState({ label: 'Home', name: '', phone: '', address: '', landmark: '', pincode: '' });

    // Favorites state
    const [favoriteProducts, setFavoriteProducts] = useState([]);
    const [favLoading, setFavLoading] = useState(false);

    useEffect(() => {
        if (!customer) {
            navigate('/login');
            return;
        }
        loadOrders();
        setTimeout(() => setLoaded(true), 100);
    }, [customer, navigate]);

    const loadOrders = useCallback(async () => {
        try {
            const token = localStorage.getItem('customerToken');
            if (!token) { setLoading(false); return; }
            const { data } = await fetchMyOrders();
            setOrders(data || []);
        } catch (err) {
            console.error(err);
            if (err.response?.status === 401) {
                setOrders([]);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // Load favorite products when favorites section opens
    const loadFavorites = useCallback(async () => {
        const ids = getFavoriteIds();
        if (ids.length === 0) { setFavoriteProducts([]); return; }
        setFavLoading(true);
        try {
            const { data } = await fetchProducts();
            const products = data.products || data || [];
            setFavoriteProducts(products.filter(p => ids.includes(p._id)));
        } catch (err) {
            console.error(err);
        } finally {
            setFavLoading(false);
        }
    }, []);

    const removeFavorite = (productId) => {
        const ids = getFavoriteIds().filter(id => id !== productId);
        saveFavoriteIds(ids);
        setFavoriteProducts(prev => prev.filter(p => p._id !== productId));
    };

    // Address helpers
    const resetAddressForm = () => {
        setAddressForm({ label: 'Home', name: '', phone: '', address: '', landmark: '', pincode: '' });
        setEditingIndex(null);
        setShowAddressForm(false);
    };

    const handleSaveAddress = () => {
        if (!addressForm.name.trim() || !addressForm.address.trim()) return;
        const updated = [...addresses];
        if (editingIndex !== null) {
            updated[editingIndex] = addressForm;
        } else {
            updated.push(addressForm);
        }
        setAddresses(updated);
        saveAddresses(updated);
        resetAddressForm();
    };

    const handleEditAddress = (index) => {
        setAddressForm(addresses[index]);
        setEditingIndex(index);
        setShowAddressForm(true);
    };

    const handleDeleteAddress = (index) => {
        const updated = addresses.filter((_, i) => i !== index);
        setAddresses(updated);
        saveAddresses(updated);
    };

    // Notifications derived from orders
    const notifications = orders.map(order => {
        const msgs = {
            'Pending': { text: `Order #${order._id?.slice(-6).toUpperCase()} is pending confirmation`, icon: '🕐', color: '#F59E0B' },
            'Confirmed': { text: `Order #${order._id?.slice(-6).toUpperCase()} has been confirmed!`, icon: '✅', color: '#22C55E' },
            'Preparing': { text: `Your order #${order._id?.slice(-6).toUpperCase()} is being prepared`, icon: '👨‍🍳', color: '#F97316' },
            'Ready': { text: `Order #${order._id?.slice(-6).toUpperCase()} is ready for pickup!`, icon: '📦', color: '#3B82F6' },
            'Delivered': { text: `Order #${order._id?.slice(-6).toUpperCase()} has been delivered`, icon: '🎉', color: '#22C55E' },
            'Cancelled': { text: `Order #${order._id?.slice(-6).toUpperCase()} was cancelled`, icon: '❌', color: '#EF4444' },
        };
        const info = msgs[order.status] || msgs['Pending'];
        return { ...info, date: order.updatedAt || order.createdAt, orderId: order._id };
    });

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Delivered': return <FaCheckCircle size={12} className="text-green-500" />;
            case 'Preparing': return <FaUtensils size={12} className="text-orange-500" />;
            case 'Ready': return <FaBoxOpen size={12} className="text-blue-500" />;
            case 'Cancelled': return <FaClock size={12} className="text-red-500" />;
            default: return <FaClock size={12} className="text-yellow-500" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Delivered': return { bg: '#DCFCE7', text: '#166534', border: '#BBF7D0' };
            case 'Preparing': return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' };
            case 'Ready': return { bg: '#DBEAFE', text: '#1E40AF', border: '#BFDBFE' };
            case 'Cancelled': return { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' };
            default: return { bg: '#FEF3E2', text: '#6B4423', border: '#FDE8CC' };
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return '🌅 Good Morning';
        if (hour < 17) return '☀️ Good Afternoon';
        return '🌙 Good Evening';
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const openSection = (section) => {
        if (section === 'favorites') loadFavorites();
        setActiveSection(section);
    };

    if (!customer) return null;

    const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const activeOrders = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');

    // ──────── SUB-SECTION OVERLAYS ────────

    // Notification Panel
    const NotificationsPanel = () => (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#FAF7F2' }}>
            <div className="flex items-center gap-3 px-4 pt-5 pb-4" style={{ background: 'white', borderBottom: '1px solid #F3F0EB' }}>
                <button onClick={() => setActiveSection(null)} className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 active:scale-90 transition-all">
                    <FaArrowLeft size={14} color="#374151" />
                </button>
                <h2 className="font-bold text-lg" style={{ color: '#1F2937' }}>Notifications</h2>
                {activeOrders.length > 0 && (
                    <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">{activeOrders.length} active</span>
                )}
            </div>
            <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
                {notifications.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: '#FFF7ED' }}>
                            <span className="text-3xl">🔔</span>
                        </div>
                        <p className="font-semibold text-sm" style={{ color: '#1F2937' }}>No notifications</p>
                        <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Order updates will appear here</p>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {notifications.map((n, i) => (
                            <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-white" style={{ border: '1px solid #F3F0EB' }}>
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${n.color}15` }}>
                                    <span className="text-lg">{n.icon}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium" style={{ color: '#1F2937' }}>{n.text}</p>
                                    <p className="text-[10px] mt-1" style={{ color: '#9CA3AF' }}>
                                        {new Date(n.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    // Saved Addresses Panel
    const AddressesPanel = () => (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#FAF7F2' }}>
            <div className="flex items-center gap-3 px-4 pt-5 pb-4" style={{ background: 'white', borderBottom: '1px solid #F3F0EB' }}>
                <button onClick={() => { setActiveSection(null); resetAddressForm(); }} className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 active:scale-90 transition-all">
                    <FaArrowLeft size={14} color="#374151" />
                </button>
                <h2 className="font-bold text-lg" style={{ color: '#1F2937' }}>Saved Addresses</h2>
                <button onClick={() => { resetAddressForm(); setShowAddressForm(true); }}
                    className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95"
                    style={{ background: '#FFF7ED', color: '#F97316', border: '1px solid #FDBA74' }}>
                    <FaPlus size={10} /> Add
                </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
                {/* Add/Edit Form */}
                {showAddressForm && (
                    <div className="mb-4 p-4 rounded-2xl bg-white" style={{ border: '1px solid #F3F0EB', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                        <h3 className="font-bold text-sm mb-3" style={{ color: '#1F2937' }}>{editingIndex !== null ? 'Edit Address' : 'New Address'}</h3>
                        {/* Label selector */}
                        <div className="flex gap-2 mb-3">
                            {['Home', 'Work', 'Other'].map(lbl => (
                                <button key={lbl} onClick={() => setAddressForm(f => ({ ...f, label: lbl }))}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                                    style={{
                                        background: addressForm.label === lbl ? '#F97316' : '#F9FAFB',
                                        color: addressForm.label === lbl ? 'white' : '#6B7280',
                                        border: `1px solid ${addressForm.label === lbl ? '#F97316' : '#E5E7EB'}`
                                    }}>
                                    {lbl === 'Home' ? <FaHome size={10} /> : lbl === 'Work' ? <FaBriefcase size={10} /> : <FaMapMarkerAlt size={10} />}
                                    {lbl}
                                </button>
                            ))}
                        </div>
                        <div className="space-y-2.5">
                            <input value={addressForm.name} onChange={e => setAddressForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="Full Name *" className="w-full px-3 py-2.5 rounded-xl text-sm bg-gray-50 border border-gray-200 outline-none focus:border-orange-400" />
                            <input value={addressForm.phone} onChange={e => setAddressForm(f => ({ ...f, phone: e.target.value }))}
                                placeholder="Phone Number" className="w-full px-3 py-2.5 rounded-xl text-sm bg-gray-50 border border-gray-200 outline-none focus:border-orange-400" />
                            <textarea value={addressForm.address} onChange={e => setAddressForm(f => ({ ...f, address: e.target.value }))}
                                placeholder="Full Address *" rows={2} className="w-full px-3 py-2.5 rounded-xl text-sm bg-gray-50 border border-gray-200 outline-none focus:border-orange-400 resize-none" />
                            <div className="grid grid-cols-2 gap-2">
                                <input value={addressForm.landmark} onChange={e => setAddressForm(f => ({ ...f, landmark: e.target.value }))}
                                    placeholder="Landmark" className="w-full px-3 py-2.5 rounded-xl text-sm bg-gray-50 border border-gray-200 outline-none focus:border-orange-400" />
                                <input value={addressForm.pincode} onChange={e => setAddressForm(f => ({ ...f, pincode: e.target.value }))}
                                    placeholder="Pincode" className="w-full px-3 py-2.5 rounded-xl text-sm bg-gray-50 border border-gray-200 outline-none focus:border-orange-400" />
                            </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button onClick={resetAddressForm} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600 active:scale-95 transition-all">Cancel</button>
                            <button onClick={handleSaveAddress}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white active:scale-95 transition-all"
                                style={{ background: 'linear-gradient(135deg, #F97316, #FB923C)' }}>
                                {editingIndex !== null ? 'Update' : 'Save'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Address List */}
                {addresses.length === 0 && !showAddressForm ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: '#EFF6FF' }}>
                            <span className="text-3xl">📍</span>
                        </div>
                        <p className="font-semibold text-sm" style={{ color: '#1F2937' }}>No saved addresses</p>
                        <p className="text-xs mt-1 mb-4" style={{ color: '#9CA3AF' }}>Add an address for faster checkout</p>
                        <button onClick={() => setShowAddressForm(true)}
                            className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm active:scale-95 transition-all"
                            style={{ background: 'linear-gradient(135deg, #F97316, #FB923C)' }}>
                            <FaPlus size={10} className="inline mr-1" /> Add Address
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {addresses.map((addr, i) => (
                            <div key={i} className="p-3.5 rounded-xl bg-white" style={{ border: '1px solid #F3F0EB' }}>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                            style={{ background: addr.label === 'Home' ? '#EFF6FF' : addr.label === 'Work' ? '#F0FDF4' : '#FFF7ED', color: addr.label === 'Home' ? '#3B82F6' : addr.label === 'Work' ? '#22C55E' : '#F97316' }}>
                                            {addr.label === 'Home' ? '🏠' : addr.label === 'Work' ? '💼' : '📍'} {addr.label}
                                        </span>
                                    </div>
                                    <div className="flex gap-1.5">
                                        <button onClick={() => handleEditAddress(i)} className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-50 active:scale-90 transition-all">
                                            <FaEdit size={11} color="#6B7280" />
                                        </button>
                                        <button onClick={() => handleDeleteAddress(i)} className="w-7 h-7 rounded-full flex items-center justify-center bg-red-50 active:scale-90 transition-all">
                                            <FaTrash size={10} color="#EF4444" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm font-semibold" style={{ color: '#1F2937' }}>{addr.name}</p>
                                <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{addr.address}</p>
                                {addr.landmark && <p className="text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>Near {addr.landmark}</p>}
                                <div className="flex items-center gap-3 mt-1.5">
                                    {addr.phone && <p className="text-[11px]" style={{ color: '#9CA3AF' }}>📞 {addr.phone}</p>}
                                    {addr.pincode && <p className="text-[11px]" style={{ color: '#9CA3AF' }}>📮 {addr.pincode}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    // Favorites Panel
    const FavoritesPanel = () => (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#FAF7F2' }}>
            <div className="flex items-center gap-3 px-4 pt-5 pb-4" style={{ background: 'white', borderBottom: '1px solid #F3F0EB' }}>
                <button onClick={() => setActiveSection(null)} className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 active:scale-90 transition-all">
                    <FaArrowLeft size={14} color="#374151" />
                </button>
                <h2 className="font-bold text-lg" style={{ color: '#1F2937' }}>Favorites</h2>
                <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#FEF2F2', color: '#EF4444' }}>
                    {getFavoriteIds().length} items
                </span>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
                {favLoading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <FaSpinner className="animate-spin mb-3" size={20} color="#F97316" />
                        <p className="text-xs" style={{ color: '#9CA3AF' }}>Loading favorites...</p>
                    </div>
                ) : favoriteProducts.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: '#FEF2F2' }}>
                            <span className="text-3xl">❤️</span>
                        </div>
                        <p className="font-semibold text-sm" style={{ color: '#1F2937' }}>No favorites yet</p>
                        <p className="text-xs mt-1 mb-4" style={{ color: '#9CA3AF' }}>Tap the heart icon on products to save them</p>
                        <button onClick={() => { setActiveSection(null); navigate('/menu'); }}
                            className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm active:scale-95 transition-all"
                            style={{ background: 'linear-gradient(135deg, #F97316, #FB923C)' }}>
                            Browse Menu →
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {favoriteProducts.map(p => (
                            <div key={p._id} onClick={() => navigate(`/product/${p.slug || p._id}`)}
                                className="flex items-center gap-3 p-3 rounded-xl bg-white cursor-pointer active:scale-[0.98] transition-all"
                                style={{ border: '1px solid #F3F0EB' }}>
                                <div className="w-16 h-16 rounded-xl flex-shrink-0 bg-gray-100 bg-cover bg-center overflow-hidden"
                                    style={{ backgroundImage: p.image ? `url(${p.image})` : 'none' }}>
                                    {!p.image && <div className="w-full h-full flex items-center justify-center text-2xl">🍰</div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm line-clamp-1" style={{ color: '#1F2937' }}>{p.name}</p>
                                    <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{p.description?.slice(0, 50)}</p>
                                    <p className="font-bold text-sm mt-1" style={{ color: '#F97316' }}>₹{p.basePrice || p.price}</p>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); removeFavorite(p._id); }}
                                    className="w-8 h-8 rounded-full flex items-center justify-center bg-red-50 active:scale-90 transition-all flex-shrink-0">
                                    <FaHeart size={12} color="#EF4444" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    // ──────── MAIN RENDER ────────

    return (
        <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(180deg, #1C1117 0%, #F5F0E8 25%, #FAF7F2 100%)' }}>
            {/* Section Overlays */}
            {activeSection === 'notifications' && <NotificationsPanel />}
            {activeSection === 'addresses' && <AddressesPanel />}
            {activeSection === 'favorites' && <FavoritesPanel />}

            {/* Premium Header with gradient */}
            <header className="relative overflow-hidden pt-safe">
                <div className="absolute inset-0"
                    style={{ background: 'linear-gradient(160deg, #1C1117 0%, #2D1F16 40%, #3D2B1F 100%)' }}></div>
                <div className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(249, 115, 22, 0.3) 0%, transparent 50%)',
                    }}></div>

                {/* Top bar */}
                <div className="relative px-4 pt-4 pb-3 flex items-center justify-between">
                    <button onClick={() => navigate('/menu')}
                        className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
                        style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                        <FaArrowLeft size={16} color="#FFFFFF" />
                    </button>
                    <h1 className="text-lg font-bold text-white">My Account</h1>
                    <button onClick={() => openSection('notifications')}
                        className="w-10 h-10 rounded-full flex items-center justify-center relative transition-all active:scale-90"
                        style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                        <FaBell size={15} color="#F9FAFB" />
                        {activeOrders.length > 0 && (
                        <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-[#2D1F16]"></span>
                        )}
                    </button>
                </div>

                {/* Profile Section */}
                <div className={`relative px-4 pb-6 pt-2 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-18 h-18 rounded-2xl flex items-center justify-center"
                                style={{
                                    width: '72px', height: '72px',
                                    background: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)',
                                    boxShadow: '0 8px 25px rgba(249, 115, 22, 0.4)',
                                }}>
                                <span className="text-3xl">😊</span>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                                style={{ background: '#22C55E', border: '2px solid #2D1F16' }}>
                                <FaCheckCircle size={10} color="#fff" />
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium mb-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                {getGreeting()}
                            </p>
                            <h2 className="text-xl font-bold text-white truncate">{customer.name}</h2>
                            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{customer.phone}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full"
                                    style={{ background: 'rgba(249, 115, 22, 0.2)', border: '1px solid rgba(249, 115, 22, 0.3)' }}>
                                    <FaCrown size={9} color="#FB923C" />
                                    <span className="text-[10px] font-bold" style={{ color: '#FB923C' }}>MEMBER</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Stats Row */}
            <div className={`mx-3 -mt-1 grid grid-cols-2 gap-2 transition-all duration-700 delay-100 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="p-3 rounded-2xl text-center"
                    style={{ background: 'white', boxShadow: '0 4px 15px rgba(0,0,0,0.06)', border: '1px solid #F3F0EB' }}>
                    <p className="text-xl font-bold" style={{ color: '#F97316' }}>{orders.length}</p>
                    <p className="text-[10px] font-medium mt-0.5" style={{ color: '#9CA3AF' }}>Orders</p>
                </div>
                <div className="p-3 rounded-2xl text-center"
                    style={{ background: 'white', boxShadow: '0 4px 15px rgba(0,0,0,0.06)', border: '1px solid #F3F0EB' }}>
                    <p className="text-xl font-bold" style={{ color: '#F97316' }}>₹{totalSpent}</p>
                    <p className="text-[10px] font-medium mt-0.5" style={{ color: '#9CA3AF' }}>Spent</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className={`mx-3 mt-4 transition-all duration-700 delay-200 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="p-1 rounded-2xl" style={{ background: 'white', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #F3F0EB' }}>
                    {[
                        { icon: <FaBell size={16} color="#8B5CF6" />, label: 'Notifications', sub: activeOrders.length > 0 ? `${activeOrders.length} active orders` : 'No new updates', action: () => openSection('notifications'), bg: '#F5F3FF' },
                        { icon: <FaShoppingBag size={16} color="#F97316" />, label: 'My Orders', sub: `${orders.length} orders placed`, action: () => { const el = document.getElementById('recent-orders-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, bg: '#FFF7ED' },
                        { icon: <FaMapMarkerAlt size={16} color="#3B82F6" />, label: 'Saved Address', sub: addresses.length > 0 ? `${addresses.length} saved` : 'Add delivery address', action: () => openSection('addresses'), bg: '#EFF6FF' },
                        { icon: <FaHeart size={16} color="#EF4444" />, label: 'Favorites', sub: `${getFavoriteIds().length} liked items`, action: () => openSection('favorites'), bg: '#FEF2F2' },
                    ].map((item, i, arr) => (
                        <button key={i} onClick={item.action}
                            className="w-full flex items-center gap-3 p-3.5 rounded-xl transition-all active:scale-[0.98] active:bg-gray-50"
                            style={{ borderBottom: i < arr.length - 1 ? '1px solid #F5F3F0' : 'none' }}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: item.bg }}>
                                {item.icon}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <p className="text-sm font-semibold" style={{ color: '#1F2937' }}>{item.label}</p>
                                <p className="text-[11px]" style={{ color: '#9CA3AF' }}>{item.sub}</p>
                            </div>
                            <FaChevronRight size={12} color="#D1D5DB" />
                        </button>
                    ))}
                </div>
            </div>


            {/* Recent Orders */}
            <div id="recent-orders-section" className={`mx-3 mt-5 transition-all duration-700 delay-400 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <FaReceipt size={14} color="#F97316" />
                        <h3 className="font-bold text-sm" style={{ color: '#1F2937' }}>Recent Orders</h3>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ background: '#FFF7ED', color: '#F97316' }}>
                        {orders.length} total
                    </span>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                            style={{ background: '#FFF7ED' }}>
                            <FaSpinner className="animate-spin" size={18} color="#F97316" />
                        </div>
                        <p className="text-xs" style={{ color: '#9CA3AF' }}>Loading orders...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-10 rounded-2xl"
                        style={{ background: 'white', border: '1px solid #F3F0EB', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                            style={{ background: '#FFF7ED' }}>
                            <span className="text-3xl">🛒</span>
                        </div>
                        <p className="font-semibold text-sm" style={{ color: '#1F2937' }}>No orders yet</p>
                        <p className="text-xs mt-1 mb-4" style={{ color: '#9CA3AF' }}>Start ordering delicious treats!</p>
                        <button onClick={() => navigate('/menu')}
                            className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm transition-all active:scale-95"
                            style={{
                                background: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)',
                                boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)',
                            }}>
                            Browse Menu →
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {orders.slice(0, 5).map((order, index) => {
                            const statusStyle = getStatusColor(order.status);
                            return (
                                <div key={order._id}
                                    className="p-3.5 rounded-xl transition-all active:scale-[0.98]"
                                    style={{
                                        background: 'white',
                                        border: '1px solid #F3F0EB',
                                        boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                                        animationDelay: `${index * 0.1}s`,
                                    }}>
                                    <div className="flex justify-between items-start mb-2.5">
                                        <div>
                                            <p className="font-bold text-sm" style={{ color: '#1F2937' }}>
                                                Order #{order._id?.slice(-6).toUpperCase()}
                                            </p>
                                            <p className="text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>
                                                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric', month: 'short', year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
                                            style={{ background: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}` }}>
                                            {getStatusIcon(order.status)}
                                            <span className="capitalize">{order.status?.replace('_', ' ')}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center pt-2"
                                        style={{ borderTop: '1px dashed #F3F0EB' }}>
                                        <p className="text-xs" style={{ color: '#9CA3AF' }}>
                                            🍽️ {order.items?.length} item{order.items?.length > 1 ? 's' : ''}
                                        </p>
                                        <p className="font-bold text-sm" style={{ color: '#F97316' }}>₹{order.totalAmount}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Logout Button */}
            <div className={`mx-3 mt-6 mb-4 transition-all duration-700 delay-500 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <button onClick={handleLogout}
                    className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                    style={{
                        background: '#FEF2F2',
                        color: '#EF4444',
                        border: '1.5px solid #FECACA',
                    }}>
                    <FaSignOutAlt size={14} />
                    Logout
                </button>
            </div>
        </div>
    );
};

export default UserDashboard;
