import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchMyOrders } from '../services/api';
import {
    FaArrowLeft, FaReceipt, FaClock, FaCheckCircle, FaSpinner, FaUtensils,
    FaBoxOpen, FaMapMarkerAlt, FaHeart, FaCrown, FaStar,
    FaGift, FaPercent, FaBell, FaChevronRight, FaShoppingBag, FaSignOutAlt
} from 'react-icons/fa';

const UserDashboard = () => {
    const navigate = useNavigate();
    const { customer, logout } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loaded, setLoaded] = useState(false);

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
            const { data } = await fetchMyOrders();
            setOrders(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

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

    // Time-based greeting
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

    if (!customer) return null;

    const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return (
        <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(180deg, #1C1117 0%, #F5F0E8 25%, #FAF7F2 100%)' }}>
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
                    <button onClick={() => { const el = document.getElementById('recent-orders-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}
                        className="w-10 h-10 rounded-full flex items-center justify-center relative transition-all active:scale-90"
                        style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                        <FaBell size={15} color="#F9FAFB" />
                        {orders.length > 0 && (
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
                        { icon: <FaShoppingBag size={16} color="#F97316" />, label: 'My Orders', sub: `${orders.length} orders placed`, action: () => { const el = document.getElementById('recent-orders-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, bg: '#FFF7ED' },
                        { icon: <FaMapMarkerAlt size={16} color="#3B82F6" />, label: 'Saved Address', sub: 'Manage delivery address', action: () => navigate('/cart'), bg: '#EFF6FF' },
                        { icon: <FaHeart size={16} color="#EF4444" />, label: 'Favorites', sub: 'Browse your liked items', action: () => navigate('/menu'), bg: '#FEF2F2' },
                    ].map((item, i) => (
                        <button key={i} onClick={item.action}
                            className="w-full flex items-center gap-3 p-3.5 rounded-xl transition-all active:scale-[0.98] active:bg-gray-50"
                            style={{ borderBottom: i < 3 ? '1px solid #F5F3F0' : 'none' }}>
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
