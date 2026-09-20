import React from 'react';
import { FiSmartphone, FiCompass, FiShoppingCart, FiCheckSquare } from 'react-icons/fi';

const HowItWorks = () => {
  const steps = [
    {
      number: '01',
      icon: FiSmartphone,
      title: 'Customer Scans',
      description: 'Customer scans the QR code placed on their restaurant table using their smartphone camera.'
    },
    {
      number: '02',
      icon: FiCompass,
      title: 'Customer Browses',
      description: 'The digital menu opens instantly in the mobile browser with photos, prices, and categories.'
    },
    {
      number: '03',
      icon: FiShoppingCart,
      title: 'Customer Orders',
      description: 'Customer selects food items, customizes preferences, and submits the order directly.'
    },
    {
      number: '04',
      icon: FiCheckSquare,
      title: 'Restaurant Receives',
      description: 'The restaurant receives the order live in their dashboard and manages kitchen preparation.'
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-[#070A11] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-400">
            Simple 4-Step Process
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            How QR Menu Works
          </h2>
          <p className="text-base md:text-lg text-gray-400">
            Seamless experience for both customers and restaurant staff.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="glass-card p-6 rounded-2xl border-white/5 relative group hover:border-purple-500/30 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-6">
                  <span className="text-3xl font-black text-purple-500/40 group-hover:text-purple-400 transition-colors font-mono">
                    {step.number}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300">
                    <Icon className="text-lg" />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
