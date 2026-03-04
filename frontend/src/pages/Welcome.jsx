import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaArrowRight, FaUtensils, FaMapMarkerAlt, FaLeaf } from 'react-icons/fa';

const Welcome = () => {
    const navigate = useNavigate();
    const { customer } = useAuth();
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (customer) {
            navigate('/menu');
        }
        // Trigger entrance animations
        setTimeout(() => setLoaded(true), 100);
    }, [customer, navigate]);

    // Time-based greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return '🌅 Good Morning!';
        if (hour < 17) return '☀️ Good Afternoon!';
        return '🌙 Good Evening!';
    };

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 z-0"
                style={{
                    background: 'linear-gradient(160deg, #FFF8F0 0%, #FFE8CC 25%, #FFDDB5 50%, #FFE8CC 75%, #FFF5EB 100%)',
                }}
            ></div>

            {/* Animated gradient overlay */}
            <div className="absolute inset-0 z-0 animate-gradient-shift"
                style={{
                    background: 'radial-gradient(ellipse at 30% 20%, rgba(249, 115, 22, 0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(251, 146, 60, 0.06) 0%, transparent 50%)',
                }}
            ></div>

            {/* Subtle dot pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.04]"
                style={{
                    backgroundImage: `radial-gradient(circle, #F97316 1px, transparent 1px)`,
                    backgroundSize: '32px 32px',
                }}
            ></div>

            {/* Decorative Warm Blobs */}
            <div className="absolute top-[-15%] left-[-15%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-30 animate-blob"
                style={{ background: '#FFD6A8' }}></div>
            <div className="absolute bottom-[-15%] right-[-15%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-25 animate-blob-reverse"
                style={{ background: '#FFCFA0' }}></div>
            <div className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[40%] h-[40%] rounded-full blur-[100px] opacity-15"
                style={{ background: '#FFC78A' }}></div>

            {/* Floating Food Items */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
                {/* Top Left - Cake */}
                <div className={`absolute top-[4%] left-[3%] transition-all duration-1000 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
                    <div className="animate-float-slow">
                        <div className="w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden ring-4 ring-white/40"
                            style={{ boxShadow: '0 12px 40px rgba(249, 115, 22, 0.2)' }}>
                            <img
                                src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=300&fit=crop&q=80"
                                alt="Chocolate Cake"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>

                {/* Top Right - Iced Drink */}
                <div className={`absolute top-[8%] right-[3%] transition-all duration-1000 delay-200 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
                    <div className="animate-float-medium">
                        <div className="w-18 h-18 md:w-24 md:h-24 rounded-full overflow-hidden ring-4 ring-white/40"
                            style={{ boxShadow: '0 12px 40px rgba(249, 115, 22, 0.2)', width: '72px', height: '72px' }}>
                            <img
                                src="https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=300&h=300&fit=crop&q=80"
                                alt="Iced Drink"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>

                {/* Bottom Left - Pastry */}
                <div className={`absolute bottom-[20%] left-[-2%] transition-all duration-1000 delay-400 ${loaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
                    <div className="animate-float-fast">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden ring-4 ring-white/40"
                            style={{ boxShadow: '0 12px 40px rgba(249, 115, 22, 0.18)' }}>
                            <img
                                src="https://images.unsplash.com/photo-1626803775151-61d756612f97?w=300&h=300&fit=crop&q=80"
                                alt="Pastry"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>

                {/* Bottom Right - Drink */}
                <div className={`absolute bottom-[12%] right-[0%] transition-all duration-1000 delay-300 ${loaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
                    <div className="animate-float-slow">
                        <div className="w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden ring-4 ring-white/40"
                            style={{ boxShadow: '0 12px 40px rgba(249, 115, 22, 0.18)' }}>
                            <img
                                src="https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=300&h=300&fit=crop&q=80"
                                alt="Iced Drink"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>

                {/* Mid Right - Milkshake */}
                <div className={`absolute top-[42%] right-[1%] transition-all duration-1000 delay-500 ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                    <div className="animate-float-medium">
                        <div className="w-14 h-14 md:w-20 md:h-20 rounded-full overflow-hidden ring-3 ring-white/30"
                            style={{ boxShadow: '0 8px 30px rgba(249, 115, 22, 0.15)' }}>
                            <img
                                src="https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&h=300&fit=crop&q=80"
                                alt="Milkshake"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>

                {/* Floating emojis */}
                <div className="absolute top-[30%] left-[8%] text-2xl animate-float-emoji-1 opacity-40">🍰</div>
                <div className="absolute top-[60%] right-[10%] text-xl animate-float-emoji-2 opacity-30">🧁</div>
                <div className="absolute bottom-[35%] left-[15%] text-lg animate-float-emoji-3 opacity-25">🍩</div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-20 text-center px-6">

                {/* Time-based greeting */}
                <div className={`transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'}`}>
                    <p className="text-sm font-medium mb-4 px-4 py-1.5 rounded-full inline-block"
                        style={{ background: 'rgba(249, 115, 22, 0.1)', color: '#EA580C' }}>
                        {getGreeting()}
                    </p>
                </div>

                {/* Logo Icon with Glow */}
                <div className={`mb-5 relative transition-all duration-800 delay-100 ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                    <div className="absolute inset-0 rounded-full animate-pulse-glow"
                        style={{ background: 'rgba(249, 115, 22, 0.15)', filter: 'blur(20px)', transform: 'scale(1.3)' }}></div>
                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center relative"
                        style={{
                            background: 'linear-gradient(145deg, #FFFFFF 0%, #FFF8F2 100%)',
                            boxShadow: '0 10px 50px rgba(249, 115, 22, 0.2), 0 4px 15px rgba(0,0,0,0.06), inset 0 -2px 8px rgba(249, 115, 22, 0.05)',
                        }}>
                        <FaUtensils size={38} color="#F97316" />
                    </div>
                </div>

                {/* Brand Name */}
                <div className={`transition-all duration-700 delay-200 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-1">
                        <span style={{ color: '#1a1a2e' }}>Sewa Shubham</span>
                    </h1>
                    <p className="text-lg md:text-xl font-bold mb-5">
                        <span style={{ color: '#F97316' }}>Bakery & Cafe</span>
                    </p>
                </div>

                {/* Tagline */}
                <div className={`transition-all duration-700 delay-300 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
                    <p className="text-base md:text-lg font-medium max-w-md mb-8 leading-relaxed"
                        style={{ color: '#78716C' }}>
                        ✨ Fresh Bakes • Delicious Moments • Happy Memories ✨
                    </p>
                </div>

                {/* Main CTA Button with shine effect */}
                <div className={`transition-all duration-700 delay-400 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
                    <button
                        onClick={() => navigate('/menu')}
                        className="group text-white font-bold text-lg py-4 px-10 rounded-2xl flex items-center gap-3 transition-all duration-300 transform hover:scale-105 active:scale-95 w-full max-w-sm justify-center relative overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, #F97316 0%, #FB923C 50%, #F97316 100%)',
                            boxShadow: '0 10px 35px rgba(249, 115, 22, 0.4), 0 4px 12px rgba(249, 115, 22, 0.2)',
                        }}
                    >
                        {/* Shine effect */}
                        <div className="absolute inset-0 animate-shine"
                            style={{
                                background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 45%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.3) 55%, transparent 60%)',
                                backgroundSize: '300% 100%',
                            }}></div>
                        <span className="relative z-10 flex items-center gap-3">
                            Browse Our Menu
                            <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>
                </div>

                {/* Trust Badges — Real, verifiable info */}
                <div className={`flex items-center gap-4 mt-8 transition-all duration-700 delay-500 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
                    <div className="flex items-center gap-1.5">
                        <FaLeaf size={12} color="#22C55E" />
                        <span className="text-xs font-semibold" style={{ color: '#92400E' }}>100% Eggless</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-orange-300"></div>
                    <div className="flex items-center gap-1.5">
                        <FaMapMarkerAlt size={12} color="#F97316" />
                        <span className="text-xs font-semibold" style={{ color: '#92400E' }}>Bharatpur</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-orange-300"></div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs" style={{ color: '#F97316' }}>🍰</span>
                        <span className="text-xs font-semibold" style={{ color: '#92400E' }}>Since 2002</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="relative z-20 pb-8 text-center">
                <p className="text-sm font-medium" style={{ color: '#D97706' }}>
                    Made with <span className="text-red-500 animate-heartbeat inline-block">❤️</span> for our lovely customers
                </p>
            </div>

            {/* All Animations */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-15px) rotate(2deg); }
                }
                @keyframes float-reverse {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(15px) rotate(-2deg); }
                }
                .animate-float-slow {
                    animation: float 6s ease-in-out infinite;
                }
                .animate-float-medium {
                    animation: float-reverse 5s ease-in-out infinite;
                }
                .animate-float-fast {
                    animation: float 4s ease-in-out infinite;
                }
                @keyframes float-emoji-1 {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    33% { transform: translateY(-20px) rotate(15deg); }
                    66% { transform: translateY(10px) rotate(-10deg); }
                }
                @keyframes float-emoji-2 {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-25px) rotate(-20deg); }
                }
                @keyframes float-emoji-3 {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-15px) scale(1.2); }
                }
                .animate-float-emoji-1 { animation: float-emoji-1 8s ease-in-out infinite; }
                .animate-float-emoji-2 { animation: float-emoji-2 7s ease-in-out infinite 1s; }
                .animate-float-emoji-3 { animation: float-emoji-3 6s ease-in-out infinite 2s; }

                @keyframes pulse-glow-bg {
                    0%, 100% { opacity: 0.4; transform: scale(1.3); }
                    50% { opacity: 0.7; transform: scale(1.5); }
                }
                .animate-pulse-glow { animation: pulse-glow-bg 3s ease-in-out infinite; }

                @keyframes shine {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                .animate-shine { animation: shine 3s ease-in-out infinite; }

                @keyframes heartbeat {
                    0%, 100% { transform: scale(1); }
                    25% { transform: scale(1.2); }
                    50% { transform: scale(1); }
                    75% { transform: scale(1.15); }
                }
                .animate-heartbeat { animation: heartbeat 2s ease-in-out infinite; }

                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(10px, -20px) scale(1.05); }
                    66% { transform: translate(-10px, 10px) scale(0.95); }
                }
                @keyframes blob-reverse {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(-15px, 15px) scale(0.95); }
                    66% { transform: translate(10px, -10px) scale(1.05); }
                }
                .animate-blob { animation: blob 12s ease-in-out infinite; }
                .animate-blob-reverse { animation: blob-reverse 10s ease-in-out infinite; }

                @keyframes gradient-shift {
                    0%, 100% { opacity: 0.8; }
                    50% { opacity: 1; }
                }
                .animate-gradient-shift { animation: gradient-shift 6s ease-in-out infinite; }
            `}
            </style>
        </div>
    );
};

export default Welcome;
