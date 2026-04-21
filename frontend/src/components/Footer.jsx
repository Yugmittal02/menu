import React, { memo, useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPhoneAlt, FaEnvelope, FaInstagram, FaWhatsapp, FaHeart, FaMapMarkerAlt } from 'react-icons/fa';
import { getStoreSettings } from '../services/api';

const Footer = memo(() => {
    const currentYear = useMemo(() => new Date().getFullYear(), []);
    
    const [settings, setSettings] = useState({
        adminPhone: '9876543210',
        email: 'contact@bakerydelight.com',
        storeAddress: 'Bharatpur, Rajasthan',
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
                console.error('Failed to load store settings for footer:', error);
            }
        };
        loadSettings();
    }, []);

    return (
        <footer className="bakery-footer">
            {/* Logo */}
            <div className="footer-logo">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <span className="text-3xl" style={{ animationDuration: '3s' }}>🍰</span>
                    <h3>Sewa Shubham Bakery</h3>
                </div>
                <p>Crafting sweet memories since 2002</p>
            </div>

            {/* Address */}
            <div className="flex items-center justify-center gap-2 mb-6 text-white/80">
                <FaMapMarkerAlt size={14} className="flex-shrink-0" />
                <span className="text-sm whitespace-pre-line text-center">{settings.storeAddress}</span>
            </div>

            {/* Links */}
            <div className="footer-links">
                <Link to="/terms">Terms</Link>
                <Link to="/privacy">Privacy</Link>
                <Link to="/refund">Refund</Link>
                <Link to="/shipping">Shipping</Link>
                <Link to="/contact">Contact</Link>
            </div>

            {/* Social */}
            <div className="footer-social">
                <a href={`https://wa.me/91${settings.adminPhone}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                    <FaWhatsapp size={22} />
                </a>
                <a href={settings.instagramLink} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                    <FaInstagram size={22} />
                </a>
                <a href={`tel:+91${settings.adminPhone}`} aria-label="Phone">
                    <FaPhoneAlt size={19} />
                </a>
                <a href={`mailto:${settings.email}`} aria-label="Email">
                    <FaEnvelope size={19} />
                </a>
            </div>

            {/* Bottom */}
            <div className="footer-bottom">
                <p className="flex items-center justify-center gap-2 text-white">
                    Made with <FaHeart size={12} style={{ color: '#FFFFFF' }} className="animate-pulse" /> in Bharatpur
                </p>
                <p className="mt-2 text-white opacity-80">© {currentYear} Sewa Shubham Bakery. All rights reserved.</p>
            </div>
        </footer>
    );
});

Footer.displayName = 'Footer';

export default Footer;
