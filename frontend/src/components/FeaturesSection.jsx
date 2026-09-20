import React from 'react';
import {
  FiGrid,
  FiBookOpen,
  FiZap,
  FiBarChart2,
  FiSmartphone,
  FiEdit3,
} from 'react-icons/fi';

const FeaturesSection = () => {
  const features = [
    {
      icon: FiGrid,
      title: 'Table QR Codes',
      description: 'Generate unique QR codes for every table and let customers start ordering instantly.',
      badge: 'QR Generator'
    },
    {
      icon: FiBookOpen,
      title: 'Digital Menu',
      description: 'Create beautiful menus with categories, food images, descriptions and prices.',
      badge: 'Real-time Sync'
    },
    {
      icon: FiZap,
      title: 'Live Orders',
      description: 'Receive and manage customer orders from your restaurant dashboard in real time.',
      badge: 'Instant Alerts'
    },
    {
      icon: FiBarChart2,
      title: 'Order Data',
      description: 'Track order volume, popular products and restaurant activity.',
      badge: 'Analytics'
    },
    {
      icon: FiSmartphone,
      title: 'Mobile First',
      description: 'Give customers a fast and easy ordering experience on any smartphone.',
      badge: 'No App Install'
    },
    {
      icon: FiEdit3,
      title: 'Easy Menu Updates',
      description: 'Change prices, products and availability without reprinting menus.',
      badge: '1-Click Editing'
    }
  ];

  return (
    <section id="features" className="py-20 bg-[#0B0F19] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-400">
            Platform Features
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Everything in One Simple Platform
          </h2>
          <p className="text-base md:text-lg text-gray-400">
            Powerful features without complicated restaurant software.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="glass-card p-8 rounded-2xl border-purple-900/20 hover:border-purple-500/40 hover:bg-purple-950/10 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shadow-lg shadow-purple-950/30">
                    <Icon className="text-2xl" />
                  </div>
                  <span className="text-[11px] font-semibold tracking-wider text-purple-300 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                    {feat.badge}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-300 transition-colors">
                  {feat.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
