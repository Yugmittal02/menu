import React from 'react';
import { Link } from 'react-router-dom';
import { FiGrid } from 'react-icons/fi';
import { trackEvent } from '../utils/analytics';

const Footer = ({ onOpenApplication }) => {
  const handleNavClick = (anchorId) => {
    const element = document.getElementById(anchorId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleApply = () => {
    trackEvent('Apply QR Menu Click', { source: 'footer' });
    if (onOpenApplication) {
      onOpenApplication();
    } else {
      handleNavClick('apply');
    }
  };

  return (
    <footer id="contact" className="bg-[#070A11] border-t border-purple-900/20 text-gray-400 text-sm py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-white/5">
          {/* Column 1: Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-bold">
                <FiGrid className="text-lg" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">QR Menu</span>
            </Link>
            <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
              Digital menus. Smarter ordering. Empowering cafes, restaurants, and cloud kitchens with seamless table QR ordering.
            </p>
            <div className="pt-2 text-xs text-purple-400 font-mono">
              Built for high conversion & instant restaurant deployment
            </div>
          </div>

          {/* Column 2: Product */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-white uppercase tracking-wider">Product</p>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => handleNavClick('features')} className="hover:text-purple-400 transition-colors">
                  Features
                </button>
              </li>
              <li>
                <button onClick={() => handleNavClick('how-it-works')} className="hover:text-purple-400 transition-colors">
                  How It Works
                </button>
              </li>
              <li>
                <button onClick={() => handleNavClick('dashboard-preview')} className="hover:text-purple-400 transition-colors">
                  Demo
                </button>
              </li>
              <li>
                <button onClick={handleApply} className="hover:text-purple-400 transition-colors">
                  Pricing & Plans
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Business */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-white uppercase tracking-wider">Business</p>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={handleApply} className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                  Apply for QR Menu
                </button>
              </li>
              <li>
                <Link to="/cafe/login" className="hover:text-purple-400 transition-colors">
                  Cafe Login
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="hover:text-purple-400 transition-colors">
                  Super Admin
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Support & Legal */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-white uppercase tracking-wider">Support & Legal</p>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => handleNavClick('faq')} className="hover:text-purple-400 transition-colors">
                  FAQ
                </button>
              </li>
              <li>
                <a href="mailto:support@qrmenu.app" className="hover:text-purple-400 transition-colors">
                  Contact Support
                </a>
              </li>
              <li>
                <span className="text-gray-500 hover:text-gray-400 cursor-pointer">Privacy Policy</span>
              </li>
              <li>
                <span className="text-gray-500 hover:text-gray-400 cursor-pointer">Terms of Service</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} QR Menu Ordering System. All rights reserved.</p>
          <p className="text-[11px] text-gray-600">
            Smart Restaurant QR Ordering Platform
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
