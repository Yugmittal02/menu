import React, { useState, useMemo } from 'react';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCopy,
  FiImage,
  FiClock,
  FiSearch,
  FiCheck,
  FiX
} from 'react-icons/fi';
import EmptyState from '../ui/EmptyState';
import ConfirmModal from '../ui/ConfirmModal';

const CAT_COLORS = [
  '#7C3AED',
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#F43F5E',
  '#14B8A6',
  '#D946EF',
  '#D4A574'
];

const MenuTab = ({
  menu = [],
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onToggleItem,
  uploadImage
}) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    isVeg: true,
    image: '',
    preparationTime: 15
  });

  // Extract all categories
  const categories = useMemo(() => {
    const set = new Set();
    menu.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set);
  }, [menu]);

  // Filtered menu
  const filteredMenu = useMemo(() => {
    return menu.filter((item) => {
      const matchCat =
        selectedCategory === 'All' || item.category === selectedCategory;
      const matchSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description &&
          item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [menu, selectedCategory, searchQuery]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm({
      name: '',
      description: '',
      price: '',
      category: categories[0] || 'Main Course',
      isVeg: true,
      image: '',
      preparationTime: 15
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name || '',
      description: item.description || '',
      price: item.price || '',
      category: item.category || '',
      isVeg: item.isVeg !== undefined ? item.isVeg : true,
      image: item.image || '',
      preparationTime: item.preparationTime || 15
    });
    setShowModal(true);
  };

  const handleDuplicate = (item) => {
    setEditingItem(null);
    setForm({
      name: `${item.name} (Copy)`,
      description: item.description || '',
      price: item.price || '',
      category: item.category || '',
      isVeg: item.isVeg,
      image: item.image || '',
      preparationTime: item.preparationTime || 15
    });
    setShowModal(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !uploadImage) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await uploadImage(formData);
      setForm((prev) => ({ ...prev, image: data.url }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      price: Number(form.price),
      preparationTime: Number(form.preparationTime) || 15
    };

    if (editingItem) {
      await onUpdateItem(editingItem._id, payload);
    } else {
      await onAddItem(payload);
    }
    setShowModal(false);
    setEditingItem(null);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header bar: Title, Search, Category count, Add Item button */}
      <div
        className="p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3"
        style={{
          backgroundColor: '#11111D',
          border: '1px solid rgba(255, 255, 255, 0.07)'
        }}
      >
        <div className="flex items-center gap-3">
          <h2 className="text-base md:text-lg font-bold text-white">Menu Management</h2>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#7C3AED]/20 text-[#A78BFA]">
            {menu.length} {menu.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-64">
            <FiSearch
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: '#707089' }}
              size={14}
            />
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs text-white placeholder-[#707089] outline-none"
              style={{
                backgroundColor: '#151523',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            />
          </div>

          {/* Add Item CTA button */}
          <button
            data-tour="menu-add-btn"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:brightness-110 active:scale-95 shadow-md"
            style={{
              background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
            }}
          >
            <FiPlus size={15} />
            <span>Add Menu Item</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div data-tour="menu-categories" className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        <button
          onClick={() => setSelectedCategory('All')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
            selectedCategory === 'All'
              ? 'bg-[#7C3AED] text-white font-semibold'
              : 'bg-[#11111D] text-[#A1A1B5] hover:text-white border border-white/[0.06]'
          }`}
        >
          All Items ({menu.length})
        </button>

        {categories.map((cat, idx) => {
          const count = menu.filter((i) => i.category === cat).length;
          const active = selectedCategory === cat;
          const color = CAT_COLORS[idx % CAT_COLORS.length];

          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                active
                  ? 'text-white font-semibold'
                  : 'text-[#A1A1B5] hover:text-white border border-white/[0.06]'
              }`}
              style={{
                backgroundColor: active ? color : '#11111D'
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: active ? '#fff' : color }}
              />
              <span>{cat}</span>
              <span className="text-[10px] opacity-75 font-mono">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Menu Items Grid */}
      {filteredMenu.length === 0 ? (
        <EmptyState
          emoji="🍽️"
          title={menu.length === 0 ? 'Your menu is empty' : 'No items match your search'}
          description={
            menu.length === 0
              ? 'Add your first menu item with photos and pricing to start accepting digital table orders.'
              : 'Try selecting a different category or clearing your search term.'
          }
          actionText={menu.length === 0 ? 'Add Menu Item' : 'Clear Filters'}
          onAction={
            menu.length === 0 ? handleOpenAdd : () => {
              setSelectedCategory('All');
              setSearchQuery('');
            }
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMenu.map((item) => {
            const isAvailable = item.isAvailable !== false;

            return (
              <div
                key={item._id}
                className={`rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 border ${
                  !isAvailable ? 'opacity-50 grayscale' : 'hover:border-white/[0.15]'
                }`}
                style={{
                  backgroundColor: '#11111D',
                  borderColor: 'rgba(255, 255, 255, 0.07)'
                }}
              >
                <div>
                  {/* Top row: Image thumbnail + Basic Info */}
                  <div className="flex items-start gap-3 mb-3">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-white/[0.08]"
                      />
                    ) : (
                      <div
                        className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl"
                        style={{ backgroundColor: '#151523', border: '1px solid rgba(255, 255, 255, 0.06)' }}
                      >
                        🍽️
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            item.isVeg
                              ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                              : 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
                          }`}
                        >
                          {item.isVeg ? 'VEG' : 'NON-VEG'}
                        </span>
                        <span className="text-[10px] text-[#707089] px-1.5 py-0.5 rounded bg-white/5 truncate max-w-[110px]">
                          {item.category}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white truncate leading-tight">
                        {item.name}
                      </h3>
                      <p className="text-xs text-[#8E8EA8] line-clamp-2 mt-1">
                        {item.description || 'No description provided'}
                      </p>
                    </div>
                  </div>

                  {/* Price & Prep time */}
                  <div className="flex items-center justify-between py-2 border-y border-white/[0.05] text-xs">
                    <div className="font-mono font-bold text-base text-[#10B981]">
                      ₹{item.price}
                    </div>
                    {item.preparationTime && (
                      <div className="flex items-center gap-1 text-[#707089]">
                        <FiClock size={12} />
                        <span>{item.preparationTime} mins</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="flex items-center justify-between pt-3 mt-2">
                  {/* Stock Availability toggle */}
                  <button
                    onClick={() => onToggleItem(item._id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                      isAvailable
                        ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                        : 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
                    }`}
                    title={isAvailable ? 'Click to mark Out of Stock' : 'Click to mark In Stock'}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isAvailable ? 'bg-[#10B981]' : 'bg-[#EF4444]'
                      }`}
                    />
                    <span>{isAvailable ? 'In Stock' : 'Out of Stock'}</span>
                  </button>

                  {/* Edit, Duplicate, Delete buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDuplicate(item)}
                      className="p-1.5 rounded-lg text-[#707089] hover:text-white hover:bg-white/5 transition-colors"
                      title="Duplicate item"
                    >
                      <FiCopy size={14} />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg text-[#A78BFA] hover:bg-[#7C3AED]/15 transition-colors"
                      title="Edit item"
                    >
                      <FiEdit2 size={14} />
                    </button>
                    <button
                      onClick={() => setItemToDelete(item)}
                      className="p-1.5 rounded-lg text-[#EF4444] hover:bg-[#EF4444]/15 transition-colors"
                      title="Delete item"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Item Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div
            className="w-full max-w-lg rounded-2xl p-6 shadow-2xl transition-all max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: '#151523',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08]">
              <h3 className="text-base font-bold text-white">
                {editingItem ? '✏️ Edit Menu Item' : '➕ Add New Menu Item'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#707089] hover:text-white p-1 rounded-lg"
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs text-[#8E8EA8] block mb-1">Item Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Truffle Mushroom Pizza"
                    className="w-full px-3.5 py-2 rounded-xl text-xs md:text-sm text-white bg-[#11111D] border border-white/[0.08] outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#8E8EA8] block mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="e.g. 299"
                    className="w-full px-3.5 py-2 rounded-xl text-xs md:text-sm text-white bg-[#11111D] border border-white/[0.08] outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#8E8EA8] block mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    list="category-suggestions"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="Select or enter category"
                    className="w-full px-3.5 py-2 rounded-xl text-xs md:text-sm text-white bg-[#11111D] border border-white/[0.08] outline-none focus:border-[#7C3AED]"
                  />
                  <datalist id="category-suggestions">
                    {categories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                    <option value="Starters" />
                    <option value="Main Course" />
                    <option value="Pizza" />
                    <option value="Burger" />
                    <option value="Beverages" />
                    <option value="Desserts" />
                  </datalist>
                </div>

                <div>
                  <label className="text-xs text-[#8E8EA8] block mb-1">Prep Time (mins)</label>
                  <input
                    type="number"
                    min="1"
                    value={form.preparationTime}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        preparationTime: parseInt(e.target.value) || 15
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl text-xs md:text-sm text-white bg-[#11111D] border border-white/[0.08] outline-none focus:border-[#7C3AED]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#8E8EA8] block mb-1">Description</label>
                <textarea
                  rows="2"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short, delicious description for the customer menu..."
                  className="w-full px-3.5 py-2 rounded-xl text-xs md:text-sm text-white bg-[#11111D] border border-white/[0.08] outline-none focus:border-[#7C3AED]"
                />
              </div>

              {/* Veg Toggle + Photo Upload */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-xl bg-[#11111D] border border-white/[0.06]">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isVeg}
                    onChange={(e) => setForm({ ...form, isVeg: e.target.checked })}
                    className="w-4 h-4 rounded accent-[#10B981]"
                  />
                  <span className="text-xs font-semibold text-white">Vegetarian Dish</span>
                </label>

                <div className="flex items-center gap-2.5">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-[#A78BFA] bg-[#7C3AED]/15 border border-[#7C3AED]/30 hover:bg-[#7C3AED]/25 cursor-pointer transition-colors">
                    <FiImage size={13} />
                    <span>{uploading ? 'Uploading...' : 'Upload Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>

                  {form.image && (
                    <div className="relative inline-block">
                      <img
                        src={form.image}
                        alt="Preview"
                        className="w-10 h-10 rounded-lg object-cover border border-white/10"
                      />
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, image: '' }))}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] hover:bg-rose-700 shadow"
                        title="Remove photo"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#A1A1B5] hover:text-white bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#7C3AED] hover:bg-[#6D28D9] transition-all shadow-md active:scale-95"
                >
                  {editingItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Delete Menu Item"
        message={`Are you sure you want to permanently delete "${itemToDelete?.name}"? Customers will no longer be able to order this item.`}
        confirmText="Delete"
        danger
        onCancel={() => setItemToDelete(null)}
        onConfirm={async () => {
          if (itemToDelete) {
            await onDeleteItem(itemToDelete._id);
            setItemToDelete(null);
          }
        }}
      />
    </div>
  );
};

export default MenuTab;
