import React, { useState, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { FaPlus, FaStar, FaCheck } from 'react-icons/fa';

const ProductCard = memo(({ product, onAddSuccess }) => {
    const { addToCart } = useCart();
    const navigate = useNavigate();
    const [added, setAdded] = useState(false);
    
    // Defensive checks for product properties
    const safeProduct = useMemo(() => ({
        _id: product?._id || '',
        slug: product?.slug || '',
        name: product?.name || 'Unnamed Product',
        description: product?.description || '',
        basePrice: Number(product?.basePrice) || 0,
        image: product?.image || null,
        isAvailable: product?.isAvailable !== false,
        rating: Number(product?.rating) || 0,
        sizes: Array.isArray(product?.sizes) ? product.sizes : [],
        addons: Array.isArray(product?.addons) ? product.addons : [],
        category: product?.category || '',
    }), [product]);
    
    const hasOptions = safeProduct.sizes.length > 0 || safeProduct.addons.length > 0;
    
    const handleAdd = useCallback((e) => {
        e?.stopPropagation();
        if (!safeProduct.isAvailable) return;
        
        if (hasOptions) {
            navigate(`/product/${safeProduct.slug || safeProduct._id}`);
        } else {
            addToCart({
                ...safeProduct,
                size: null,
                selectedAddons: [],
                price: safeProduct.basePrice,
                quantity: 1,
            });
            setAdded(true);
            setTimeout(() => setAdded(false), 1500);
            onAddSuccess?.();
        }
    }, [safeProduct, hasOptions, addToCart, onAddSuccess, navigate]);

    return (
        <>
            <div onClick={() => navigate(`/product/${safeProduct.slug || safeProduct._id}`)} className={`rounded-3xl shadow-sm overflow-hidden transition-all active:scale-[0.98] cursor-pointer bg-white border border-gray-100 ${
                !safeProduct.isAvailable ? 'opacity-60' : ''
            }`}>
                
                {/* Large Touch Area */}
                <div className="p-4 flex gap-4">
                    {/* Image */}
                    <div 
                        className="w-28 h-28 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex-shrink-0 bg-cover bg-center relative overflow-hidden"
                        style={{ backgroundImage: safeProduct.image ? `url(${safeProduct.image})` : 'none' }}
                    >
                        {!safeProduct.image && (
                            <div className="absolute inset-0 flex items-center justify-center text-5xl">🍽️</div>
                        )}
                        {!safeProduct.isAvailable && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                <span className="text-white text-xs font-bold bg-red-500 px-3 py-1.5 rounded-xl uppercase tracking-wide">Sold Out</span>
                            </div>
                        )}
                        {safeProduct.rating > 0 && (
                            <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm text-amber-700 px-2 py-1 rounded-lg shadow-sm">
                                <FaStar className="text-amber-500" size={10} />
                                <span className="font-bold text-xs">{safeProduct.rating}</span>
                            </div>
                        )}
                    </div>
                    
                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between min-w-0 py-1">
                        <div>
                            <h3 className="font-bold text-lg leading-tight line-clamp-1 text-gray-800">{safeProduct.name}</h3>
                            <p className="text-sm text-gray-500 line-clamp-2 mt-1 leading-relaxed">{safeProduct.description}</p>
                            
                            {/* Sizes hint */}
                            {safeProduct.sizes.length > 0 && (
                                <div className="flex gap-1.5 mt-2 flex-wrap">
                                    {safeProduct.sizes.map(s => (
                                        <span key={s?.name || Math.random()} className="text-xs text-orange-600 font-semibold bg-orange-50 px-2.5 py-1 rounded-lg">
                                            {s?.name || 'Size'}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {safeProduct.addons.length > 0 && (
                                <div className="mt-2">
                                    <span className="text-xs text-green-700 font-semibold bg-green-50 px-2.5 py-1 rounded-lg border border-green-100 inline-flex items-center gap-1">
                                        ✨ Add-ons Available
                                    </span>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex justify-between items-end mt-3">
                            <div>
                                <span className="text-xs text-gray-400 font-medium">Starts at</span>
                                <div className="flex items-baseline gap-0.5">
                                    <span className="text-sm text-gray-500">₹</span>
                                    <span className="font-black text-2xl text-gray-900">{safeProduct.basePrice}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add Button */}
                <button 
                    onClick={handleAdd}
                    disabled={!safeProduct.isAvailable}
                    className={`w-full h-14 flex items-center justify-center gap-2 font-bold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        added 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gradient-to-r from-orange-50 to-amber-50 text-orange-600 border-t border-orange-100 active:from-orange-500 active:to-orange-600 active:text-white'
                    }`}
                >
                    {added ? (
                        <>
                            <FaCheck size={16} />
                            <span>Added to Cart!</span>
                        </>
                    ) : (
                        <>
                            <FaPlus size={14} />
                            <span>{hasOptions ? 'Customize & Add' : 'Add to Cart'}</span>
                        </>
                    )}
                </button>
            </div>
            
        </>
    );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;


