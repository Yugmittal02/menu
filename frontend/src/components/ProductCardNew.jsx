import React, { useState, useMemo, memo, useCallback } from 'react';
import { FaHeart, FaRegHeart, FaStar, FaShoppingCart, FaCheck, FaBolt } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import CustomizeModal from './CustomizeModal';

const ProductCardNew = memo(({ product, onAddSuccess, index = 0, featured = false }) => {
    const { addToCart } = useCart();
    const [added, setAdded] = useState(false);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [showCustomize, setShowCustomize] = useState(false);

    const safeProduct = useMemo(() => ({
        _id: product?._id || '',
        name: product?.name || 'Product',
        price: Number(product?.price || product?.basePrice) || 0,
        basePrice: Number(product?.basePrice || product?.price) || 0,
        originalPrice: Number(product?.originalPrice || product?.mrp) || Number(product?.price || product?.basePrice) || 0,
        image: product?.image || '',
        rating: product?.rating || '4.5',
        soldCount: product?.soldCount || Math.floor(Math.random() * 200 + 50),
        description: product?.description || '',
        isAvailable: product?.isAvailable !== false,
        isBestseller: product?.isBestseller || false,
        category: product?.category || '',
        weight: product?.weight || '500g',
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
        if (!safeProduct.isAvailable || added) return;

        if (hasOptions) {
            setShowCustomize(true);
            return;
        }

        addToCart({
            _id: safeProduct._id,
            name: safeProduct.name,
            price: safeProduct.price,
            basePrice: safeProduct.basePrice,
            image: safeProduct.image,
        });
        setAdded(true);
        onAddSuccess?.();
        setTimeout(() => setAdded(false), 2000);
    }, [safeProduct, added, addToCart, onAddSuccess, hasOptions]);

    const handleCustomizeClose = useCallback((didAdd = false) => {
        setShowCustomize(false);
        if (didAdd) {
            setAdded(true);
            setTimeout(() => setAdded(false), 2000);
            onAddSuccess?.();
        }
    }, [onAddSuccess]);

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
            {/* Badges - Top Left */}
            <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                {safeProduct.isBestseller && (
                    <span className="bg-[#C97B4B] text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <FaBolt size={7} /> BEST
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

                {/* Express Delivery Badge - Winni Style */}
                <div className="absolute bottom-0 left-0 right-0 px-2 pb-2">
                    <div className="flex items-center gap-1 bg-white/95 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm w-fit">
                        <FaBolt size={8} className="text-[#C97B4B]" />
                        <span className="text-[9px] font-semibold text-gray-700">Express Delivery</span>
                    </div>
                </div>
            </div>

            {/* Product Info */}
            <div className="p-2.5 flex flex-col gap-1">
                {/* Rating Row - FNP Style */}
                <div className="flex items-center gap-1">
                    <div className="flex items-center gap-0.5 bg-green-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        <span>{safeProduct.rating}</span>
                        <FaStar size={7} />
                    </div>
                    <span className="text-[10px] text-gray-400">({safeProduct.soldCount})</span>
                </div>

                {/* Name */}
                <h4 className="font-semibold text-[13px] text-gray-800 leading-tight line-clamp-2 min-h-[2.2em]">
                    {safeProduct.name}
                </h4>

                {/* Weight/Size - Winni Style */}
                <span className="text-[10px] text-gray-400 font-medium">
                    {safeProduct.weight}
                </span>

                {/* Price + Add Button Row */}
                <div className="flex items-end justify-between mt-1">
                    <div className="flex flex-col">
                        <span className="font-bold text-[15px] text-gray-900">₹{safeProduct.price}</span>
                        {safeProduct.originalPrice > safeProduct.price && (
                            <span className="text-[10px] text-gray-400 line-through">₹{safeProduct.originalPrice}</span>
                        )}
                    </div>

                    {/* Add Button - Compact like Winni */}
                    <button
                        onClick={handleAdd}
                        disabled={!safeProduct.isAvailable || added}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all active:scale-95 ${added
                                ? 'bg-green-600 text-white'
                                : 'border-2 border-[#C97B4B] text-[#C97B4B] bg-white hover:bg-[#C97B4B] hover:text-white'
                            }`}
                    >
                        {added ? (
                            <>
                                <FaCheck size={9} />
                                <span>Added</span>
                            </>
                        ) : (
                            <>
                                <span>{hasOptions ? 'ADD +' : 'ADD'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>

        {/* Customize Modal */}
        {showCustomize && (
            <CustomizeModal
                product={safeProduct}
                onClose={handleCustomizeClose}
            />
        )}
        </>
    );
});

ProductCardNew.displayName = 'ProductCardNew';
export default ProductCardNew;
