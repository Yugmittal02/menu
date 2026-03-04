import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FaTimes, FaCheck, FaPlus, FaMinus } from 'react-icons/fa';
import { useCart } from '../context/CartContext';

/* ─────────────────────────────────────────────────────────
   BottomSheetCustomizer — mobile-first customization sheet
   ───────────────────────────────────────────────────────── */
const BottomSheetCustomizer = ({ product, onClose, triggerRef }) => {
    const { cart, addToCart, updateQuantity, removeFromCart } = useCart();

    // Selection state
    const hasSizes  = product.sizes?.length > 0;
    const hasAddons = product.addons?.length > 0;
    const [selectedSize, setSelectedSize] = useState(hasSizes ? product.sizes[0] : null);
    const [selectedAddons, setSelectedAddons] = useState([]);
    const [note, setNote] = useState('');
    const [sizeError, setSizeError] = useState(false);

    // Animation state
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    // Refs
    const sheetRef   = useRef(null);
    const firstInput = useRef(null);
    const touchStart = useRef(null);

    /* ── mount / unmount animation ── */
    useEffect(() => {
        requestAnimationFrame(() => setIsVisible(true));
        // push a dummy history entry so Android back closes the sheet
        window.history.pushState({ bottomSheet: true }, '');
        const onPop = () => handleClose();
        window.addEventListener('popstate', onPop);
        return () => window.removeEventListener('popstate', onPop);
    }, []);

    // Focus first interactive element on open
    useEffect(() => {
        if (isVisible && firstInput.current) {
            firstInput.current.focus({ preventScroll: true });
        }
    }, [isVisible]);

    /* ── close helper (plays exit animation then unmounts) ── */
    const handleClose = useCallback(() => {
        if (isClosing) return;
        setIsClosing(true);
        // Remove dummy history entry if still there
        if (window.history.state?.bottomSheet) {
            window.history.back();
        }
        setTimeout(() => onClose(), 350);
    }, [isClosing, onClose]);

    /* ── swipe-to-dismiss ── */
    const onTouchStart = (e) => {
        touchStart.current = e.touches[0].clientY;
    };
    const onTouchMove = (e) => {
        if (touchStart.current === null) return;
        const delta = e.touches[0].clientY - touchStart.current;
        if (delta > 0 && sheetRef.current) {
            sheetRef.current.style.transform = `translateY(${delta}px)`;
            sheetRef.current.style.transition = 'none';
        }
    };
    const onTouchEnd = (e) => {
        if (touchStart.current === null) return;
        const delta = e.changedTouches[0].clientY - touchStart.current;
        touchStart.current = null;
        if (sheetRef.current) {
            sheetRef.current.style.transition = '';
        }
        if (delta > 80) {
            handleClose();
        } else if (sheetRef.current) {
            sheetRef.current.style.transform = '';
        }
    };

    /* ── focus trap ── */
    const trapFocus = (e) => {
        if (e.key !== 'Tab' || !sheetRef.current) return;
        const focusable = sheetRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];
        if (e.shiftKey) {
            if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
            if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    };
    useEffect(() => {
        document.addEventListener('keydown', trapFocus);
        return () => document.removeEventListener('keydown', trapFocus);
    }, []);

    /* ── addon toggle ── */
    const toggleAddon = (addon) => {
        setSelectedAddons(prev =>
            prev.find(a => a.name === addon.name)
                ? prev.filter(a => a.name !== addon.name)
                : [...prev, addon]
        );
    };

    /* ── price calc ── */
    const unitPrice = useMemo(() => {
        let p = selectedSize?.price || product.basePrice || product.price || 0;
        p += selectedAddons.reduce((s, a) => s + (a.price || 0), 0);
        return p;
    }, [selectedSize, selectedAddons, product]);

    /* ── cart match: find existing item with same product+size+addons ── */
    const existingCartItem = useMemo(() => {
        const addonKey = selectedAddons.map(a => a.name).sort().join(',');
        return cart.find(item => {
            if (item._id !== product._id) return false;
            if ((item.size || 'default') !== (selectedSize?.name || 'default')) return false;
            const itemAddonKey = (item.selectedAddons || []).slice().sort().join(',');
            return itemAddonKey === addonKey;
        });
    }, [cart, product._id, selectedSize, selectedAddons]);

    const existingQty = existingCartItem?.quantity || 0;

    /* ── add to cart ── */
    const handleAddToCart = () => {
        if (hasSizes && !selectedSize) {
            setSizeError(true);
            return;
        }
        addToCart({
            _id: product._id,
            name: product.name,
            image: product.image,
            basePrice: product.basePrice,
            price: unitPrice,
            size: selectedSize?.name || null,
            selectedAddons: selectedAddons.map(a => a.name),
            note,
        });
        handleClose();
    };

    /* ── quantity stepper ── */
    const handleIncrement = () => {
        if (existingCartItem) {
            updateQuantity(existingCartItem.cartId, 1);
        }
    };
    const handleDecrement = () => {
        if (existingCartItem) {
            if (existingCartItem.quantity <= 1) {
                removeFromCart(existingCartItem.cartId);
            } else {
                updateQuantity(existingCartItem.cartId, -1);
            }
        }
    };

    /* ── derive category colour ── */
    const catColor = (typeof product.category === 'object' && product.category?.colorFrom) || '#C97B4B';

    return (
        <>
            {/* BACKDROP */}
            <div
                onClick={(e) => { e.stopPropagation(); handleClose(); }}
                style={{
                    position: 'fixed', inset: 0, zIndex: 999,
                    background: 'rgba(0,0,0,0.5)',
                    opacity: isVisible && !isClosing ? 1 : 0,
                    transition: isClosing ? 'opacity 150ms ease 200ms' : 'opacity 200ms ease',
                    willChange: 'opacity',
                }}
            />

            {/* SHEET */}
            <div
                ref={sheetRef}
                role="dialog"
                aria-modal="true"
                aria-label={`Customise ${product.name}`}
                onKeyDown={trapFocus}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0,
                    zIndex: 1000,
                    maxHeight: '85vh',
                    background: '#FFFFFF',
                    borderRadius: '24px 24px 0 0',
                    display: 'flex', flexDirection: 'column',
                    boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
                    transform: isVisible && !isClosing ? 'translateY(0)' : 'translateY(100%)',
                    transition: isClosing ? 'transform 250ms ease-in' : 'transform 300ms ease-out',
                    willChange: 'transform',
                    overflow: 'hidden',
                }}
            >
                {/* ── Drag handle ── */}
                <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
                    <div style={{
                        width: 40, height: 4, borderRadius: 2,
                        background: '#D4D4D4',
                    }} />
                </div>

                {/* ── Close button ── */}
                <button
                    ref={firstInput}
                    onClick={handleClose}
                    style={{
                        position: 'absolute', top: 12, right: 12, zIndex: 2,
                        width: 36, height: 36, borderRadius: '50%',
                        border: 'none', background: 'rgba(0,0,0,0.06)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                    }}
                >
                    <FaTimes size={14} color="#666" />
                </button>

                {/* ── Scrollable content ── */}
                <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>

                    {/* Product image */}
                    <div style={{ width: '100%', height: 100, overflow: 'hidden', background: '#f3f0eb' }}>
                        {product.image ? (
                            <img src={product.image} alt={product.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, background: 'linear-gradient(135deg,#FFF7ED,#FEF3C7)' }}>🍰</div>
                        )}
                    </div>

                    {/* Name + category badge */}
                    <div style={{ padding: '14px 16px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1C1C1C', margin: 0 }}>
                                {product.name}
                            </h2>
                            {product.category && (
                                <span style={{
                                    fontSize: 10, fontWeight: 700,
                                    padding: '2px 8px', borderRadius: 10,
                                    background: `${catColor}18`, color: catColor,
                                }}>
                                    {typeof product.category === 'object' ? product.category.name : product.category}
                                </span>
                            )}
                        </div>
                        {product.description && (
                            <p style={{
                                fontSize: 13, color: '#888', margin: '6px 0 0', lineHeight: 1.4,
                                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                            }}>
                                {product.description}
                            </p>
                        )}
                    </div>

                    {/* Divider */}
                    <div style={{ height: 1, background: '#F0ECE6', margin: '14px 16px 0' }} />

                    {/* ── SIZE SELECTOR ── */}
                    {hasSizes && (
                        <div style={{ padding: '14px 16px 0' }} className={sizeError ? 'shake-anim' : ''}>
                            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#2D1810', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                                Choose Size <span style={{ color: '#E53935' }}>*</span>
                            </h3>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {product.sizes.map(size => {
                                    const isActive = selectedSize?.name === size.name;
                                    return (
                                        <button
                                            key={size.name}
                                            onClick={() => { setSelectedSize(size); setSizeError(false); }}
                                            style={{
                                                flex: '1 1 0', minWidth: 90,
                                                padding: '10px 8px', borderRadius: 14,
                                                border: isActive ? '2px solid #E8956A' : '2px solid #E8E3DB',
                                                background: isActive
                                                    ? 'linear-gradient(135deg,#E8956A,#D4773E)'
                                                    : '#FFFFFF',
                                                color: isActive ? '#FFF' : '#2D1810',
                                                textAlign: 'center', cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                boxShadow: isActive ? '0 4px 12px rgba(232,149,106,0.35)' : 'none',
                                            }}
                                        >
                                            <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>{size.name}</p>
                                            <p style={{ fontSize: 13, fontWeight: 600, margin: '3px 0 0', opacity: isActive ? 0.9 : 0.7 }}>₹{size.price}</p>
                                        </button>
                                    );
                                })}
                            </div>
                            {sizeError && (
                                <p style={{ fontSize: 12, color: '#E53935', margin: '6px 0 0', fontWeight: 600 }}>
                                    Please choose a size
                                </p>
                            )}
                        </div>
                    )}

                    {/* ── ADDONS ── */}
                    {hasAddons && (
                        <div style={{ padding: '14px 16px 0' }}>
                            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#2D1810', margin: '0 0 10px' }}>
                                Add Extras <span style={{ fontSize: 11, fontWeight: 500, color: '#AAA' }}>(optional)</span>
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {product.addons.map(addon => {
                                    const checked = !!selectedAddons.find(a => a.name === addon.name);
                                    return (
                                        <button
                                            key={addon.name}
                                            onClick={() => toggleAddon(addon)}
                                            style={{
                                                width: '100%', padding: '11px 14px', borderRadius: 14,
                                                border: checked ? '2px solid #E8956A' : '2px solid #E8E3DB',
                                                background: checked ? '#FFF7ED' : '#FFF',
                                                display: 'flex', alignItems: 'center', gap: 10,
                                                cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                                            }}
                                        >
                                            {/* checkbox */}
                                            <div style={{
                                                width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                                                border: checked ? '2px solid #E8956A' : '2px solid #CCC',
                                                background: checked ? '#E8956A' : '#FFF',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                {checked && <FaCheck size={9} color="#FFF" />}
                                            </div>
                                            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#2D1810' }}>{addon.name}</span>
                                            <span style={{ fontSize: 14, fontWeight: 700, color: checked ? '#E8956A' : '#8B7355', flexShrink: 0 }}>+₹{addon.price}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Special Instructions ── */}
                    <div style={{ padding: '14px 16px 16px' }}>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Any special requests? (optional)"
                            rows={1}
                            onFocus={(e) => { e.target.rows = 3; }}
                            onBlur={(e) => { if (!e.target.value) e.target.rows = 1; }}
                            style={{
                                width: '100%', padding: '10px 14px', borderRadius: 14,
                                border: '2px solid #E8E3DB', background: '#FAFAF8',
                                fontSize: 13, color: '#2D1810', resize: 'none',
                                outline: 'none', fontFamily: 'inherit',
                                transition: 'border-color 0.2s',
                            }}
                        />
                    </div>
                </div>

                {/* ── STICKY BOTTOM BAR ── */}
                <div style={{
                    position: 'sticky', bottom: 0,
                    background: '#FFF', borderTop: '1px solid #F0ECE6',
                    padding: '14px 16px',
                    paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 12,
                }}>
                    {/* Running total */}
                    <div>
                        <p style={{ fontSize: 11, color: '#999', margin: 0, fontWeight: 500 }}>Total</p>
                        <p style={{ fontSize: 22, fontWeight: 800, color: '#2D1810', margin: 0 }}>
                            ₹{unitPrice * (existingQty || 1)}
                        </p>
                    </div>

                    {/* Add button or Quantity stepper */}
                    {existingQty > 0 ? (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 0,
                            background: 'linear-gradient(135deg,#E8956A,#D4773E)',
                            borderRadius: 16, overflow: 'hidden',
                            boxShadow: '0 4px 16px rgba(232,149,106,0.4)',
                        }}>
                            <button onClick={handleDecrement} style={{
                                width: 44, height: 48, border: 'none', background: 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                            }}>
                                <FaMinus size={13} color="#FFF" />
                            </button>
                            <span style={{
                                minWidth: 32, textAlign: 'center',
                                fontSize: 18, fontWeight: 800, color: '#FFF',
                            }}>
                                {existingQty}
                            </span>
                            <button onClick={handleIncrement} style={{
                                width: 44, height: 48, border: 'none', background: 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                            }}>
                                <FaPlus size={13} color="#FFF" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleAddToCart}
                            disabled={hasSizes && !selectedSize}
                            style={{
                                width: '55%', height: 50,
                                background: hasSizes && !selectedSize
                                    ? '#CCCCCC'
                                    : 'linear-gradient(135deg,#E8956A,#D4773E)',
                                color: '#FFF', border: 'none', borderRadius: 16,
                                fontSize: 15, fontWeight: 700, cursor: 'pointer',
                                boxShadow: hasSizes && !selectedSize
                                    ? 'none'
                                    : '0 4px 16px rgba(232,149,106,0.4)',
                                transition: 'all 0.2s',
                            }}
                        >
                            Add to Cart
                        </button>
                    )}
                </div>
            </div>

            {/* CSS */}
            <style>{`
                @keyframes shakeX {
                    0%,100% { transform: translateX(0); }
                    20%,60% { transform: translateX(-6px); }
                    40%,80% { transform: translateX(6px); }
                }
                .shake-anim { animation: shakeX 0.4s ease; }
            `}</style>
        </>
    );
};

export default BottomSheetCustomizer;
