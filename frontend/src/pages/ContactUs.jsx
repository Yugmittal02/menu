import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPhoneAlt, FaWhatsapp, FaEnvelope, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import { getStoreSettings } from '../services/api';
import Footer from '../components/Footer';

const ContactUs = () => {
    const navigate = useNavigate();
    const [settings, setSettings] = useState({
        adminPhone: '9876543210',
        email: 'contact@bakerydelight.com',
        storeAddress: 'Bakery Delight, Main Market Road,\nNear City Center, Delhi - 110001',
        workingHours: 'Monday - Sunday\n10:00 AM - 10:00 PM',
        instagramLink: 'https://www.instagram.com/bakery_delight/'
    });

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const { data } = await getStoreSettings();
                if (data) {
                    setSettings(prev => ({ ...prev, ...data }));
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
            }
        };
        loadSettings();
    }, []);

    const contactMethods = [
        {
            icon: FaPhoneAlt,
            label: 'Call Us',
            value: settings.adminPhone,
            href: `tel:+91${settings.adminPhone}`,
            iconColor: '#6B4423',
            bgColor: '#FEF3E2',
        },
        {
            icon: FaWhatsapp,
            label: 'WhatsApp',
            value: 'Chat with us',
            href: `https://wa.me/91${settings.adminPhone}`,
            iconColor: '#22C55E',
            bgColor: '#DCFCE7',
        },
        {
            icon: FaEnvelope,
            label: 'Email',
            value: settings.email,
            href: `mailto:${settings.email}`,
            iconColor: '#C9A962',
            bgColor: '#FEF3E2',
        },
    ];

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #F5F0E8 0%, #FAF7F2 100%)' }}>
            {/* Header */}
            <header className="sticky top-0 z-10 px-4 py-4 flex items-center gap-4"
                style={{ background: 'linear-gradient(180deg, #2D1F16 0%, #3D2B1F 100%)', borderBottom: '3px solid #C9A962' }}>
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
                    style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                    <FaArrowLeft size={16} color="#D4B896" />
                </button>
                <div className="flex items-center gap-2">
                    <span className="text-xl">📞</span>
                    <h1 className="text-lg font-script" style={{ color: '#D4B896' }}>Contact Us</h1>
                </div>
            </header>

            {/* Content */}
            <div className="p-6 max-w-2xl mx-auto">
                {/* Hero */}
                <div className="text-center mb-8 animate-fade-in">
                    <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ background: 'linear-gradient(135deg, #FEF3E2 0%, #FDE8CC 100%)', border: '3px solid #C9A962' }}>
                        <span className="text-5xl">📞</span>
                    </div>
                    <h2 className="text-2xl font-script mb-2" style={{ color: '#6B4423' }}>Get in Touch</h2>
                    <p style={{ color: '#8B7355' }}>We'd love to hear from you!</p>
                </div>

                {/* Contact Methods */}
                <div className="space-y-4 mb-8">
                    {contactMethods.map((method, idx) => (
                        <a
                            key={idx}
                            href={method.href}
                            target={method.icon === FaWhatsapp ? '_blank' : undefined}
                            rel={method.icon === FaWhatsapp ? 'noopener noreferrer' : undefined}
                            className="block w-full p-5 rounded-2xl transition-all active:scale-[0.98] animate-fade-in"
                            style={{
                                background: 'white',
                                border: '2px solid #E8E3DB',
                                boxShadow: '0 4px 16px rgba(74, 55, 40, 0.06)',
                                animationDelay: `${idx * 0.1}s`
                            }}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                                    style={{ background: method.bgColor }}>
                                    <method.icon size={22} color={method.iconColor} />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-base" style={{ color: '#4A3728' }}>{method.label}</p>
                                    <p className="text-sm" style={{ color: '#8B7355' }}>{method.value}</p>
                                </div>
                                <span style={{ color: '#C9A962' }}>→</span>
                            </div>
                        </a>
                    ))}
                </div>

                {/* Address & Hours */}
                <div className="rounded-2xl p-5 mb-8"
                    style={{ background: 'white', border: '2px solid #E8E3DB', boxShadow: '0 4px 16px rgba(74, 55, 40, 0.06)' }}>
                    <div className="flex items-start gap-4 mb-4 pb-4" style={{ borderBottom: '1px dashed #E8E3DB' }}>
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: '#FEF3E2' }}>
                            <FaMapMarkerAlt size={18} color="#6B4423" />
                        </div>
                        <div>
                            <p className="font-bold" style={{ color: '#4A3728' }}>Our Location</p>
                            <p className="text-sm mt-1 whitespace-pre-line" style={{ color: '#8B7355' }}>
                                {settings.storeAddress}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: '#FEF3E2' }}>
                            <FaClock size={18} color="#C9A962" />
                        </div>
                        <div>
                            <p className="font-bold" style={{ color: '#4A3728' }}>Working Hours</p>
                            <p className="text-sm mt-1 whitespace-pre-line" style={{ color: '#8B7355' }}>
                                {settings.workingHours}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default ContactUs;
