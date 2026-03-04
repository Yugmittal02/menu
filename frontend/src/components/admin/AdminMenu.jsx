import React, { useState, useEffect, useMemo } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaExclamationTriangle } from 'react-icons/fa';
import { fetchCategories } from '../../services/api';

const AdminMenu = ({
    products,
    onAdd,
    onEdit,
    onDelete,
    onToggleAvailability,
    onClearAll
}) => {
    const [search, setSearch] = useState('');
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [categories, setCategories] = useState([]);
    const [catLoading, setCatLoading] = useState(true);
    const [activeCatFilter, setActiveCatFilter] = useState('All');

    useEffect(() => {
        const loadCats = async () => {
            try {
                const { data } = await fetchCategories();
                setCategories(data.filter(c => c.isActive));
            } catch (err) {
                console.error('Failed to load categories:', err);
            }
            setCatLoading(false);
        };
        loadCats();
    }, []);

    // Get category display name for a product
    const getCatName = (product) => {
        if (product.category && typeof product.category === 'object') {
            return product.category.name || '';
        }
        return typeof product.category === 'string' ? product.category : '';
    };

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const catName = getCatName(p);
            // Text search
            const matchesSearch = search === '' ||
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                catName.toLowerCase().includes(search.toLowerCase());

            // Category filter
            const matchesCat = activeCatFilter === 'All' ||
                (p.category && typeof p.category === 'object' && p.category._id === activeCatFilter);

            return matchesSearch && matchesCat;
        });
    }, [products, search, activeCatFilter]);

    return (
        <div className="px-4 pb-20 pt-4">
            {/* Header & Search */}
            <div className="sticky top-0 z-30 pb-4 space-y-3" style={{ background: '#FAF7F2' }}>
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-black" style={{ color: '#1C1C1C' }}>Menu</h2>
                    <div className="flex gap-2">
                        {products.length > 0 && (
                            <button
                                onClick={() => setShowClearConfirm(true)}
                                className="px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 active:scale-95 transition-transform text-sm"
                                style={{ background: '#FEE2E2', color: '#DC2626', border: '2px solid #FECACA' }}
                            >
                                <FaTrash size={11} /> Clear All
                            </button>
                        )}
                        <button
                            onClick={onAdd}
                            className="px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-white active:scale-95 transition-transform"
                            style={{ background: 'linear-gradient(135deg, #C97B4B 0%, #E8956A 100%)', boxShadow: '0 4px 16px rgba(201, 123, 75, 0.3)' }}
                        >
                            <FaPlus size={12} /> Add Item
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#A0998F' }} />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl outline-none transition-all"
                        style={{ background: '#FFFFFF', border: '2px solid #E8E3DB', color: '#1C1C1C' }}
                        onFocus={(e) => e.target.style.borderColor = '#C97B4B'}
                        onBlur={(e) => e.target.style.borderColor = '#E8E3DB'}
                    />
                </div>

                {/* Category Filter Bar */}
                <div className="flex overflow-x-auto gap-2 pb-1 hide-scrollbar">
                    {catLoading ? (
                        // Skeleton pills
                        [...Array(4)].map((_, i) => (
                            <div key={i} className="flex-shrink-0 w-20 h-8 rounded-full animate-pulse" style={{ background: '#E8E3DB' }} />
                        ))
                    ) : (
                        <>
                            <button
                                onClick={() => setActiveCatFilter('All')}
                                className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95"
                                style={activeCatFilter === 'All'
                                    ? { background: '#C97B4B', color: '#FFFFFF', boxShadow: '0 2px 8px rgba(201,123,75,0.3)' }
                                    : { background: '#FFFFFF', color: '#5C3A2A', border: '1.5px solid #E8E3DB' }
                                }
                            >
                                All ({products.length})
                            </button>
                            {categories.map((cat) => {
                                const count = products.filter(p => p.category && typeof p.category === 'object' && p.category._id === cat._id).length;
                                return (
                                    <button
                                        key={cat._id}
                                        onClick={() => setActiveCatFilter(cat._id)}
                                        className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 whitespace-nowrap"
                                        style={activeCatFilter === cat._id
                                            ? { background: cat.colorFrom || '#C97B4B', color: '#FFFFFF', boxShadow: `0 2px 8px ${cat.colorFrom || '#C97B4B'}30` }
                                            : { background: '#FFFFFF', color: '#5C3A2A', border: '1.5px solid #E8E3DB' }
                                        }
                                    >
                                        {cat.icon || '📦'} {cat.name} ({count})
                                    </button>
                                );
                            })}
                        </>
                    )}
                </div>
            </div>

            {/* Empty State */}
            {filteredProducts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4"
                        style={{ background: 'linear-gradient(135deg, #FEF3E2 0%, #FDE8CC 100%)', border: '3px solid #E8E3DB' }}>
                        <span className="text-4xl">🍰</span>
                    </div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: '#1C1C1C' }}>No items yet</h3>
                    <p className="mb-6" style={{ color: '#7E7E7E' }}>Add your first menu item to get started!</p>
                    <button
                        onClick={onAdd}
                        className="px-8 py-3 rounded-full text-white font-bold active:scale-95 transition-transform"
                        style={{ background: 'linear-gradient(135deg, #C97B4B 0%, #E8956A 100%)', boxShadow: '0 8px 24px rgba(201, 123, 75, 0.3)' }}
                    >
                        <FaPlus className="inline mr-2" size={12} /> Add First Item
                    </button>
                </div>
            )}

            {/* Product Cards */}
            <div className="space-y-3">
                {filteredProducts.map((product) => (
                    <div key={product._id}
                        className={`p-3 rounded-2xl flex gap-3 transition-opacity ${!product.isAvailable ? 'opacity-60' : ''}`}
                        style={{ background: '#FFFFFF', border: '2px solid #E8E3DB', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        {/* Image */}
                        <div className="w-24 h-24 rounded-xl flex-shrink-0 bg-cover bg-center overflow-hidden"
                            style={{ backgroundImage: product.image ? `url(${product.image})` : 'none', border: '2px solid #E8E3DB' }}>
                            {!product.image && <div className="flex items-center justify-center h-full text-2xl" style={{ background: '#FAF7F2' }}>🍰</div>}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                            <div>
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-sm truncate pr-2" style={{ color: '#1C1C1C' }}>{product.name}</h3>
                                    <p className="font-bold" style={{ color: '#C97B4B' }}>₹{product.basePrice}</p>
                                </div>
                                <p className="text-xs" style={{ color: '#A0998F' }}>
                                    {getCatName(product)}
                                    {product.isBestseller && (
                                        <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: '#FEF3E2', color: '#C97B4B', border: '1px solid #E8E3DB' }}>⭐ Bestseller</span>
                                    )}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-end justify-between gap-3 mt-2">
                                <button
                                    onClick={() => onToggleAvailability(product)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold flex-1 transition-colors"
                                    style={product.isAvailable
                                        ? { background: '#DCFCE7', color: '#16A34A' }
                                        : { background: '#FEE2E2', color: '#DC2626' }
                                    }
                                >
                                    {product.isAvailable ? 'In Stock' : 'Out of Stock'}
                                </button>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onEdit(product)}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                                        style={{ background: '#FEF3E2', color: '#C97B4B', border: '1px solid #E8E3DB' }}
                                    >
                                        <FaEdit size={12} />
                                    </button>
                                    <button
                                        onClick={() => onDelete(product._id)}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                                        style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA' }}
                                    >
                                        <FaTrash size={12} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Clear All Confirmation Modal */}
            {showClearConfirm && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
                                style={{ background: '#FEE2E2' }}>
                                <FaExclamationTriangle size={28} style={{ color: '#DC2626' }} />
                            </div>
                            <h3 className="text-xl font-bold mb-2" style={{ color: '#1C1C1C' }}>Clear All Menu Items?</h3>
                            <p className="text-sm" style={{ color: '#7E7E7E' }}>
                                This will permanently delete <span className="font-bold" style={{ color: '#DC2626' }}>{products.length} items</span> from the menu. This cannot be undone.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowClearConfirm(false)}
                                className="flex-1 py-3 font-bold rounded-xl active:scale-95 transition-transform"
                                style={{ background: '#FAF7F2', color: '#7E7E7E', border: '2px solid #E8E3DB' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => { onClearAll(); setShowClearConfirm(false); }}
                                className="flex-1 py-3 font-bold rounded-xl text-white active:scale-95 transition-transform"
                                style={{ background: '#DC2626', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)' }}
                            >
                                Delete All
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminMenu;
