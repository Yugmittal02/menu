import React, { useMemo } from 'react';
import { FaClipboardList, FaRupeeSign, FaClock, FaChartLine, FaShoppingCart, FaFire, FaTruck, FaCheckCircle } from 'react-icons/fa';

const AdminStats = ({ todayOrders, todayRevenue, pendingOrders, allOrders = [], products = [] }) => {
    const totalOrders = allOrders.length;
    // Revenue: only count non-cancelled orders with valid payment
    const validOrders = useMemo(() => allOrders.filter(o => o.status !== 'Cancelled' && o.paymentStatus !== 'Failed'), [allOrders]);
    const totalRevenue = useMemo(() => validOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0), [validOrders]);
    const avgOrderValue = validOrders.length > 0 ? (totalRevenue / validOrders.length).toFixed(0) : 0;

    const deliveredOrders = allOrders.filter(o => o.status === 'Delivered').length;
    const cancelledOrders = allOrders.filter(o => o.status === 'Cancelled').length;

    const weeklyOrders = useMemo(() => {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return allOrders.filter(o => new Date(o.createdAt) >= weekAgo);
    }, [allOrders]);
    const weeklyRevenue = weeklyOrders.filter(o => o.status !== 'Cancelled' && o.paymentStatus !== 'Failed').reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const categoryBreakdown = useMemo(() => {
        const cats = {};
        allOrders.forEach(o => {
            (o.items || []).forEach(item => {
                const product = products.find(p => p._id === (item.product?._id || item.product));
                const cat = product?.category || 'Other';
                cats[cat] = (cats[cat] || 0) + (item.quantity || 1);
            });
        });
        return Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 5);
    }, [allOrders, products]);

    const paymentBreakdown = useMemo(() => {
        const methods = {};
        allOrders.forEach(o => {
            const method = o.paymentMethod || 'Cash';
            methods[method] = (methods[method] || 0) + 1;
        });
        return Object.entries(methods).sort((a, b) => b[1] - a[1]);
    }, [allOrders]);

    const statCards = [
        { label: 'Today', value: todayOrders.length, sub: 'orders', icon: FaClipboardList, color: '#C97B4B', bg: '#FEF3E2' },
        { label: 'Revenue', value: `₹${todayRevenue}`, sub: 'today', icon: FaRupeeSign, color: '#16A34A', bg: '#DCFCE7' },
        { label: 'Pending', value: pendingOrders, sub: pendingOrders > 0 ? '⚡ Action Needed' : 'all clear', icon: FaClock, color: '#EAB308', bg: '#FEF9C3' },
        { label: 'Avg Value', value: `₹${avgOrderValue}`, sub: 'per order', icon: FaShoppingCart, color: '#8B5CF6', bg: '#EDE9FE' },
    ];

    return (
        <div className="px-4 pb-20 pt-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black" style={{ color: '#1C1C1C' }}>Overview</h2>
                <div className="px-3 py-1 rounded-lg text-xs font-bold"
                    style={{ background: '#DCFCE7', color: '#16A34A' }}>
                    Live Updates
                </div>
            </div>

            {/* Top Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                {statCards.map((card) => {
                    const CardIcon = card.icon;
                    return (
                        <div key={card.label} className="p-5 rounded-3xl relative overflow-hidden"
                            style={{ background: '#FFFFFF', border: '2px solid #E8E3DB', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                        style={{ background: card.bg, color: card.color }}>
                                        <CardIcon />
                                    </div>
                                    <span className="font-bold text-xs" style={{ color: '#A0998F' }}>{card.label}</span>
                                </div>
                                <p className="text-3xl font-black" style={{ color: '#1C1C1C' }}>{card.value}</p>
                                <p className="text-[10px] mt-0.5" style={{ color: card.sub === '⚡ Action Needed' ? '#EAB308' : '#A0998F' }}>
                                    {card.sub}
                                </p>
                            </div>
                            <div className="absolute right-0 top-0 w-24 h-24 rounded-full -mr-6 -mt-6 opacity-30 pointer-events-none"
                                style={{ background: card.bg }}></div>
                        </div>
                    );
                })}
            </div>

            {/* Weekly Summary */}
            <div className="p-5 rounded-3xl mb-4"
                style={{ background: '#FFFFFF', border: '2px solid #E8E3DB', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div className="flex items-center gap-2 mb-4">
                    <FaChartLine style={{ color: '#C97B4B' }} />
                    <h3 className="font-bold" style={{ color: '#1C1C1C' }}>This Week</h3>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-2xl p-3" style={{ background: '#FEF3E2' }}>
                        <p className="text-2xl font-black" style={{ color: '#C97B4B' }}>{weeklyOrders.length}</p>
                        <p className="text-[10px] font-semibold mt-0.5" style={{ color: '#E8956A' }}>Orders</p>
                    </div>
                    <div className="rounded-2xl p-3" style={{ background: '#DCFCE7' }}>
                        <p className="text-2xl font-black" style={{ color: '#16A34A' }}>₹{(weeklyRevenue / 1000).toFixed(1)}k</p>
                        <p className="text-[10px] font-semibold mt-0.5" style={{ color: '#22C55E' }}>Revenue</p>
                    </div>
                    <div className="rounded-2xl p-3" style={{ background: '#FEF9C3' }}>
                        <p className="text-2xl font-black" style={{ color: '#A16207' }}>{totalOrders}</p>
                        <p className="text-[10px] font-semibold mt-0.5" style={{ color: '#CA8A04' }}>All Time</p>
                    </div>
                </div>
            </div>

            {/* Order Status Breakdown */}
            <div className="p-5 rounded-3xl mb-4"
                style={{ background: '#FFFFFF', border: '2px solid #E8E3DB', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: '#1C1C1C' }}>
                    <FaTruck style={{ color: '#A0998F' }} /> Order Status
                </h3>
                <div className="space-y-3">
                    {[
                        { label: 'Delivered', count: deliveredOrders, color: '#16A34A', bg: '#DCFCE7', icon: <FaCheckCircle size={12} style={{ color: '#16A34A' }} /> },
                        { label: 'Pending', count: pendingOrders, color: '#EAB308', bg: '#FEF9C3', icon: <FaClock size={12} style={{ color: '#EAB308' }} /> },
                        { label: 'Cancelled', count: cancelledOrders, color: '#DC2626', bg: '#FEE2E2', icon: <FaClock size={12} style={{ color: '#DC2626' }} /> },
                    ].map(item => {
                        const pct = totalOrders > 0 ? (item.count / totalOrders) * 100 : 0;
                        return (
                            <div key={item.label} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{ background: item.bg }}>{item.icon}</div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-semibold" style={{ color: '#1C1C1C' }}>{item.label}</span>
                                        <span className="text-xs font-bold" style={{ color: '#7E7E7E' }}>{item.count} ({pct.toFixed(0)}%)</span>
                                    </div>
                                    <div className="w-full rounded-full h-2" style={{ background: '#FAF7F2' }}>
                                        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: item.color }}></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Top Categories */}
            {categoryBreakdown.length > 0 && (
                <div className="p-5 rounded-3xl mb-4"
                    style={{ background: '#FFFFFF', border: '2px solid #E8E3DB', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: '#1C1C1C' }}>
                        <FaFire style={{ color: '#C97B4B' }} /> Top Categories
                    </h3>
                    <div className="space-y-3">
                        {categoryBreakdown.map(([cat, count], i) => (
                            <div key={cat} className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black"
                                    style={{ background: '#FEF3E2', color: '#C97B4B' }}>
                                    {i + 1}
                                </span>
                                <span className="flex-1 text-sm font-semibold capitalize" style={{ color: '#1C1C1C' }}>{cat}</span>
                                <span className="text-sm font-bold" style={{ color: '#7E7E7E' }}>{count} items</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Payment Methods */}
            {paymentBreakdown.length > 0 && (
                <div className="p-5 rounded-3xl"
                    style={{ background: '#FFFFFF', border: '2px solid #E8E3DB', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <h3 className="font-bold mb-4" style={{ color: '#1C1C1C' }}>💳 Payment Methods</h3>
                    <div className="flex flex-wrap gap-2">
                        {paymentBreakdown.map(([method, count]) => (
                            <div key={method} className="px-3 py-2 rounded-xl text-center"
                                style={{ background: '#FAF7F2', border: '1px solid #E8E3DB' }}>
                                <p className="text-lg font-black" style={{ color: '#1C1C1C' }}>{count}</p>
                                <p className="text-[10px] font-semibold" style={{ color: '#7E7E7E' }}>{method}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminStats;
