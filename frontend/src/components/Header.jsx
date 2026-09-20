import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiGrid, FiMenu, FiX, FiArrowRight, FiCoffee } from 'react-icons/fi';
import { trackEvent } from '../utils/analytics';

const Header = ({ onOpenApplication }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (anchorId) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(anchorId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenApp = () => {
    setMobileMenuOpen(false);
    trackEvent('Get QR Menu Click', { source: 'header' });
    if (onOpenApplication) {
      onOpenApplication();
    } else {
      const element = document.getElementById('apply');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'py-3 bg-[#0B0F19]/90 backdrop-blur-md border-b border-purple-900/20 shadow-lg shadow-purple-950/20'
          : 'py-5 bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-lg shadow-purple-600/30 group-hover:scale-105 transition-transform duration-300">
            <FiGrid className="text-white text-xl" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              QR Menu
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                SaaS
              </span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
          <button
            onClick={() => handleNavClick('features')}
            className="hover:text-purple-400 transition-colors cursor-pointer"
          >
            Features
          </button>
          <button
            onClick={() => handleNavClick('how-it-works')}
            className="hover:text-purple-400 transition-colors cursor-pointer"
          >
            How It Works
          </button>
          <button
            onClick={() => handleNavClick('benefits')}
            className="hover:text-purple-400 transition-colors cursor-pointer"
          >
            Benefits
          </button>
          <button
            onClick={() => handleNavClick('faq')}
            className="hover:text-purple-400 transition-colors cursor-pointer"
          >
            FAQ
          </button>
          <button
            onClick={() => handleNavClick('contact')}
            className="hover:text-purple-400 transition-colors cursor-pointer"
          >
            Contact
          </button>
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            to="/cafe/login"
            onClick={() => trackEvent('Cafe Login Click', { source: 'header' })}
            className="btn-outline text-sm py-2 px-4 flex items-center gap-2 hover:border-purple-500 transition-all"
          >
            <FiCoffee className="text-purple-400" />
            Cafe Login
          </Link>
          <button onClick={handleOpenApp} className="btn-primary text-sm py-2 px-5">
            Get QR Menu
            <FiArrowRight className="text-sm" />
          </button>
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={handleOpenApp}
            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
          >
            Get QR Menu
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-white/5 border border-purple-500/20 text-gray-300 hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0D1222] border-b border-purple-900/30 px-6 py-6 space-y-4 shadow-2xl animate-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col space-y-3 text-base font-medium text-gray-200">
            <button
              onClick={() => handleNavClick('features')}
              className="text-left py-2 hover:text-purple-400 border-b border-white/5"
            >
              Features
            </button>
            <button
              onClick={() => handleNavClick('how-it-works')}
              className="text-left py-2 hover:text-purple-400 border-b border-white/5"
            >
              How It Works
            </button>
            <button
              onClick={() => handleNavClick('benefits')}
              className="text-left py-2 hover:text-purple-400 border-b border-white/5"
            >
              Benefits
            </button>
            <button
              onClick={() => handleNavClick('faq')}
              className="text-left py-2 hover:text-purple-400 border-b border-white/5"
            >
              FAQ
            </button>
            <button
              onClick={() => handleNavClick('contact')}
              className="text-left py-2 hover:text-purple-400 border-b border-white/5"
            >
              Contact
            </button>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Link
              to="/cafe/login"
              onClick={() => {
                setMobileMenuOpen(false);
                trackEvent('Cafe Login Click', { source: 'mobile_header' });
              }}
              className="btn-outline w-full py-2.5 text-center flex items-center justify-center gap-2 text-sm"
            >
              <FiCoffee /> Cafe Owner Login
            </Link>
            <button
              onClick={handleOpenApp}
              className="btn-primary w-full py-3 text-center text-sm font-semibold flex items-center justify-center gap-2"
            >
              Get QR Menu <FiArrowRight />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
