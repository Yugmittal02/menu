import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiCoffee } from 'react-icons/fi';
import { trackEvent } from '../utils/analytics';

const FinalCTA = ({ onOpenApplication }) => {
  const handleApplyClick = () => {
    trackEvent('Apply QR Menu Click', { source: 'final_cta' });
    if (onOpenApplication) {
      onOpenApplication();
    } else {
      const element = document.getElementById('apply');
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-20 bg-gradient-to-b from-[#070A11] via-[#0D1222] to-[#0B0F19] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="glass-card p-10 md:p-14 rounded-3xl border-purple-500/30 bg-gradient-to-br from-purple-950/40 via-[#0B0F19] to-indigo-950/30 shadow-2xl shadow-purple-950/50">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Ready to Make Your Restaurant Smarter?
          </h2>
          <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto mb-8">
            Give your customers a faster way to explore your menu and place orders. Start receiving live digital orders today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleApplyClick}
              className="btn-primary w-full sm:w-auto text-base py-3.5 px-8 flex items-center justify-center gap-3 shadow-lg shadow-purple-600/30"
            >
              Apply for QR Menu
              <FiArrowRight className="text-lg" />
            </button>
            <Link
              to="/cafe/login"
              onClick={() => trackEvent('Cafe Login Click', { source: 'final_cta' })}
              className="btn-outline w-full sm:w-auto text-base py-3.5 px-8 flex items-center justify-center gap-2 border-purple-500/30 text-gray-200 hover:text-white"
            >
              <FiCoffee className="text-purple-400" />
              Cafe Login
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
