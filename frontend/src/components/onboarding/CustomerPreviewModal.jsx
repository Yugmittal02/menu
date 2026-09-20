import React, { useState } from 'react';
import { useOnboarding } from '../../context/OnboardingContext';
import { themes } from '../../utils/themes';
import {
  LuX,
  LuShoppingBag,
  LuPlus,
  LuMinus,
  LuSparkles,
  LuUtensils,
  LuExternalLink
} from 'react-icons/lu';

export default function CustomerPreviewModal({ cafe, menu = [] }) {
  const { isCustomerPreviewOpen, setIsCustomerPreviewOpen } = useOnboarding();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [simulatedCart, setSimulatedCart] = useState({});

  if (!isCustomerPreviewOpen) return null;

  const activeTheme = themes[cafe?.theme] || themes['classic-dark'];
  const currency = cafe?.currency || '₹';

  const categories = ['All', ...new Set(menu.map(m => m.category).filter(Boolean))];
  const filteredMenu = selectedCategory === 'All'
    ? menu
    : menu.filter(m => m.category === selectedCategory);

  const cartItemCount = Object.values(simulatedCart).reduce((sum, q) => sum + q, 0);
  const cartSubtotal = Object.entries(simulatedCart).reduce((sum, [id, qty]) => {
    const item = menu.find(m => String(m._id) === String(id));
    return sum + (item ? (item.price || 0) * qty : 0);
  }, 0);

  const addToCart = (id) => {
    setSimulatedCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id) => {
    setSimulatedCart(prev => {
      const copy = { ...prev };
      if (copy[id] > 1) {
        copy[id] -= 1;
      } else {
        delete copy[id];
      }
      return copy;
    });
  };

  const customerUrl = `/c/${cafe?.slug || cafe?.cafeId || 'demo'}/t/1`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm sm:max-w-md bg-[#10101C] border border-white/20 rounded-[36px] shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {/* Mobile Phone Mock Top Notch */}
        <div className="pt-3 pb-2 px-6 bg-[#0E0E18] flex items-center justify-between border-b border-white/5 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-white">Table 1 • Live QR</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={customerUrl}
              target="_blank"
              rel="noreferrer"
              className="text-violet-400 hover:text-white flex items-center gap-1 transition-colors"
              title="Open full page in new tab"
            >
              <span>New Tab</span>
              <LuExternalLink size={12} />
            </a>
            <button
              onClick={() => setIsCustomerPreviewOpen(false)}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <LuX size={16} />
            </button>
          </div>
        </div>

        {/* Cafe Digital Header */}
        <div
          className="p-5 text-center relative overflow-hidden flex-shrink-0"
          style={{ background: activeTheme.background }}
        >
          <div className="relative z-10">
            {cafe?.logo ? (
              <img
                src={cafe.logo}
                alt={cafe.name}
                className="w-14 h-14 rounded-2xl mx-auto mb-2 object-cover shadow-xl border border-white/10"
              />
            ) : (
              <div
                className="w-14 h-14 rounded-2xl mx-auto mb-2 flex items-center justify-center font-black text-2xl text-white shadow-xl"
                style={{ background: `linear-gradient(135deg, ${activeTheme.primary}, ${activeTheme.primaryDark})` }}
              >
                {cafe?.name ? cafe.name.charAt(0).toUpperCase() : '☕'}
              </div>
            )}
            <h2 className="text-base font-bold" style={{ color: activeTheme.textPrimary }}>
              {cafe?.name || 'Your Restaurant'}
            </h2>
            {(cafe?.tagline || cafe?.description) && (
              <p className="text-[11px] font-medium tracking-wide uppercase mt-0.5" style={{ color: activeTheme.textSecondary }}>
                {cafe?.tagline || cafe?.description}
              </p>
            )}
          </div>
        </div>

        {/* Categories Bar */}
        <div className="px-4 py-2.5 bg-[#141424] border-y border-white/5 flex items-center gap-2 overflow-x-auto flex-shrink-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Items Scroll View */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3 bg-[#0B0B14]">
          {filteredMenu.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <LuUtensils className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No items in this category yet.</p>
            </div>
          ) : (
            filteredMenu.map((item) => {
              const qty = simulatedCart[item._id] || 0;
              return (
                <div
                  key={item._id}
                  className="p-3 rounded-2xl bg-[#141424] border border-white/5 flex items-center justify-between gap-3 shadow"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                        title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                      />
                      <h3 className="text-xs font-bold text-white truncate">
                        {item.name}
                      </h3>
                    </div>
                    {item.description && (
                      <p className="text-[10px] text-slate-400 line-clamp-1 mb-1">
                        {item.description}
                      </p>
                    )}
                    <span className="text-xs font-bold font-mono text-emerald-400">
                      {currency}{item.price}
                    </span>
                  </div>

                  <div className="flex-shrink-0">
                    {qty === 0 ? (
                      <button
                        onClick={() => addToCart(item._id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 active:scale-95 transition-all shadow-md shadow-violet-600/30 cursor-pointer"
                      >
                        ADD
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 bg-violet-600/20 border border-violet-500/40 rounded-xl px-2 py-1">
                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="w-5 h-5 rounded flex items-center justify-center text-white hover:bg-white/10"
                        >
                          <LuMinus size={11} />
                        </button>
                        <span className="text-xs font-bold text-white font-mono min-w-3 text-center">
                          {qty}
                        </span>
                        <button
                          onClick={() => addToCart(item._id)}
                          className="w-5 h-5 rounded flex items-center justify-center text-white hover:bg-white/10"
                        >
                          <LuPlus size={11} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Floating Cart Pill at Bottom of Phone */}
        {cartItemCount > 0 && (
          <div className="p-3.5 bg-[#161628] border-t border-white/10 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                <LuShoppingBag size={15} />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  {cartItemCount} item{cartItemCount > 1 ? 's' : ''} added
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Subtotal: {currency}{cartSubtotal}
                </span>
              </div>
            </div>

            <button
              onClick={() => alert(`Simulated customer order of ${currency}${cartSubtotal} sent to Kitchen POS!`)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer"
            >
              Place Order
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
