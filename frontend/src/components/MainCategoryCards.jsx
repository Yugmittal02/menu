import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCategories } from '../services/api';
import SubCategoryRow from './SubCategoryRow';

const MainCategoryCards = ({ onCategorySelect, activeCategory }) => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await fetchCategories();
                setCategories(data.filter(c => c.isActive));
            } catch (err) {
                console.error('Failed to load categories:', err);
            }
            setLoading(false);
        };
        load();
    }, []);

    const handleCategoryClick = (slug) => {
        navigate(`/category/${slug}`);
    };

    return (
        <>
            <section className="category-section-wrapper">
                <div className="category-section-title">
                    <h2>Our Categories</h2>
                    <p>Explore our delicious collection</p>
                </div>

                <div style={{
                    display: 'flex',
                    gap: '20px',
                    padding: '0 16px 8px',
                    overflowX: 'auto',
                    justifyContent: 'flex-start'
                }} className="hide-scrollbar">
                    {loading ? (
                        // Skeleton loading
                        [...Array(5)].map((_, i) => (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#E8E3DB' }}
                                    className="animate-pulse" />
                                <div style={{ width: 50, height: 12, borderRadius: 6, background: '#E8E3DB' }}
                                    className="animate-pulse" />
                            </div>
                        ))
                    ) : (
                        categories.map((category) => (
                            <button
                                key={category._id}
                                onClick={() => handleCategoryClick(category.slug)}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    transition: 'transform 0.2s ease'
                                }}
                                className="active:scale-95"
                            >
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: activeCategory === category.slug ? '3px solid #C97B4B' : '3px solid #FFFFFF',
                                    boxShadow: '0 4px 16px rgba(45,24,16,0.10)',
                                    background: category.image
                                        ? 'transparent'
                                        : `linear-gradient(135deg, ${category.colorFrom || '#F97316'}, ${category.colorTo || '#FB923C'})`
                                }}>
                                    {category.image ? (
                                        <img
                                            src={category.image}
                                            alt={category.name}
                                            loading="lazy"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <span style={{ fontSize: '32px' }}>{category.icon || '📦'}</span>
                                    )}
                                </div>
                                <span style={{
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: activeCategory === category.slug ? '#C97B4B' : '#5C3A2A'
                                }}>
                                    {category.name}
                                </span>
                            </button>
                        ))
                    )}
                </div>
            </section>

            <SubCategoryRow categories={categories} />
        </>
    );
};

export default MainCategoryCards;
