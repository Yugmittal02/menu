import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getPublicCafe,
  getPublicMenu,
  getPublicOffers,
  placeOrder,
  resolveQrSession,
  getCustomerSession,
  requestTableBill,
  validateCoupon
} from '../services/api';
import { useCart } from '../context/CartContext';
import { applyCafeTheme } from '../utils/themeEngine';

// Customer Modular Components
import CafeHeader from '../components/customer/CafeHeader';
import CafeInfoModal from '../components/customer/CafeInfoModal';
import OfferCarousel from '../components/customer/OfferCarousel';
import CategoryNav from '../components/customer/CategoryNav';
import MenuSection from '../components/customer/MenuSection';
import MenuCard from '../components/customer/MenuCard';
import MenuItemSheet from '../components/customer/MenuItemSheet';
import CartBar from '../components/customer/CartBar';
import CartDrawer from '../components/customer/CartDrawer';
import CustomerIdentitySheet from '../components/customer/CustomerIdentitySheet';
import OrderStatusView from '../components/customer/OrderStatusView';
import CustomerBillModal from '../components/customer/CustomerBillModal';
import CafeFooter from '../components/customer/CafeFooter';
import LoadingState from '../components/customer/LoadingState';
import ErrorState from '../components/customer/ErrorState';

import { LuSearch, LuX, LuUtensils, LuReceipt, LuArrowLeft, LuShoppingBag } from 'react-icons/lu';

const getStoredCustomer = () => {
  try {
    return JSON.parse(localStorage.getItem('qr_customer') || '{}');
  } catch {
    return {};
  }
};

export default function CustomerMenu() {
  const { cafeSlug, tableId, cafeId: paramCafeId, tableNo: paramTableNo } = useParams();
  const navigate = useNavigate();

  const cafeIdentifier = cafeSlug || paramCafeId;
  const currentTable = tableId || paramTableNo || '1';

  // Cart Context
  const {
    cart,
    subtotal,
    discount,
    total,
    coupon,
    initCart,
    addToCart,
    updateQuantity,
    clearCart,
    getItemCount,
    applyCoupon,
    removeCoupon
  } = useCart();

  // Core Data States
  const [cafe, setCafe] = useState(null);
  const [menu, setMenu] = useState([]);
  const [offers, setOffers] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Search States
  const [activeCategory, setActiveCategory] = useState('All');
  const [vegOnly, setVegOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('qr_favs') || '[]'));
    } catch {
      return new Set();
    }
  });

  // UI Modal & View States
  const [viewMode, setViewMode] = useState('menu'); // 'menu' | 'status'
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isIdentityOpen, setIsIdentityOpen] = useState(false);
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [selectedItemForSheet, setSelectedItemForSheet] = useState(null);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [customerInfo, setCustomerInfo] = useState(getStoredCustomer);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isRequestingBill, setIsRequestingBill] = useState(false);
  const [orderMode, setOrderMode] = useState('dine-in'); // 'dine-in' | 'takeaway'
  const [pickupToken, setPickupToken] = useState('');

  const initDone = useRef(false);

  // 1. Initial Load of Cafe, Menu, Offers & Dining Session
  const loadCafeData = async () => {
    if (!cafeIdentifier) {
      setError('Invalid QR code. Cafe identifier is missing.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Load Cafe details
      const cafeRes = await getPublicCafe(cafeIdentifier);
      const cafeData = cafeRes.data;
      setCafe(cafeData);

      // Apply theme CSS variables dynamically
      applyCafeTheme(cafeData);

      // Initialize Cart for this cafe
      if (!initDone.current) {
        initCart(cafeData._id || cafeData.cafeId || cafeIdentifier);
        initDone.current = true;
      }

      // Concurrently load Menu, Offers, and Session
      const [menuRes, offersRes, sessionRes] = await Promise.allSettled([
        getPublicMenu(cafeData._id || cafeData.cafeId || cafeIdentifier),
        getPublicOffers(cafeData._id || cafeData.cafeId || cafeIdentifier),
        resolveQrSession({
          cafeId: cafeData._id,
          tableNumber: parseInt(currentTable, 10)
        })
      ]);

      // Set Menu items
      if (menuRes.status === 'fulfilled') {
        const availableItems = (menuRes.value.data || []).filter(
          (item) => item.isAvailable !== false
        );
        setMenu(availableItems);
      }

      // Set Offers
      if (offersRes.status === 'fulfilled') {
        setOffers(offersRes.value.data || []);
      }

      // Set Session & Existing Orders
      if (sessionRes.status === 'fulfilled' && sessionRes.value.data) {
        const rawData = sessionRes.value.data;
        const resolvedSess = rawData.session || rawData;
        if (resolvedSess && resolvedSess._id) {
          try {
            const detailRes = await getCustomerSession(resolvedSess._id);
            setActiveSession(detailRes.data || resolvedSess);
          } catch {
            setActiveSession(resolvedSess);
          }
        } else if (resolvedSess) {
          setActiveSession(resolvedSess);
        }
      }
    } catch (err) {
      console.error('Failed to load cafe QR menu:', err);
      setError(
        err.response?.data?.message ||
        'Unable to load menu. The cafe may be closed or the QR code has expired.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCafeData();
  }, [cafeIdentifier, currentTable]);

  // Periodic polling (every 25s) to sync session orders status in real time
  useEffect(() => {
    if (!activeSession?._id) return;
    const interval = setInterval(async () => {
      try {
        const detailRes = await getCustomerSession(activeSession._id);
        if (detailRes.data) {
          setActiveSession(detailRes.data);
        }
      } catch (err) {
        // silent fail on polling
      }
    }, 25000);
    return () => clearInterval(interval);
  }, [activeSession?._id]);

  // Computed Categories
  const categories = useMemo(() => {
    const cats = new Set();
    menu.forEach((item) => {
      if (item.category && item.category.trim()) {
        cats.add(item.category.trim());
      }
    });
    return ['All', ...Array.from(cats)];
  }, [menu]);

  // Filtered Menu Items
  const filteredMenu = useMemo(() => {
    return menu.filter((item) => {
      // Category filter
      if (activeCategory !== 'All' && item.category !== activeCategory) {
        return false;
      }
      // Veg only toggle
      if (vegOnly && !item.isVeg) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchDesc = (item.description || '').toLowerCase().includes(q);
        const matchCat = (item.category || '').toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchCat) return false;
      }
      return true;
    });
  }, [menu, activeCategory, vegOnly, searchQuery]);

  // Grouped Menu by Category (for clean section rendering)
  const groupedMenu = useMemo(() => {
    if (activeCategory !== 'All' || searchQuery.trim()) {
      return {
        [activeCategory !== 'All' ? activeCategory : 'Search Results']: filteredMenu
      };
    }
    const groups = {};
    filteredMenu.forEach((item) => {
      const cat = item.category || 'Specialties';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [filteredMenu, activeCategory, searchQuery]);

  // Cart item quantity helper
  const getCartQuantity = (itemId) => {
    const found = cart.find(
      (c) => c.menuItemId === itemId || c._id === itemId
    );
    return found ? found.quantity : 0;
  };

  // Toggle favorite
  const handleToggleFavorite = (itemId) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      try {
        localStorage.setItem('qr_favs', JSON.stringify(Array.from(next)));
      } catch { }
      return next;
    });
  };

  // Add Item to Cart
  const handleAddToCart = (item, quantity = 1, itemInstructions = '') => {
    addToCart({
      menuItemId: item._id,
      _id: item._id,
      name: item.name,
      price: item.price,
      image: item.image,
      category: item.category,
      isVeg: item.isVeg,
      specialInstructions: itemInstructions,
      quantity
    });
  };

  // Apply offer from carousel or coupon drawer
  const handleApplyOffer = async (offer) => {
    if (!offer?.code) return { error: 'Coupon code is required' };
    if (offer.type && offer.value !== undefined) {
      applyCoupon(offer);
      return { success: true };
    }
    try {
      const cafeIdVal = cafe?._id || cafe?.cafeId || cafeIdentifier;
      const res = await validateCoupon({
        cafeId: cafeIdVal,
        code: offer.code,
        orderTotal: subtotal
      });
      if (res.data?.valid) {
        applyCoupon(res.data);
        return { success: true };
      } else {
        return { error: res.data?.message || 'Invalid coupon code' };
      }
    } catch (err) {
      return {
        error: err.response?.data?.message || 'Invalid or expired coupon code'
      };
    }
  };

  // Proceed to Checkout button in CartDrawer
  const handleProceedToCheckout = () => {
    if (!customerInfo.name || !customerInfo.name.trim()) {
      setIsIdentityOpen(true);
    } else {
      executeOrderPlacement(customerInfo.name, customerInfo.phone);
    }
  };

  // Submit Identity and place order
  const handleIdentitySubmit = ({ name, phone }) => {
    const updated = { name, phone };
    setCustomerInfo(updated);
    try {
      localStorage.setItem('qr_customer', JSON.stringify(updated));
    } catch { }
    setIsIdentityOpen(false);
    executeOrderPlacement(name, phone);
  };

  // Execute Order Placement to Backend
  const executeOrderPlacement = async (name, phone) => {
    if (cart.length === 0) return;
    setIsPlacingOrder(true);

    try {
      const orderItems = cart.map((item) => ({
        menuItem: item.menuItemId || item._id,
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity) || 1,
        image: item.image,
        specialInstructions: item.specialInstructions || ''
      }));

      const isTakeaway = orderMode === 'takeaway';
      const payload = {
        cafeId: cafe.cafeId || cafe._id || cafeIdentifier,
        orderType: orderMode,
        tableNumber: isTakeaway ? 0 : parseInt(currentTable, 10),
        customerName: name.trim(),
        customerPhone: (phone || '').trim(),
        items: orderItems,
        specialInstructions: specialInstructions.trim(),
        couponCode: coupon?.code || '',
        sessionId: isTakeaway ? null : activeSession?._id
      };

      const response = await placeOrder(payload);

      // Store pickup token if takeaway
      if (response.data?.pickupToken) {
        setPickupToken(response.data.pickupToken);
      }

      // Successfully placed!
      clearCart();
      setIsCartOpen(false);
      setSpecialInstructions('');

      // Refresh table session to include newly placed round
      const targetSessionId =
        response.data?.order?.sessionId ||
        response.data?.sessionCode ||
        activeSession?._id;

      if (targetSessionId && !isTakeaway) {
        try {
          const detailRes = await getCustomerSession(targetSessionId);
          if (detailRes.data) {
            setActiveSession(detailRes.data);
          }
        } catch (sessErr) {
          console.warn('Could not load session details:', sessErr);
          if (response.data?.order) {
            setActiveSession((prev) => ({
              _id: targetSessionId,
              tableNumber: parseInt(currentTable, 10),
              orders: prev?.orders
                ? [...prev.orders, response.data.order]
                : [response.data.order]
            }));
          }
        }
      } else if (response.data?.order) {
        setActiveSession((prev) => ({
          tableNumber: isTakeaway ? 0 : parseInt(currentTable, 10),
          pickupToken: response.data?.pickupToken,
          orders: prev?.orders && isTakeaway
            ? [...prev.orders, response.data.order]
            : [response.data.order]
        }));
      }

      // Switch to live order status view
      setViewMode('status');
    } catch (err) {
      console.error('Error placing order:', err);
      alert(
        err.response?.data?.message ||
        'Failed to place order. Please check your connection or contact the server.'
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Request Final Bill
  const handleRequestBill = async () => {
    const sessId = activeSession?._id || activeSession?.sessionId;
    if (!sessId) {
      setIsBillOpen(true);
      return;
    }
    setIsRequestingBill(true);
    try {
      const res = await requestTableBill(sessId);
      if (res.data?.session) {
        setActiveSession(res.data.session);
      }
      setIsBillOpen(true);
    } catch (err) {
      console.error('Failed to request bill:', err);
      setIsBillOpen(true);
    } finally {
      setIsRequestingBill(false);
    }
  };

  // Refresh Session Manually
  const handleRefreshSession = async () => {
    if (!activeSession?._id) return;
    try {
      const res = await getCustomerSession(activeSession._id);
      setActiveSession(res.data);
    } catch (err) {
      console.error('Failed to refresh session:', err);
    }
  };

  // Session order count
  const activeOrderCount = (activeSession?.orders || []).length;
  const currentRound = activeOrderCount + 1;

  // Calculate tax amount based on cafe tax rate
  const taxRate = cafe?.taxPercent || 0;
  const taxAmount = Math.round(
    (Math.max(0, subtotal - discount) * taxRate) / 100
  );
  const grandTotal = Math.max(0, subtotal - discount) + taxAmount;

  // 1. Loading State
  if (loading) {
    return <LoadingState cafeName={cafe?.name || 'The Café'} />;
  }

  // 2. Error State
  if (error || !cafe) {
    return (
      <ErrorState
        title="Menu Unavailable"
        message={error || 'Could not load cafe details.'}
        onRetry={loadCafeData}
        cafePhone={cafe?.phone}
      />
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col justify-between transition-colors duration-200 overflow-x-hidden"
      style={{
        backgroundColor: 'var(--cafe-background, #F7F4EC)',
        color: 'var(--cafe-text, #222522)',
        fontFamily: 'var(--cafe-font-body, "Plus Jakarta Sans", sans-serif)'
      }}
    >
      {/* 1. Header */}
      <CafeHeader
        cafe={cafe}
        tableNo={orderMode === 'takeaway' ? null : currentTable}
        onOpenInfo={() => setIsInfoOpen(true)}
        activeOrderCount={activeOrderCount}
        onViewOrders={() =>
          setViewMode((prev) => (prev === 'status' ? 'menu' : 'status'))
        }
      />

      {/* 1b. Order Mode Selector: Dine In vs Takeaway */}
      <div className="bg-[var(--cafe-surface,#FFFFFF)]/90 backdrop-blur-md border-b border-[var(--cafe-border,#E7E0D3)] py-2 px-4 transition-all">
        <div className="mx-auto max-w-lg flex items-center justify-center">
          <div className="inline-flex rounded-2xl p-1 bg-[var(--cafe-background,#F7F4EC)] border border-[var(--cafe-border,#E7E0D3)] w-full max-w-xs shadow-inner">
            <button
              type="button"
              onClick={() => setOrderMode('dine-in')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all min-h-[42px] cursor-pointer ${
                orderMode === 'dine-in'
                  ? 'bg-[var(--cafe-primary,#173D32)] text-white shadow-sm'
                  : 'text-[var(--cafe-muted,#6A746B)] hover:text-[var(--cafe-text,#222522)]'
              }`}
            >
              <LuUtensils className="h-3.5 w-3.5" />
              <span>Dine In {currentTable ? `(T${currentTable})` : ''}</span>
            </button>
            <button
              type="button"
              onClick={() => setOrderMode('takeaway')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all min-h-[42px] cursor-pointer ${
                orderMode === 'takeaway'
                  ? 'bg-[var(--cafe-primary,#173D32)] text-white shadow-sm'
                  : 'text-[var(--cafe-muted,#6A746B)] hover:text-[var(--cafe-text,#222522)]'
              }`}
            >
              <LuShoppingBag className="h-3.5 w-3.5" />
              <span>Takeaway</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mode Switcher Banner (if active orders exist) */}
      {activeOrderCount > 0 && (
        <div className="bg-[var(--cafe-surface,#FFFFFF)] border-b border-[var(--cafe-border,#E7E0D3)] px-4 py-2.5">
          <div className="mx-auto max-w-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-semibold text-[var(--cafe-primary)]">
                {activeOrderCount}{' '}
                {activeOrderCount === 1 ? 'Order active' : 'Orders in progress'}
              </span>
            </div>
            <button
              onClick={() =>
                setViewMode((prev) => (prev === 'status' ? 'menu' : 'status'))
              }
              className="text-xs font-bold uppercase tracking-wider text-[var(--cafe-primary)] hover:underline flex items-center gap-1"
            >
              {viewMode === 'status' ? (
                <>
                  <LuArrowLeft className="w-3.5 h-3.5" />
                  Back to Menu
                </>
              ) : (
                <>
                  View Live Status
                  <LuReceipt className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 2. Main Content: Status View OR Menu View */}
      {viewMode === 'status' ? (
        <div className="flex-1 flex flex-col justify-between">
          <OrderStatusView
            session={activeSession}
            cafe={cafe}
            tableNo={currentTable}
            currency={cafe?.currency || '₹'}
            orderMode={orderMode}
            pickupToken={pickupToken || activeSession?.pickupToken}
            onOrderMore={() => setViewMode('menu')}
            onRequestBill={handleRequestBill}
            onRefresh={handleRefreshSession}
          />
          <CafeFooter cafe={cafe} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between">
          <main className="flex-1">
            {/* Exclusive Offers Carousel */}
            {offers && offers.length > 0 && (
              <OfferCarousel
                offers={offers}
                appliedCoupon={coupon}
                onApplyOffer={handleApplyOffer}
              />
            )}

            {/* Search Bar */}
            <div className="mx-auto max-w-lg px-4 pt-3 pb-2 sm:px-6">
              <div className="relative flex items-center rounded-2xl bg-[var(--cafe-surface,#FFFFFF)] border border-[var(--cafe-border,#E7E0D3)] shadow-sm px-3.5 py-2.5 transition focus-within:ring-2 focus-within:ring-[var(--cafe-primary,#173D32)]/20">
                <LuSearch className="h-4 w-4 text-[var(--cafe-muted,#6A746B)] shrink-0" />
                <input
                  type="text"
                  placeholder="Search artisanal brews, bowls, brunch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent pl-2.5 pr-2 text-sm text-[var(--cafe-text,#222522)] placeholder:text-[var(--cafe-muted,#6A746B)]/70 outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="rounded-full p-1 text-[var(--cafe-muted)] hover:bg-stone-100"
                  >
                    <LuX className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Sticky Category Navigation */}
            <CategoryNav
              categories={categories}
              activeCategory={activeCategory}
              onSelectCategory={(cat) => {
                setActiveCategory(cat);
                setSearchQuery('');
              }}
              vegOnly={vegOnly}
              onToggleVegOnly={() => setVegOnly((prev) => !prev)}
            />

            {/* Menu Sections & Cards */}
            <div className="mx-auto max-w-lg px-4 py-4 sm:px-6 space-y-6">
              {Object.keys(groupedMenu).length === 0 || filteredMenu.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-[var(--cafe-surface,#FFFFFF)] border border-[var(--cafe-border,#E7E0D3)] flex items-center justify-center mx-auto mb-3 shadow-sm text-2xl">
                    🥗
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[var(--cafe-text,#222522)]">
                    No Dishes Found
                  </h3>
                  <p className="text-xs text-[var(--cafe-muted,#6A746B)] mt-1 max-w-xs mx-auto">
                    {vegOnly
                      ? 'No vegetarian items match this selection. Try turning off the Veg Only filter.'
                      : 'Try checking your search spelling or switch to another category.'}
                  </p>
                  {vegOnly && (
                    <button
                      onClick={() => setVegOnly(false)}
                      className="mt-4 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-[var(--cafe-primary)] text-white"
                    >
                      Disable Veg Filter
                    </button>
                  )}
                </div>
              ) : (
                Object.entries(groupedMenu).map(([categoryName, items]) => (
                  <MenuSection
                    key={categoryName}
                    title={categoryName}
                    count={items.length}
                  >
                    <div className="space-y-3.5">
                      {items.map((item) => (
                        <MenuCard
                          key={item._id}
                          item={item}
                          cartQuantity={getCartQuantity(item._id)}
                          currency={cafe?.currency || '₹'}
                          isFavorite={favorites.has(item._id)}
                          onToggleFavorite={() => handleToggleFavorite(item._id)}
                          onAddToCart={() => handleAddToCart(item)}
                          onUpdateQuantity={(arg1, arg2) => {
                            const delta = typeof arg2 === 'number' ? arg2 : arg1;
                            updateQuantity(item._id, delta);
                          }}
                          onOpenDetail={() => setSelectedItemForSheet(item)}
                        />
                      ))}
                    </div>
                  </MenuSection>
                ))
              )}
            </div>
          </main>

          {/* Botanical Cafe Footer */}
          <CafeFooter cafe={cafe} />
        </div>
      )}

      {/* 3. Sticky Bottom Cart Bar (shows when items in cart) */}
      <CartBar
        itemCount={getItemCount()}
        total={grandTotal}
        currency={cafe?.currency || '₹'}
        onOpenCart={() => setIsCartOpen(true)}
        onClick={() => setIsCartOpen(true)}
      />

      {/* 4. Slide-over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        cart={cart}
        subtotal={subtotal}
        discount={discount}
        taxAmount={taxAmount}
        total={grandTotal}
        currency={cafe?.currency || '₹'}
        tableNo={orderMode === 'takeaway' ? 'Takeaway' : currentTable}
        currentRound={currentRound}
        appliedCoupon={coupon}
        availableOffers={offers}
        specialNotes={specialInstructions}
        isPlacingOrder={isPlacingOrder}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={(menuItemId, delta) =>
          updateQuantity(menuItemId, delta)
        }
        onRemoveItem={(menuItemId) => updateQuantity(menuItemId, -9999)}
        onApplyCoupon={handleApplyOffer}
        onRemoveCoupon={removeCoupon}
        onUpdateNotes={setSpecialInstructions}
        onProceedToCheckout={handleProceedToCheckout}
      />

      {/* 5. Menu Item Detail Sheet */}
      <MenuItemSheet
        item={selectedItemForSheet}
        isOpen={!!selectedItemForSheet}
        currency={cafe?.currency || '₹'}
        onClose={() => setSelectedItemForSheet(null)}
        onAddToCart={(itemWithNotes) => {
          handleAddToCart(
            itemWithNotes,
            itemWithNotes.quantity || 1,
            itemWithNotes.specialInstructions || ''
          );
        }}
      />

      {/* 6. Guest Identity Sheet */}
      <CustomerIdentitySheet
        isOpen={isIdentityOpen}
        initialName={customerInfo.name || ''}
        initialPhone={customerInfo.phone || ''}
        tableNo={orderMode === 'takeaway' ? 'Takeaway Pickup' : currentTable}
        isPlacingOrder={isPlacingOrder}
        onClose={() => setIsIdentityOpen(false)}
        onSubmit={handleIdentitySubmit}
      />

      {/* 7. Cafe Info & Timings Modal */}
      <CafeInfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        cafe={cafe}
      />

      {/* 8. Digital Bill Receipt Modal */}
      <CustomerBillModal
        isOpen={isBillOpen}
        session={activeSession}
        cafe={cafe}
        currency={cafe?.currency || '₹'}
        onClose={() => setIsBillOpen(false)}
      />
    </div>
  );
}
