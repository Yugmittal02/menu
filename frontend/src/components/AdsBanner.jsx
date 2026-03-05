import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';

const AdsBanner = () => {
    const navigate = useNavigate();
    const [currentAd, setCurrentAd] = useState(0);

    const gradients = [
        'linear-gradient(135deg, #C97B4B 0%, #E8956A 100%)',
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        'linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)',
    ];

    const icons = ['🎂', '🥟', '💍', '🎁', '🍕', '🍪'];

    // Default fallback ads - always show these if API fails or returns empty
    const defaultAds = [
        {
            id: 'default-1',
            title: 'Fresh Cakes Daily',
            subtitle: 'Made with love & premium ingredients',
            description: 'Order Now & Get 10% OFF',
            image: 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=600&h=400&fit=crop&q=80',
            bgGradient: gradients[0],
            link: '/category/cake',
            badge: '🔥 HOT',
            icon: '🎂'
        },
        {
            id: 'default-2',
            title: 'Birthday Specials',
            subtitle: 'Make celebrations memorable',
            description: 'Custom Cakes Available',
            image: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=600&h=400&fit=crop&q=80',
            bgGradient: gradients[1],
            link: '/category/cake',
            badge: '🎉 SPECIAL',
            icon: '🎁'
        },
        {
            id: 'default-3',
            title: 'Crispy Patties',
            subtitle: 'Hot & Fresh from the oven',
            description: 'Starting at just ₹20',
            image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&h=400&fit=crop&q=80',
            bgGradient: gradients[4],
            link: '/category/fastfood',
            badge: '⚡ QUICK',
            icon: '🥟'
        },
        {
            id: 'default-4',
            title: 'Beautiful Flowers',
            subtitle: 'Perfect for every occasion',
            description: 'Fresh Bouquets Daily',
            image: 'https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=600&h=400&fit=crop&q=80',
            bgGradient: gradients[2],
            link: '/category/flowers',
            badge: '💐 NEW',
            icon: '💐'
        }
    ];

    const [ads] = useState(defaultAds);

    // Auto-rotate ads every 5 seconds
    useEffect(() => {
        if (ads.length === 0) return;
        const timer = setInterval(() => {
            setCurrentAd((prev) => (prev + 1) % ads.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [ads.length]);

    const handleAdClick = (link) => {
        navigate(link);
    };

    const goToSlide = (index) => {
        setCurrentAd(index);
    };

    const nextSlide = () => {
        if (ads.length === 0) return;
        setCurrentAd((prev) => (prev + 1) % ads.length);
    };

    const prevSlide = () => {
        if (ads.length === 0) return;
        setCurrentAd((prev) => (prev - 1 + ads.length) % ads.length);
    };

    return (
        <section className="ads-banner-section max-w-5xl mx-auto my-4 px-3">
            {/* Section Header - Compact */}
            <div className="ads-banner-header text-center mb-3">
                <div className="ads-banner-title flex items-center justify-center gap-2 mb-1">
                    <span className="fire-icon text-lg">🔥</span>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 m-0">Special Offers</h2>
                    <span className="fire-icon text-lg">🔥</span>
                </div>
                <p className="ads-banner-subtitle text-xs md:text-sm text-gray-500 m-0">Don't miss out on these amazing deals!</p>
            </div>

            {/* Main Carousel - Compact */}
            <div className="ads-carousel-wrapper relative rounded-2xl overflow-hidden shadow-md bg-white" style={{ aspectRatio: '16/9' }}>
                {/* Navigation Arrows */}
                {ads.length > 1 && (
                    <>
                        <button className="carousel-arrow prev absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white shadow-sm text-gray-700 transition-all" onClick={prevSlide}>
                            ‹
                        </button>
                        <button className="carousel-arrow next absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white shadow-sm text-gray-700 transition-all" onClick={nextSlide}>
                            ›
                        </button>
                    </>
                )}

                {/* Carousel Container */}
                <div className="ads-carousel h-full w-full">
                    <div
                        className="ads-carousel-track h-full flex transition-transform duration-500 ease-out"
                        style={{ transform: `translateX(-${currentAd * 100}%)` }}
                    >
                        {ads.map((ad) => (
                            <div
                                key={ad.id}
                                className="ad-slide min-w-full h-full relative flex cursor-pointer"
                                onClick={() => handleAdClick(ad.link)}
                            >
                                <div
                                    className="ad-slide-content w-full h-full flex"
                                    style={{ background: ad.bgGradient }}
                                >
                                    {/* Left Content */}
                                    <div className="ad-slide-text flex-1 p-4 md:p-8 flex flex-col justify-center items-start z-10">
                                        <div className="ad-slide-badge bg-white/90 text-[11px] md:text-xs font-bold px-2.5 py-1 rounded-full mb-2 shadow-sm text-orange-600 uppercase tracking-wider">{ad.badge}</div>
                                        <h3 className="ad-slide-title text-shadow text-white font-bold text-xl md:text-2xl mb-1.5 leading-tight">{ad.title}</h3>
                                        <p className="ad-slide-subtitle text-white/90 text-sm md:text-base mb-1">{ad.subtitle}</p>
                                        <p className="ad-slide-description bg-white/20 inline-block px-3 py-1 rounded-full text-[11px] md:text-xs text-white backdrop-blur-sm mt-1">{ad.description}</p>
                                        <button className="ad-slide-cta mt-3 bg-white text-orange-600 px-4 py-2 rounded-full text-xs md:text-sm font-bold shadow-lg flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-transform">
                                            Shop Now <FaArrowRight size={10} />
                                        </button>
                                    </div>

                                    {/* Right Image */}
                                    <div className="ad-slide-image flex-1 relative overflow-hidden">
                                        <img src={ad.image} alt={ad.title} className="object-cover w-full h-full absolute inset-0 mask-image-gradient" />
                                        <div className="ad-slide-image-overlay absolute inset-0 bg-gradient-to-r from-black/10 to-transparent"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Dots Navigation */}
                {ads.length > 1 && (
                    <div className="carousel-dots absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-20">
                        {ads.map((_, index) => (
                            <button
                                key={index}
                                onClick={(e) => { e.stopPropagation(); goToSlide(index); }}
                                className={`carousel-dot w-1.5 h-1.5 rounded-full transition-all ${currentAd === index ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/80'}`}
                            />
                        ))}
                    </div>
                )}
            </div>

        </section>
    );
};

export default AdsBanner;
