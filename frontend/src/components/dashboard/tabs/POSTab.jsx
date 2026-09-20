import React, { useState, useEffect, useMemo } from "react";
import {
  LuSearch,
  LuPlus,
  LuMinus,
  LuTrash2,
  LuSend,
  LuReceipt,
  LuUtensils,
  LuArmchair,
  LuShoppingBag,
  LuPrinter,
  LuCircleCheck,
  LuClock,
  LuUser
} from "react-icons/lu";

export default function POSTab({
  menu = [],
  categories = [],
  sessions = [],
  cafe = {},
  defaultTable = 1,
  onPlacePosOrder,
  onQuickTakeaway,
  onShowKotModal,
  onShowInvoiceModal
}) {
  const [orderType, setOrderType] = useState("dine-in"); // 'dine-in' | 'takeaway'
  const [selectedTable, setSelectedTable] = useState(defaultTable || 1);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [pax, setPax] = useState(2);
  const [orderNotes, setOrderNotes] = useState("");
  const [discountInput, setDiscountInput] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  // Filter & Search
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Cart state: array of { menuItem, name, price, quantity, notes }
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  const currency = cafe?.currency || "₹";
  const taxPercent = cafe?.taxPercent || 0;
  const taxLabel = cafe?.taxLabel || "GST";
  const tableCount = cafe?.tableCount || 10;

  // Active sessions mapped by table number for quick lookup
  const sessionByTable = useMemo(() => {
    const map = {};
    (sessions || []).forEach((s) => {
      if (s.status === "active" || s.status === "billing") {
        map[s.tableNumber] = s;
      }
    });
    return map;
  }, [sessions]);

  // When table changes in dine-in, auto-fill customer info if session exists
  const handleTableChange = (tblNum) => {
    const num = parseInt(tblNum);
    setSelectedTable(num);
    const existing = sessionByTable[num];
    if (existing) {
      setCustomerName(existing.customerName || "");
      setCustomerPhone(existing.customerPhone || "");
      setPax(existing.pax || 2);
    }
  };

  // Auto-sync table selection when defaultTable prop changes (e.g. from TablesTab "Add Food")
  useEffect(() => {
    if (defaultTable) {
      handleTableChange(defaultTable);
      setOrderType("dine-in");
    }
  }, [defaultTable]);

  // Filtered menu items
  const filteredMenu = useMemo(() => {
    return menu.filter((item) => {
      if (!item.isAvailable) return false;
      const matchesCategory =
        selectedCategory === "all" ||
        item.category?.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menu, selectedCategory, searchQuery]);

  // Cart actions
  const addToCart = (item) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.menuItemId === item._id);
      if (idx > -1) {
        const next = [...prev];
        next[idx].quantity += 1;
        return next;
      }
      return [
        ...prev,
        {
          menuItemId: item._id,
          name: item.name,
          price: item.price,
          quantity: 1,
          image: item.image || "",
          notes: ""
        }
      ];
    });
  };

  const updateQuantity = (menuItemId, delta) => {
    setCart((prev) => {
      return prev
        .map((it) => {
          if (it.menuItemId === menuItemId) {
            const nextQty = it.quantity + delta;
            return nextQty > 0 ? { ...it, quantity: nextQty } : null;
          }
          return it;
        })
        .filter(Boolean);
    });
  };

  const updateItemNote = (menuItemId, note) => {
    setCart((prev) =>
      prev.map((it) => (it.menuItemId === menuItemId ? { ...it, notes: note } : it))
    );
  };

  const removeFromCart = (menuItemId) => {
    setCart((prev) => prev.filter((it) => it.menuItemId !== menuItemId));
  };

  const clearCart = () => {
    setCart([]);
    setOrderNotes("");
    setDiscountInput(0);
  };

  // Calculations
  const subtotal = Math.round(cart.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0) * 100) / 100;
  const discount = Math.round(Math.min(subtotal, Math.max(0, parseFloat(discountInput) || 0)) * 100) / 100;
  const taxable = Math.max(0, Math.round((subtotal - discount) * 100) / 100);
  const taxAmount = Math.round((taxable * taxPercent) / 100);
  const grandTotal = Math.round((taxable + taxAmount) * 100) / 100;

  // Submit Order (Send KOT)
  const handleSendKot = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      if (orderType === "takeaway") {
        const res = await onQuickTakeaway({
          customerName: customerName.trim() || "Takeaway Guest",
          customerPhone: customerPhone.trim(),
          customerAddress: customerAddress.trim(),
          items: cart,
          notes: orderNotes,
          discount,
          paymentMethod,
          isPaid: false
        });
        if (res?.order) {
          clearCart();
          onShowKotModal(res.order._id);
        }
      } else {
        const currentSession = sessionByTable[selectedTable];
        const res = await onPlacePosOrder({
          orderSource: "counter",
          orderType: "dine-in",
          tableNumber: selectedTable,
          sessionId: currentSession?._id || null,
          customerName: customerName.trim() || `Table ${selectedTable} Guest`,
          customerPhone: customerPhone.trim(),
          pax,
          items: cart,
          notes: orderNotes,
          discount,
          isPaid: false
        });
        if (res?.order) {
          clearCart();
          onShowKotModal(res.order._id);
        }
      }
    } catch (err) {
      console.error("POS order error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Quick Pay & Print Bill
  const handleQuickPayBill = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      if (orderType === "takeaway") {
        const res = await onQuickTakeaway({
          customerName: customerName.trim() || "Takeaway Guest",
          customerPhone: customerPhone.trim(),
          customerAddress: customerAddress.trim(),
          items: cart,
          notes: orderNotes,
          discount,
          paymentMethod,
          isPaid: true
        });
        if (res?.order) {
          clearCart();
          onShowInvoiceModal(null, res.order._id);
        }
      } else {
        const currentSession = sessionByTable[selectedTable];
        const res = await onPlacePosOrder({
          orderSource: "counter",
          orderType: "dine-in",
          tableNumber: selectedTable,
          sessionId: currentSession?._id || null,
          customerName: customerName.trim() || `Table ${selectedTable} Guest`,
          customerPhone: customerPhone.trim(),
          pax,
          items: cart,
          notes: orderNotes,
          discount,
          paymentMethod,
          isPaid: true
        });
        if (res?.order) {
          clearCart();
          if (res.session?._id) {
            onShowInvoiceModal(res.session._id);
          } else {
            onShowInvoiceModal(null, res.order._id);
          }
        }
      }
    } catch (err) {
      console.error("Quick pay error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start h-[calc(100vh-140px)] min-h-[600px]">
      {/* LEFT PANEL: Menu Catalog (60%) */}
      <div className="flex-1 w-full flex flex-col h-full bg-[#11111d] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        {/* Top toolbar: Search & Categories */}
        <div data-tour="pos-search" className="p-4 border-b border-white/10 space-y-3 bg-[#151525]">
          {/* Search bar */}
          <div className="relative">
            <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search food & beverages by name..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0b0b14] border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                  : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              }`}
            >
              All Items ({menu.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                    : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredMenu.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
              <LuUtensils className="w-12 h-12 stroke-[1.5] mb-3 text-slate-600" />
              <p className="text-sm font-medium">No menu items found</p>
              <p className="text-xs text-slate-600 mt-1">Try a different search term or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredMenu.map((item) => {
                const inCartItem = cart.find((i) => i.menuItemId === item._id);
                return (
                  <div
                    key={item._id}
                    onClick={() => addToCart(item)}
                    className="group relative flex flex-col justify-between p-3 rounded-xl bg-[#171727] hover:bg-[#1e1e32] border border-white/5 hover:border-violet-500/40 cursor-pointer transition-all hover:scale-[1.02] shadow-sm select-none"
                  >
                    <div>
                      {/* Image or Category placeholder */}
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black/40 mb-2 border border-white/5 flex items-center justify-center">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <LuUtensils className="w-6 h-6 text-slate-600" />
                        )}

                        {/* Veg / Non-veg dot */}
                        <div className="absolute top-1.5 left-1.5 p-0.5 rounded bg-black/60 backdrop-blur-xs">
                          <div className={`w-3 h-3 rounded-xs border flex items-center justify-center ${
                            item.isVeg ? "border-emerald-500" : "border-rose-500"
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              item.isVeg ? "bg-emerald-500" : "bg-rose-500"
                            }`} />
                          </div>
                        </div>

                        {/* Cart quantity badge */}
                        {inCartItem && (
                          <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-violet-600 text-white font-bold text-xs shadow-lg shadow-violet-600/40">
                            ×{inCartItem.quantity}
                          </div>
                        )}
                      </div>

                      <h4 className="font-bold text-xs text-white line-clamp-1 group-hover:text-violet-300 transition-colors">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 capitalize mt-0.5">{item.category}</p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="font-black text-emerald-400 text-sm">
                        {currency}{item.price}
                      </span>
                      <button
                        type="button"
                        className="p-1 rounded-lg bg-white/5 hover:bg-violet-600 text-slate-300 hover:text-white transition-colors"
                      >
                        <LuPlus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Cart & POS Order Builder (40%) */}
      <div className="w-full lg:w-[420px] flex flex-col h-full bg-[#11111d] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        {/* Order Mode Toggle */}
        <div data-tour="pos-order-type" className="p-4 border-b border-white/10 bg-[#151525]">
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#0b0b14] border border-white/10 text-xs font-bold">
            <button
              type="button"
              onClick={() => setOrderType("dine-in")}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-all cursor-pointer ${
                orderType === "dine-in"
                  ? "bg-violet-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LuArmchair className="w-4 h-4" />
              Dine-In Table
            </button>
            <button
              type="button"
              onClick={() => setOrderType("takeaway")}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-all cursor-pointer ${
                orderType === "takeaway"
                  ? "bg-violet-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LuShoppingBag className="w-4 h-4" />
              Takeaway / Counter
            </button>
          </div>

          {/* Dine-in Table Selector / Customer info */}
          {orderType === "dine-in" ? (
            <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
              <div data-tour="pos-table-select" className="col-span-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Table</label>
                <select
                  value={selectedTable}
                  onChange={(e) => handleTableChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#0b0b14] border border-white/10 text-white font-bold focus:outline-none focus:border-violet-500"
                >
                  {Array.from({ length: tableCount }, (_, i) => i + 1).map((num) => {
                    const hasSession = !!sessionByTable[num];
                    return (
                      <option key={num} value={num}>
                        T{num} {hasSession ? "(Occupied)" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Guests</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={pax}
                  onChange={(e) => setPax(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#0b0b14] border border-white/10 text-white focus:outline-none focus:border-violet-500"
                />
              </div>
              <div data-tour="pos-customer" className="col-span-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Guest Name</label>
                <input
                  type="text"
                  placeholder="Optional"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#0b0b14] border border-white/10 text-white focus:outline-none focus:border-violet-500 truncate"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Customer</label>
                <input
                  type="text"
                  placeholder="Guest name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#0b0b14] border border-white/10 text-white focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phone</label>
                <input
                  type="tel"
                  placeholder="Mobile number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#0b0b14] border border-white/10 text-white focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Cart items list */}
        <div data-tour="pos-cart" className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <LuShoppingBag className="w-10 h-10 stroke-[1.5] mb-2 text-slate-600" />
              <p className="text-xs font-semibold">Cart is empty</p>
              <p className="text-[11px] text-slate-600 mt-0.5">Click any menu item to add to order</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.menuItemId}
                className="p-2.5 rounded-xl bg-[#171727] border border-white/5 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <span className="font-bold text-xs text-white">{item.name}</span>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {currency}{item.price} each
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1.5 bg-[#0b0b14] border border-white/10 px-1.5 py-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.menuItemId, -1)}
                      className="p-0.5 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <LuMinus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center font-bold text-xs text-white">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.menuItemId, 1)}
                      className="p-0.5 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <LuPlus className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="font-black text-xs text-white font-mono min-w-[50px] text-right">
                    {currency}{item.price * item.quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.menuItemId)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <LuTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Item note input */}
                <input
                  type="text"
                  placeholder="Special instructions (e.g. extra spicy)..."
                  value={item.notes}
                  onChange={(e) => updateItemNote(item.menuItemId, e.target.value)}
                  className="w-full px-2 py-1 rounded bg-[#0b0b14] border border-white/5 text-[11px] text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-violet-500"
                />
              </div>
            ))
          )}
        </div>

        {/* Cart Bottom Summary & Actions */}
        <div className="p-4 border-t border-white/10 bg-[#151525] space-y-3">
          {/* Bill calculations */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
              <span className="font-mono text-white">{currency}{subtotal}</span>
            </div>

            {taxPercent > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>{taxLabel} ({taxPercent}%)</span>
                <span className="font-mono text-white">{currency}{taxAmount}</span>
              </div>
            )}

            <div className="flex justify-between items-baseline pt-1.5 border-t border-white/10 font-bold text-sm text-white">
              <span className="uppercase tracking-wider">Total</span>
              <span className="text-base font-black text-emerald-400 font-mono">
                {currency}{grandTotal}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              data-tour="pos-send-kot"
              onClick={handleSendKot}
              disabled={cart.length === 0 || loading}
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <LuSend className="w-3.5 h-3.5" />
              {loading ? "Sending..." : "Send KOT"}
            </button>

            <button
              type="button"
              data-tour="pos-pay-btn"
              onClick={handleQuickPayBill}
              disabled={cart.length === 0 || loading}
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <LuPrinter className="w-3.5 h-3.5" />
              Pay & Bill
            </button>
          </div>

          {cart.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="w-full text-center text-[11px] text-slate-500 hover:text-slate-300 transition-colors py-1 cursor-pointer"
            >
              Clear Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
