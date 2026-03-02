import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getFeeSettings, validateCoupon } from '../services/api';
import {
  FaArrowLeft, FaTruck, FaUtensils, FaMinus, FaPlus, FaTrash, FaMapMarkerAlt,
  FaEdit, FaShoppingBag, FaClock, FaShieldAlt, FaPercent, FaGift, FaTag, FaTimes, FaCheckCircle
} from 'react-icons/fa';

const Cart = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, total, clearCart } = useCart();
  const { customer } = useAuth();
  const [orderType, setOrderType] = useState('Delivery');
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [feeSettings, setFeeSettings] = useState({ deliveryFeeBase: 30, freeDeliveryThreshold: 299 });
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [appliedOffer, setAppliedOffer] = useState(null);

  useEffect(() => {
    getFeeSettings().then(res => {
      if (res.data) setFeeSettings(res.data);
    }).catch(() => { });
  }, []);

  const addresses = useMemo(() => customer?.addresses || [], [customer]);
  const selectedAddress = addresses[selectedAddressIndex];

  const deliveryFee = orderType === 'Delivery'
    ? (total >= (feeSettings.freeDeliveryThreshold || 299) ? 0 : (feeSettings.deliveryFeeBase || 30))
    : 0;
  const discountAmount = appliedOffer ? (appliedOffer.calculatedDiscount || 0) : 0;
  const grandTotal = total + deliveryFee - discountAmount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }
    setCouponLoading(true);
    setCouponError('');
    try {
      const response = await validateCoupon(couponCode.trim().toUpperCase(), total);
      const offer = response?.data?.offer;
      if (offer) {
        let discount = 0;
        if (offer.discountType === 'percentage') {
          discount = Math.round(total * (offer.discountValue / 100));
        } else {
          discount = offer.discountValue;
        }
        setAppliedOffer({ ...offer, calculatedDiscount: discount });
        setCouponError('');
      } else {
        setCouponError('Invalid coupon code');
      }
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid or expired coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedOffer(null);
    setCouponCode('');
    setCouponError('');
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;

    // Check if user is logged in
    if (!customer) {
      // Redirect to login with return path to cart
      navigate('/login', { state: { from: '/cart' } });
      return;
    }

    // Navigate to payment page - address can be collected there if needed
    navigate('/payment', {
      state: {
        orderType,
        deliveryAddress: orderType === 'Delivery' ? selectedAddress : null,
        subtotal: Number(total) || 0,
        deliveryFee: Number(deliveryFee) || 0,
        grandTotal: Number(grandTotal) || 0,
        appliedOffer: appliedOffer ? {
          offerId: appliedOffer._id,
          code: appliedOffer.code,
          discountAmount: discountAmount
        } : null
      }
    });
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in" style={{ background: '#FFFFFF' }}>
        <div className="w-32 h-32 rounded-full flex items-center justify-center mb-6"
          style={{ background: 'linear-gradient(135deg, #FEF3E2 0%, #FDE8CC 100%)', border: '3px solid #E8E3DB' }}>
          <FaShoppingBag size={48} color="#C97B4B" />
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#1C1C1C' }}>Your cart is empty</h2>
        <p className="mb-8 text-center" style={{ color: '#7E7E7E' }}>Add some delicious items to get started!</p>
        <button
          onClick={() => navigate('/menu')}
          className="px-8 py-4 rounded-full text-white font-bold active:scale-95 transition-transform"
          style={{ background: 'linear-gradient(135deg, #C97B4B 0%, #E8956A 100%)', boxShadow: '0 8px 24px rgba(252, 128, 25, 0.3)' }}
        >
          🍰 Browse Menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-40" style={{ background: '#FFFFFF' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 px-4 py-4 flex justify-between items-center"
        style={{ background: '#FFFFFF', borderBottom: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(252, 128, 25, 0.1)' }}>
          <FaArrowLeft size={18} color="#C97B4B" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🛒</span>
          <h1 className="text-xl font-bold" style={{ color: '#C97B4B' }}>Your Cart</h1>
        </div>
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(252, 128, 25, 0.1)' }}>
          <FaShoppingBag size={12} color="#C97B4B" />
          <span className="text-sm font-bold" style={{ color: '#C97B4B' }}>{cart.length}</span>
        </div>
      </header>

      {/* Order Type Toggle */}
      <div className="mx-4 mt-4">
        <div className="p-1.5 rounded-full flex gap-1"
          style={{ background: 'white', border: '1.5px solid #E8E3DB', boxShadow: '0 4px 16px rgba(28, 28, 28, 0.06)' }}>
          <button
            onClick={() => setOrderType('Delivery')}
            className={`flex-1 py-3 rounded-full font-semibold flex flex-col items-center gap-1 transition-all ${orderType === 'Delivery' ? 'text-white' : ''}`}
            style={orderType === 'Delivery' ? { background: 'linear-gradient(135deg, #C97B4B 0%, #E8956A 100%)', boxShadow: '0 4px 12px rgba(252, 128, 25, 0.3)' } : { color: '#7E7E7E' }}
          >
            <FaTruck size={18} />
            <span className="text-xs">Delivery</span>
            {orderType === 'Delivery' && deliveryFee === 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500">FREE</span>}
          </button>
          <button
            onClick={() => setOrderType('Takeaway')}
            className={`flex-1 py-3 rounded-full font-semibold flex flex-col items-center gap-1 transition-all ${orderType === 'Takeaway' ? 'text-white' : ''}`}
            style={orderType === 'Takeaway' ? { background: 'linear-gradient(135deg, #C97B4B 0%, #E8956A 100%)', boxShadow: '0 4px 12px rgba(252, 128, 25, 0.3)' } : { color: '#7E7E7E' }}
          >
            <FaShoppingBag size={18} />
            <span className="text-xs">Takeaway</span>
          </button>
          <button
            onClick={() => setOrderType('Dine-in')}
            className={`flex-1 py-3 rounded-full font-semibold flex flex-col items-center gap-1 transition-all ${orderType === 'Dine-in' ? 'text-white' : ''}`}
            style={orderType === 'Dine-in' ? { background: 'linear-gradient(135deg, #C97B4B 0%, #E8956A 100%)', boxShadow: '0 4px 12px rgba(252, 128, 25, 0.3)' } : { color: '#7E7E7E' }}
          >
            <FaUtensils size={18} />
            <span className="text-xs">Dine-in</span>
          </button>
        </div>
      </div>




      {/* Delivery Address */}
      {orderType === 'Delivery' && (
        <div className="mx-4 mt-4 p-4 rounded-2xl"
          style={{ background: 'white', border: '2px solid #E8E3DB', boxShadow: '0 4px 16px rgba(28, 28, 28, 0.06)' }}>
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(252, 128, 25, 0.1)' }}>
                <FaMapMarkerAlt size={14} color="#C97B4B" />
              </div>
              <span className="font-bold" style={{ color: '#1C1C1C' }}>Deliver To</span>
            </div>
            <button
              onClick={() => navigate('/address/add')}
              className="flex items-center gap-1 text-sm font-semibold" style={{ color: '#C97B4B' }}
            >
              <FaEdit size={12} />
              {addresses.length > 0 ? 'Change' : 'Add'}
            </button>
          </div>
          {selectedAddress ? (
            <div className="p-3 rounded-xl" style={{ background: '#FAF7F2', border: '1px solid #E8E3DB' }}>
              <p className="font-semibold text-sm" style={{ color: '#1C1C1C' }}>{selectedAddress.label || 'Home'}</p>
              <p className="text-sm mt-1" style={{ color: '#7E7E7E' }}>{selectedAddress.fullAddress}</p>
            </div>
          ) : (
            <p className="text-sm" style={{ color: '#7E7E7E' }}>Please add a delivery address</p>
          )}
        </div>
      )}

      {/* Cart Items */}
      <div className="mx-4 mt-4 p-4 rounded-2xl"
        style={{ background: 'white', border: '2px solid #E8E3DB', boxShadow: '0 4px 16px rgba(28, 28, 28, 0.06)' }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🧺</span>
          <span className="font-bold" style={{ color: '#1C1C1C' }}>Your Items ({cart.length})</span>
        </div>

        {cart.map((item, index) => {
          const itemPrice = Number(item.price) || 0;
          const itemQty = Number(item.quantity) || 1;
          return (
            <div key={item.cartId || item._id || index}
              className={`flex gap-4 py-4 animate-fade-in ${index !== cart.length - 1 ? 'border-b border-[#E8E3DB]' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0" style={{ border: '2px solid #E8E3DB' }}>
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl" style={{ background: '#FAF7F2' }}>🍰</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold truncate" style={{ color: '#1C1C1C' }}>{item.name}</h4>
                {item.size && (
                  <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1" style={{ background: '#FEF3E2', color: '#C97B4B', border: '1px solid #E8E3DB' }}>
                    {item.size}
                  </span>
                )}
                {item.selectedAddons && item.selectedAddons.length > 0 && (
                  <p className="text-xs mt-0.5" style={{ color: '#A0998F' }}>+ {item.selectedAddons.join(', ')}</p>
                )}
                <p className="text-sm mt-0.5" style={{ color: '#7E7E7E' }}>₹{itemPrice} each</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold" style={{ color: '#C97B4B' }}>₹{itemPrice * itemQty}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => itemQty > 1 ? updateQuantity(item.cartId, -1) : removeFromCart(item.cartId)}
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: '#FAF7F2', border: '2px solid #E8E3DB' }}
                    >
                      {itemQty === 1 ? <FaTrash size={12} color="#E57373" /> : <FaMinus size={12} color="#C97B4B" />}
                    </button>
                    <span className="w-8 text-center font-bold" style={{ color: '#1C1C1C' }}>{itemQty}</span>
                    <button
                      onClick={() => updateQuantity(item.cartId, 1)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                      style={{ background: 'linear-gradient(135deg, #C97B4B 0%, #E8956A 100%)' }}
                    >
                      <FaPlus size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Coupon Section */}
      <div className="mx-4 mt-4 p-4 rounded-2xl"
        style={{ background: appliedOffer ? '#F0FDF4' : 'linear-gradient(135deg, #FEF3E2 0%, #FDE8CC 100%)', border: appliedOffer ? '2px solid #22C55E' : '2px dashed #C97B4B' }}>
        {appliedOffer ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaCheckCircle size={18} color="#22C55E" />
              <div>
                <p className="text-sm font-bold" style={{ color: '#166534' }}>{appliedOffer.code} applied!</p>
                <p className="text-xs" style={{ color: '#15803D' }}>You save ₹{appliedOffer.calculatedDiscount}</p>
              </div>
            </div>
            <button onClick={handleRemoveCoupon} className="p-2 rounded-full" style={{ background: '#FEE2E2' }}>
              <FaTimes size={12} color="#DC2626" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <FaTag size={18} color="#C97B4B" />
              <input
                type="text"
                placeholder="Have a coupon code?"
                value={couponCode}
                onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                className="flex-1 bg-transparent outline-none text-sm font-medium uppercase"
                style={{ color: '#C97B4B' }}
              />
              <button
                onClick={handleApplyCoupon}
                disabled={couponLoading || !couponCode.trim()}
                className="px-5 py-2 rounded-full text-white text-sm font-bold active:scale-95 transition-transform disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #C97B4B 0%, #E8956A 100%)' }}>
                {couponLoading ? '...' : 'Apply'}
              </button>
            </div>
            {couponError && (
              <p className="text-xs mt-2 font-medium" style={{ color: '#DC2626' }}>⚠️ {couponError}</p>
            )}
          </>
        )}
      </div>

      {/* Bill Summary */}
      <div className="mx-4 mt-4 p-4 rounded-2xl"
        style={{ background: 'white', border: '2px solid #E8E3DB', boxShadow: '0 4px 16px rgba(28, 28, 28, 0.06)' }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">📋</span>
          <span className="font-bold" style={{ color: '#1C1C1C' }}>Bill Summary</span>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span style={{ color: '#7E7E7E' }}>Item Total</span>
            <span className="font-semibold" style={{ color: '#1C1C1C' }}>₹{(Number(total) || 0).toFixed(2)}</span>
          </div>
          {orderType === 'Delivery' && (
            <div className="flex justify-between text-sm">
              <span style={{ color: '#7E7E7E' }}>Delivery Fee</span>
              {deliveryFee === 0 ? (
                <span className="font-semibold text-green-600">FREE</span>
              ) : (
                <span className="font-semibold" style={{ color: '#1C1C1C' }}>₹{deliveryFee}</span>
              )}
            </div>
          )}
          {appliedOffer && discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span style={{ color: '#22C55E' }}>Coupon Discount ({appliedOffer.code})</span>
              <span className="font-semibold text-green-600">-₹{discountAmount}</span>
            </div>
          )}
          <div className="pt-3 flex justify-between" style={{ borderTop: '2px dashed #E8E3DB' }}>
            <span className="font-bold" style={{ color: '#1C1C1C' }}>Grand Total</span>
            <span className="text-xl font-bold" style={{ color: '#C97B4B' }}>₹{(Number(grandTotal) || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="mx-4 mt-4 flex justify-center gap-8">
        <div className="flex items-center gap-2">
          <FaShieldAlt size={14} color="#22C55E" />
          <span className="text-xs" style={{ color: '#7E7E7E' }}>Safe Payment</span>
        </div>
        <div className="flex items-center gap-2">
          <FaClock size={14} color="#C97B4B" />
          <span className="text-xs" style={{ color: '#7E7E7E' }}>Quick Delivery</span>
        </div>
      </div>

      {/* Checkout Button - Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 z-20"
        style={{ background: 'linear-gradient(180deg, transparent 0%, #FFFFFF 20%, #FFFFFF 100%)' }}>
        <button
          onClick={handleCheckout}
          className="w-full py-4 rounded-full text-white font-bold text-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #C97B4B 0%, #E8956A 100%)',
            boxShadow: '0 8px 32px rgba(252, 128, 25, 0.4)'
          }}
        >
          <span>Proceed to Pay</span>
          <span className="px-3 py-1 rounded-full text-sm" style={{ background: 'rgba(255,255,255,0.2)' }}>
            ₹{(Number(grandTotal) || 0).toFixed(0)}
          </span>
        </button>
      </div>
    </div>
  );
};

export default Cart;
