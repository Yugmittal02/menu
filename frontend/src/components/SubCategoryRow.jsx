import React from 'react';
import { useNavigate } from 'react-router-dom';

const SubCategoryRow = ({ categories = [] }) => {
    const navigate = useNavigate();

    // Filter to only QuickPick categories
    const quickPicks = categories.filter(c => c.isQuickPick && c.isActive);

    // Hide entirely if no quick picks
    if (quickPicks.length === 0) return null;

    return (
        <div className="mx-4 mt-2 mb-4 bg-white/60 backdrop-blur-md rounded-2xl border border-[#E8DEC8]/60 shadow-sm overflow-hidden">
            {/* Section Title */}
            <h3 className="text-center text-[#C97B4B] font-bold text-sm py-3 border-b border-[#E8DEC8]/40">
                ✨ Quick Picks
            </h3>

            {/* 4-column Grid */}
            <div className="grid grid-cols-4 gap-3 p-3">
                {quickPicks.map((cat, index) => (
                    <button
                        key={cat._id}
                        onClick={() => navigate(`/category/${cat.slug}`)}
                        className="animate-fade-in flex flex-col items-center gap-2 group"
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden border border-[#E8DEC8] relative shadow-sm group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-300"
                            style={{
                                background: cat.image
                                    ? 'transparent'
                                    : `linear-gradient(135deg, ${cat.colorFrom || '#F97316'}, ${cat.colorTo || '#FB923C'})`
                            }}>
                            {cat.image ? (
                                <img
                                    src={cat.image}
                                    alt={cat.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            ) : null}
                            <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                                <span className="text-xl drop-shadow-md">{cat.icon || '📦'}</span>
                            </div>
                        </div>
                        <p className="text-[10px] md:text-xs font-semibold text-[#5C3A21] text-center leading-tight">
                            {cat.name}
                        </p>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SubCategoryRow;
