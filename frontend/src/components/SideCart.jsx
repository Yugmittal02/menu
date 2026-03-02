import React, { useState, useEffect, memo, useCallback } from "react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import {
  FaTimes,
  FaTrash,
  FaMinus,
  FaPlus,
  FaShoppingBag,
  FaArrowRight,
  FaGift,
} from "react-icons/fa";

const SideCart = memo(({ isOpen, onClose }) => {
  const { cart, total, updateQuantity, removeFromCart, getItemCount } = useCart();
  const navigate = useNavigate();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsAnimating(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  const handleCheckout = useCallback(() => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
      navigate("/cart");
    }, 300);
  }, [onClose, navigate]);

  const handleRemoveItem = useCallback((cartId) => {
    removeFromCart(cartId);
  }, [removeFromCart]);

  const handleUpdateQty = useCallback((cartId, delta) => {
    updateQuantity(cartId, delta);
  }, [updateQuantity]);

  if (!isOpen && !isAnimating) return null;

  const freeDeliveryThreshold = 500;
  const remainingForFreeDelivery = Math.max(0, freeDeliveryThreshold - total);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[100] transition-all duration-300 ${isAnimating && isOpen ? "opacity-100" : "opacity-0"
          }`}
        style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
        onClick={handleClose}
      />

      {/* Side Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 md:w-[420px] z-[101] shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${isAnimating && isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        style={{ background: '#FAF7F2', willChange: 'transform' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 safe-area-top"
          style={{ background: '#FFFFFF', borderBottom: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(252, 128, 25, 0.1)' }}>
              <FaShoppingBag size={18} color="#C97B4B" />
            </div>
            <div>
              <h2 className="font-bold text-lg" style={{ color: '#C97B4B' }}>Your Cart</h2>
              <p className="text-xs" style={{ color: '#7E7E7E' }}>
                {getItemCount()} item{getItemCount() !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
            style={{ background: 'rgba(252, 128, 25, 0.1)' }}
          >
            <FaTimes size={18} color="#C97B4B" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 scroll-container hide-scrollbar">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4"
                style={{ background: 'linear-gradient(135deg, #FEF3E2 0%, #FDE8CC 100%)', border: '2px solid #E8E3DB' }}>
                <span className="text-5xl">🛒</span>
              </div>
              <p className="font-semibold text-lg" style={{ color: '#1C1C1C' }}>
                Your cart is empty
              </p>
              <p className="text-sm mt-1" style={{ color: '#7E7E7E' }}>
                Add delicious items to get started!
              </p>
              <button
                onClick={handleClose}
                className="mt-6 px-8 py-3 text-white font-bold rounded-full active:scale-95 transition-transform"
                style={{ background: 'linear-gradient(135deg, #C97B4B 0%, #E8956A 100%)', boxShadow: '0 6px 20px rgba(252, 128, 25, 0.3)' }}
              >
                🍰 Browse Menu
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item, index) => (
                <div
                  key={item.cartId}
                  className="p-4 rounded-2xl animate-fade-in"
                  style={{
                    background: 'white',
                    border: '2px solid #E8E3DB',
                    boxShadow: '0 2px 8px rgba(74, 55, 40, 0.06)',
                    animationDelay: `${index * 0.1}s`
                  }}
                >
                  <div className="flex gap-3">
                    {/* Item Image */}
                    {item.image && (
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0" style={{ border: '2px solid #E8E3DB' }}>
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    )}

                    {/* Item Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate" style={{ color: '#1C1C1C' }}>
                        {item.name}
                      </h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.size && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-medium"
                            style={{ background: '#FFF5EE', color: '#C97B4B' }}>
                            {item.size}
                          </span>
                        )}
                        {item.selectedAddons?.map((addon, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded-md"
                            style={{ background: '#F5F5F5', color: '#7E7E7E' }}
                          >
                            +{addon}
                          </span>
                        ))}
                      </div>
                      <p className="font-bold text-base mt-2" style={{ color: '#C97B4B' }}>
                        ₹{(Number(item.price) || 0) * (Number(item.quantity) || 1)}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex flex-col items-end justify-between">
                      <button
                        onClick={() => handleRemoveItem(item.cartId)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                        style={{ color: '#E57373' }}
                      >
                        <FaTrash size={11} />
                      </button>
                      <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: '#F5F5F5', border: '2px solid #E8E8E8' }}>
                        <button
                          onClick={() => handleUpdateQty(item.cartId, -1)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center active:scale-90 transition-transform"
                          style={{ background: 'white' }}
                        >
                          <FaMinus size={9} color="#C97B4B" />
                        </button>
                        <span className="font-bold w-5 text-center text-sm" style={{ color: '#1C1C1C' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQty(item.cartId, 1)}
                          className="w-7 h-7 rounded-lg text-white flex items-center justify-center active:scale-90 transition-transform"
                          style={{ background: 'linear-gradient(135deg, #C97B4B 0%, #E8956A 100%)' }}
                        >
                          <FaPlus size={9} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Checkout Section */}
        {cart.length > 0 && (
          <div className="p-4 border-t" style={{ borderColor: '#f0f0f0', background: 'white', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', boxShadow: '0 -4px 20px rgba(0,0,0,0.05)' }}>
            {/* Total */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-xs uppercase font-medium" style={{ color: '#7E7E7E' }}>
                  Subtotal
                </p>
                <p className="text-2xl font-bold" style={{ color: '#C97B4B' }}>
                  ₹{total.toFixed(0)}
                </p>
              </div>
              {remainingForFreeDelivery <= 0 && (
                <div className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: '#DCFCE7', color: '#166534' }}>
                  🎉 FREE Delivery
                </div>
              )}
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              className="w-full h-14 text-white font-bold text-base rounded-full shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #C97B4B 0%, #E8956A 100%)',
                boxShadow: '0 8px 24px rgba(252, 128, 25, 0.35)'
              }}
            >
              <span>Proceed to Checkout</span>
              <FaArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </>
  );
});

SideCart.displayName = 'SideCart';

export default SideCart;
