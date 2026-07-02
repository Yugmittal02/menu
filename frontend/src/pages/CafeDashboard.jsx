import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyCafe, getMyMenu, addMenuItem, updateMenuItem, deleteMenuItem, toggleMenuItemAvailability, getCafeOrders, updateOrderStatus, getCafeStats, uploadImage, updateMyCafe, getMyCoupons, createCoupon, deleteCoupon, toggleCouponStatus, markOrderPaid } from '../services/api';
import { FiLogOut, FiPlus, FiEdit2, FiTrash2, FiImage, FiClock, FiCheck, FiX, FiDownload, FiRefreshCw, FiSearch, FiCopy, FiVolume2, FiVolumeX, FiMenu, FiChevronRight, FiBox, FiGrid, FiSettings, FiShoppingBag, FiTag, FiSun, FiMoon, FiBellOff } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import { themes } from '../utils/themes';

const TABS = [
  { id: 'Orders', icon: FiShoppingBag, label: 'Orders' },
  { id: 'Menu', icon: FiBox, label: 'Menu' },
  { id: 'Coupons', icon: FiTag, label: 'Coupons' },
  { id: 'QR', icon: FiGrid, label: 'QR & Tables' },
  { id: 'Settings', icon: FiSettings, label: 'Settings' }
];

const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return new Date(date).toLocaleDateString();
};

// Live elapsed timer: returns "MM:SS" format
const elapsedTimer = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
};

const CAT_COLORS = ['#7C3AED','#3B82F6','#10B981','#F59E0B','#F43F5E','#14B8A6','#D946EF','#D4A574'];

const playBuzzer = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.setValueAtTime(450, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch(e) {}
};

const CafeDashboard = () => {
  const { cafeUser, logoutCafeOwner } = useAuth();
  const [activeTab, setActiveTab] = useState('Orders');
  const [cafe, setCafe] = useState(null);
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ totalOrders:0, totalRevenue:0, totalDiscount:0, pendingOrders:0, preparingOrders:0, completedOrders:0, unpaidOrders:0, paidOrderCount:0, period:'today' });
  const [payingOrderId, setPayingOrderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [menuForm, setMenuForm] = useState({ name:'', description:'', price:'', category:'', isVeg:true, image:'', preparationTime:15 });
  const [uploading, setUploading] = useState(false);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({});
  const [orderFilter, setOrderFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('week');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [adminTheme, setAdminTheme] = useState(() => localStorage.getItem('adminTheme') || 'dark');
  const [orderSearch, setOrderSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [copiedId, setCopiedId] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const prevOrderCount = useRef(0);
  const [coupons, setCoupons] = useState([]);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponForm, setCouponForm] = useState({ code:'', type:'percentage', value:'', minOrder:'', maxDiscount:'', usageLimit:'', expiresAt:'' });
  const [tick, setTick] = useState(0); // drives live timer updates
  const [silencedOrders, setSilencedOrders] = useState(new Set());

  const orderQuery = {
    status: orderFilter === 'all' ? undefined : orderFilter,
    date: dateFilter,
    payment: paymentFilter === 'all' ? undefined : paymentFilter,
  };

  const loadData = useCallback(async () => {
    // Load cafe profile independently so QR/Settings work even if menu fails
    try {
      const cafeRes = await getMyCafe();
      setCafe(cafeRes.data);
    } catch (e) { console.error('Cafe load error:', e); }
    try {
      const menuRes = await getMyMenu();
      setMenu(menuRes.data);
    } catch (e) { console.error('Menu load error:', e); }
    // Load orders & stats separately so failures don't break dashboard
    try {
      const [orderRes, statsRes] = await Promise.all([
        getCafeOrders(orderQuery),
        getCafeStats({ date: dateFilter })
      ]);
      setOrders(orderRes.data);
      setStats(statsRes.data);
    } catch (e) { console.error('Orders/stats load error:', e); }
    // Load coupons independently
    try { const couponRes = await getMyCoupons(); setCoupons(couponRes.data); } catch(e) { setCoupons([]); }
    setLoading(false);
  }, [orderFilter, dateFilter, paymentFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-refresh orders every 10 seconds with new order sound
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [orderRes, statsRes] = await Promise.all([
          getCafeOrders(orderQuery),
          getCafeStats({ date: dateFilter })
        ]);
        if (soundOn && orderRes.data.length > prevOrderCount.current && prevOrderCount.current > 0) {
          try { new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACA').play(); } catch(e) {}
        }
        prevOrderCount.current = orderRes.data.length;
        setOrders(orderRes.data);
        setStats(statsRes.data);
      } catch (e) {}
    }, 3000);
    return () => clearInterval(interval);
  }, [orderFilter, dateFilter, paymentFilter, soundOn]);

  // Tick every second for live order timers
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Buzzer for late orders
  useEffect(() => {
    if (!soundOn) return;
    const hasActiveLateOrder = orders.some(order => {
      if (order.status !== 'pending') return false;
      if (silencedOrders.has(order._id)) return false;
      return (Date.now() - new Date(order.createdAt).getTime()) >= 1 * 60 * 1000;
    });
    
    if (hasActiveLateOrder && tick % 5 === 0) {
      playBuzzer();
    }
  }, [tick, orders, silencedOrders, soundOn]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setTimeout(() => setRefreshing(false), 600);
  };

  const copyOrderNum = (num) => {
    navigator.clipboard.writeText(num);
    setCopiedId(num);
    setTimeout(() => setCopiedId(''), 1500);
  };

  // Coupon handlers
  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      await createCoupon({
        code: couponForm.code,
        type: couponForm.type,
        value: parseFloat(couponForm.value),
        minOrder: parseFloat(couponForm.minOrder) || 0,
        maxDiscount: parseFloat(couponForm.maxDiscount) || 0,
        usageLimit: parseInt(couponForm.usageLimit) || 0,
        expiresAt: couponForm.expiresAt || null
      });
      setCouponForm({ code:'', type:'percentage', value:'', minOrder:'', maxDiscount:'', usageLimit:'', expiresAt:'' });
      setShowCouponForm(false);
      loadData();
    } catch (e) { alert(e.response?.data?.message || 'Failed to create coupon'); }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try { await deleteCoupon(id); loadData(); } catch (e) { alert('Failed'); }
  };

  const handleToggleCoupon = async (id) => {
    try { await toggleCouponStatus(id); loadData(); } catch (e) { alert('Failed'); }
  };

  // Image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await uploadImage(formData);
      setMenuForm(prev => ({ ...prev, image: data.url }));
    } catch (e) { alert('Image upload failed'); }
    setUploading(false);
  };

  // Menu CRUD
  const handleMenuSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...menuForm, price: Number(menuForm.price) };
      if (editingItem) {
        await updateMenuItem(editingItem._id, payload);
      } else {
        await addMenuItem(payload);
      }
      setShowMenuForm(false);
      setEditingItem(null);
      setMenuForm({ name:'', description:'', price:'', category:'', isVeg:true, image:'', preparationTime:15 });
      loadData();
    } catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateMyCafe(settingsForm);
      setIsEditingSettings(false);
      loadData();
    } catch (e) { alert(e.response?.data?.message || 'Failed to update settings'); }
  };

  const handleEditSettings = () => {
    setSettingsForm({
      name: cafe.name, ownerName: cafe.ownerName, phone: cafe.phone,
      address: cafe.address, city: cafe.city, openTime: cafe.openTime,
      closeTime: cafe.closeTime, tableCount: cafe.tableCount, theme: cafe.theme || 'classic-dark'
    });
    setIsEditingSettings(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setMenuForm({ name:item.name, description:item.description, price:item.price, category:item.category, isVeg:item.isVeg, image:item.image, preparationTime:item.preparationTime });
    setShowMenuForm(true);
  };

  const handleDeleteItem = async (id) => {
    if (!confirm('Delete this item?')) return;
    try { await deleteMenuItem(id); loadData(); } catch (e) { alert('Failed'); }
  };

  const handleToggleItem = async (id) => {
    try { await toggleMenuItemAvailability(id); loadData(); } catch (e) { alert('Failed'); }
  };

  const handleStatusUpdate = async (orderId, status) => {
    try { await updateOrderStatus(orderId, status); loadData(); } catch (e) { alert('Failed'); }
  };

  const handleMarkPaid = async (orderId, paymentMethod) => {
    setPayingOrderId(null);
    try {
      await markOrderPaid(orderId, paymentMethod);
      loadData();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to mark payment');
    }
  };

  const getBaseUrl = () => 'https://orderly.menu.krixov.com';

  const downloadQR = (tableNo) => {
    const svg = document.getElementById(`qr-${tableNo}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 400; canvas.height = 480;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 400, 480);
      ctx.drawImage(img, 50, 20, 300, 300);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(cafe?.name || 'Cafe', 200, 360);
      ctx.font = '18px Inter, sans-serif';
      ctx.fillText(`Table ${tableNo}`, 200, 390);
      ctx.font = '13px Inter, sans-serif';
      ctx.fillStyle = '#666666';
      ctx.fillText('Scan to view menu & order', 200, 420);
      const link = document.createElement('a');
      link.download = `Table-${tableNo}-QR.png`;
      link.href = canvas.toDataURL();
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (loading) return (
    <div className="min-h-screen" style={{background:'linear-gradient(145deg,#0B0B14,#151525)'}}>
      <div className="p-6 space-y-4">
        <div className="skeleton h-14 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[...Array(5)].map((_,i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
        <div className="skeleton h-10 w-64" />
        {[...Array(3)].map((_,i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
      </div>
    </div>
  );

  const categories = [...new Set(menu.map(i => i.category))];
  const cafeProfile = cafe || (cafeUser ? {
    name: cafeUser.name,
    cafeId: cafeUser.cafeCode,
    ownerName: cafeUser.ownerName,
    tableCount: cafeUser.tableCount || 10,
    theme: cafeUser.theme || 'classic-dark',
  } : null);
  const getTheme = (themeKey) => themes[themeKey] || themes['classic-dark'];

  const isDark = adminTheme === 'dark';
  const toggleAdminTheme = () => { const next = isDark ? 'light' : 'dark'; setAdminTheme(next); localStorage.setItem('adminTheme', next); };
  const th = isDark ? {
    bg:'linear-gradient(145deg,#0B0B14,#151525,#1A1A30)', headerBg:'rgba(11,11,20,0.8)', headerBorder:'rgba(124,58,237,0.12)',
    text:'#F1F1F6', textSec:'#8B8FA3', textMuted:'#565970'
  } : {
    bg:'linear-gradient(145deg,#F8F8FC,#EEEEF4,#E5E5EE)', headerBg:'rgba(255,255,255,0.92)', headerBorder:'rgba(0,0,0,0.08)',
    text:'#1A1A2E', textSec:'#6B6B80', textMuted:'#9999AA'
  };

  const statsPeriodLabel = { today: 'Today', week: 'This Week', all: 'All Time' }[dateFilter] || 'Today';

  return (
    <div className="min-h-screen" style={{background:th.bg}}>
      {/* Premium Header */}
      <header className="flex items-center justify-between px-4 md:px-6 py-4" style={{borderBottom:`1px solid ${th.headerBorder}`, background:th.headerBg, backdropFilter:'blur(12px)'}}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold text-white" style={{background:'linear-gradient(135deg,#7C3AED,#6D28D9)', boxShadow:'0 4px 15px rgba(124,58,237,0.3)'}}>
            {cafe?.name?.charAt(0) || '☕'}
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{color:th.text}}>{cafe?.name || 'Dashboard'}</h1>
            <p className="text-xs" style={{color:th.textMuted}}>{cafe?.cafeId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleAdminTheme} className="btn-ghost p-2 rounded-lg" title="Toggle theme">
            {isDark ? <FiSun style={{color:'#F59E0B'}} /> : <FiMoon style={{color:'#7C3AED'}} />}
          </button>
          <button onClick={() => setSoundOn(!soundOn)} className="btn-ghost p-2 rounded-lg" title={soundOn ? 'Mute' : 'Unmute'}>
            {soundOn ? <FiVolume2 style={{color:'#7C3AED'}} /> : <FiVolumeX style={{color:th.textMuted}} />}
          </button>
          <button onClick={handleRefresh} className="btn-ghost p-2 rounded-lg" title="Refresh">
            <FiRefreshCw style={{color: refreshing ? '#7C3AED' : th.textSec, animation: refreshing ? 'spin 0.6s linear infinite' : 'none'}} />
          </button>
          <button onClick={logoutCafeOwner} className="btn-outline text-sm py-2 px-3"><FiLogOut /></button>
        </div>
      </header>

      {/* Animated Stats Bar */}
      <div className="px-4 md:px-6">
        <p className="text-xs mb-2" style={{color:th.textMuted}}>Stats for <span style={{color:th.textSec}}>{statsPeriodLabel}</span> — revenue updates only when payment is received</p>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 px-4 md:px-6 pb-4 md:pb-6">
        {[
          { label:'Orders', value:stats.totalOrders, color:'#7C3AED', icon:'📦' },
          { label:'Revenue', value:`₹${(stats.totalRevenue||0).toLocaleString()}`, color:'#10B981', icon:'💰', note:`${stats.paidOrderCount||0} paid` },
          { label:'Unpaid', value:stats.unpaidOrders||0, color:'#F43F5E', icon:'💳' },
          { label:'Pending', value:stats.pendingOrders, color:'#F59E0B', icon:'⏳' },
          { label:'Preparing', value:stats.preparingOrders, color:'#FB923C', icon:'🍳' },
          { label:'Done', value:stats.completedOrders, color:'#22C55E', icon:'✅' }
        ].map((s,i) => (
          <div key={i} className="stat-card p-3 text-center slide-up" style={{animationDelay:`${i*0.05}s`}}>
            <div style={{position:'absolute',bottom:0,left:0,right:0,height:'3px',borderRadius:'0 0 16px 16px',background:`linear-gradient(90deg,transparent,${s.color},transparent)`}} />
            <p className="text-xs mb-0.5" style={{opacity:0.7}}>{s.icon}</p>
            <p className="text-xl font-bold" style={{color:s.color}}>{s.value}</p>
            <p className="text-[10px] mt-0.5" style={{color:'#8B8FA3'}}>{s.label}</p>
            {s.note && <p className="text-[9px]" style={{color:'#565970'}}>{s.note}</p>}
          </div>
        ))}
      </div>

      {/* BIG Premium Tabs */}
      <div className="flex gap-2 px-4 md:px-6 overflow-x-auto pb-1" style={{scrollbarWidth:'none'}}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          const count = tab.id === 'Orders' ? stats.pendingOrders : tab.id === 'Menu' ? menu.length : tab.id === 'Coupons' ? coupons.length : 0;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-5 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 relative ${active ? 'text-white' : 'text-[#8B8FA3] hover:text-white'}`}
              style={active ? {background:'linear-gradient(135deg,#7C3AED,#6D28D9)',boxShadow:'0 6px 25px rgba(124,58,237,0.35)',minWidth:'80px'} : {background:'rgba(255,255,255,0.03)',minWidth:'70px'}}>
              <Icon size={20} />
              <span className="text-xs">{tab.label}</span>
              {count > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full text-[10px] font-bold flex items-center justify-center px-1" style={{background: tab.id === 'Orders' ? '#F43F5E' : '#7C3AED',color:'white'}}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-4 md:p-6">
        {/* ORDERS TAB */}
        {activeTab === 'Orders' && (
          <div className="fade-in">
            {/* Search + Filters */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-xs">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#565970]" size={14} />
                <input placeholder="Search order #..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} className="input-field pl-9 text-sm py-2" />
              </div>
              <select value={dateFilter} onChange={e=>setDateFilter(e.target.value)} className="input-field text-xs py-2 px-3 w-auto" style={{maxWidth:120}}>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {['all','pending','confirmed','completed','cancelled'].map(s => (
                <button key={s} onClick={() => setOrderFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${orderFilter===s ? 'text-white' : 'text-[#8B8FA3] hover:text-white'}`}
                  style={orderFilter===s ? {background:'linear-gradient(135deg,#7C3AED,#6D28D9)',boxShadow:'0 2px 10px rgba(124,58,237,0.25)'} : {background:'rgba(255,255,255,0.04)'}}>
                  {s}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs self-center" style={{color:'#565970'}}>Payment:</span>
              {['all','unpaid','paid'].map(p => (
                <button key={p} onClick={() => setPaymentFilter(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${paymentFilter===p ? 'text-white' : 'text-[#8B8FA3] hover:text-white'}`}
                  style={paymentFilter===p ? {background:'linear-gradient(135deg,#10B981,#059669)',boxShadow:'0 2px 10px rgba(16,185,129,0.25)'} : {background:'rgba(255,255,255,0.04)'}}>
                  {p}
                </button>
              ))}
            </div>

            {orders.filter(o => !orderSearch || o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase())).length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4 opacity-30">📋</div>
                <p className="text-[#565970]">No orders found</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {orders.filter(o => !orderSearch || o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase())).map(order => {
                  const statusColors = {pending:'#F59E0B',confirmed:'#7C3AED',completed:'#22C55E',cancelled:'#F43F5E',preparing:'#FB923C',ready:'#10B981',served:'#22C55E'};
                  const elapsedMs = Date.now() - new Date(order.createdAt).getTime();
                  const isLate = order.status === 'pending' && elapsedMs >= 1 * 60 * 1000;
                  const isSilenced = silencedOrders.has(order._id);
                  
                  return (
                    <div key={order._id} className="glow-card p-4 slide-up" style={{
                      borderLeft:`3px solid ${isLate ? '#F43F5E' : (statusColors[order.status]||'#7C3AED')}`,
                      ...(isLate && !isSilenced ? { boxShadow:'0 0 20px rgba(244,63,94,0.3)', borderColor:'rgba(244,63,94,0.6)' } : {}),
                      ...((order.status === 'served' || order.status === 'completed') && order.paymentStatus !== 'paid' ? { boxShadow:'0 0 20px rgba(245,158,11,0.15)', borderColor:'rgba(245,158,11,0.3)' } : {})
                    }}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <button onClick={() => copyOrderNum(order.orderNumber)} className="flex items-center gap-1.5 text-white font-bold hover:text-[#A78BFA] transition-colors" title="Copy order number">
                              {order.orderNumber}
                              {copiedId === order.orderNumber ? <FiCheck size={12} className="text-[#10B981]" /> : <FiCopy size={12} className="text-[#565970]" />}
                            </button>
                            <span className={`status-badge status-${order.status}`}>{order.status}</span>
                            {isLate && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-500/20 text-red-500 flex items-center gap-1 animate-pulse">⚠️ LATE</span>}
                            {order.paymentStatus === 'paid' ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{background:'rgba(16,185,129,0.12)',color:'#10B981'}}>Paid</span>
                            ) : order.status !== 'cancelled' && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{background:'rgba(244,63,94,0.12)',color:'#F43F5E'}}>Unpaid</span>
                            )}
                          </div>
                          <p className="text-sm mt-1" style={{color:'#8B8FA3'}}>
                            🪑 Table {order.tableNumber} • {order.customerName}
                            {order.customerPhone && <span> • 📞 {order.customerPhone}</span>}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs" style={{color:'#565970'}}><FiClock className="inline mr-1" size={10}/>{timeAgo(order.createdAt)}</span>
                            {order.status !== 'served' && order.status !== 'completed' && order.status !== 'cancelled' && (
                              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md" style={{background:'rgba(245,158,11,0.1)',color:'#F59E0B'}} key={tick}>⏱ {elapsedTimer(order.createdAt)}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold" style={{color:'#10B981'}}>₹{order.totalAmount}</p>
                          {order.discount > 0 && <p className="text-[10px]" style={{color:'#F43F5E'}}>-₹{order.discount} off</p>}
                        </div>
                      </div>
                      <div className="space-y-1 mb-3 pl-1" style={{borderLeft:'2px solid rgba(124,58,237,0.1)'}}>
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm pl-3">
                            <span style={{color:'#C4C7D4'}}>{item.quantity}× {item.name}</span>
                            <span style={{color:'#8B8FA3'}}>₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                      {order.specialInstructions && (
                        <p className="text-xs mb-3 px-2 py-1.5 rounded-lg" style={{background:'rgba(245,158,11,0.08)',color:'#F59E0B'}}>📝 {order.specialInstructions}</p>
                      )}
                      {/* Action Bar */}
                      {order.status !== 'cancelled' && (
                        <div className="flex gap-3 flex-wrap pt-3 mt-3 items-center justify-start" style={{borderTop:'1px solid rgba(255,255,255,0.06)'}}>
                          {/* Food Status */}
                          {order.status === 'pending' && <>
                            <button onClick={() => handleStatusUpdate(order._id, 'confirmed')} className="btn-primary text-sm py-2 px-5"><FiCheck size={14} /> Confirm Order</button>
                            <button onClick={() => handleStatusUpdate(order._id, 'cancelled')} className="btn-danger text-sm py-2 px-4"><FiX size={14} /> Reject</button>
                          </>}
                          {order.status === 'confirmed' && <button onClick={() => handleStatusUpdate(order._id, 'completed')} className="btn-primary text-sm py-2 px-5">✅ Complete</button>}
                          {order.status === 'preparing' && <button onClick={() => handleStatusUpdate(order._id, 'ready')} className="btn-primary text-sm py-2 px-5">✅ Mark Ready</button>}
                          {order.status === 'ready' && <button onClick={() => handleStatusUpdate(order._id, 'completed')} className="btn-primary text-sm py-2 px-5">🍽️ Complete</button>}
                          
                          {/* Buzzer Silence Button */}
                          {isLate && !isSilenced && (
                            <button onClick={() => setSilencedOrders(prev => new Set(prev).add(order._id))} className="btn-outline text-sm py-2 px-4 !border-red-500/50 !text-red-500 hover:!bg-red-500/10 ml-auto flex items-center gap-2">
                              <FiBellOff size={14} /> Stop Buzzer
                            </button>
                          )}
                          
                          {/* Payment Section */}
                          {order.paymentStatus === 'paid' ? (
                            <span className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-bold" style={{background:'rgba(16,185,129,0.12)',color:'#10B981'}}>✅ Paid via {order.paymentMethod||'cash'}</span>
                          ) : payingOrderId === order._id ? (
                            <div className="flex gap-2 flex-wrap items-center bg-[rgba(255,255,255,0.02)] p-1.5 rounded-xl border border-[rgba(255,255,255,0.05)]">
                              <span className="text-xs px-2" style={{color:'#8B8FA3'}}>Select method:</span>
                              {['cash','upi','card','other'].map(m => (
                                <button key={m} onClick={() => handleMarkPaid(order._id, m)} className="text-xs px-3 py-1.5 rounded-lg font-bold capitalize transition-colors hover:bg-[rgba(16,185,129,0.25)]" style={{background:'rgba(16,185,129,0.15)',color:'#10B981',border:'1px solid rgba(16,185,129,0.3)'}}>{m}</button>
                              ))}
                              <button onClick={() => setPayingOrderId(null)} className="text-xs px-2 py-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.1)] transition-colors" style={{background:'rgba(255,255,255,0.04)',color:'#8B8FA3'}}><FiX size={14}/></button>
                            </div>
                          ) : (
                            <button onClick={() => setPayingOrderId(order._id)} className="text-sm px-5 py-2 rounded-xl font-bold hover:bg-[rgba(16,185,129,0.2)] transition-colors" style={{background:'rgba(16,185,129,0.12)',color:'#10B981',border:'1px solid rgba(16,185,129,0.25)'}}>💳 Payment Received</button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MENU TAB */}
        {activeTab === 'Menu' && (
          <div className="fade-in">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <p style={{color:'#8B8FA3'}} className="text-sm">{menu.length} items</p>
                {categories.map((c,i) => (
                  <span key={c} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{background:`${CAT_COLORS[i%CAT_COLORS.length]}20`,color:CAT_COLORS[i%CAT_COLORS.length]}}>{c}</span>
                ))}
              </div>
              <button onClick={() => { setEditingItem(null); setMenuForm({ name:'', description:'', price:'', category:'', isVeg:true, image:'', preparationTime:15 }); setShowMenuForm(true); }} className="btn-primary text-sm"><FiPlus /> Add Item</button>
            </div>

            {showMenuForm && (
              <form onSubmit={handleMenuSubmit} className="glow-card p-5 mb-6 slide-up">
                <h3 className="text-lg font-bold text-white mb-4">{editingItem ? '✏️ Edit Item' : '➕ Add Menu Item'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input placeholder="Item Name *" className="input-field" required value={menuForm.name} onChange={e => setMenuForm({...menuForm, name:e.target.value})} />
                  <input placeholder="Price *" type="number" min="0" step="0.01" className="input-field" required value={menuForm.price} onChange={e => setMenuForm({...menuForm, price:e.target.value})} />
                  <div>
                    <input placeholder="Category *" className="input-field" required value={menuForm.category} onChange={e => setMenuForm({...menuForm, category:e.target.value})} list="categories" />
                    <datalist id="categories">{[...categories,'Add-ons','Extras','Utilities'].map(c => <option key={c} value={c} />)}</datalist>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {['Add-ons','Extras','Utilities','Drinks','Snacks'].map(s => (
                        <button key={s} type="button" onClick={() => setMenuForm({...menuForm, category:s})} className="text-[10px] px-2 py-0.5 rounded-full" style={{background: menuForm.category===s ? '#7C3AED' : 'rgba(124,58,237,0.1)', color: menuForm.category===s ? '#fff' : '#A78BFA'}}>{s}</button>
                      ))}
                    </div>
                  </div>
                  <input placeholder="Prep Time (mins)" type="number" className="input-field" value={menuForm.preparationTime} onChange={e => setMenuForm({...menuForm, preparationTime:parseInt(e.target.value)||15})} />
                </div>
                <textarea placeholder="Description" className="input-field mt-4" rows="2" value={menuForm.description} onChange={e => setMenuForm({...menuForm, description:e.target.value})} />
                <div className="flex items-center gap-4 mt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={menuForm.isVeg} onChange={e => setMenuForm({...menuForm, isVeg:e.target.checked})} className="w-4 h-4 accent-[#10B981]" />
                    <span className="text-sm" style={{color:'#C4C7D4'}}>Vegetarian</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="btn-outline text-sm py-2 px-3 cursor-pointer">
                      <FiImage /> {uploading ? 'Uploading...' : 'Upload Image'}
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                    {menuForm.image && <img src={menuForm.image} alt="" className="w-12 h-12 rounded-lg object-cover border" style={{borderColor:'rgba(124,58,237,0.2)'}} />}
                  </div>
                </div>
                <div className="flex gap-3 mt-4 pt-3" style={{borderTop:'1px solid rgba(124,58,237,0.1)'}}>
                  <button type="submit" className="btn-primary">{editingItem ? 'Update' : 'Add Item'}</button>
                  <button type="button" onClick={() => { setShowMenuForm(false); setEditingItem(null); }} className="btn-outline">Cancel</button>
                </div>
              </form>
            )}

            {categories.map((cat,ci) => (
              <div key={cat} className="mb-6">
                <h3 className="text-md font-bold text-white mb-3 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{background:CAT_COLORS[ci%CAT_COLORS.length]}} />
                  {cat}
                  <span className="text-xs font-normal ml-1" style={{color:'#565970'}}>({menu.filter(i=>i.category===cat).length})</span>
                </h3>
                <div className="grid gap-3">
                  {menu.filter(i => i.category === cat).map(item => (
                    <div key={item._id} className={`glow-card p-4 flex gap-4 items-center transition-all ${!item.isAvailable ? 'opacity-40 grayscale' : ''}`}>
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" style={{border:'1px solid rgba(124,58,237,0.1)'}} />
                      ) : (
                        <div className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center text-xl" style={{background:'rgba(124,58,237,0.08)'}}>🍽️</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium truncate">{item.name}</span>
                          <span className={item.isVeg ? 'badge-veg' : 'badge-nonveg'}>{item.isVeg ? 'VEG' : 'NON-VEG'}</span>
                        </div>
                        <p className="text-sm truncate" style={{color:'#8B8FA3'}}>{item.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-bold" style={{color:'#7C3AED'}}>₹{item.price}</span>
                          {item.preparationTime && <span className="text-xs flex items-center gap-1" style={{color:'#565970'}}><FiClock size={10}/>{item.preparationTime}m</span>}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => handleToggleItem(item._id)} className="btn-ghost text-xs py-1.5 px-2 rounded-lg">{item.isAvailable ? '✅' : '❌'}</button>
                        <button onClick={() => handleEdit(item)} className="btn-ghost text-xs py-1.5 px-2 rounded-lg"><FiEdit2 size={14} /></button>
                        <button onClick={() => handleDeleteItem(item._id)} className="btn-danger text-xs py-1.5 px-2"><FiTrash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {menu.length === 0 && <div className="text-center py-16"><div className="text-5xl mb-4 opacity-30">🍽️</div><p style={{color:'#565970'}}>No menu items. Add your first item!</p></div>}
          </div>
        )}

        {/* COUPONS TAB */}
        {activeTab === 'Coupons' && (
          <div className="fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><FiTag size={18} /> Coupons & Offers</h3>
              <button onClick={() => setShowCouponForm(!showCouponForm)} className="btn-primary text-sm py-2 px-3"><FiPlus size={14} /> {showCouponForm ? 'Cancel' : 'New Coupon'}</button>
            </div>

            {showCouponForm && (
              <form onSubmit={handleCreateCoupon} className="glow-card p-5 mb-6 slide-up space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><label className="text-xs mb-1 block" style={{color:'#8B8FA3'}}>Coupon Code</label><input className="input-field uppercase" placeholder="e.g. SAVE20" value={couponForm.code} onChange={e=>setCouponForm({...couponForm,code:e.target.value.toUpperCase()})} required /></div>
                  <div><label className="text-xs mb-1 block" style={{color:'#8B8FA3'}}>Discount Type</label>
                    <select className="input-field" value={couponForm.type} onChange={e=>setCouponForm({...couponForm,type:e.target.value})}>
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat (₹)</option>
                    </select>
                  </div>
                  <div><label className="text-xs mb-1 block" style={{color:'#8B8FA3'}}>Value {couponForm.type==='percentage'?'(%)':'(₹)'}</label><input type="number" className="input-field" placeholder={couponForm.type==='percentage'?'e.g. 20':'e.g. 50'} value={couponForm.value} onChange={e=>setCouponForm({...couponForm,value:e.target.value})} required min="1" /></div>
                  <div><label className="text-xs mb-1 block" style={{color:'#8B8FA3'}}>Min Order (₹)</label><input type="number" className="input-field" placeholder="0 = no min" value={couponForm.minOrder} onChange={e=>setCouponForm({...couponForm,minOrder:e.target.value})} /></div>
                  {couponForm.type==='percentage' && <div><label className="text-xs mb-1 block" style={{color:'#8B8FA3'}}>Max Discount (₹)</label><input type="number" className="input-field" placeholder="0 = no cap" value={couponForm.maxDiscount} onChange={e=>setCouponForm({...couponForm,maxDiscount:e.target.value})} /></div>}
                  <div><label className="text-xs mb-1 block" style={{color:'#8B8FA3'}}>Usage Limit</label><input type="number" className="input-field" placeholder="0 = unlimited" value={couponForm.usageLimit} onChange={e=>setCouponForm({...couponForm,usageLimit:e.target.value})} /></div>
                  <div><label className="text-xs mb-1 block" style={{color:'#8B8FA3'}}>Expires On</label><input type="date" className="input-field" value={couponForm.expiresAt} onChange={e=>setCouponForm({...couponForm,expiresAt:e.target.value})} /></div>
                </div>
                <button type="submit" className="btn-primary">🎫 Create Coupon</button>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {coupons.map(c => (
                <div key={c._id} className="glow-card p-4 slide-up" style={{opacity: c.isActive ? 1 : 0.5}}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold px-3 py-1 rounded-lg" style={{background:'rgba(124,58,237,0.12)',color:'#A78BFA',letterSpacing:'2px'}}>{c.code}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${c.isActive ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>{c.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl font-bold" style={{color:'#7C3AED'}}>{c.type==='percentage' ? `${c.value}%` : `₹${c.value}`}</span>
                    <span className="text-xs" style={{color:'#565970'}}>off {c.minOrder > 0 ? `on orders above ₹${c.minOrder}` : 'any order'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] mb-3" style={{color:'#565970'}}>
                    {c.maxDiscount > 0 && <span>Max: ₹{c.maxDiscount}</span>}
                    <span>Used: {c.usedCount}{c.usageLimit > 0 ? `/${c.usageLimit}` : ''}</span>
                    {c.expiresAt && <span>Exp: {new Date(c.expiresAt).toLocaleDateString()}</span>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleToggleCoupon(c._id)} className="btn-outline text-xs py-1 px-2">{c.isActive ? 'Deactivate' : 'Activate'}</button>
                    <button onClick={() => handleDeleteCoupon(c._id)} className="btn-danger text-xs py-1 px-2"><FiTrash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
            {coupons.length === 0 && !showCouponForm && (
              <div className="text-center py-16"><div className="text-5xl mb-4 opacity-30">🎫</div><p style={{color:'#565970'}}>No coupons yet. Create your first offer!</p></div>
            )}
          </div>
        )}

        {/* QR & TABLES TAB */}
        {activeTab === 'QR' && (
          <div className="fade-in">
            {!cafeProfile ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4 opacity-30">📱</div>
                <p style={{color:'#565970'}}>Could not load cafe profile. Try refreshing.</p>
                <button onClick={handleRefresh} className="btn-primary text-sm mt-4">Refresh</button>
              </div>
            ) : (
              <>
                <div className="glass-card p-4 mb-6 flex items-center gap-3" style={{borderLeft:'3px solid #7C3AED'}}>
                  <span className="text-2xl">📱</span>
                  <div>
                    <p className="text-white text-sm font-medium">QR Code Table Cards</p>
                    <p style={{color:'#8B8FA3'}} className="text-xs">Download QR codes and place them on each table. Customers scan to view your menu & order instantly.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: Math.max(1, cafeProfile.tableCount || 10) }, (_, i) => i + 1).map(tableNo => (
                    <div key={tableNo} className="glow-card p-5 text-center slide-up" style={{animationDelay:`${tableNo*0.03}s`}}>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3 text-xs font-bold" style={{background:'rgba(124,58,237,0.12)',color:'#A78BFA'}}>🪑 Table {tableNo}</div>
                      <div className="bg-white p-3 rounded-xl inline-block mb-3" style={{boxShadow:'0 4px 20px rgba(0,0,0,0.3)'}}>
                        <QRCodeSVG id={`qr-${tableNo}`} value={`${getBaseUrl()}/cafe/${cafeProfile.cafeId}/table/${tableNo}`} size={140} level="H" />
                      </div>
                      <p className="text-[10px] mb-3 break-all px-2" style={{color:'#565970'}}>{getBaseUrl()}/cafe/{cafeProfile.cafeId}/table/{tableNo}</p>
                      <button onClick={() => downloadQR(tableNo)} className="btn-primary text-xs py-2 px-4 w-full"><FiDownload size={13} /> Download PNG</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'Settings' && (
          <div className="fade-in max-w-2xl">
            {!cafe ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4 opacity-30">⚙️</div>
                <p style={{color:'#565970'}}>Could not load cafe settings. Try refreshing.</p>
                <button onClick={handleRefresh} className="btn-primary text-sm mt-4">Refresh</button>
              </div>
            ) : (
            <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">⚙️ Cafe Settings</h3>
              {!isEditingSettings && (
                <button onClick={handleEditSettings} className="btn-outline text-sm py-1.5 px-3"><FiEdit2 size={14} /> Edit</button>
              )}
            </div>
            
            {isEditingSettings ? (
              <form onSubmit={handleSettingsSubmit} className="glow-card p-5 space-y-4 slide-up">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="text-sm mb-1 block" style={{color:'#8B8FA3'}}>Cafe Name</label><input className="input-field" value={settingsForm.name} onChange={e=>setSettingsForm({...settingsForm,name:e.target.value})} required /></div>
                  <div><label className="text-sm mb-1 block" style={{color:'#8B8FA3'}}>Owner Name</label><input className="input-field" value={settingsForm.ownerName} onChange={e=>setSettingsForm({...settingsForm,ownerName:e.target.value})} required /></div>
                  <div><label className="text-sm mb-1 block" style={{color:'#8B8FA3'}}>Phone</label><input className="input-field" value={settingsForm.phone} onChange={e=>setSettingsForm({...settingsForm,phone:e.target.value})} required pattern="[0-9]{10}" title="Enter 10-digit phone number" /></div>
                  <div><label className="text-sm mb-1 block" style={{color:'#8B8FA3'}}>Number of Tables</label><input type="number" className="input-field" value={settingsForm.tableCount} onChange={e=>setSettingsForm({...settingsForm,tableCount:parseInt(e.target.value)||10})} required /></div>
                  <div><label className="text-sm mb-1 block" style={{color:'#8B8FA3'}}>Open Time</label><input type="time" className="input-field" value={settingsForm.openTime} onChange={e=>setSettingsForm({...settingsForm,openTime:e.target.value})} /></div>
                  <div><label className="text-sm mb-1 block" style={{color:'#8B8FA3'}}>Close Time</label><input type="time" className="input-field" value={settingsForm.closeTime} onChange={e=>setSettingsForm({...settingsForm,closeTime:e.target.value})} /></div>
                  <div><label className="text-sm mb-1 block" style={{color:'#8B8FA3'}}>Address</label><input className="input-field" value={settingsForm.address} onChange={e=>setSettingsForm({...settingsForm,address:e.target.value})} /></div>
                  <div><label className="text-sm mb-1 block" style={{color:'#8B8FA3'}}>City</label><input className="input-field" value={settingsForm.city} onChange={e=>setSettingsForm({...settingsForm,city:e.target.value})} /></div>
                </div>
                <div className="pt-3" style={{borderTop:'1px solid rgba(124,58,237,0.1)'}}>
                  <label className="text-sm mb-3 block font-medium" style={{color:'#8B8FA3'}}>🎨 Customer Menu Theme</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(themes).map(([key, t]) => (
                      <label key={key} className={`cursor-pointer rounded-xl p-3 border-2 transition-all hover:scale-[1.02] ${settingsForm.theme === key ? 'scale-[1.02]' : ''}`}
                        style={{background: t.cardBg, borderColor: settingsForm.theme === key ? t.primary : 'transparent', boxShadow: settingsForm.theme === key ? `0 0 20px ${t.primary}30` : 'none'}}>
                        <input type="radio" name="theme" value={key} checked={settingsForm.theme === key} onChange={e => setSettingsForm({...settingsForm, theme: e.target.value})} className="hidden" />
                        <div className="w-full h-6 rounded-lg mb-2" style={{background: t.background}} />
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full" style={{background: t.primary}} />
                          <p className="text-[10px] text-white font-medium truncate">{t.name}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  {/* Live Theme Preview */}
                  {settingsForm.theme && themes[settingsForm.theme] && (
                    <div className="mt-4 rounded-xl p-4 border" style={{background:themes[settingsForm.theme].glassBg, borderColor:`${themes[settingsForm.theme].primary}30`}}>
                      <p className="text-[10px] uppercase tracking-wider mb-2" style={{color:themes[settingsForm.theme].textSecondary}}>Preview</p>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg" style={{background:`linear-gradient(135deg,${themes[settingsForm.theme].primary},${themes[settingsForm.theme].primaryDark})`}} />
                        <div>
                          <p className="text-sm font-bold" style={{color:themes[settingsForm.theme].textPrimary}}>{settingsForm.name || 'Cafe Name'}</p>
                          <p className="text-xs" style={{color:themes[settingsForm.theme].textSecondary}}>This is how your menu will look</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 pt-3" style={{borderTop:'1px solid rgba(124,58,237,0.1)'}}>
                  <button type="submit" className="btn-primary">💾 Save Changes</button>
                  <button type="button" onClick={()=>setIsEditingSettings(false)} className="btn-outline">Cancel</button>
                </div>
              </form>
            ) : (
              <div className="glow-card p-5 space-y-3">
                {[
                  { label:'Cafe Name', value:cafe.name, icon:'🏪' },
                  { label:'Cafe ID', value:cafe.cafeId, isCode:true, icon:'🔑' },
                  { label:'Owner', value:cafe.ownerName, icon:'👤' },
                  { label:'Phone', value:cafe.phone, icon:'📞' },
                  { label:'Tables', value:cafe.tableCount, icon:'🪑' },
                  { label:'Hours', value:`${cafe.openTime} — ${cafe.closeTime}`, icon:'🕐' },
                  { label:'Address', value:`${cafe.address}${cafe.city ? `, ${cafe.city}` : ''}`, icon:'📍' }
                ].map((f,i) => (
                  <div key={i} className="flex items-center gap-3 py-2" style={{borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                    <span className="text-sm">{f.icon}</span>
                    <div className="flex-1">
                      <label className="text-xs block" style={{color:'#565970'}}>{f.label}</label>
                      {f.isCode ? (
                        <code className="font-mono text-sm px-2 py-0.5 rounded" style={{background:'rgba(124,58,237,0.1)',color:'#A78BFA'}}>{f.value}</code>
                      ) : (
                        <p className="text-white text-sm">{f.value || '—'}</p>
                      )}
                    </div>
                  </div>
                ))}
                <div className="pt-2">
                  <label className="text-xs block mb-2" style={{color:'#565970'}}>Active Theme</label>
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl" style={{background: getTheme(cafe.theme).cardBg, border:`1px solid ${getTheme(cafe.theme).primary}30`}}>
                    <span className="w-3.5 h-3.5 rounded-full" style={{background: getTheme(cafe.theme).primary}} />
                    <span className="text-white text-xs font-medium">{getTheme(cafe.theme).name}</span>
                  </div>
                </div>
              </div>
            )}
            </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CafeDashboard;
