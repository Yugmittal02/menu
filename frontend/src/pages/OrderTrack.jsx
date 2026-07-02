import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { trackOrder } from '../services/api';
import { FiCheck, FiClock, FiArrowLeft, FiShoppingBag, FiHome } from 'react-icons/fi';

const STATUSES = ['pending', 'confirmed', 'completed'];
const STATUS_INFO = {
  pending: { emoji: '⏳', label: 'Order Placed', desc: 'Waiting for cafe to confirm', color: '#F59E0B' },
  confirmed: { emoji: '✅', label: 'Confirmed', desc: 'Cafe accepted your order', color: '#3B82F6' },
  completed: { emoji: '🎉', label: 'Completed', desc: 'Your order is complete!', color: '#10B981' },
  cancelled: { emoji: '❌', label: 'Cancelled', desc: 'Order was cancelled', color: '#F43F5E' }
};

const OrderTrack = () => {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrder = async () => {
    try {
      const { data } = await trackOrder(orderNumber);
      setOrder(data);
    } catch (e) {
      setError('Order not found');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOrder();
    const interval = setInterval(loadOrder, 3000);
    return () => clearInterval(interval);
  }, [orderNumber]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'#0B0B14'}}>
      <div className="text-center"><div className="text-4xl mb-3 animate-bounce">🍽️</div><p className="text-gray-400">Loading order...</p></div>
    </div>
  );
  if (error) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'#0B0B14'}}>
      <div className="text-center">
        <p className="text-5xl mb-3">🔍</p>
        <p className="text-red-400 mb-4 text-lg">{error}</p>
        <Link to="/" className="btn-primary">Go Home</Link>
      </div>
    </div>
  );

  const info = STATUS_INFO[order.status] || STATUS_INFO.pending;
  // If old order has deprecated status, map it visually for progress
  const normalizedStatus = ['preparing', 'ready'].includes(order.status) ? 'confirmed' : order.status === 'served' ? 'completed' : order.status;
  const currentIndex = normalizedStatus === 'cancelled' ? -1 : STATUSES.indexOf(normalizedStatus);
  const progressPercent = normalizedStatus === 'cancelled' ? 0 : ((currentIndex + 1) / STATUSES.length) * 100;

  // Build back-to-menu URL from order data
  const menuUrl = order.cafeId ? `/cafe/${order.cafeId}/table/${order.tableNumber}` : null;

  return (
    <div className="min-h-screen p-4" style={{background:'linear-gradient(145deg,#0B0B14,#151525,#1A1A30)'}}>
      <div className="max-w-lg mx-auto">
        {/* Status Hero */}
        <div className="text-center py-8 slide-up">
          <div className="text-6xl mb-4" style={{filter:`drop-shadow(0 0 20px ${info.color}40)`}}>{info.emoji}</div>
          <h1 className="text-2xl font-bold text-white mb-1">{info.label}</h1>
          <p className="text-gray-400 mb-4">{info.desc}</p>
          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full overflow-hidden mx-auto max-w-xs" style={{background:'rgba(255,255,255,0.06)'}}>
            <div className="h-full rounded-full transition-all duration-1000" style={{width:`${progressPercent}%`, background:`linear-gradient(90deg,#7C3AED,${info.color})`}} />
          </div>
          <p className="text-[10px] mt-2" style={{color:'#565970'}}>{normalizedStatus === 'completed' ? 'Completed' : `Step ${currentIndex+1} of ${STATUSES.length}`}</p>
        </div>

        {/* Order Info */}
        <div className="glass-card p-5 mb-4">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-white font-bold text-lg">{order.orderNumber}</p>
              <p className="text-sm text-gray-400">Table {order.tableNumber} • {order.customerName}</p>
            </div>
            <span className={`status-badge status-${order.status}`}>{order.status}</span>
          </div>
          <p className="text-xs text-gray-500 flex items-center gap-1"><FiClock /> {new Date(order.createdAt).toLocaleString()}</p>
        </div>

        {/* Progress Steps */}
        {normalizedStatus !== 'cancelled' && (
          <div className="glass-card p-5 mb-4">
            <div className="space-y-4">
              {STATUSES.map((s, i) => {
                const done = i <= currentIndex;
                const active = i === currentIndex;
                const si = STATUS_INFO[s];
                return (
                  <div key={s} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${done ? 'text-white' : 'text-gray-500'}`}
                      style={done ? {background: si.color, boxShadow: active ? `0 0 15px ${si.color}50` : 'none'} : {background:'rgba(255,255,255,0.05)'}}>
                      {done ? <FiCheck size={16} /> : <span className="text-xs">{i+1}</span>}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${done ? 'text-white' : 'text-gray-500'}`}>{si.label}</p>
                      {active && <p className="text-xs text-gray-400">{si.desc}</p>}
                    </div>
                    {active && <span className="w-2 h-2 rounded-full animate-pulse" style={{background: si.color}} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="glass-card p-5 mb-4">
          <h3 className="text-white font-bold mb-3">Order Summary</h3>
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between py-2 border-b" style={{borderColor:'rgba(255,255,255,0.05)'}}>
              <span className="text-gray-300 text-sm">{item.quantity}x {item.name}</span>
              <span className="text-gray-400 text-sm">₹{item.price * item.quantity}</span>
            </div>
          ))}
          {order.discount > 0 && (
            <div className="flex justify-between py-2 border-b" style={{borderColor:'rgba(255,255,255,0.05)'}}>
              <span className="text-sm" style={{color:'#10B981'}}>Discount ({order.couponCode})</span>
              <span className="text-sm" style={{color:'#10B981'}}>-₹{order.discount}</span>
            </div>
          )}
          <div className="flex justify-between mt-3 pt-2">
            <span className="text-white font-bold">Total</span>
            <span className="text-white font-bold text-lg">₹{order.totalAmount}</span>
          </div>
          {order.specialInstructions && (
            <p className="mt-3 text-xs text-yellow-400 p-2 rounded-lg" style={{background:'rgba(245,158,11,0.08)'}}>📝 {order.specialInstructions}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-8">
          {menuUrl && (
            <Link to={menuUrl} className="flex-1 py-3 px-4 rounded-xl text-center text-sm font-bold text-white flex items-center justify-center gap-2" style={{background:'linear-gradient(135deg,#7C3AED,#6D28D9)', boxShadow:'0 4px 15px rgba(124,58,237,0.3)'}}>
              <FiShoppingBag size={16} /> Order More
            </Link>
          )}
          <Link to={menuUrl || "/"} className="flex-1 py-3 px-4 rounded-xl text-center text-sm font-medium flex items-center justify-center gap-2" style={{background:'rgba(255,255,255,0.06)', color:'#8B8FA3', border:'1px solid rgba(255,255,255,0.08)'}}>
            <FiHome size={16} /> Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderTrack;
