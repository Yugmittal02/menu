import React from 'react';

const ProductCardSkeleton = ({ index = 0 }) => (
    <div
        className="animate-fade-in"
        style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid #f0f0f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            animationDelay: `${index * 0.08}s`
        }}
    >
        {/* Image skeleton — square like ProductCardNew */}
        <div
            className="skeleton"
            style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: '0',
                background: 'linear-gradient(90deg, #f0ebe3 25%, #e5dfd5 50%, #f0ebe3 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite'
            }}
        />

        {/* Content skeleton */}
        <div style={{ padding: '10px' }}>
            {/* Name — two lines */}
            <div
                className="skeleton"
                style={{ width: '85%', height: '14px', borderRadius: '6px', marginBottom: '6px' }}
            />
            <div
                className="skeleton"
                style={{ width: '55%', height: '14px', borderRadius: '6px', marginBottom: '8px' }}
            />

            {/* Weight */}
            <div
                className="skeleton"
                style={{ width: '32px', height: '10px', borderRadius: '4px', marginBottom: '10px' }}
            />

            {/* Price + Button row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <div
                        className="skeleton"
                        style={{ width: '50px', height: '16px', borderRadius: '6px', marginBottom: '4px' }}
                    />
                    <div
                        className="skeleton"
                        style={{ width: '36px', height: '10px', borderRadius: '4px' }}
                    />
                </div>
                <div
                    className="skeleton"
                    style={{
                        width: '56px',
                        height: '28px',
                        borderRadius: '14px'
                    }}
                />
            </div>
        </div>
    </div>
);

export default ProductCardSkeleton;
