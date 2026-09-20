import React from 'react';
import {
  FiSmartphone,
  FiGrid,
  FiZap,
  FiLayout,
  FiCheckCircle,
  FiBarChart2,
} from 'react-icons/fi';

const TrustStrip = () => {
  const trustItems = [
    { icon: FiSmartphone, title: 'No App Required', desc: 'Opens in mobile browser' },
    { icon: FiGrid, title: 'Easy QR Scanning', desc: 'Instant camera scan' },
    { icon: FiZap, title: 'Live Order Management', desc: 'Real-time kitchen alerts' },
    { icon: FiLayout, title: 'Digital Menu', desc: 'Rich photos & pricing' },
    { icon: FiCheckCircle, title: 'Mobile Friendly', desc: 'Optimized touch UI' },
    { icon: FiBarChart2, title: 'Restaurant Dashboard', desc: 'Sales & item tracking' },
  ];

  return (
    <section className="py-12 border-y border-purple-900/20 bg-[#0B0F19]/60 backdrop-blur-sm relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-widest font-semibold text-purple-400">
            Trusted Platform Capabilities
          </p>
          <h3 className="text-lg md:text-xl font-bold text-gray-200 mt-1">
            Everything your restaurant needs for digital ordering
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {trustItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="glass-card p-4 rounded-xl text-center group hover:border-purple-500/40 hover:bg-purple-900/10 transition-all duration-300"
              >
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                  <Icon className="text-lg" />
                </div>
                <p className="text-sm font-bold text-white mb-0.5">{item.title}</p>
                <p className="text-[11px] text-gray-400">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TrustStrip;
