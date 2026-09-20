import React, { useState } from 'react';
import { FiCoffee, FiShoppingBag, FiBox, FiGrid, FiHome, FiCheck } from 'react-icons/fi';

const RestaurantBenefits = () => {
  const [selectedCategory, setSelectedCategory] = useState(0);

  const categories = [
    {
      name: 'Cafes',
      icon: FiCoffee,
      benefit: 'Fast table ordering and beautiful digital menus.',
      details: 'Keep coffee lines moving. Customers scan, order their favourite brews & pastries directly from their seats.',
      tags: ['Fast Table Turnover', 'Pastry & Drink Modifiers', 'Quick Checkout']
    },
    {
      name: 'Restaurants',
      icon: FiShoppingBag,
      benefit: 'Manage larger menus and high order volumes.',
      details: 'Organize extensive multi-course menus by appetizers, mains, desserts & beverages with high-resolution imagery.',
      tags: ['Multi-Category Menus', 'High Volume Kitchen Sync', 'Table Tracking']
    },
    {
      name: 'Cloud Kitchens',
      icon: FiBox,
      benefit: 'Digital ordering without physical menus.',
      details: 'Eliminate printed menu costs completely. Instant digital menus with live stock and item availability toggles.',
      tags: ['Zero Printing Costs', 'Dynamic Item Availability', 'Direct Kitchen Alerts']
    },
    {
      name: 'Food Courts',
      icon: FiGrid,
      benefit: 'Simple QR-based customer ordering.',
      details: 'Allow diners to browse multi-vendor options from their phone and receive notifications when food is ready.',
      tags: ['Shared Table QR', 'Self-Serve Notification', 'Fast Queue Control']
    },
    {
      name: 'Hotels',
      icon: FiHome,
      benefit: 'Table and room-service style digital ordering.',
      details: 'Deliver premium digital dining in hotel lounges, poolside tables, or room service with unique QR identifiers.',
      tags: ['Lounge & Poolside QR', 'Room Delivery Ready', 'Multi-Language Friendly']
    }
  ];

  return (
    <section id="benefits" className="py-20 bg-[#070A11] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-400">
            Tailored Industry Solutions
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Built for Restaurants of Every Size
          </h2>
          <p className="text-base md:text-lg text-gray-400">
            Designed to match the unique workflow of your venue.
          </p>
        </div>

        {/* Desktop / Tablet Category Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === idx;
            return (
              <button
                key={idx}
                onClick={() => setSelectedCategory(idx)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 scale-105'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                <Icon className={isSelected ? 'text-white' : 'text-purple-400'} />
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Selected Category Feature Showcase Card */}
        <div className="glass-card p-8 rounded-2xl border-purple-500/20 bg-gradient-to-r from-[#0E1322] via-[#0B0F19] to-[#0E1322] max-w-4xl mx-auto shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-4 flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
                <span>{categories[selectedCategory].name} Solution</span>
              </div>

              <h3 className="text-2xl font-bold text-white">
                {categories[selectedCategory].benefit}
              </h3>

              <p className="text-base text-gray-300 leading-relaxed">
                {categories[selectedCategory].details}
              </p>

              <div className="pt-2 flex flex-wrap gap-2">
                {categories[selectedCategory].tags.map((tag, tIdx) => (
                  <span
                    key={tIdx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 text-gray-300 text-xs font-medium border border-white/5"
                  >
                    <FiCheck className="text-purple-400" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RestaurantBenefits;
