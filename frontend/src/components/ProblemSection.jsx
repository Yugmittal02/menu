import React from 'react';
import { FiXCircle, FiPrinter, FiClock, FiAlertTriangle, FiPieChart, FiArrowRight } from 'react-icons/fi';

const ProblemSection = ({ onOpenApplication }) => {
  const problems = [
    {
      icon: FiPrinter,
      title: 'Printed Menus',
      description: 'Prices and items become outdated quickly and require repeated printing expenses.',
      solution: 'Instant real-time menu updates'
    },
    {
      icon: FiClock,
      title: 'Manual Order Taking',
      description: 'Staff spend valuable time writing down orders instead of delivering fast service.',
      solution: 'Instant customer self-ordering'
    },
    {
      icon: FiAlertTriangle,
      title: 'Order Confusion',
      description: 'Handwritten slips lead to missed food items, wrong notes, and kitchen miscommunication.',
      solution: 'Direct digital kitchen orders'
    },
    {
      icon: FiPieChart,
      title: 'Limited Insights',
      description: 'Traditional paper ordering provides zero analytics on top items or daily peak hours.',
      solution: 'Comprehensive sales reports'
    }
  ];

  return (
    <section className="py-20 bg-[#070A11] relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold uppercase tracking-wider">
            <FiXCircle className="text-sm" /> Operational Challenges
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Still Managing Orders the Old Way?
          </h2>
          <p className="text-base md:text-lg text-gray-400">
            Replace manual menus and order-taking with one simple digital system.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((problem, idx) => {
            const Icon = problem.icon;
            return (
              <div
                key={idx}
                className="glass-card p-6 rounded-2xl border-white/5 hover:border-purple-500/30 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-5">
                    <Icon className="text-2xl" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{problem.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed mb-6">
                    {problem.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center gap-2 text-xs font-semibold text-purple-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  {problem.solution}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
