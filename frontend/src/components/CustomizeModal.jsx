import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaMinus, FaTimes, FaCheck, FaShoppingBag, FaArrowRight, FaShoppingCart } from 'react-icons/fa';

const CustomizeModal = ({ product, onClose }) => {
    const { addToCart } = useCart();
    const navigate = useNavigate();
    const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || null);
    const [selectedAddons, setSelectedAddons] = useState([]);
    const [quantity, setQuantity] = useState(1);
    const [addedState, setAddedState] = useState(false);

    const toggleAddon = (addon) => {
        setSelectedAddons(prev => 
            prev.find(a => a.name === addon.name) 
                ? prev.filter(a => a.name !== addon.name)
                : [...prev, addon]
        );
    };

    const calculatePrice = () => {
        let price = selectedSize?.price || product.basePrice;
        price += selectedAddons.reduce((sum, a) => sum + a.price, 0);
        return price * quantity;
    };

    const handleAddToCart = () => {
        addToCart({
            ...product,
            size: selectedSize?.name || null,
            selectedAddons: selectedAddons.map(a => a.name),
            price: calculatePrice() / quantity,
            quantity
        });
        setAddedState(true);
    };

    const handleContinueShopping = () => {
        onClose(true);
    };

    const handleViewCart = () => {
        onClose(true);
        navigate('/cart');
    };

    return (
        <div
            className="fixed inset-0 z-[60] flex items-end justify-center"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(false); }}
        >
            <div
                style={{
                    background: '#FFFFFF',
                    width: '100%',
                    maxWidth: '500px',
                    maxHeight: '88vh',
                    borderTopLeftRadius: '24px',
                    borderTopRightRadius: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    boxShadow: '0 -8px 40px rgba(0,0,0,0.25)',
                    animation: 'slide-up 0.3s ease-out'
                }}
            >
                {/* Success State — After Adding to Cart */}
                {addedState ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '48px 24px 40px',
                        minHeight: '340px'
                    }}>
                        {/* Success Icon */}
                        <div style={{
                            width: '72px',
                            height: '72px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '20px',
                            boxShadow: '0 8px 24px rgba(34, 197, 94, 0.3)',
                            animation: 'bounceIn 0.5s ease'
                        }}>
                            <FaCheck size={28} color="#FFFFFF" />
                        </div>

                        <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#1C1C1C', margin: '0 0 6px', textAlign: 'center' }}>
                            Added to Cart!
                        </h3>
                        <p style={{ fontSize: '14px', color: '#7E7E7E', margin: '0 0 8px', textAlign: 'center' }}>
                            {product.name} {selectedSize ? `(${selectedSize.name})` : ''} × {quantity}
                        </p>
                        <p style={{ fontSize: '20px', fontWeight: 700, color: '#C97B4B', margin: '0 0 28px' }}>
                            ₹{calculatePrice()}
                        </p>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                            <button
                                onClick={handleViewCart}
                                style={{
                                    width: '100%',
                                    height: '52px',
                                    background: 'linear-gradient(135deg, #C97B4B 0%, #E8956A 100%)',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: '14px',
                                    fontSize: '16px',
                                    fontWeight: 700,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    cursor: 'pointer',
                                    boxShadow: '0 6px 20px rgba(201, 123, 75, 0.35)'
                                }}
                            >
                                <FaShoppingCart size={16} />
                                <span>View Cart</span>
                                <FaArrowRight size={12} />
                            </button>
                            <button
                                onClick={handleContinueShopping}
                                style={{
                                    width: '100%',
                                    height: '48px',
                                    background: '#F5F5F5',
                                    color: '#666666',
                                    border: '2px solid #E8E3DB',
                                    borderRadius: '14px',
                                    fontSize: '15px',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Header with Image — fixed height */}
                        <div style={{ position: 'relative', height: '180px', flexShrink: 0, background: '#f3f0eb' }}>
                            {product.image ? (
                                <img src={product.image} alt={product.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '56px', background: 'linear-gradient(135deg, #FFF7ED, #FEF3C7)' }}>
                                    🍽️
                                </div>
                            )}
                            <div style={{
                                position: 'absolute', inset: 0,
                                background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)'
                            }}></div>
                            <button 
                                onClick={() => onClose(false)}
                                style={{
                                    position: 'absolute', top: '12px', right: '12px',
                                    width: '40px', height: '40px',
                                    background: 'rgba(255,255,255,0.9)',
                                    border: 'none', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                }}
                            >
                                <FaTimes size={16} color="#555" />
                            </button>
                            <div style={{ position: 'absolute', bottom: '14px', left: '16px', right: '16px' }}>
                                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', margin: 0, textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                                    {product.name}
                                </h2>
                                {product.description && (
                                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {product.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '20px 16px',
                            WebkitOverflowScrolling: 'touch'
                        }}>
                            {/* Sizes */}
                            {product.sizes?.length > 0 && (
                                <div style={{ marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#2D1810', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        🏷️ Choose Size
                                    </h3>
                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                        {product.sizes.map(size => (
                                            <button
                                                key={size.name}
                                                onClick={() => setSelectedSize(size)}
                                                style={{
                                                    flex: '1 1 0',
                                                    minWidth: '90px',
                                                    padding: '12px 8px',
                                                    borderRadius: '14px',
                                                    border: selectedSize?.name === size.name ? '2px solid #E8956A' : '2px solid #E8E3DB',
                                                    background: selectedSize?.name === size.name ? '#FFF7ED' : '#FFFFFF',
                                                    textAlign: 'center',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                <p style={{ fontSize: '14px', fontWeight: 700, color: '#2D1810', margin: 0 }}>{size.name}</p>
                                                <p style={{
                                                    fontSize: '14px', fontWeight: 600, margin: '4px 0 0',
                                                    color: selectedSize?.name === size.name ? '#E8956A' : '#8B7355'
                                                }}>
                                                    ₹{size.price}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Addons */}
                            {product.addons?.length > 0 && (
                                <div style={{ marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#2D1810', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        ✨ Add Extras
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {product.addons.map(addon => {
                                            const isSelected = selectedAddons.find(a => a.name === addon.name);
                                            return (
                                                <button
                                                    key={addon.name}
                                                    onClick={() => toggleAddon(addon)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px 14px',
                                                        borderRadius: '14px',
                                                        border: isSelected ? '2px solid #E8956A' : '2px solid #E8E3DB',
                                                        background: isSelected ? '#FFF7ED' : '#FFFFFF',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        gap: '12px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        textAlign: 'left'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                                                        <div style={{
                                                            width: '22px', height: '22px',
                                                            borderRadius: '6px',
                                                            border: isSelected ? '2px solid #E8956A' : '2px solid #CCC',
                                                            background: isSelected ? '#E8956A' : '#FFFFFF',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            flexShrink: 0
                                                        }}>
                                                            {isSelected && <FaCheck size={10} color="#FFFFFF" />}
                                                        </div>
                                                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#2D1810', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {addon.name}
                                                        </span>
                                                    </div>
                                                    <span style={{
                                                        fontSize: '14px', fontWeight: 700, flexShrink: 0,
                                                        color: isSelected ? '#E8956A' : '#8B7355'
                                                    }}>
                                                        +₹{addon.price}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Quantity */}
                            <div>
                                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#2D1810', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    🔢 Quantity
                                </h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <button
                                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                        style={{
                                            width: '48px', height: '48px',
                                            background: '#F3F0EB', border: 'none', borderRadius: '14px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', fontSize: '18px'
                                        }}
                                    >
                                        <FaMinus size={14} color="#555" />
                                    </button>
                                    <span style={{ fontSize: '24px', fontWeight: 800, color: '#2D1810', width: '36px', textAlign: 'center' }}>
                                        {quantity}
                                    </span>
                                    <button
                                        onClick={() => setQuantity(q => q + 1)}
                                        style={{
                                            width: '48px', height: '48px',
                                            background: '#FFF7ED', border: '2px solid #E8956A', borderRadius: '14px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <FaPlus size={14} color="#E8956A" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer — Add to Cart Button (sticky) */}
                        <div style={{
                            padding: '12px 16px',
                            paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
                            borderTop: '1px solid #F0EBE3',
                            background: '#FFFFFF',
                            flexShrink: 0
                        }}>
                            <button
                                onClick={handleAddToCart}
                                style={{
                                    width: '100%',
                                    height: '54px',
                                    background: 'linear-gradient(135deg, #E8956A 0%, #D4773E 100%)',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: '16px',
                                    fontSize: '16px',
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '12px',
                                    cursor: 'pointer',
                                    boxShadow: '0 6px 20px rgba(232, 149, 106, 0.4)'
                                }}
                            >
                                <FaShoppingBag size={18} />
                                <span>Add to Cart</span>
                                <span style={{
                                    background: 'rgba(255,255,255,0.25)',
                                    padding: '4px 14px',
                                    borderRadius: '10px',
                                    fontWeight: 800,
                                    fontSize: '17px'
                                }}>
                                    ₹{calculatePrice()}
                                </span>
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Custom CSS */}
            <style>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                @keyframes bounceIn {
                    0% { opacity: 0; transform: scale(0.3); }
                    50% { opacity: 1; transform: scale(1.05); }
                    70% { transform: scale(0.9); }
                    100% { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default CustomizeModal;
