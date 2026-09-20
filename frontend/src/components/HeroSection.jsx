import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiSmartphone,
  FiCheckCircle,
  FiGrid,
  FiShoppingBag,
  FiTrendingUp,
  FiCoffee,
  FiClock,
  FiCheck,
} from 'react-icons/fi';
import { trackEvent } from '../utils/analytics';

const HeroSection = ({ onOpenApplication }) => {
  const [activeTab, setActiveTab] = useState('ordering'); // 'ordering', 'dashboard', 'qr'

  const handlePrimaryClick = () => {
    trackEvent('Hero CTA Click', { source: 'hero_primary' });
    if (onOpenApplication) {
      onOpenApplication();
    } else {
      const element = document.getElementById('apply');
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDemoClick = () => {
    trackEvent('View Demo Click', { source: 'hero_secondary' });
    const element = document.getElementById('dashboard-preview');
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-purple-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/25 backdrop-blur-sm">
            <FiSmartphone className="text-purple-400 text-sm" />
            <span className="text-xs md:text-sm font-semibold tracking-wider text-purple-300 uppercase">
              SMART QR ORDERING FOR MODERN RESTAURANTS
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Turn Every Table Into a{' '}
            <span className="bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-400 bg-clip-text text-transparent inline-block">
              Digital Ordering Point
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-gray-300 leading-relaxed font-normal max-w-2xl mx-auto">
            Let customers scan, browse and order directly from their table — no app required.
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handlePrimaryClick}
              className="btn-primary w-full sm:w-auto text-base py-3.5 px-8 flex items-center justify-center gap-3 shadow-xl shadow-purple-600/25"
            >
              Get Your QR Menu
              <FiArrowRight className="text-lg" />
            </button>
            <button
              onClick={handleDemoClick}
              className="btn-outline w-full sm:w-auto text-base py-3.5 px-8 flex items-center justify-center gap-2 border-purple-500/30 text-gray-200 hover:text-white"
            >
              View Demo
            </button>
          </div>

          {/* Micro Copy */}
          <div className="pt-4 flex items-center justify-center gap-3 text-xs md:text-sm text-gray-400 font-medium flex-wrap">
            <span className="flex items-center gap-1.5">
              <FiCheckCircle className="text-purple-400" /> Simple setup
            </span>
            <span className="hidden sm:inline text-gray-600">•</span>
            <span className="flex items-center gap-1.5">
              <FiCheckCircle className="text-purple-400" /> Mobile friendly
            </span>
            <span className="hidden sm:inline text-gray-600">•</span>
            <span className="flex items-center gap-1.5">
              <FiCheckCircle className="text-purple-400" /> No customer app required
            </span>
          </div>
        </div>

        {/* Hero Interactive Visual Mockup */}
        <div className="mt-16 relative max-w-5xl mx-auto">
          {/* Card Wrapper with Glass Style */}
          <div className="relative rounded-2xl p-2 md:p-4 bg-gradient-to-b from-purple-500/10 via-[#0F1424] to-[#0B0F19] border border-purple-500/20 shadow-2xl shadow-purple-950/40">
            {/* Mockup Top Navigation Tabs */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-purple-900/20 bg-[#0A0E1A]/80 rounded-t-xl">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-mono text-gray-400 ml-2">live-demo.qrmenu.app</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('ordering')}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === 'ordering'
                      ? 'bg-purple-600 text-white font-medium shadow-md shadow-purple-600/30'
                      : 'text-gray-400 hover:text-gray-200 bg-white/5'
                  }`}
                >
                  📱 Mobile Menu Preview
                </button>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === 'dashboard'
                      ? 'bg-purple-600 text-white font-medium shadow-md shadow-purple-600/30'
                      : 'text-gray-400 hover:text-gray-200 bg-white/5'
                  }`}
                >
                  📊 Live Dashboard
                </button>
              </div>
            </div>

            {/* Mockup Display Content */}
            <div className="p-4 md:p-8 bg-[#090D16]">
              {activeTab === 'ordering' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  {/* Left Column: Phone Customer View (5 cols) */}
                  <div className="lg:col-span-5 bg-[#111628] rounded-2xl border border-purple-500/20 p-4 shadow-xl">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold text-xs">
                          R
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">The Artisan Cafe</p>
                          <p className="text-[10px] text-purple-400 font-medium">Table #04 • Dine-In</p>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Live Menu
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {/* Item 1 */}
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-700/50 to-orange-900/50 flex items-center justify-center text-xl shadow-inner">
                          ☕
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">Iced Hazelnut Latte</p>
                          <p className="text-[11px] text-gray-400 truncate">Espresso, oat milk, hazelnut</p>
                          <p className="text-xs font-bold text-purple-400 mt-0.5">$4.50</p>
                        </div>
                        <span className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-[10px] font-bold transition-colors">
                          + Add
                        </span>
                      </div>

                      {/* Item 2 */}
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500/40 to-yellow-800/40 flex items-center justify-center text-xl shadow-inner">
                          🥐
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">Butter Croissant</p>
                          <p className="text-[11px] text-gray-400 truncate">Flaky, golden baked fresh</p>
                          <p className="text-xs font-bold text-purple-400 mt-0.5">$3.20</p>
                        </div>
                        <span className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-[10px] font-bold transition-colors">
                          + Add
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-gray-400">2 Items in Cart</p>
                        <p className="text-xs font-bold text-white">$7.70 Total</p>
                      </div>
                      <button className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-semibold rounded-lg shadow-md shadow-purple-600/30">
                        Place Order
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Table QR Stand + Live Order Notification + Dashboard Metrics (7 cols) */}
                  <div className="lg:col-span-7 space-y-4">
                    {/* Table QR Code Stand Concept Card */}
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/40 via-[#111628] to-[#111628] border border-purple-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-xl p-1.5 flex items-center justify-center shadow-lg shadow-purple-500/10">
                          <FiGrid className="text-purple-950 text-2xl" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-white">Table QR Code Concept</p>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">
                              Table #04
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400">Customer scans with native camera & orders</p>
                        </div>
                      </div>
                      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                        <FiCheck className="text-xs" /> No App Needed
                      </span>
                    </div>

                    {/* Live Order Notification Badge */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-[#111628] border border-purple-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                          <FiShoppingBag className="text-lg animate-bounce" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white flex items-center gap-2">
                            New Live Order Received!
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                              Just now
                            </span>
                          </p>
                          <p className="text-xs text-gray-400">
                            Table #04 • 2 Items ($7.70) • Status: <span className="text-purple-300 font-semibold">Incoming</span>
                          </p>
                        </div>
                      </div>
                      <button className="hidden sm:block px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors">
                        Accept Order
                      </button>
                    </div>

                    {/* Restaurant Admin Stats Grid */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-[#111628] border border-white/5 text-left">
                        <p className="text-[11px] text-gray-400">Today's Orders</p>
                        <p className="text-xl font-extrabold text-white mt-1">48</p>
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                          <FiTrendingUp /> +18% vs yesterday
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#111628] border border-white/5 text-left">
                        <p className="text-[11px] text-gray-400">Table Scans</p>
                        <p className="text-xl font-extrabold text-purple-400 mt-1">162</p>
                        <span className="text-[10px] text-purple-300 flex items-center gap-1 mt-1">
                          <FiSmartphone /> 12 Active Tables
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#111628] border border-white/5 text-left">
                        <p className="text-[11px] text-gray-400">Avg. Prep Time</p>
                        <p className="text-xl font-extrabold text-indigo-400 mt-1">8.5 min</p>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">
                          <FiClock /> Fast kitchen sync
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-white">Restaurant Sales Overview</h4>
                      <p className="text-xs text-gray-400">Live order feed and table statistics</p>
                    </div>
                    <span className="text-xs text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                      Live Dashboard
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-[#111628] rounded-xl border border-white/5">
                      <p className="text-xs text-gray-400">Total Revenue</p>
                      <p className="text-xl font-bold text-white mt-0.5">$1,248.50</p>
                    </div>
                    <div className="p-3 bg-[#111628] rounded-xl border border-white/5">
                      <p className="text-xs text-gray-400">Active Orders</p>
                      <p className="text-xl font-bold text-amber-400 mt-0.5">5 Pending</p>
                    </div>
                    <div className="p-3 bg-[#111628] rounded-xl border border-white/5">
                      <p className="text-xs text-gray-400">Completed Orders</p>
                      <p className="text-xl font-bold text-emerald-400 mt-0.5">43 Served</p>
                    </div>
                    <div className="p-3 bg-[#111628] rounded-xl border border-white/5">
                      <p className="text-xs text-gray-400">Top Item</p>
                      <p className="text-sm font-bold text-purple-300 mt-0.5">Caramel Macchiato</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
