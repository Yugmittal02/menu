import React, { useState, useMemo } from "react";
import {
  LuBoxes,
  LuPlus,
  LuMinus,
  LuSearch,
  LuFilter,
  LuPackageX,
  LuPackageCheck,
  LuPackagePlus,
  LuRefreshCw,
  LuLayers,
  LuCheck,
  LuX,
  LuTriangleAlert,
  LuPencil,
  LuArrowRight,
  LuSparkles,
  LuTag
} from "react-icons/lu";

export default function InventoryTab({
  inventoryData = { summary: {}, items: [] },
  cafe = {},
  menu = [],
  onUpdateStock,
  onToggle86,
  onBulkRestock,
  onAddInventoryItem,
  onAddItem,
  onRefresh
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'low' | 'out' | 'tracked'
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkInputs, setBulkInputs] = useState({});
  const [loading, setLoading] = useState(false);

  // Manual Stock Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState("restock"); // 'restock' | 'new'
  const [manualItemId, setManualItemId] = useState("");
  const [manualMode, setManualMode] = useState("add"); // 'add' (add delta) | 'set' (set exact)
  const [manualQuantity, setManualQuantity] = useState("10");
  const [manualThreshold, setManualThreshold] = useState("5");
  const [manualReason, setManualReason] = useState("Supplier Restock");

  // New Item Form State (for creating directly from Inventory)
  const [newItemForm, setNewItemForm] = useState({
    name: "",
    category: "",
    customCategory: "",
    price: "",
    stockQuantity: "25",
    lowStockThreshold: "5",
    isVeg: true,
    description: ""
  });

  // Inline table row editing
  const [inlineEditingId, setInlineEditingId] = useState(null);
  const [inlineStockValue, setInlineStockValue] = useState("");

  // Feedback banner
  const [feedback, setFeedback] = useState(null);

  const showFeedback = (msg, type = "success") => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const items = inventoryData.items || [];
  const summary = inventoryData.summary || {};

  // Combined item list for selection (fallback to menu if items is empty)
  const selectableItems = useMemo(() => {
    if (items && items.length > 0) return items;
    return menu || [];
  }, [items, menu]);

  // Unique categories
  const categories = useMemo(() => {
    const list = selectableItems.map((i) => i.category).filter(Boolean);
    return Array.from(new Set(list));
  }, [selectableItems]);

  // Currently selected item in manual modal
  const activeSelectedItem = useMemo(() => {
    if (!manualItemId && selectableItems.length > 0) return selectableItems[0];
    return selectableItems.find((i) => i._id === manualItemId) || selectableItems[0];
  }, [manualItemId, selectableItems]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategory === "all" || item.category === selectedCategory;

      let matchesStatus = true;
      if (statusFilter === "low") {
        matchesStatus =
          item.trackStock &&
          item.stockQuantity <= (item.lowStockThreshold || 5) &&
          item.stockQuantity > 0 &&
          !item.isOutOfStock;
      } else if (statusFilter === "out") {
        matchesStatus =
          item.isOutOfStock ||
          (item.trackStock && item.stockQuantity <= 0) ||
          !item.isAvailable;
      } else if (statusFilter === "tracked") {
        matchesStatus = item.trackStock;
      }

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [items, searchQuery, selectedCategory, statusFilter]);

  // Open manual restock dialog
  const openManualModal = (item = null) => {
    if (item) {
      setManualItemId(item._id);
      setManualQuantity("10");
      setManualThreshold(String(item.lowStockThreshold || 5));
      setModalTab("restock");
      setManualMode("add");
    } else if (selectableItems.length === 0) {
      setModalTab("new");
    } else {
      setManualItemId(selectableItems[0]?._id || "");
      setManualQuantity("10");
      setManualThreshold(String(selectableItems[0]?.lowStockThreshold || 5));
      setModalTab("restock");
      setManualMode("add");
    }
    setIsManualModalOpen(true);
  };

  const handleStockDelta = async (itemId, delta) => {
    try {
      await onUpdateStock(itemId, { delta });
      showFeedback(`Stock adjusted by ${delta > 0 ? `+${delta}` : delta}`);
    } catch (err) {
      showFeedback("Failed to adjust stock", "error");
    }
  };

  const handleToggleTrackStock = async (itemId, currentVal) => {
    try {
      await onUpdateStock(itemId, { trackStock: !currentVal });
      showFeedback(`Stock tracking ${!currentVal ? "enabled" : "disabled"}`);
    } catch (err) {
      showFeedback("Failed to toggle stock tracking", "error");
    }
  };

  // Inline stock edit save
  const handleSaveInlineStock = async (itemId) => {
    const qty = parseInt(inlineStockValue);
    if (isNaN(qty) || qty < 0) {
      showFeedback("Please enter a valid stock quantity (0 or greater)", "error");
      return;
    }
    try {
      await onUpdateStock(itemId, { stockQuantity: qty, trackStock: true });
      setInlineEditingId(null);
      showFeedback(`Stock updated to ${qty}`);
    } catch (err) {
      showFeedback("Failed to update stock", "error");
    }
  };

  // Manual Stock Submit (Modal)
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (modalTab === "restock") {
      if (!activeSelectedItem) {
        showFeedback("Please select an item to restock", "error");
        return;
      }
      const qtyNum = parseInt(manualQuantity);
      if (isNaN(qtyNum) || (manualMode === "add" && qtyNum <= 0) || (manualMode === "set" && qtyNum < 0)) {
        showFeedback("Please enter a valid positive quantity", "error");
        return;
      }

      setLoading(true);
      try {
        const payload = {
          trackStock: true,
          lowStockThreshold: parseInt(manualThreshold) || 5
        };

        if (manualMode === "add") {
          payload.delta = qtyNum;
        } else {
          payload.stockQuantity = qtyNum;
        }

        await onUpdateStock(activeSelectedItem._id, payload);
        setIsManualModalOpen(false);
        showFeedback(
          manualMode === "add"
            ? `Successfully added +${qtyNum} units to "${activeSelectedItem.name}"`
            : `Set stock for "${activeSelectedItem.name}" to ${qtyNum}`
        );
      } catch (err) {
        showFeedback("Failed to update stock", "error");
      } finally {
        setLoading(false);
      }
    } else {
      // Create new inventory item
      if (!newItemForm.name.trim()) {
        showFeedback("Item name is required", "error");
        return;
      }
      const cat = newItemForm.category === "__custom__"
        ? newItemForm.customCategory.trim()
        : newItemForm.category.trim();

      if (!cat) {
        showFeedback("Category is required", "error");
        return;
      }
      if (newItemForm.price === "" || isNaN(Number(newItemForm.price))) {
        showFeedback("Please enter a valid price", "error");
        return;
      }

      setLoading(true);
      try {
        const itemPayload = {
          name: newItemForm.name.trim(),
          category: cat,
          price: Number(newItemForm.price),
          stockQuantity: Math.max(0, parseInt(newItemForm.stockQuantity) || 0),
          lowStockThreshold: Math.max(0, parseInt(newItemForm.lowStockThreshold) || 5),
          isVeg: newItemForm.isVeg,
          description: newItemForm.description.trim(),
          trackStock: true
        };

        if (onAddInventoryItem) {
          await onAddInventoryItem(itemPayload);
        } else if (onAddItem) {
          await onAddItem(itemPayload);
        }

        setIsManualModalOpen(false);
        setNewItemForm({
          name: "",
          category: "",
          customCategory: "",
          price: "",
          stockQuantity: "25",
          lowStockThreshold: "5",
          isVeg: true,
          description: ""
        });
        showFeedback(`Created "${itemPayload.name}" with initial stock of ${itemPayload.stockQuantity}!`);
      } catch (err) {
        showFeedback("Failed to create inventory item", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updates = Object.entries(bulkInputs)
        .filter(([_, qty]) => qty !== "")
        .map(([itemId, stockQuantity]) => ({
          itemId,
          stockQuantity: parseInt(stockQuantity) || 0
        }));

      if (updates.length > 0) {
        await onBulkRestock(updates);
        setIsBulkModalOpen(false);
        setBulkInputs({});
        showFeedback(`Bulk restocked ${updates.length} items`);
      }
    } catch (err) {
      showFeedback("Failed to apply bulk restock", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold border shadow-lg transition-all animate-in fade-in slide-in-from-top-2 ${
            feedback.type === "error"
              ? "bg-rose-500/15 border-rose-500/30 text-rose-300"
              : "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "error" ? (
              <LuTriangleAlert className="w-4 h-4 text-rose-400" />
            ) : (
              <LuCheck className="w-4 h-4 text-emerald-400" />
            )}
            <span>{feedback.msg}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <LuX className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <LuBoxes className="w-5 h-5 text-violet-400" />
            Inventory & Stock Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time stock tracking, low-inventory alerts, auto-decrement on orders, and manual restocking
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onRefresh}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition-all cursor-pointer"
            title="Refresh Inventory"
          >
            <LuRefreshCw className="w-4 h-4" />
          </button>

          {/* Primary CTA: Add Stock Manually */}
          <button
            onClick={() => openManualModal()}
            data-tour="inv-add-btn"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition-all cursor-pointer active:scale-95"
          >
            <LuPackagePlus className="w-4 h-4" />
            <span>Add Stock Manually</span>
          </button>

          <button
            onClick={() => {
              const initial = {};
              items.forEach((i) => {
                if (i.trackStock) initial[i._id] = i.stockQuantity;
              });
              setBulkInputs(initial);
              setIsBulkModalOpen(true);
            }}
            data-tour="inv-restock-btn"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold border border-white/10 transition-all cursor-pointer"
          >
            <LuLayers className="w-4 h-4 text-violet-400" />
            Bulk Restock
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div data-tour="inventory-summary-cards" className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#131322] border border-white/5">
          <span className="text-xs font-medium text-slate-400">Total Menu Items</span>
          <div className="text-2xl font-black text-white mt-1 font-mono">
            {summary.totalItems ?? items.length}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[#131322] border border-white/5">
          <span className="text-xs font-medium text-violet-400">Tracked Stock Items</span>
          <div className="text-2xl font-black text-violet-400 mt-1 font-mono">
            {summary.trackedCount ?? items.filter((i) => i.trackStock).length}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[#131322] border border-white/5">
          <span className="text-xs font-medium text-amber-400">Low Stock Warnings</span>
          <div className="text-2xl font-black text-amber-400 mt-1 font-mono">
            {summary.lowStockCount || 0}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[#131322] border border-white/5">
          <span className="text-xs font-medium text-rose-400">Out of Stock (86'd)</span>
          <div className="text-2xl font-black text-rose-400 mt-1 font-mono">
            {summary.outOfStockCount || 0}
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-[#131322] border border-white/5">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items by name or category..."
            className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: "all", label: "All Items" },
              { id: "tracked", label: "Tracked" },
              { id: "low", label: "Low Stock ⚠️" },
              { id: "out", label: "Out of Stock ❌" }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === f.id
                    ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Inventory Table or Empty State */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-[#131322] border border-white/5 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mx-auto text-violet-400">
            <LuBoxes className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">No Inventory Items Found</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
              {items.length === 0
                ? "You haven't added any menu dishes or stock items yet. Add stock manually or create your first inventory item to get started."
                : "No dishes match your selected filter. Change filters, clear search terms, or restock items."}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            {items.length > 0 ? (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setSelectedCategory("all");
                }}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-colors"
              >
                Clear Filters
              </button>
            ) : null}
            <button
              onClick={() => openManualModal()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
            >
              <LuPlus className="w-4 h-4" />
              <span>{items.length === 0 ? "Add First Stock Item" : "Add Stock Manually"}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#131322] border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Tracking</th>
                  <th className="py-3 px-4 min-w-[220px]">Current Stock</th>
                  <th className="py-3 px-4">Threshold</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                {filteredItems.map((item) => {
                  const isLow =
                    item.trackStock &&
                    item.stockQuantity <= (item.lowStockThreshold || 5) &&
                    item.stockQuantity > 0 &&
                    !item.isOutOfStock;
                  const isOut =
                    item.isOutOfStock ||
                    (item.trackStock && item.stockQuantity <= 0) ||
                    !item.isAvailable;

                  const isInlineEditing = inlineEditingId === item._id;

                  return (
                    <tr key={item._id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Name */}
                      <td className="py-3.5 px-4 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              item.isVeg ? "bg-emerald-400" : "bg-rose-500"
                            }`}
                            title={item.isVeg ? "Veg" : "Non-Veg"}
                          />
                          <span className="truncate max-w-[200px]">{item.name}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-slate-400">{item.category}</td>

                      {/* Stock Tracking Toggle */}
                      <td className="py-3.5 px-4">
                        <label data-tour="inv-86-toggle" className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(item.trackStock)}
                            onChange={() => handleToggleTrackStock(item._id, item.trackStock)}
                            className="w-4 h-4 rounded border-white/20 bg-black/40 text-violet-600 focus:ring-0 cursor-pointer"
                          />
                          <span className={`text-[11px] font-medium ${item.trackStock ? "text-violet-300" : "text-slate-500"}`}>
                            {item.trackStock ? "Enabled" : "Off"}
                          </span>
                        </label>
                      </td>

                      {/* Current Stock (with inline edit, buttons & restock) */}
                      <td className="py-3.5 px-4">
                        {item.trackStock ? (
                          isInlineEditing ? (
                            <div className="flex items-center gap-1.5 bg-black/50 p-1 rounded-xl border border-violet-500/50 w-fit">
                              <input
                                type="number"
                                min="0"
                                value={inlineStockValue}
                                onChange={(e) => setInlineStockValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveInlineStock(item._id);
                                  if (e.key === "Escape") setInlineEditingId(null);
                                }}
                                autoFocus
                                className="w-16 bg-black/70 border border-white/20 rounded-lg px-2 py-1 text-xs text-white font-mono text-center focus:outline-none focus:border-violet-500"
                              />
                              <button
                                onClick={() => handleSaveInlineStock(item._id)}
                                className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                                title="Save"
                              >
                                <LuCheck className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setInlineEditingId(null)}
                                className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 transition-colors"
                                title="Cancel"
                              >
                                <LuX className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                onClick={() => handleStockDelta(item._id, -1)}
                                disabled={item.stockQuantity <= 0}
                                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 active:bg-rose-600/20 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-slate-300 transition-colors cursor-pointer"
                                title="Decrease by 1"
                              >
                                <LuMinus className="w-3 h-3" />
                              </button>

                              {/* Editable Stock Badge */}
                              <button
                                onClick={() => {
                                  setInlineEditingId(item._id);
                                  setInlineStockValue(String(item.stockQuantity));
                                }}
                                className={`group flex items-center gap-1 font-mono font-bold text-xs px-2.5 py-1 rounded-lg border cursor-pointer transition-all hover:scale-105 ${
                                  isOut
                                    ? "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:border-rose-500/40"
                                    : isLow
                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:border-amber-500/40"
                                    : "bg-white/5 text-white border-white/10 hover:border-violet-500/40"
                                }`}
                                title="Click to manually edit exact quantity"
                              >
                                <span>{item.stockQuantity}</span>
                                <LuPencil className="w-2.5 h-2.5 text-slate-400 opacity-60 group-hover:opacity-100 group-hover:text-violet-300" />
                              </button>

                              <button
                                onClick={() => handleStockDelta(item._id, 1)}
                                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 active:bg-emerald-600/20 flex items-center justify-center text-slate-300 transition-colors cursor-pointer"
                                title="Increase by 1"
                              >
                                <LuPlus className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleStockDelta(item._id, 5)}
                                className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-mono text-slate-300 transition-colors cursor-pointer"
                                title="Add 5"
                              >
                                +5
                              </button>
                            </div>
                          )
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 italic text-[11px]">Unlimited</span>
                            <button
                              onClick={() => openManualModal(item)}
                              className="px-2 py-0.5 rounded-lg bg-violet-600/15 hover:bg-violet-600/30 text-violet-300 text-[10px] font-semibold border border-violet-500/20 transition-all cursor-pointer"
                              title="Enable and add stock"
                            >
                              + Track
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Threshold */}
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {item.trackStock ? item.lowStockThreshold || 5 : "—"}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            <LuPackageX className="w-3 h-3" /> Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <LuTriangleAlert className="w-3 h-3" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <LuPackageCheck className="w-3 h-3" /> Available
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openManualModal(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/30 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                            title="Manually add or set stock"
                          >
                            <LuPackagePlus className="w-3.5 h-3.5" />
                            <span>Restock</span>
                          </button>

                          <button
                            onClick={() => onToggle86(item._id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              item.isOutOfStock || !item.isAvailable
                                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30"
                                : "bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30"
                            }`}
                          >
                            {item.isOutOfStock || !item.isAvailable ? "Restore" : "86"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MANUAL STOCK MANAGEMENT MODAL */}
      {/* =================================================================== */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-[#12121e] border border-white/10 rounded-3xl shadow-2xl p-6 text-white max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                  <LuPackagePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Manual Stock Management</h3>
                  <p className="text-[11px] text-slate-400">Add inventory units or initialize new stock</p>
                </div>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <LuX className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex rounded-xl bg-black/40 p-1 border border-white/5 mb-5">
              <button
                type="button"
                onClick={() => setModalTab("restock")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  modalTab === "restock"
                    ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Restock Existing Item
              </button>
              <button
                type="button"
                onClick={() => setModalTab("new")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  modalTab === "new"
                    ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                + New Tracked Item
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              {modalTab === "restock" ? (
                <>
                  {/* Select Item */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Select Menu Dish / Product
                    </label>
                    {selectableItems.length === 0 ? (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                        No menu items found. Please switch to the <strong>"+ New Tracked Item"</strong> tab above to create an item.
                      </div>
                    ) : (
                      <select
                        value={activeSelectedItem?._id || ""}
                        onChange={(e) => {
                          setManualItemId(e.target.value);
                          const it = selectableItems.find((i) => i._id === e.target.value);
                          if (it) {
                            setManualThreshold(String(it.lowStockThreshold || 5));
                          }
                        }}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                      >
                        {selectableItems.map((item) => (
                          <option key={item._id} value={item._id} className="bg-[#12121e]">
                            {item.name} ({item.category}) — Current: {item.trackStock ? `${item.stockQuantity} in stock` : "Unlimited"}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {activeSelectedItem && (
                    <>
                      {/* Active Item Status Card */}
                      <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-white block">{activeSelectedItem.name}</span>
                          <span className="text-[11px] text-slate-400">{activeSelectedItem.category}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 block">Current Stock</span>
                          <span className="font-mono font-bold text-sm text-violet-400">
                            {activeSelectedItem.trackStock ? `${activeSelectedItem.stockQuantity} units` : "Untracked"}
                          </span>
                        </div>
                      </div>

                      {/* Operation Type Toggle */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Adjustment Type
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setManualMode("add")}
                            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                              manualMode === "add"
                                ? "bg-violet-600/20 border-violet-500 text-violet-300 shadow-sm"
                                : "bg-black/30 border-white/10 text-slate-400 hover:text-white"
                            }`}
                          >
                            <LuPlus className="w-3.5 h-3.5" />
                            Add to Current Stock
                          </button>
                          <button
                            type="button"
                            onClick={() => setManualMode("set")}
                            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                              manualMode === "set"
                                ? "bg-violet-600/20 border-violet-500 text-violet-300 shadow-sm"
                                : "bg-black/30 border-white/10 text-slate-400 hover:text-white"
                            }`}
                          >
                            <LuCheck className="w-3.5 h-3.5" />
                            Set Exact Count
                          </button>
                        </div>
                      </div>

                      {/* Quantity Input with Quick Presets */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-semibold text-slate-300">
                            {manualMode === "add" ? "Units to Add (+)" : "New Exact Stock Quantity"}
                          </label>
                          <span className="text-[10px] text-slate-400">Quick add:</span>
                        </div>
                        <div className="space-y-2">
                          <input
                            type="number"
                            min="0"
                            value={manualQuantity}
                            onChange={(e) => setManualQuantity(e.target.value)}
                            placeholder={manualMode === "add" ? "e.g. 20" : "e.g. 50"}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-mono font-bold focus:outline-none focus:border-violet-500"
                            required
                          />
                          {/* Quick Chips */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {[5, 10, 25, 50, 100].map((n) => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => {
                                  if (manualMode === "add") {
                                    const curr = parseInt(manualQuantity) || 0;
                                    setManualQuantity(String(curr + n));
                                  } else {
                                    setManualQuantity(String(n));
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-violet-600/20 hover:text-violet-300 text-slate-300 text-[11px] font-mono font-semibold border border-white/5 transition-all"
                              >
                                +{n}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => setManualQuantity("0")}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[11px] font-mono border border-rose-500/20 transition-all"
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Calculation Preview Banner */}
                      <div className="p-3 rounded-xl bg-violet-900/20 border border-violet-500/30 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-violet-300">
                          <LuSparkles className="w-4 h-4 text-violet-400 shrink-0" />
                          <span>New Stock Result:</span>
                        </div>
                        <div className="font-mono font-black text-sm text-white">
                          {manualMode === "add" ? (
                            <span>
                              {(activeSelectedItem.stockQuantity || 0)} + {parseInt(manualQuantity) || 0} ={" "}
                              <span className="text-emerald-400 font-bold">
                                {(activeSelectedItem.stockQuantity || 0) + (parseInt(manualQuantity) || 0)} units
                              </span>
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-bold">
                              {parseInt(manualQuantity) || 0} units
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Low Stock Threshold & Reason */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            Low-Stock Alert
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={manualThreshold}
                            onChange={(e) => setManualThreshold(e.target.value)}
                            placeholder="Threshold"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-violet-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            Restock Reason
                          </label>
                          <select
                            value={manualReason}
                            onChange={(e) => setManualReason(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                          >
                            <option value="Supplier Restock">Supplier Restock</option>
                            <option value="Daily Kitchen Prep">Daily Kitchen Prep</option>
                            <option value="Inventory Audit Count">Inventory Audit Count</option>
                            <option value="Customer Return">Customer Return</option>
                            <option value="Damage / Spoilage Adjustment">Damage / Spoilage</option>
                            <option value="Other">Other Adjustment</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : (
                /* Mode 2: Create New Inventory Item */
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Item / Dish Name *
                    </label>
                    <input
                      type="text"
                      value={newItemForm.name}
                      onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
                      placeholder="e.g. Arabica Roast Espresso Beans (1kg)"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Category *
                      </label>
                      <select
                        value={newItemForm.category}
                        onChange={(e) => setNewItemForm({ ...newItemForm, category: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                        <option value="Beverages">Beverages</option>
                        <option value="Bakery">Bakery</option>
                        <option value="Snacks">Snacks</option>
                        <option value="Main Course">Main Course</option>
                        <option value="Desserts">Desserts</option>
                        <option value="__custom__">+ Custom Category</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Price (₹) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newItemForm.price}
                        onChange={(e) => setNewItemForm({ ...newItemForm, price: e.target.value })}
                        placeholder="e.g. 240"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-violet-500"
                        required
                      />
                    </div>
                  </div>

                  {newItemForm.category === "__custom__" && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Enter Custom Category Name
                      </label>
                      <input
                        type="text"
                        value={newItemForm.customCategory}
                        onChange={(e) => setNewItemForm({ ...newItemForm, customCategory: e.target.value })}
                        placeholder="e.g. Coffee Beans / Merchandise"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                        required
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Initial Stock Quantity *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newItemForm.stockQuantity}
                        onChange={(e) => setNewItemForm({ ...newItemForm, stockQuantity: e.target.value })}
                        placeholder="25"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-violet-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Low Stock Alert *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newItemForm.lowStockThreshold}
                        onChange={(e) => setNewItemForm({ ...newItemForm, lowStockThreshold: e.target.value })}
                        placeholder="5"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-violet-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Veg Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/5">
                    <span className="text-xs text-slate-300">Food Type</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setNewItemForm({ ...newItemForm, isVeg: true })}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          newItemForm.isVeg
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                            : "bg-white/5 border-transparent text-slate-400"
                        }`}
                      >
                        Veg
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewItemForm({ ...newItemForm, isVeg: false })}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          !newItemForm.isVeg
                            ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                            : "bg-white/5 border-transparent text-slate-400"
                        }`}
                      >
                        Non-Veg
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Description (optional)
                    </label>
                    <textarea
                      rows={2}
                      value={newItemForm.description}
                      onChange={(e) => setNewItemForm({ ...newItemForm, description: e.target.value })}
                      placeholder="Brief notes, brand, supplier details..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || (modalTab === "restock" && !activeSelectedItem)}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-violet-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading
                    ? "Saving..."
                    : modalTab === "restock"
                    ? "Save & Update Stock"
                    : "Create & Add to Inventory"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* BULK RESTOCK MODAL */}
      {/* =================================================================== */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-[#12121e] border border-white/10 rounded-3xl shadow-2xl p-6 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <LuLayers className="w-4 h-4 text-violet-400" />
                Bulk Restock Items
              </h3>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <LuX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <p className="text-xs text-slate-400">
                Update stock quantities in batch. Items will automatically have stock tracking enabled.
              </p>

              {items.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No items available for bulk restock. Use <strong>"Add Stock Manually"</strong> to create items first.
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1 divide-y divide-white/5">
                  {items.map((item) => (
                    <div key={item._id} className="pt-2 flex items-center justify-between gap-4 text-xs">
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-white block truncate">{item.name}</span>
                        <span className="text-[11px] text-slate-400">{item.category}</span>
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          min="0"
                          placeholder="Quantity"
                          value={bulkInputs[item._id] ?? ""}
                          onChange={(e) =>
                            setBulkInputs({ ...bulkInputs, [item._id]: e.target.value })
                          }
                          className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono text-center focus:outline-none focus:border-violet-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || items.length === 0}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white shadow-lg shadow-violet-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Apply Bulk Restock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
