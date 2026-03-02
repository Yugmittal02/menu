import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { fetchProducts } from '../services/api';
import Header from '../components/Header';
import MainCategoryCards from '../components/MainCategoryCards';
import AdsBanner from '../components/AdsBanner';
import ProductCardNew from '../components/ProductCardNew';
import SideCart from '../components/SideCart';
import Footer from '../components/Footer';
import { FaShoppingBag, FaStar, FaCrown, FaArrowRight, FaSearch } from 'react-icons/fa';
import { useCart } from '../context/CartContext';

// Premium Skeleton loader
const ProductSkeleton = ({ index = 0 }) => (
    <div
        className="skeleton-card animate-fade-in"
        style={{ animationDelay: `${index * 0.1}s` }}
    >
        <div className="skeleton-image skeleton"></div>
        <div className="p-4">
            <div className="skeleton skeleton-text" style={{ width: '75%' }}></div>
            <div className="skeleton skeleton-text short" style={{ width: '100%', height: '12px' }}></div>
            <div className="skeleton skeleton-text" style={{ width: '40%', marginTop: '12px' }}></div>
            <div className="skeleton skeleton-button"></div>
        </div>
    </div>
);

// Featured Product Banner
const FeaturedBanner = ({ product, onAddSuccess }) => {
    if (!product) return null;

    return (
        <div className="mx-5 mb-6 p-5 rounded-2xl animate-fade-in-up"
            style={{
                background: 'linear-gradient(135deg, #FFF5EE 0%, #FFE8D6 100%)',
                border: '2px solid #C97B4B',
                boxShadow: '0 8px 32px rgba(252, 128, 25, 0.15)'
            }}>
            <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #C97B4B 0%, #E8956A 100%)' }}>
                    <FaCrown size={14} color="#FFFFFF" />
                </div>
                <span className="font-bold text-sm" style={{ color: '#C97B4B' }}>TODAY'S SPECIAL</span>
            </div>
            <div className="flex gap-4">
                <img
                    src={product.image || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&h=200&fit=crop'}
                    alt={product.name}
                    className="w-24 h-24 rounded-xl object-cover"
                    style={{ border: '2px solid #C97B4B' }}
                />
                <div className="flex-1">
                    <h4 className="font-bold" style={{ color: '#1C1C1C' }}>{product.name}</h4>
                    <div className="flex items-center gap-1 my-1">
                        {[1, 2, 3, 4, 5].map(i => <FaStar key={i} size={10} color="#C97B4B" />)}
                        <span className="text-xs ml-1" style={{ color: '#7E7E7E' }}>(98 reviews)</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-lg" style={{ color: '#C97B4B' }}>₹{product.price}</span>
                        <span className="text-sm line-through" style={{ color: '#A0A0A0' }}>₹{Math.round(product.price * 1.3)}</span>
                        <span className="px-2 py-0.5 rounded text-xs font-bold text-white"
                            style={{ background: '#22C55E' }}>30% OFF</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Delivery Info Strip – 3 pill cards
const DeliveryStrip = () => (
    <div style={{ padding: '0 16px', marginTop: '4px', marginBottom: '0' }}>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {[
                { icon: '⚡', title: 'Express Delivery', sub: 'Within 2 hours' },
                { icon: '🎁', title: 'Free Delivery', sub: 'Above ₹500' },
                { icon: '💯', title: '100% Fresh', sub: 'Baked Daily' }
            ].map((item, i) => (
                <div key={i} style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 10px',
                    borderRadius: '30px',
                    background: '#FFFFFF',
                    border: '1px solid #F0E8E0',
                    boxShadow: '0 2px 8px rgba(45,24,16,0.04)'
                }}>
                    <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon}</span>
                    <div>
                        <p style={{ fontSize: '10px', fontWeight: 700, color: '#2D1810', margin: 0, lineHeight: 1.2 }}>{item.title}</p>
                        <p style={{ fontSize: '9px', color: '#A89585', margin: 0, marginTop: '1px' }}>{item.sub}</p>
                    </div>
                </div>
            ))}
        </div>
        {/* Pure Veg Green Strip */}
        <div style={{
            marginTop: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '7px 0',
            background: 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)',
            borderRadius: '6px'
        }}>
            <span style={{
                width: '16px', height: '16px',
                borderRadius: '3px',
                border: '2px solid #FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FFFFFF' }}></span>
            </span>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.15em', textTransform: 'uppercase' }}>100% Eggless</span>
        </div>
    </div>
);

// Quick Picks Section – Horizontal Scrollable Product Thumbnails
const QuickPicksSection = ({ products }) => {
    if (!products || products.length === 0) return null;
    const picks = products.slice(0, 4);
    return (
        <div style={{
            margin: '12px 16px',
            padding: '16px',
            background: '#FFFFFF',
            borderRadius: '20px',
            boxShadow: '0 2px 12px rgba(45,24,16,0.05)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                <span style={{ fontSize: '18px' }}>✨</span>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#2D1810', margin: 0 }}>Quick Picks</h3>
            </div>
            <div style={{
                display: 'flex',
                gap: '12px',
                overflowX: 'auto',
                paddingBottom: '4px'
            }} className="hide-scrollbar">
                {picks.map((product) => (
                    <div key={product._id} style={{
                        flexShrink: 0,
                        width: '100px',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            boxShadow: '0 3px 12px rgba(45,24,16,0.08)'
                        }}>
                            <img
                                src={product.image || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&h=200&fit=crop'}
                                alt={product.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                loading="lazy"
                            />
                        </div>
                        <p style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#5C3A2A',
                            margin: '6px 0 0',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>{product.name}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Home = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
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
        try {
            const { data } = await fetchProducts(activeCategory || '');
            setProducts(data);
            sessionStorage.setItem('cachedProducts', JSON.stringify(data));
            sessionStorage.setItem('productsCacheTime', Date.now().toString());
        } catch (error) {
            console.error(error);
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

    // Get featured product (first one)
    const featuredProduct = useMemo(() => {
        return products.length > 0 ? products[0] : null;
    }, [products]);

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

            {/* Search Bar */}
            <div style={{ padding: '8px 16px 4px', background: '#FDF8F4' }}>
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
                            paddingTop: '12px',
                            paddingBottom: '12px',
                            borderRadius: '30px',
                            border: 'none',
                            background: '#F0EDEA',
                            fontSize: '13px',
                            color: '#5C3A2A',
                            outline: 'none',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)'
                        }}
                    />
                    <FaSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#A89585', fontSize: '14px' }} />
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

            {/* Quick Picks */}
            {!loading && filteredProducts.length > 0 && (
                <QuickPicksSection products={filteredProducts} />
            )}

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
                        {!loading && (
                            <div className="all-items-badge">
                                <FaStar size={10} />
                                <span>Top Rated</span>
                            </div>
                        )}
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
                    {loading ? (
                        <>
                            <ProductSkeleton index={0} />
                            <ProductSkeleton index={1} />
                            <ProductSkeleton index={2} />
                            <ProductSkeleton index={3} />
                            <ProductSkeleton index={4} />
                            <ProductSkeleton index={5} />
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
