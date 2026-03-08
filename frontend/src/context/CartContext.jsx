import React, { createContext, useState, useContext, useEffect, useRef } from "react";
import { syncCartToDB, getCartFromDB } from "../services/api";

const CartContext = createContext();

// Helper to safely parse JSON from localStorage
const getStoredCart = () => {
  try {
    const stored = localStorage.getItem("sewashubham_cart");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => getStoredCart());
  const [total, setTotal] = useState(0);
  const syncTimeoutRef = useRef(null);
  const hasLoadedFromDB = useRef(false);

  // Calculate total whenever cart changes
  useEffect(() => {
    const newTotal = cart.reduce(
      (sum, item) => {
        const itemPrice = Number(item.price) || Number(item.basePrice) || 0;
        const itemQty = Number(item.quantity) || 1;
        return sum + (itemPrice * itemQty);
      },
      0,
    );
    setTotal(newTotal);
  }, [cart]);

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("sewashubham_cart", JSON.stringify(cart));
    } catch (e) {
      console.error("Failed to save cart to localStorage:", e);
    }
  }, [cart]);

  // Debounced sync to DB (only if user is logged in)
  useEffect(() => {
    if (!hasLoadedFromDB.current) return; // Don't sync before initial load

    const token = localStorage.getItem("customerToken");
    if (!token) return;

    // Debounce: wait 1s after last change before syncing
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      syncCartToDB(cart).catch(err => {
        if (err.response?.status === 401 || err.response?.status === 400) return;
        console.error("Cart sync error:", err);
      });
    }, 1000);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [cart]);

  // Load cart from DB on mount if user is logged in
  useEffect(() => {
    const loadCartFromDB = async () => {
      const token = localStorage.getItem("customerToken");
      if (!token) {
        hasLoadedFromDB.current = true;
        return;
      }

      try {
        const { data } = await getCartFromDB();
        if (data && data.length > 0) {
          // Merge: DB cart takes priority, but also keep any localStorage items not in DB
          const localCart = getStoredCart();
          const dbCartIds = new Set(data.map(item => item.cartId));
          const uniqueLocal = localCart.filter(item => !dbCartIds.has(item.cartId));
          const merged = [...data, ...uniqueLocal];
          setCart(merged);
        }
      } catch (err) {
        if (err.response?.status !== 401 && err.response?.status !== 400) {
          console.error("Failed to load cart from DB:", err);
        }
      }
      hasLoadedFromDB.current = true;
    };

    loadCartFromDB();
  }, []);

  const addToCart = (item) => {
    const cartItem = {
      ...item,
      cartId: `${item._id}-${item.size || "default"}-${(item.selectedAddons || []).join("-")}-${Date.now()}`,
      quantity: 1,
    };
    setCart((prev) => [...prev, cartItem]);
  };

  const updateQuantity = (cartId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartId === cartId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean),
    );
  };

  const removeFromCart = (cartId) => {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const clearCart = () => {
    setCart([]);
    try {
      localStorage.removeItem("sewashubham_cart");
    } catch (e) {
      console.error("Failed to clear cart from localStorage:", e);
    }
    // Also clear in DB
    const token = localStorage.getItem("customerToken");
    if (token) {
      syncCartToDB([]).catch(err => console.error("Cart clear sync error:", err));
    }
  };

  const getItemCount = () => cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        total,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
