import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { fetchProducts } from '../services/api';
import Header from '../components/Header';
import MainCategoryCards from '../components/MainCategoryCards';
import AdsBanner from '../components/AdsBanner';
import ProductCardNew from '../components/ProductCardNew';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import SideCart from '../components/SideCart';
import Footer from '../components/Footer';
import { FaShoppingBag, FaArrowRight, FaSearch } from 'react-icons/fa';
import { useCart } from '../context/CartContext';

// Skeleton loader is now imported from ProductCardSkeleton

// Delivery Info Strip – fetched from Settings API, fallback to defaults
const FALLBACK_BADGES = [
    { icon: '⚡', title: 'Express Delivery', subtitle: 'Within 2 hours', enabled: true },
    { icon: '🌿', title: '100% Eggless', subtitle: 'Pure Vegetarian', enabled: true },
    { icon: '🎁', title: 'Free Delivery', subtitle: 'Above ₹500', enabled: true },
];

const DeliveryStrip = () => {
    const [badges, setBadges] = React.useState(FALLBACK_BADGES);

    React.useEffect(() => {
        const load = async () => {
            try {
                const { getHomepageBadges } = await import('../services/api');
                const { data } = await getHomepageBadges();
                if (Array.isArray(data) && data.length > 0) setBadges(data);
            } catch (err) {
                // Use fallback
            }
        };
        load();
    }, []);

    const visible = badges.filter(b => b.enabled !== false);
    if (visible.length === 0) return null;

    return (
        <div style={{ padding: '0 16px', marginTop: '4px', marginBottom: '0' }}>
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                {visible.map((item, i) => (
                    <div key={i} style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 10px',
                        borderRadius: '14px',
                        background: '#FFFFFF',
                        border: '1px solid #F0E8E0',
                        boxShadow: '0 2px 8px rgba(45,24,16,0.04)'
                    }}>
                        <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon}</span>
                        <div>
                            <p style={{ fontSize: '10px', fontWeight: 700, color: '#2D1810', margin: 0, lineHeight: 1.2 }}>{item.title}</p>
                            <p style={{ fontSize: '9px', color: '#A89585', margin: 0, marginTop: '1px' }}>{item.subtitle || item.sub}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Home = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [activeCategory, setActiveCategory] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [showSideCart, setShowSideCart] = useState(false);
    const { cart, total, getItemCount } = useCart();
    const searchDebounceRef = useRef(null);

    // Debounce search
    useEffect(() => {
        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
        }
        searchDebounceRef.current = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 150);
        return () => {
            if (searchDebounceRef.current) {
                clearTimeout(searchDebounceRef.current);
            }
        };
    }, [searchQuery]);

    // Load products
    useEffect(() => {
        const cachedProducts = sessionStorage.getItem('cachedProducts');
        const cacheTime = sessionStorage.getItem('productsCacheTime');
        const now = Date.now();

        if (cachedProducts && cacheTime && (now - parseInt(cacheTime)) < 120000) {
            setProducts(JSON.parse(cachedProducts));
            setLoading(false);
        }

        loadProducts();
    }, []);

    useEffect(() => {
        loadProducts();
    }, [activeCategory]);

    const loadProducts = async () => {
        setLoading(true);
        setLoadError(false);
        try {
            const { data } = await fetchProducts(activeCategory || '');
            setProducts(data);
            sessionStorage.setItem('cachedProducts', JSON.stringify(data));
            sessionStorage.setItem('productsCacheTime', Date.now().toString());
        } catch (error) {
            console.error(error);
            setLoadError(true);
        } finally {
            setLoading(false);
        }
    };

    // Filter products
    const filteredProducts = useMemo(() => {
        return products.filter(p =>
            p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            p.description?.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
    }, [products, debouncedSearch]);



    // Get bestseller products
    const bestsellerProducts = useMemo(() => {
        return filteredProducts.filter(p => p.isBestseller);
    }, [filteredProducts]);

    const handleItemAdded = useCallback(() => {
        setShowSideCart(true);
    }, []);

    const handleCategoryChange = useCallback((categoryId) => {
        setActiveCategory(categoryId === activeCategory ? '' : categoryId);
    }, [activeCategory]);

    return (
        <div style={{ background: '#FDF8F4', minHeight: '100vh' }}>
            {/* Header */}
            <Header
                activeCategory={activeCategory}
                onCategoryChange={handleCategoryChange}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />

            {/* Search Bar — Highlighted */}
            <div style={{ padding: '10px 16px 6px', background: '#FDF8F4' }}>
                <div style={{ position: 'relative', maxWidth: '500px', margin: '0 auto' }}>
                    <input
                        type="text"
                        placeholder="Search for cakes, pastries…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            paddingLeft: '44px',
                            paddingRight: '16px',
                            paddingTop: '14px',
                            paddingBottom: '14px',
                            borderRadius: '16px',
                            border: '2px solid #E8DFD6',
                            background: '#FFFFFF',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: '#2D1810',
                            outline: 'none',
                            boxShadow: '0 4px 16px rgba(201, 123, 75, 0.08), inset 0 1px 2px rgba(0,0,0,0.02)',
                            transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = '#C97B4B';
                            e.target.style.boxShadow = '0 4px 20px rgba(201, 123, 75, 0.15), 0 0 0 4px rgba(201, 123, 75, 0.08)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = '#E8DFD6';
                            e.target.style.boxShadow = '0 4px 16px rgba(201, 123, 75, 0.08), inset 0 1px 2px rgba(0,0,0,0.02)';
                        }}
                    />
                    <FaSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#C97B4B', fontSize: '15px' }} />
                </div>
            </div>

            {/* Delivery Info Strip - Winni Style */}
            <DeliveryStrip />

            {/* Main Category Cards */}
            <MainCategoryCards
                onCategorySelect={handleCategoryChange}
                activeCategory={activeCategory}
            />

            {/* Promotional Ads Banner */}
            <AdsBanner />

            {/* Bestsellers Section - Premium Design */}
            {!loading && bestsellerProducts.length > 0 && (
                <section className="bestsellers-section">
                    <div className="bestsellers-header">
                        <div className="bestsellers-title">
                            <span className="bestsellers-icon">🔥</span>
                            <h3>Bestsellers</h3>
                            <span className="bestsellers-icon">🔥</span>
                        </div>
                        <p className="bestsellers-subtitle">Our most loved treats</p>
                    </div>
                    <div className="bestsellers-grid">
                        {bestsellerProducts.slice(0, 6).map((product, index) => (
                            <div key={product._id} className="bestseller-card-wrapper animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                                <ProductCardNew
                                    product={{ ...product, isBestseller: true }}
                                    onAddSuccess={handleItemAdded}
                                    index={index}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="bestsellers-cta">
                        <button className="view-all-btn" onClick={() => { }}>
                            View All Bestsellers
                            <FaArrowRight size={12} />
                        </button>
                    </div>
                </section>
            )}

            {/* Products Section - Mobile First */}
            <section className="all-items-section">
                {/* Section Header */}
                <div className="all-items-header">
                    <div className="all-items-title-row">
                        <div className="all-items-title">
                            <span className="all-items-icon">🍽️</span>
                            <div>
                                <h3>{activeCategory ? `${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Items` : 'All Items'}</h3>
                                <p className="all-items-count">
                                    {loading ? 'Loading...' : `${filteredProducts.length} items available`}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Filter Chips - Mobile Scrollable */}
                    <div className="filter-chips">
                        <button
                            className={`filter-chip ${activeCategory === 'Cake' ? 'active' : ''}`}
                            onClick={() => setActiveCategory('Cake')}
                        >
                            🎂 Cakes
                        </button>
                        <button
                            className={`filter-chip ${activeCategory === 'Fastfood' ? 'active' : ''}`}
                            onClick={() => setActiveCategory('Fastfood')}
                        >
                            🍔 Fast Food
                        </button>
                        <button
                            className={`filter-chip ${activeCategory === 'Beverages' ? 'active' : ''}`}
                            onClick={() => setActiveCategory('Beverages')}
                        >
                            ☕ Drinks
                        </button>
                        <button
                            className={`filter-chip ${activeCategory === 'Flowers' ? 'active' : ''}`}
                            onClick={() => setActiveCategory('Flowers')}
                        >
                            🌸 Flowers
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6 px-2 md:px-0">
                    {loadError && !loading ? (
                        <div className="col-span-2 md:col-span-full flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                                style={{ background: '#FEF3E2' }}>
                                <span className="text-4xl">😕</span>
                            </div>
                            <h3 className="text-lg font-bold" style={{ color: '#2D1810' }}>Couldn't load menu</h3>
                            <p className="text-sm mt-1" style={{ color: '#8B7355' }}>Please check your connection</p>
                            <button
                                onClick={() => loadProducts()}
                                className="mt-4 px-8 py-3 rounded-full text-white font-bold active:scale-95 transition-transform"
                                style={{ background: 'linear-gradient(135deg, #C97B4B 0%, #E8956A 100%)', boxShadow: '0 4px 16px rgba(201,123,75,0.3)' }}
                            >
                                Try Again
                            </button>
                        </div>
                    ) : loading ? (
                        <>
                            <ProductCardSkeleton index={0} />
                            <ProductCardSkeleton index={1} />
                            <ProductCardSkeleton index={2} />
                            <ProductCardSkeleton index={3} />
                            <ProductCardSkeleton index={4} />
                            <ProductCardSkeleton index={5} />
                        </>
                    ) : filteredProducts.length === 0 ? (
                        <div className="col-span-2 md:col-span-full flex flex-col items-center justify-center py-10 text-center">
                            <p className="text-4xl mb-4">🍰</p>
                            <p className="text-lg font-bold text-gray-800">No products found</p>
                            <p className="text-gray-500 mb-4">Try a different category or search term</p>
                            <button
                                onClick={() => setActiveCategory('')}
                                className="px-6 py-2 bg-orange-500 text-white rounded-full font-bold shadow-md active:scale-95 transition-transform"
                            >
                                View All Items
                            </button>
                        </div>
                    ) : (
                        filteredProducts.map((product, index) => (
                            <ProductCardNew
                                key={product._id}
                                product={product}
                                onAddSuccess={handleItemAdded}
                                index={index}
                                featured={index === 0}
                            />
                        ))
                    )}
                </div>
            </section>

            {/* Floating Cart Button */}
            {cart.length > 0 && (
                <div
                    onClick={() => setShowSideCart(true)}
                    className="floating-cart cursor-pointer"
                >
                    <div className="cart-info">
                        <div className="cart-icon-wrap">
                            <FaShoppingBag size={24} />
                            <span className="cart-badge">{getItemCount()}</span>
                        </div>
                        <div className="cart-text">
                            <p>Your Cart</p>
                            <h4>₹{(Number(total) || 0).toFixed(0)}</h4>
                        </div>
                    </div>
                    <button className="view-cart-btn">
                        View Cart →
                    </button>
                </div>
            )}

            {/* Side Cart */}
            <SideCart
                isOpen={showSideCart}
                onClose={() => setShowSideCart(false)}
            />

            {/* Footer */}
            <Footer />

            {/* Bottom Nav Spacer */}
            <div className="h-20 md:h-0"></div>
        </div>
    );
};

export default Home;
