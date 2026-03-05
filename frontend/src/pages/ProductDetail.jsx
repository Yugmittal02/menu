import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchProductBySlug, fetchProducts } from '../services/api';
import { useCart } from '../context/CartContext';
import ProductCardNew from '../components/ProductCardNew';
import {
    FaArrowLeft, FaShareAlt, FaShoppingCart,
    FaWhatsapp, FaInstagram, FaLink, FaCheck,
    FaPlus, FaMinus, FaStar, FaChevronDown, FaChevronUp
} from 'react-icons/fa';

const ProductDetail = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { cart, addToCart, updateQuantity, removeFromCart, getItemCount } = useCart();

    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Customization state
    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedAddons, setSelectedAddons] = useState([]);
    const [showFullDesc, setShowFullDesc] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    const shareMenuRef = useRef(null);

    // Load product data
    useEffect(() => {
        const loadProduct = async () => {
            setLoading(true);
            setError(false);
            setImageLoaded(false);
            try {
                const { data } = await fetchProductBySlug(slug);
                setProduct(data.product);
                setRelatedProducts(data.relatedProducts || []);
                // Default select first size
                if (data.product?.sizes?.length > 0) {
                    setSelectedSize(data.product.sizes[0]);
                } else {
                    setSelectedSize(null);
                }
                setSelectedAddons([]);
                // Set page title
                document.title = `${data.product.name} — Seva Shubham Bakery`;
            } catch (err) {
                console.error('Failed to load product:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        loadProduct();
        window.scrollTo(0, 0);
    }, [slug]);

    // Close share menu on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (shareMenuRef.current && !shareMenuRef.current.contains(e.target)) {
                setShowShareMenu(false);
            }
        };
        if (showShareMenu) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [showShareMenu]);

    const safeProduct = useMemo(() => {
        if (!product) return null;
        return {
            _id: product._id,
            name: product.name || 'Product',
            slug: product.slug || '',
            description: product.description || '',
            image: product.image || '',
            basePrice: Number(product.basePrice || product.price) || 0,
            price: Number(product.price || product.basePrice) || 0,
            isAvailable: product.isAvailable !== false,
            isBestseller: product.isBestseller || false,
            category: product.category || null,
            rating: product.rating || 0,
            ratingCount: product.ratingCount || 0,
            sizes: Array.isArray(product.sizes) ? product.sizes : [],
            addons: Array.isArray(product.addons) ? product.addons : [],
        };
    }, [product]);

    const hasSizes = safeProduct?.sizes?.length > 0;
    const hasAddons = safeProduct?.addons?.length > 0;

    // Price calculation
    const unitPrice = useMemo(() => {
        if (!safeProduct) return 0;
        let p = selectedSize?.price || safeProduct.basePrice;
        p += selectedAddons.reduce((sum, a) => sum + (a.price || 0), 0);
        return p;
    }, [safeProduct, selectedSize, selectedAddons]);

    // Cart match
    const existingCartItem = useMemo(() => {
        if (!safeProduct) return null;
        const addonKey = selectedAddons.map(a => a.name).sort().join(',');
        return cart.find(item => {
            if (item._id !== safeProduct._id) return false;
            if ((item.size || 'default') !== (selectedSize?.name || 'default')) return false;
            const itemAddonKey = (item.selectedAddons || []).slice().sort().join(',');
            return itemAddonKey === addonKey;
        });
    }, [cart, safeProduct, selectedSize, selectedAddons]);

    const existingQty = existingCartItem?.quantity || 0;

    // Addon toggle
    const toggleAddon = useCallback((addon) => {
        setSelectedAddons(prev =>
            prev.find(a => a.name === addon.name)
                ? prev.filter(a => a.name !== addon.name)
                : [...prev, addon]
        );
    }, []);

    // Add to cart
    const handleAddToCart = useCallback(() => {
        if (!safeProduct || !safeProduct.isAvailable) return;
        addToCart({
            _id: safeProduct._id,
            name: safeProduct.name,
            image: safeProduct.image,
            basePrice: safeProduct.basePrice,
            price: unitPrice,
            size: selectedSize?.name || null,
            selectedAddons: selectedAddons.map(a => a.name),
        });
    }, [safeProduct, unitPrice, selectedSize, selectedAddons, addToCart]);

    // Quantity controls
    const handleIncrement = useCallback(() => {
        if (existingCartItem) updateQuantity(existingCartItem.cartId, 1);
    }, [existingCartItem, updateQuantity]);

    const handleDecrement = useCallback(() => {
        if (existingCartItem) {
            if (existingCartItem.quantity <= 1) {
                removeFromCart(existingCartItem.cartId);
            } else {
                updateQuantity(existingCartItem.cartId, -1);
            }
        }
    }, [existingCartItem, updateQuantity, removeFromCart]);

    // Share functions
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

    const shareWhatsApp = useCallback(() => {
        const text = `Check out ${safeProduct?.name} at Seva Shubham Bakery! 🍰\n₹${unitPrice}\n${shareUrl}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        setShowShareMenu(false);
    }, [safeProduct, unitPrice, shareUrl]);

    const shareInstagram = useCallback(() => {
        // Instagram doesn't have a direct share URL, copy link + open Instagram
        navigator.clipboard?.writeText(shareUrl);
        window.open('https://www.instagram.com/', '_blank');
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
        setShowShareMenu(false);
    }, [shareUrl]);

    const copyLink = useCallback(() => {
        navigator.clipboard?.writeText(shareUrl).then(() => {
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        });
        setShowShareMenu(false);
    }, [shareUrl]);

    const catColor = safeProduct?.category?.colorFrom || '#C97B4B';
    const cartCount = getItemCount();

    // ─── Reusable Cart Actions Component (used for Desktop Inline and Mobile Sticky) ───
    const renderCartActions = (isDesktop = false) => {
        return (
            <div className={isDesktop ? "pd-desktop-cart-actions" : "pd-mobile-cart-actions-inner"}>
                <div style={isDesktop ? { marginBottom: 16 } : {}}>
                    {isDesktop && <p style={{ fontSize: 13, color: '#8B7355', margin: '0 0 4px', fontWeight: 600 }}>Total Price</p>}
                    {!isDesktop && <p style={{ fontSize: 11, color: '#999', margin: 0, fontWeight: 500 }}>Total</p>}
                    <p style={{ fontSize: 24, fontWeight: 800, color: '#2D1810', margin: 0 }}>
                        ₹{unitPrice * (existingQty || 1)}
                    </p>
                </div>

                {!safeProduct.isAvailable ? (
                    <div style={{
                        padding: '14px 28px', borderRadius: 16,
                        background: '#E0E0E0', color: '#999',
                        fontSize: 15, fontWeight: 700,
                        ...(isDesktop ? { width: '100%', textAlign: 'center' } : {})
                    }}>
                        Out of Stock
                    </div>
                ) : existingQty > 0 ? (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 0,
                        background: 'linear-gradient(135deg, #1B7E1B, #146114)',
                        borderRadius: 16, overflow: 'hidden',
                        boxShadow: '0 4px 16px rgba(27,126,27,0.3)',
                        ...(isDesktop ? { width: '100%', justifyContent: 'space-between', height: 50 } : {})
                    }}>
                        <button onClick={handleDecrement} style={{...stepperBtnStyle, width: isDesktop ? 60 : 48}}>
                            <FaMinus size={14} color="#FFF" />
                        </button>
                        <span style={{
                            flex: isDesktop ? 1 : 'unset', minWidth: 36, textAlign: 'center',
                            fontSize: 20, fontWeight: 800, color: '#FFF',
                        }}>
                            {existingQty}
                        </span>
                        <button onClick={handleIncrement} style={{...stepperBtnStyle, width: isDesktop ? 60 : 48}}>
                            <FaPlus size={14} color="#FFF" />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleAddToCart}
                        style={{
                            padding: '14px 36px', borderRadius: 16, border: 'none',
                            background: 'linear-gradient(135deg, #1B7E1B, #146114)',
                            color: '#FFF', fontSize: 16, fontWeight: 700, cursor: 'pointer',
                            boxShadow: '0 4px 16px rgba(27,126,27,0.3)',
                            transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            ...(isDesktop ? { width: '100%' } : {})
                        }}
                    >
                        <FaShoppingCart size={14} /> Add to Cart
                    </button>
                )}
            </div>
        );
    }

    // ─── Loading State ───
    if (loading) {
        return (
            <div className="pd-page-container">
                <header className="pd-header">
                    <div className="pd-header-inner pd-skeleton-header">
                        <div style={{ width: 40, height: 40, borderRadius: 20, background: '#E8E3DB' }} />
                        <div style={{ width: 150, height: 20, borderRadius: 10, background: '#E8E3DB' }} />
                    </div>
                </header>
                <div className="pd-main-wrapper pd-content-grid">
                    <div className="pd-left-column">
                        <div className="pd-image-container" style={{ animation: 'pulse 1.5s ease infinite' }} />
                    </div>
                    <div className="pd-right-column" style={{ padding: 24 }}>
                        <div style={{ height: 24, width: '70%', borderRadius: 8, background: '#E8E3DB', marginBottom: 12, animation: 'pulse 1.5s ease infinite' }} />
                        <div style={{ height: 32, width: '30%', borderRadius: 8, background: '#E8E3DB', marginBottom: 20, animation: 'pulse 1.5s ease infinite' }} />
                        <div style={{ height: 60, borderRadius: 16, background: '#E8E3DB', animation: 'pulse 1.5s ease infinite' }} />
                    </div>
                </div>
                <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
            </div>
        );
    }

    // ─── Error State ───
    if (error || !safeProduct) {
        return (
            <div style={{ background: '#FDF8F4', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
                <div style={{ width: 80, height: 80, borderRadius: 40, background: '#FEF3E2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 40 }}>😕</div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#2D1810', margin: '0 0 8px' }}>Product not found</h2>
                <p style={{ fontSize: 14, color: '#8B7355', margin: '0 0 24px' }}>This product may have been removed or the link is incorrect.</p>
                <button
                    onClick={() => navigate('/menu')}
                    style={{
                        padding: '14px 32px', borderRadius: 16, border: 'none',
                        background: 'linear-gradient(135deg, #C97B4B 0%, #E8956A 100%)',
                        color: '#FFF', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                        boxShadow: '0 4px 16px rgba(201,123,75,0.3)'
                    }}
                >
                    Browse Menu
                </button>
            </div>
        );
    }

    return (
        <div className="pd-page-container">

            {/* ─── STICKY HEADER ─── */}
            <header className="pd-header">
                <div className="pd-header-inner">
                    <button onClick={() => navigate(-1)} className="pd-icon-btn">
                        <FaArrowLeft size={16} color="#2D1810" />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {/* Share Button */}
                        <div style={{ position: 'relative' }} ref={shareMenuRef}>
                            <button onClick={() => setShowShareMenu(!showShareMenu)} className="pd-icon-btn">
                                <FaShareAlt size={14} color="#2D1810" />
                            </button>

                            {/* Share Dropdown */}
                            {showShareMenu && (
                                <div className="pd-share-dropdown">
                                    <button onClick={shareWhatsApp} style={shareItemStyle}>
                                        <FaWhatsapp size={18} color="#25D366" />
                                        <span>Share on WhatsApp</span>
                                    </button>
                                    <button onClick={shareInstagram} style={shareItemStyle}>
                                        <FaInstagram size={18} color="#E4405F" />
                                        <span>Share on Instagram</span>
                                    </button>
                                    <button onClick={copyLink} style={shareItemStyle}>
                                        <FaLink size={16} color="#C97B4B" />
                                        <span>{linkCopied ? '✓ Link Copied!' : 'Copy Link'}</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Cart Button */}
                        <button onClick={() => navigate('/cart')} className="pd-icon-btn pd-cart-btn">
                            <FaShoppingCart size={14} color="#2D1810" />
                            {cartCount > 0 && (
                                <span className="pd-cart-badge">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            <div className="pd-main-wrapper">
                {/* Desktop Breadcrumbs */}
                <div className="pd-desktop-breadcrumbs">
                    <span onClick={() => navigate('/')}>Home</span> /{' '}
                    {safeProduct.category && <span onClick={() => navigate(`/category/${safeProduct.category.slug || safeProduct.category._id}`)}>{typeof safeProduct.category === 'object' ? safeProduct.category.name : safeProduct.category}</span>} /{' '}
                    <span style={{ color: '#2D1810', fontWeight: 600 }}>{safeProduct.name}</span>
                </div>

                <div className="pd-content-grid">
                    {/* ─── LEFT COLUMN (IMAGE) ─── */}
                    <div className="pd-left-column">
                        <div className="pd-image-container">
                            {safeProduct.image ? (
                                <img
                                    src={safeProduct.image}
                                    alt={safeProduct.name}
                                    style={{
                                        width: '100%', height: '100%', objectFit: 'cover',
                                        opacity: imageLoaded ? 1 : 0,
                                        transition: 'opacity 0.4s ease',
                                    }}
                                    onLoad={() => setImageLoaded(true)}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            ) : (
                                <div style={{
                                    width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 80, background: 'linear-gradient(135deg, #FFF7ED, #FEF3C7)',
                                }}>🍰</div>
                            )}

                            {/* Badges */}
                            <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {safeProduct.isBestseller && (
                                    <span style={{
                                        background: 'linear-gradient(135deg, #C97B4B, #E8956A)', color: '#FFF',
                                        fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                                        display: 'flex', alignItems: 'center', gap: 4,
                                        boxShadow: '0 2px 8px rgba(201,123,75,0.3)',
                                    }}>
                                        ⚡ Bestseller
                                    </span>
                                )}
                                {!safeProduct.isAvailable && (
                                    <span style={{
                                        background: 'rgba(0,0,0,0.7)', color: '#FFF',
                                        fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                                    }}>
                                        Out of Stock
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ─── RIGHT COLUMN (INFO) ─── */}
                    <div className="pd-right-column">
                        <div className="pd-info-block">
                            {/* Rating */}
                            {safeProduct.rating > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 3,
                                        background: '#1B7E1B', color: '#FFF',
                                        padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                                    }}>
                                        <FaStar size={10} /> {safeProduct.rating.toFixed(1)}
                                    </div>
                                    {safeProduct.ratingCount > 0 && (
                                        <span style={{ fontSize: 12, color: '#8B7355' }}>
                                            ({safeProduct.ratingCount.toLocaleString()} ratings)
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Name */}
                            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1C1C1C', margin: 0, lineHeight: 1.3 }}>
                                {safeProduct.name}
                            </h1>

                            {/* Price */}
                            <div style={{ marginTop: 12, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                <span style={{ fontSize: 32, fontWeight: 800, color: '#2D1810' }}>₹{unitPrice}</span>
                                {safeProduct.basePrice !== unitPrice && (
                                    <span style={{ fontSize: 16, color: '#AAA', textDecoration: 'line-through' }}>
                                        ₹{safeProduct.basePrice}
                                    </span>
                                )}
                            </div>
                            <p style={{ fontSize: 12, color: '#8B7355', margin: '4px 0 0' }}>(Inclusive of all taxes)</p>
                        </div>

                        {/* DESKTOP CART ACTIONS */}
                        <div className="pd-desktop-cart-wrapper">
                            {renderCartActions(true)}
                        </div>

                        {/* SIZE SELECTOR */}
                        {hasSizes && (
                            <div className="pd-section-divider">
                                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2D1810', margin: '0 0 12px' }}>
                                    Select Unit <span style={{ color: '#E53935' }}>*</span>
                                </h3>
                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                    {safeProduct.sizes.map(size => {
                                        const isActive = selectedSize?.name === size.name;
                                        return (
                                            <button
                                                key={size.name}
                                                onClick={() => setSelectedSize(size)}
                                                style={{
                                                    flex: '0 0 auto', minWidth: 90,
                                                    padding: '12px 14px', borderRadius: 12,
                                                    border: isActive ? '2px solid #1B7E1B' : '1px solid #E8E3DB',
                                                    background: isActive ? '#F0FDF4' : '#FFFFFF',
                                                    color: '#2D1810', textAlign: 'left', cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                <p style={{ fontSize: 14, fontWeight: 600, margin: 0, color: isActive ? '#1B7E1B' : '#555' }}>{size.name}</p>
                                                <p style={{ fontSize: 15, fontWeight: 700, margin: '4px 0 0' }}>₹{size.price}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ADDONS */}
                        {hasAddons && (
                            <div className="pd-section-divider">
                                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2D1810', margin: '0 0 12px' }}>
                                    Add Extras <span style={{ fontSize: 12, fontWeight: 500, color: '#AAA' }}>(optional)</span>
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {safeProduct.addons.map(addon => {
                                        const checked = !!selectedAddons.find(a => a.name === addon.name);
                                        return (
                                            <button
                                                key={addon.name}
                                                onClick={() => toggleAddon(addon)}
                                                style={{
                                                    width: '100%', padding: '12px 14px', borderRadius: 12,
                                                    border: checked ? '2px solid #1B7E1B' : '1px solid #E8E3DB',
                                                    background: checked ? '#F0FDF4' : '#FFFFFF',
                                                    display: 'flex', alignItems: 'center', gap: 10,
                                                    cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                                                }}
                                            >
                                                <div style={{
                                                    width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                                                    border: checked ? '2px solid #1B7E1B' : '2px solid #CCC',
                                                    background: checked ? '#1B7E1B' : '#FFF',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    {checked && <FaCheck size={10} color="#FFF" />}
                                                </div>
                                                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#2D1810' }}>{addon.name}</span>
                                                <span style={{ fontSize: 14, fontWeight: 700, color: checked ? '#1B7E1B' : '#8B7355' }}>+₹{addon.price}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* DESCRIPTION */}
                        {safeProduct.description && (
                            <div className="pd-section-divider">
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#2D1810', margin: '0 0 12px' }}>
                                    Product Details
                                </h3>
                                <p style={{
                                    fontSize: 14, color: '#666', lineHeight: 1.6, margin: 0,
                                    ...(showFullDesc ? {} : { display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }),
                                }}>
                                    {safeProduct.description}
                                </p>
                                {safeProduct.description.length > 120 && (
                                    <button
                                        onClick={() => setShowFullDesc(!showFullDesc)}
                                        style={{
                                            background: 'none', border: 'none', color: '#1B7E1B',
                                            fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                            padding: '8px 0', display: 'flex', alignItems: 'center', gap: 4,
                                        }}
                                    >
                                        {showFullDesc ? 'Show Less' : 'Read More'}
                                        {showFullDesc ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* SHARE SECTION */}
                        <div className="pd-section-divider">
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2D1810', margin: '0 0 12px' }}>
                                Share this product
                            </h3>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button onClick={shareWhatsApp} style={shareButtonStyle('#25D366')}>
                                    <FaWhatsapp size={18} />
                                    <span>WhatsApp</span>
                                </button>
                                <button onClick={shareInstagram} style={shareButtonStyle('#E4405F')}>
                                    <FaInstagram size={18} />
                                    <span>Instagram</span>
                                </button>
                                <button onClick={copyLink} style={shareButtonStyle('#C97B4B')}>
                                    {linkCopied ? <FaCheck size={16} /> : <FaLink size={16} />}
                                    <span>{linkCopied ? 'Copied!' : 'Copy Link'}</span>
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

                {/* ─── RELATED PRODUCTS ─── */}
                {relatedProducts.length > 0 && (
                    <div className="pd-related-wrapper">
                        <div style={{ padding: '0 16px', marginBottom: 16 }}>
                            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#2D1810', margin: '0 0 4px' }}>
                                Similar Products
                            </h3>
                            <p style={{ fontSize: 14, color: '#8B7355', margin: 0 }}>
                                You might also like
                            </p>
                        </div>
                        <div className="pd-related-scroll hide-scrollbar">
                            {relatedProducts.map((rp, idx) => (
                                <div key={rp._id} className="pd-related-item">
                                    <ProductCardNew product={rp} index={idx} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ─── MOBILE STICKY BOTTOM BAR ─── */}
            <div className="pd-mobile-bottom-bar">
                {renderCartActions(false)}
            </div>

            {/* ─── LINK COPIED TOAST ─── */}
            {linkCopied && (
                <div style={{
                    position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
                    zIndex: 50, background: 'rgba(34,197,94,0.92)', color: '#FFF',
                    padding: '10px 20px', borderRadius: 24,
                    fontSize: 14, fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 6,
                    boxShadow: '0 4px 16px rgba(34,197,94,0.35)',
                    animation: 'toastSlideUp 0.3s ease',
                }}>
                    <FaCheck size={12} /> Link copied to clipboard!
                </div>
            )}

            {/* ─── CSS Animations & Responsive Classes ─── */}
            <style>{`
                /* Base Reset */
                .pd-page-container {
                    background: #FFFFFF;
                    min-height: 100vh;
                    padding-bottom: 100px; /* Mobile sticky bar allowance */
                    font-family: 'Inter', system-ui, sans-serif;
                }
                
                /* Header */
                .pd-header {
                    position: sticky; top: 0; z-index: 50;
                    background: rgba(255,255,255,0.95);
                    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
                    border-bottom: 1px solid #F0ECE6;
                }
                .pd-header-inner {
                    max-width: 1200px; margin: 0 auto;
                    padding: 12px 16px;
                    display: flex; align-items: center; justify-content: space-between;
                }
                .pd-icon-btn {
                    width: 40px; height: 40px; border-radius: 20px; border: none;
                    background: #FFFFFF; box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                    display: flex; align-items: center; justify-content: center; cursor: pointer;
                    transition: transform 0.2s;
                }
                .pd-icon-btn:active { transform: scale(0.95); }
                .pd-cart-btn { position: relative; }
                .pd-cart-badge {
                    position: absolute; top: -2px; right: -2px;
                    width: 18px; height: 18px; border-radius: 9px;
                    background: #E53935; color: #FFF; font-size: 10px; font-weight: 700;
                    display: flex; align-items: center; justify-content: center;
                }

                .pd-share-dropdown {
                    position: absolute; right: 0; top: 48px; z-index: 50;
                    background: #FFFFFF; border-radius: 16px; padding: 8px 4px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.15); border: 1px solid #f0f0f0;
                    min-width: 200px; animation: shareDropIn 0.2s ease;
                }

                /* Main Wrapper */
                .pd-main-wrapper {
                    max-width: 1200px; margin: 0 auto;
                    position: relative;
                }

                /* Breadcrumbs: hide on mobile, show on desktop */
                .pd-desktop-breadcrumbs {
                    display: none;
                }

                /* Grid Layout */
                .pd-content-grid {
                    display: flex; flex-direction: column;
                }
                
                .pd-left-column { width: 100%; }
                .pd-right-column { width: 100%; }
                
                .pd-image-container {
                    width: 100%; aspect-ratio: 1/1; position: relative;
                    background: linear-gradient(135deg, #F5EDE6 0%, #E8DFD6 100%);
                    overflow: hidden;
                }

                .pd-info-block { padding: 20px 16px 0; }
                .pd-section-divider {
                    padding: 16px 16px 0;
                    margin-top: 16px;
                    border-top: 1px solid #F0ECE6;
                }

                /* Related */
                .pd-related-wrapper {
                    padding: 32px 0 0;
                    margin-top: 24px;
                    border-top: 8px solid #F8F5F2;
                }
                .pd-related-scroll {
                    display: flex; gap: 12px; overflow-x: auto;
                    padding: 0 16px 16px; scroll-snap-type: x mandatory;
                    -webkit-overflow-scrolling: touch;
                }
                .pd-related-item { flex: 0 0 160px; scroll-snap-align: start; }

                /* Cart Actions */
                .pd-mobile-bottom-bar {
                    position: fixed; bottom: 0; left: 0; right: 0; z-index: 40;
                    background: #FFFFFF; border-top: 1px solid #F0ECE6; padding: 12px 16px;
                    padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
                    box-shadow: 0 -4px 20px rgba(0,0,0,0.06);
                }
                .pd-mobile-cart-actions-inner {
                    display: flex; align-items: center; justify-content: space-between; gap: 12px;
                }
                .pd-desktop-cart-wrapper { display: none; }
                
                /* ========================================================== */
                /* DESKTOP STYLES (>= 768px) */
                /* ========================================================== */
                @media (min-width: 768px) {
                    .pd-page-container {
                        padding-bottom: 60px; /* no sticky bottom bar on desktop */
                        background: #F8F5F2; /* Subtle background outside container */
                    }
                    .pd-header {
                        position: sticky; /* Keep sticky on desktop too */
                    }
                    .pd-desktop-breadcrumbs {
                        display: block;
                        padding: 24px 32px 0;
                        font-size: 13px; color: #8B7355;
                    }
                    .pd-desktop-breadcrumbs span { cursor: pointer; }
                    .pd-desktop-breadcrumbs span:hover { color: #1B7E1B; text-decoration: underline; }

                    .pd-main-wrapper {
                        background: #FFFFFF;
                        box-shadow: 0 4px 24px rgba(0,0,0,0.03);
                        border-radius: 0 0 24px 24px;
                    }

                    .pd-content-grid {
                        flex-direction: row;
                        align-items: flex-start;
                        gap: 48px;
                        padding: 32px;
                    }

                    .pd-left-column {
                        flex: 1; 
                        position: sticky; top: 100px;
                        max-width: 500px;
                    }
                    .pd-image-container {
                        border-radius: 24px;
                        border: 1px solid #F0ECE6;
                    }

                    .pd-right-column {
                        flex: 1.2;
                        padding-top: 0;
                    }
                    
                    .pd-info-block { padding: 0 0 24px 0; border-bottom: 1px solid #F0ECE6; }
                    .pd-section-divider { padding: 24px 0 0; margin-top: 24px; }
                    
                    .pd-related-wrapper {
                        border-top: 1px solid #F0ECE6;
                        margin: 0 32px;
                        padding-bottom: 32px;
                    }
                    .pd-related-scroll { padding: 0 0 16px 0; }
                    .pd-related-item { flex: 0 0 200px; }

                    /* Hide Mobile Bar, Show Desktop Cart Actions */
                    .pd-mobile-bottom-bar { display: none; }
                    .pd-desktop-cart-wrapper {
                        display: block;
                        padding-top: 24px;
                    }

                }

                @media (min-width: 1024px) {
                    .pd-content-grid {
                        padding: 40px 60px;
                        gap: 60px;
                    }
                }

                /* Keyframes */
                @keyframes shareDropIn {
                    0% { opacity: 0; transform: translateY(-8px) scale(0.95); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes toastSlideUp {
                    0% { opacity: 0; transform: translate(-50%, 16px); }
                    100% { opacity: 1; transform: translate(-50%, 0); }
                }
            `}</style>
        </div>
    );
};

// ─── Style helpers ───
const shareItemStyle = {
    display: 'flex', alignItems: 'center', gap: 10,
    width: '100%', padding: '12px 16px', borderRadius: 12,
    border: 'none', background: 'transparent', cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 14, fontWeight: 600, color: '#2D1810',
    transition: 'background 0.15s',
};

const shareButtonStyle = (color) => ({
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    padding: '12px 8px', borderRadius: 14, fontFamily: 'inherit',
    border: `1.5px solid ${color}25`, background: `${color}08`,
    color: color, fontSize: 11, fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.2s',
});

const stepperBtnStyle = {
    width: 48, height: 52, border: 'none', background: 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
};

export default ProductDetail;
