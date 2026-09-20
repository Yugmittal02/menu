import React, { createContext, useState, useContext, useEffect } from "react";

const CartContext = createContext();

const getStoredCart = (cafeId) => {
  try {
    const stored = localStorage.getItem(`qrmenu_cart_${cafeId}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [cafeId, setCafeId] = useState('');
  const [subtotal, setSubtotal] = useState(0);
  const [coupon, setCoupon] = useState(null); // { code, type, value, discount, message }
  const [discount, setDiscount] = useState(0);

  // Calculate subtotal
  useEffect(() => {
    const newSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setSubtotal(newSubtotal);
  }, [cart]);

  // Recalculate discount when subtotal or coupon changes
  useEffect(() => {
    if (coupon) {
      let d = 0;
      if (coupon.type === 'percentage') {
        d = Math.round((subtotal * coupon.value) / 100);
        if (coupon.maxDiscount > 0) d = Math.min(d, coupon.maxDiscount);
      } else {
        d = coupon.value;
      }
      d = Math.min(d, subtotal);
      setDiscount(d);
    } else {
      setDiscount(0);
    }
  }, [subtotal, coupon]);

  const total = subtotal - discount;

  // Persist cart
  useEffect(() => {
    if (cafeId) {
      localStorage.setItem(`qrmenu_cart_${cafeId}`, JSON.stringify(cart));
    }
  }, [cart, cafeId]);

  const initCart = (newCafeId) => {
    setCafeId(newCafeId);
    setCart(getStoredCart(newCafeId));
    setCoupon(null);
    setDiscount(0);
  };

  const addToCart = (item) => {
    const qtyToAdd = Number(item.quantity) > 0 ? Number(item.quantity) : 1;
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (i) =>
          (item.menuItemId && i.menuItemId === item.menuItemId) ||
          (item._id && (i._id === item._id || i.menuItemId === item._id))
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += qtyToAdd;
        if (item.specialInstructions) {
          updated[existingIndex].specialInstructions = item.specialInstructions;
        }
        return updated;
      }
      return [...prev, { ...item, quantity: qtyToAdd }];
    });
  };

  const updateQuantity = (menuItemId, delta) => {
    const numDelta = Number(delta) || (delta < 0 ? -1 : 1);
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.menuItemId === menuItemId || item._id === menuItemId) {
            const newQty = item.quantity + numDelta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (menuItemId) => {
    setCart((prev) => prev.filter((item) => item.menuItemId !== menuItemId));
  };

  const clearCart = () => {
    setCart([]);
    setCoupon(null);
    setDiscount(0);
    if (cafeId) localStorage.removeItem(`qrmenu_cart_${cafeId}`);
  };

  const applyCoupon = (couponData) => {
    setCoupon(couponData);
  };

  const removeCoupon = () => {
    setCoupon(null);
    setDiscount(0);
  };

  const getItemCount = () => cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart, subtotal, discount, total, coupon, cafeId,
      initCart, addToCart, updateQuantity, removeFromCart, clearCart,
      getItemCount, applyCoupon, removeCoupon
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
