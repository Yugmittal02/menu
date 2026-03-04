import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { FaArrowLeft, FaSearch, FaShoppingCart, FaFire } from 'react-icons/fa';
import { fetchProducts, fetchCategoryBySlug } from '../services/api';
import { useCart } from '../context/CartContext';
import ProductCardNew from '../components/ProductCardNew';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import Footer from '../components/Footer';

// Fallback theme if API doesn't return colors
const DEFAULT_THEME = { primary: '#C97B4B', light: '#E8956A', glow: 'rgba(201,123,75,0.25)', bg: '#FDF8F4' };

const CategoryPage = () => {
    const { categoryId } = useParams(); // This is now the slug
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { cart = [] } = useCart();

    const [category, setCategory] = useState(null);
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [activeSubcategory, setActiveSubcategory] = useState(() => {
        return searchParams.get('sub') || 'All';
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [sortOption, setSortOption] = useState('recommended');

    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Derive theme from category data
    const theme = useMemo(() => {
        if (!category) return DEFAULT_THEME;
        return {
            primary: category.colorFrom || DEFAULT_THEME.primary,
            light: category.colorTo || DEFAULT_THEME.light,
            glow: `${category.colorFrom || DEFAULT_THEME.primary}40`,
            bg: '#FDF8F4'
        };
    }, [category]);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setLoadError(false);
            try {
                // Fetch category info by slug
                const catRes = await fetchCategoryBySlug(categoryId);
                setCategory(catRes.data);

                // Fetch products filtered by category slug
                const prodRes = await fetchProducts(categoryId);
                setAllProducts(prodRes.data || []);
            } catch (error) {
                console.error('Failed to load:', error);
                setLoadError(true);
                // Fallback: fetch all products and try name match
                try {
                    const { data } = await fetchProducts();
                    setAllProducts(data || []);
                    setLoadError(false);
                } catch (e) {
                    setAllProducts([]);
                }
            }
            setLoading(false);
        };
        loadData();
        setActiveSubcategory('All');
        setSortOption('recommended');
    }, [categoryId]);

    // Collect unique subcategories from loaded products
    const subcategories = useMemo(() => {
        const subs = new Set();
        allProducts.forEach(p => {
            if (Array.isArray(p.subcategories)) {
                p.subcategories.forEach(s => subs.add(s));
            }
        });
        return ['All', ...Array.from(subs).sort()];
    }, [allProducts]);

    const filteredProducts = useMemo(() => {
        let filtered = [...allProducts];

        // Filter by subcategory
        if (activeSubcategory !== 'All') {
            const subLower = activeSubcategory.toLowerCase();
            filtered = filtered.filter(p => {
                const hasSub = Array.isArray(p.subcategories)
                    ? p.subcategories.some(s => s.toLowerCase().includes(subLower))
                    : false;
                return hasSub ||
                    (p.name || '').toLowerCase().includes(subLower);
            });
        }

        // Filter by search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                (p.name || '').toLowerCase().includes(query) ||
                (p.description || '').toLowerCase().includes(query)
            );
        }

        // Apply sort
        if (sortOption === 'low-high') {
            filtered.sort((a, b) => (a.basePrice || 0) - (b.basePrice || 0));
        } else if (sortOption === 'high-low') {
            filtered.sort((a, b) => (b.basePrice || 0) - (a.basePrice || 0));
        } else if (sortOption === 'popular') {
            filtered.sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0) || (b.rating || 0) - (a.rating || 0));
        }
        // 'recommended' = no sort, keep original API order

        return filtered;
    }, [allProducts, activeSubcategory, searchQuery, sortOption]);

    const catName = category?.name || categoryId;
    const catIcon = category?.icon || '📦';

    return (
        <div className="min-h-screen pb-24" style={{ background: theme.bg }}>
            {/* Header */}
            <header className="sticky top-0 z-20 px-4 py-3"
                style={{
                    background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.light} 100%)`,
                    borderBottomLeftRadius: '24px',
                    borderBottomRightRadius: '24px',
                    boxShadow: `0 8px 32px ${theme.glow}`
                }}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform"
                            style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                            <FaArrowLeft size={16} color="#FFFFFF" />
                        </button>
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/menu')}>
                            <span className="text-2xl">{catIcon}</span>
                            <h1 className="text-lg font-bold text-white">{catName}</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowSearch(!showSearch)}
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                            <FaSearch size={14} color="#FFFFFF" />
                        </button>
                        <button onClick={() => navigate('/cart')}
                            className="w-10 h-10 rounded-full flex items-center justify-center relative"
                            style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)' }}>
                            <FaShoppingCart size={14} color="#FFFFFF" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-[10px] flex items-center justify-center font-bold bg-red-500 shadow-sm">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {showSearch && (
                    <div className="mt-3 animate-fade-in">
                        <input
                            type="text"
                            placeholder={`Search in ${catName}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-5 py-3 rounded-full text-sm focus:outline-none"
                            style={{ background: 'rgba(255,255,255,0.95)', border: 'none', color: '#1C1C1C', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
                            autoFocus
                        />
                    </div>
                )}
            </header>

            {/* Hero Banner */}
            <div className="mx-4 mt-4">
                <div className="relative rounded-3xl overflow-hidden" style={{ boxShadow: `0 8px 24px ${theme.glow}` }}>
                    {category?.image ? (
                        <img src={category.image} alt={`${catName} Banner`} className="w-full h-40 md:h-48 object-cover" />
                    ) : (
                        <div className="w-full h-40 md:h-48" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.light})` }} />
                    )}
                    <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${theme.primary}dd 0%, ${theme.light}66 60%, transparent 100%)` }}>
                        <div className="p-5 h-full flex flex-col justify-end">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-white/80 font-semibold">Explore</p>
                            <h2 className="text-2xl font-bold text-white mt-1">{catName}</h2>
                            <p className="text-sm text-white/80 mt-1">
                                {category?.description || 'Freshly made with love ❤️'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subcategory Tabs */}
            {subcategories.length > 1 && (
                <div className="mt-5 px-4">
                    <div className="flex overflow-x-auto pb-3 gap-2 hide-scrollbar snap-x" style={{ WebkitOverflowScrolling: 'touch' }}>
                        {subcategories.map((sub) => (
                            <button
                                key={sub}
                                onClick={() => { setActiveSubcategory(sub); setSortOption('recommended'); }}
                                className="flex-shrink-0 px-5 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap snap-start active:scale-95"
                                style={{
                                    background: activeSubcategory === sub
                                        ? `linear-gradient(135deg, ${theme.primary} 0%, ${theme.light} 100%)`
                                        : '#FFFFFF',
                                    color: activeSubcategory === sub ? 'white' : '#666',
                                    border: activeSubcategory === sub ? 'none' : '1.5px solid #E8E3DB',
                                    boxShadow: activeSubcategory === sub
                                        ? `0 6px 16px ${theme.glow}` : '0 2px 8px rgba(0,0,0,0.04)'
                                }}
                            >
                                {sub}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Sort Options */}
            <div className="px-4 mt-2">
                <div className="flex overflow-x-auto gap-1.5 pb-2 hide-scrollbar">
                    {[
                        { key: 'recommended', label: '✨ Recommended' },
                        { key: 'low-high', label: '💰 Low to High' },
                        { key: 'high-low', label: '💸 High to Low' },
                        { key: 'popular', label: '⭐ Popular' },
                    ].map(opt => (
                        <button
                            key={opt.key}
                            onClick={() => setSortOption(opt.key)}
                            className="flex-shrink-0 px-3 py-1.5 rounded-full transition-all active:scale-95 whitespace-nowrap"
                            style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                background: sortOption === opt.key
                                    ? theme.primary
                                    : '#FFFFFF',
                                color: sortOption === opt.key ? 'white' : '#888',
                                border: sortOption === opt.key ? 'none' : '1px solid #E8E3DB',
                                boxShadow: sortOption === opt.key ? `0 3px 10px ${theme.glow}` : 'none'
                            }}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Products Grid */}
            <div className="px-4 mt-2">
                {loadError && !loading ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                            style={{ background: '#FEF3E2' }}>
                            <span className="text-4xl">😕</span>
                        </div>
                        <h3 className="text-lg font-bold" style={{ color: '#2D1810' }}>
                            Couldn't load {catName} items
                        </h3>
                        <p className="text-sm mt-1" style={{ color: '#8B7355' }}>Please check your connection</p>
                        <button
                            onClick={() => {
                                setLoadError(false);
                                setLoading(true);
                                const reload = async () => {
                                    try {
                                        const catRes = await fetchCategoryBySlug(categoryId);
                                        setCategory(catRes.data);
                                        const prodRes = await fetchProducts(categoryId);
                                        setAllProducts(prodRes.data || []);
                                    } catch (e) {
                                        setLoadError(true);
                                    }
                                    setLoading(false);
                                };
                                reload();
                            }}
                            className="mt-4 px-8 py-3 rounded-full text-white font-bold active:scale-95 transition-transform"
                            style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.light} 100%)`, boxShadow: `0 4px 16px ${theme.glow}` }}
                        >
                            Try Again
                        </button>
                    </div>
                ) : loading ? (
                    <div className="grid grid-cols-2 gap-3">
                        {[...Array(6)].map((_, i) => (
                            <ProductCardSkeleton key={i} index={i} />
                        ))}
                    </div>
                ) : filteredProducts.length > 0 ? (
                    <>
                        <div className="flex items-center gap-2 mb-3 px-1">
                            <FaFire size={12} color="#C97B4B" />
                            <span className="text-xs font-medium text-gray-500">
                                {filteredProducts.length} items found
                            </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
                            {filteredProducts.map((product, idx) => (
                                <div key={product._id} className="animate-fade-in-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                                    <ProductCardNew product={product} />
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 mx-auto rounded-full bg-orange-50 flex items-center justify-center mb-4">
                            <span className="text-4xl">🔍</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">No items found</h3>
                        <p className="text-sm mt-2 text-gray-500">No products available in this category yet</p>
                        <button onClick={() => navigate('/menu')}
                            className="mt-5 px-8 py-3 rounded-full text-white font-semibold active:scale-95 transition-transform"
                            style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.light} 100%)`, boxShadow: `0 8px 24px ${theme.glow}` }}>
                            Browse All Items
                        </button>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default CategoryPage;
