import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaArrowRight, FaUser, FaPhone, FaBirthdayCake } from 'react-icons/fa';

const Login = () => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const { enterAsCustomer } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Intro/Phone, 2: Name (if new)
    const { customer } = useAuth();

    useEffect(() => {
        if (customer) {
            const from = location.state?.from || '/dashboard';
            navigate(from, { replace: true });
        }
    }, [customer, navigate, location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // enterAsCustomer handles both login and registration in the backend
            // It searches by phone, if exists -> logs in, if not -> creates new
            const res = await enterAsCustomer(name, phone);

            if (res.success) {
                const from = location.state?.from || '/dashboard';
                navigate(from, { replace: true });
            } else {
                alert(res.message);
            }
        } catch (err) {
            console.error(err);
            alert("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#FAF7F2]">

            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="absolute top-6 left-6 z-20 w-11 h-11 rounded-full flex items-center justify-center active:scale-95 transition-all shadow-lg"
                style={{ background: '#FFFFFF', border: '2px solid #E8E3DB' }}
                aria-label="Go back"
            >
                <FaArrowLeft size={16} color="#C97B4B" />
            </button>

            {/* Background Elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#C97B4B] opacity-5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#C9A962] opacity-5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4"></div>

                {/* Floating Icons Pattern */}
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'radial-gradient(#4A2C1A 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
                </div>
            </div>

            <div className="w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden relative z-10 flex flex-col md:flex-row min-h-[600px] animate-fade-in-up">

                {/* Left Side - Visual/Brand */}
                <div className="md:w-1/2 bg-gradient-to-br from-[#1C1C1C] to-[#2D1F16] p-12 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-20">
                        <img src="https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&fit=crop"
                            alt="Bakery Background"
                            className="w-full h-full object-cover" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <span className="text-4xl">🧁</span>
                            <h1 className="text-2xl font-bold tracking-wide">Sewa Shubham</h1>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                            Taste the <span className="text-[#C97B4B]">Magic</span> <br />
                            in Every Bite
                        </h2>

                        <p className="text-white/70 text-lg leading-relaxed max-w-sm">
                            Join our community of food lovers. Order seamlessly, track deliveries, and enjoy exclusive member perks.
                        </p>
                    </div>

                    <div className="relative z-10 mt-12 flex gap-4">
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl flex-1 border border-white/20">
                            <h3 className="text-2xl font-bold text-[#C97B4B]">500+</h3>
                            <p className="text-xs text-white/60 uppercase tracking-wider mt-1">Daily Happy Customers</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl flex-1 border border-white/20">
                            <h3 className="text-2xl font-bold text-[#C97B4B]">4.9★</h3>
                            <p className="text-xs text-white/60 uppercase tracking-wider mt-1">Average Rating</p>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white relative">
                    <div className="max-w-xs mx-auto w-full">
                        <div className="mb-8 text-center md:text-left">
                            <h3 className="text-2xl font-bold text-[#1C1C1C] mb-2">Welcome Back!</h3>
                            <p className="text-[#7E7E7E]">Please enter your details to continue</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-[#8B7355] ml-1">Your Name</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <FaUser className="text-[#D4B896] group-focus-within:text-[#C97B4B] transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-[#FAF7F2] border-2 border-[#E8E3DB] text-[#1C1C1C] text-lg rounded-xl pl-11 pr-4 py-3.5 outline-none transition-all focus:border-[#C97B4B] focus:bg-white placeholder:text-[#D4B896]"
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-[#8B7355] ml-1">Phone Number</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <FaPhone className="text-[#D4B896] group-focus-within:text-[#C97B4B] transition-colors" />
                                    </div>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full bg-[#FAF7F2] border-2 border-[#E8E3DB] text-[#1C1C1C] text-lg rounded-xl pl-11 pr-4 py-3.5 outline-none transition-all focus:border-[#C97B4B] focus:bg-white placeholder:text-[#D4B896]"
                                        placeholder="98765 43210"
                                        maxLength="10"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-[#C97B4B] to-[#E8956A] text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-[#C97B4B]/30 hover:shadow-[#C97B4B]/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        Start Ordering
                                        <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="text-xs text-center text-[#9CA3AF] mt-8">
                            By continuing, you adhere to our <span onClick={() => navigate('/terms')} className="underline cursor-pointer hover:text-[#C97B4B]">Terms</span> and <span onClick={() => navigate('/privacy')} className="underline cursor-pointer hover:text-[#C97B4B]">Privacy Policy</span>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
