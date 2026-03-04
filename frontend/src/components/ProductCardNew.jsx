import React, { useState, useMemo, memo, useCallback, useRef } from 'react';
import { FaHeart, FaRegHeart, FaCheck } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import BottomSheetCustomizer from './BottomSheetCustomizer';

const ProductCardNew = memo(({ product, onAddSuccess, index = 0, featured = false }) => {
    const { addToCart } = useCart();
    const [showToast, setShowToast] = useState(false);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [showCustomize, setShowCustomize] = useState(false);
    const addBtnRef = useRef(null);

    const safeProduct = useMemo(() => ({
        _id: product?._id || '',
        name: product?.name || 'Product',
        price: Number(product?.price || product?.basePrice) || 0,
        basePrice: Number(product?.basePrice || product?.price) || 0,
        originalPrice: Number(product?.originalPrice || product?.mrp) || Number(product?.price || product?.basePrice) || 0,
        image: product?.image || '',
        isAvailable: product?.isAvailable !== false,
        isBestseller: product?.isBestseller || false,
        category: product?.category || '',
        weight: product?.weight || '',
        description: product?.description || '',
        sizes: Array.isArray(product?.sizes) ? product.sizes : [],
        addons: Array.isArray(product?.addons) ? product.addons : [],
    }), [product]);

    const hasOptions = safeProduct.sizes.length > 0 || safeProduct.addons.length > 0;

    const discountPercent = useMemo(() => {
        if (safeProduct.originalPrice > safeProduct.price) {
            return Math.round(((safeProduct.originalPrice - safeProduct.price) / safeProduct.originalPrice) * 100);
        }
        return 0;
    }, [safeProduct.price, safeProduct.originalPrice]);

    const handleAdd = useCallback((e) => {
        e?.stopPropagation();
        if (!safeProduct.isAvailable) return;

        if (hasOptions) {
            setShowCustomize(true);
            return;
        }

        // No options — direct add with toast
        addToCart({
            _id: safeProduct._id,
            name: safeProduct.name,
            price: safeProduct.price,
            basePrice: safeProduct.basePrice,
            image: safeProduct.image,
        });
        setShowToast(true);
        onAddSuccess?.();
        setTimeout(() => setShowToast(false), 1400);
    }, [safeProduct, addToCart, onAddSuccess, hasOptions]);

    const handleSheetClose = useCallback(() => {
        setShowCustomize(false);
        // Return focus
        if (addBtnRef.current) {
            addBtnRef.current.focus();
        }
    }, []);

    const toggleWishlist = useCallback((e) => {
        e?.stopPropagation();
        setIsWishlisted(prev => !prev);
    }, []);

    return (
        <>
        <div
            className={`group relative bg-white rounded-2xl overflow-hidden transition-all duration-300 ${!safeProduct.isAvailable ? 'opacity-60' : 'hover:shadow-lg active:scale-[0.98]'}`}
            style={{
                border: '1px solid #f0f0f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                animationDelay: `${index * 0.06}s`
            }}
        >
            {/* "+1 added" toast */}
            {showToast && (
                <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)', zIndex: 20,
                    background: 'rgba(34,197,94,0.92)', color: '#FFF',
                    padding: '6px 16px', borderRadius: 20,
                    fontSize: 13, fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 5,
                    boxShadow: '0 4px 16px rgba(34,197,94,0.35)',
                    animation: 'toastPop 0.3s ease',
                    pointerEvents: 'none',
                }}>
                    <FaCheck size={10} /> +1 added
                </div>
            )}

            {/* Badges - Top Left */}
            <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                {safeProduct.isBestseller && (
                    <span className="bg-[#C97B4B] text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        ⚡ BEST
                    </span>
                )}
                {discountPercent > 0 && (
                    <span className="bg-green-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                        {discountPercent}% OFF
                    </span>
                )}
            </div>

            {/* Wishlist - Top Right */}
            <button
                onClick={toggleWishlist}
                className={`absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/90 shadow-sm transition-all active:scale-90 ${isWishlisted ? 'text-red-500' : 'text-gray-300'}`}
            >
                {isWishlisted ? <FaHeart size={12} /> : <FaRegHeart size={12} />}
            </button>

            {/* Product Image */}
            <div className="relative w-full aspect-square overflow-hidden bg-gray-50">
                {safeProduct.image ? (
                    <img
                        src={safeProduct.image}
                        alt={safeProduct.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentNode.innerHTML = '<div class="w-full h-full flex items-center justify-center text-4xl bg-orange-50">🍰</div>';
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl bg-orange-50">🍰</div>
                )}

                {/* Out of Stock Overlay */}
                {!safeProduct.isAvailable && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                        <span className="bg-white/95 text-gray-800 text-[11px] font-bold px-3 py-1.5 rounded-full shadow-md uppercase tracking-wider">
                            Out of Stock
                        </span>
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className="p-2.5 flex flex-col gap-1">
                {/* Name */}
                <h4 className="font-semibold text-[13px] text-gray-800 leading-tight line-clamp-2 min-h-[2.2em]">
                    {safeProduct.name}
                </h4>

                {/* Description — one line */}
                {safeProduct.description && (
                    <p className="text-[10px] text-gray-400 line-clamp-1">{safeProduct.description}</p>
                )}

                {/* Weight/Size */}
                {safeProduct.weight && (
                    <span className="text-[10px] text-gray-400 font-medium">
                        {safeProduct.weight}
                    </span>
                )}

                {/* Price + Add Button Row */}
                <div className="flex items-end justify-between mt-1">
                    <div className="flex flex-col">
                        <span className="font-bold text-[15px] text-gray-900">₹{safeProduct.price}</span>
                        {safeProduct.originalPrice > safeProduct.price && (
                            <span className="text-[10px] text-gray-400 line-through">₹{safeProduct.originalPrice}</span>
                        )}
                    </div>

                    {/* Add Button */}
                    <button
                        ref={addBtnRef}
                        onClick={handleAdd}
                        disabled={!safeProduct.isAvailable}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all active:scale-95 border-2 border-[#C97B4B] text-[#C97B4B] bg-white hover:bg-[#C97B4B] hover:text-white"
                    >
                        <span>{hasOptions ? 'ADD +' : 'ADD'}</span>
                    </button>
                </div>
            </div>
        </div>

        {/* Bottom Sheet Customizer */}
        {showCustomize && (
            <BottomSheetCustomizer
                product={safeProduct}
                onClose={handleSheetClose}
                triggerRef={addBtnRef}
            />
        )}

        {/* Toast animation CSS */}
        <style>{`
            @keyframes toastPop {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
                100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
        `}</style>
        </>
    );
});

ProductCardNew.displayName = 'ProductCardNew';
export default ProductCardNew;
