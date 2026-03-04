import React from 'react';
import {
    FaClipboardList,
    FaUtensils,
    FaUsers,
    FaChartLine,
    FaSignOutAlt,
    FaTag,
    FaCog,
    FaLayerGroup
} from 'react-icons/fa';

const AdminLayout = ({ activeTab, setActiveTab, onLogout, children }) => {
    const tabs = [
        { id: "orders", label: "Orders", icon: FaClipboardList },
        { id: "menu", label: "Menu", icon: FaUtensils },
        { id: "categories", label: "Categories", icon: FaLayerGroup },
        { id: "offers", label: "Offers", icon: FaTag },
        { id: "customers", label: "Users", icon: FaUsers },
        { id: "revenue", label: "Stats", icon: FaChartLine },
        { id: "settings", label: "Settings", icon: FaCog },
    ];

    return (
        <div className="min-h-screen" style={{ background: '#FAF7F2', paddingBottom: '80px' }}>
            <main className="max-w-lg mx-auto min-h-screen">
                {children}
            </main>

            <nav className="fixed bottom-0 left-0 right-0 z-50"
                style={{ background: '#FFFFFF', borderTop: '2px solid #E8E3DB', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
                <div className="flex justify-around items-center h-[68px] max-w-lg mx-auto px-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className="flex flex-col items-center justify-center w-full h-full transition-all"
                            style={{ color: activeTab === tab.id ? '#C97B4B' : '#A0998F' }}
                        >
                            <div className="p-1.5 rounded-xl transition-all"
                                style={activeTab === tab.id
                                    ? { background: '#FEF3E2', transform: 'translateY(-2px)' }
                                    : {}
                                }>
                                <tab.icon size={20} />
                            </div>
                            <span className={`text-[10px] mt-0.5 leading-tight ${activeTab === tab.id ? 'font-bold' : 'font-medium'}`}>
                                {tab.label}
                            </span>
                        </button>
                    ))}
                    {/* Logout button */}
                    <button
                        onClick={onLogout}
                        className="flex flex-col items-center justify-center w-full h-full transition-all"
                        style={{ color: '#DC2626' }}
                    >
                        <div className="p-1.5 rounded-xl">
                            <FaSignOutAlt size={20} />
                        </div>
                        <span className="text-[10px] mt-0.5 leading-tight font-medium">Logout</span>
                    </button>
                </div>
                <div style={{ height: 'env(safe-area-inset-bottom, 0px)', background: '#FFFFFF' }}></div>
            </nav>
        </div>
    );
};

export default AdminLayout;
