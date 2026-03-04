import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaHome, FaThLarge, FaUser, FaClipboardList } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { fetchMyOrders } from '../services/api';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { customer } = useAuth();
    const [activeOrderCount, setActiveOrderCount] = useState(0);

    useEffect(() => {
        if (!customer) {
            setActiveOrderCount(0);
            return;
        }

        const loadActiveOrders = async () => {
            try {
                const { data } = await fetchMyOrders();
                const active = (data || []).filter(o =>
                    o.status !== 'Delivered' && o.status !== 'Cancelled'
                );
                setActiveOrderCount(active.length);
            } catch (err) {
                // Silent fail — just hide badge
            }
        };

        loadActiveOrders();
        const interval = setInterval(loadActiveOrders, 60000);
        return () => clearInterval(interval);
    }, [customer]);

    // Don't show on specific pages
    const hiddenPaths = ['/', '/login', '/signup', '/admin', '/payment'];
    if (hiddenPaths.some(path => location.pathname === path || location.pathname.startsWith('/admin'))) {
        return null;
    }

    const navItems = [
        { path: '/menu', icon: FaHome, label: 'Home' },
        { path: '/categories', icon: FaThLarge, label: 'Categories' },
        { path: '/dashboard', icon: FaClipboardList, label: 'Orders', showBadge: true },
        { path: '/dashboard', icon: FaUser, label: 'Profile' },
    ];

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 translate-y-0"
            style={{
                background: '#FFF8F0',
                boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)'
            }}
        >
            <div className="flex justify-around items-center px-2 pt-3 pb-4">
                {navItems.map((item, idx) => {
                    const isActive = location.pathname === item.path && (
                        item.label !== 'Orders' && item.label !== 'Profile' || 
                        (item.label === 'Profile')
                    );
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.label}
                            onClick={() => navigate(item.path)}
                            className="flex flex-col items-center gap-0.5 w-16 relative"
                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            <div
                                className="transition-all duration-300 relative"
                                style={{
                                    padding: '8px',
                                    borderRadius: '12px',
                                    background: isActive ? 'rgba(232,149,106,0.12)' : 'transparent',
                                    transform: isActive ? 'translateY(-2px)' : 'none'
                                }}
                            >
                                <Icon
                                    size={20}
                                    color={isActive ? '#E8956A' : '#8B7355'}
                                />
                                {/* Orders badge */}
                                {item.showBadge && activeOrderCount > 0 && (
                                    <span
                                        className="absolute flex items-center justify-center font-bold text-white"
                                        style={{
                                            top: '2px',
                                            right: '0px',
                                            minWidth: '16px',
                                            height: '16px',
                                            borderRadius: '8px',
                                            background: '#E53935',
                                            fontSize: '9px',
                                            padding: '0 3px',
                                            boxShadow: '0 1px 4px rgba(229,57,53,0.4)'
                                        }}
                                    >
                                        {activeOrderCount > 9 ? '9+' : activeOrderCount}
                                    </span>
                                )}
                            </div>
                            <span
                                style={{
                                    fontSize: '10px',
                                    fontWeight: isActive ? 700 : 500,
                                    color: isActive ? '#E8956A' : '#8B7355',
                                    marginTop: '1px'
                                }}
                            >
                                {item.label}
                            </span>

                            {isActive && (
                                <span style={{
                                    position: 'absolute',
                                    bottom: '-6px',
                                    width: '16px',
                                    height: '3px',
                                    borderRadius: '2px',
                                    background: '#E8956A'
                                }}></span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default BottomNav;
