import React, { useState, useEffect } from 'react';
import { FaStore, FaToggleOn, FaToggleOff, FaLock, FaSave, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { getHomepageBadges, updateHomepageBadges } from '../../services/api';

const AdminSettings = ({
    storeSettings,
    setStoreSettings,
    onUpdateStore,
}) => {
    // Homepage Badges state
    const [badges, setBadges] = useState([]);
    const [badgesOpen, setBadgesOpen] = useState(false);
    const [badgesSaving, setBadgesSaving] = useState(false);
    const [badgesMsg, setBadgesMsg] = useState('');

    useEffect(() => {
        const loadBadges = async () => {
            try {
                const { data } = await getHomepageBadges();
                setBadges(data);
            } catch (err) {
                console.error('Failed to load badges:', err);
            }
        };
        loadBadges();
    }, []);

    const handleBadgeChange = (index, field, value) => {
        const updated = [...badges];
        updated[index] = { ...updated[index], [field]: value };
        setBadges(updated);
    };

    const saveBadges = async () => {
        setBadgesSaving(true);
        setBadgesMsg('');
        try {
            await updateHomepageBadges(badges);
            setBadgesMsg('✅ Saved!');
            setTimeout(() => setBadgesMsg(''), 2000);
        } catch (err) {
            setBadgesMsg('❌ Failed to save');
        }
        setBadgesSaving(false);
    };

    return (
        <div className="px-4 pb-24 pt-4 space-y-5">
            <h2 className="text-2xl font-black" style={{ color: '#1C1C1C' }}>Settings</h2>

            {/* Store Status */}
            <div className="p-5 rounded-2xl"
                style={{ background: '#FFFFFF', border: '2px solid #E8E3DB', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: '#FEF3E2', color: '#C97B4B' }}>
                        <FaStore />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold" style={{ color: '#1C1C1C' }}>Store Status</h3>
                        <p className="text-xs" style={{ color: '#A0998F' }}>Control whether customers can place orders</p>
                    </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl mb-4"
                    style={{ background: '#FAF7F2', border: '1px solid #E8E3DB' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ background: storeSettings.isOpen ? '#16A34A' : '#DC2626' }}></div>
                        <span className="font-bold" style={{ color: storeSettings.isOpen ? '#16A34A' : '#DC2626' }}>
                            {storeSettings.isOpen ? 'Store is Open' : 'Store is Closed'}
                        </span>
                    </div>
                    <button
                        onClick={() => setStoreSettings({ ...storeSettings, isOpen: !storeSettings.isOpen })}
                        className="text-3xl transition-transform active:scale-90"
                        style={{ color: storeSettings.isOpen ? '#16A34A' : '#A0998F' }}
                    >
                        {storeSettings.isOpen ? <FaToggleOn /> : <FaToggleOff />}
                    </button>
                </div>
                <button
                    onClick={onUpdateStore}
                    className="w-full py-3 text-white font-bold rounded-xl active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, #C97B4B 0%, #E8956A 100%)', boxShadow: '0 4px 12px rgba(201, 123, 75, 0.3)' }}
                >
                    Save Settings
                </button>
            </div>

            {/* Homepage Badges — Collapsible */}
            <div className="rounded-2xl overflow-hidden"
                style={{ background: '#FFFFFF', border: '2px solid #E8E3DB', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <button
                    onClick={() => setBadgesOpen(!badgesOpen)}
                    className="w-full p-5 flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-xl">🏷️</span>
                        <div className="text-left">
                            <h3 className="font-bold" style={{ color: '#1C1C1C' }}>Homepage Badges</h3>
                            <p className="text-xs" style={{ color: '#A0998F' }}>Express Delivery, Eggless, Free Delivery pills</p>
                        </div>
                    </div>
                    {badgesOpen ? <FaChevronUp style={{ color: '#A0998F' }} /> : <FaChevronDown style={{ color: '#A0998F' }} />}
                </button>

                {badgesOpen && (
                    <div className="px-5 pb-5 space-y-4">
                        {badges.map((badge, i) => (
                            <div key={i} className="p-4 rounded-xl space-y-3"
                                style={{ background: '#FAF7F2', border: '1px solid #E8E3DB' }}>
                                <div className="flex items-center gap-3">
                                    {/* Emoji input */}
                                    <input
                                        type="text"
                                        maxLength={2}
                                        value={badge.icon}
                                        onChange={(e) => handleBadgeChange(i, 'icon', e.target.value)}
                                        className="w-12 h-10 text-center text-xl rounded-lg outline-none"
                                        style={{ background: '#FFFFFF', border: '1px solid #E8E3DB' }}
                                    />
                                    {/* Title */}
                                    <input
                                        type="text"
                                        value={badge.title}
                                        onChange={(e) => handleBadgeChange(i, 'title', e.target.value)}
                                        placeholder="Title"
                                        className="flex-1 px-3 py-2 rounded-lg text-sm font-medium outline-none"
                                        style={{ background: '#FFFFFF', border: '1px solid #E8E3DB', color: '#1C1C1C' }}
                                    />
                                    {/* Toggle */}
                                    <button
                                        onClick={() => handleBadgeChange(i, 'enabled', !badge.enabled)}
                                        className="text-2xl"
                                        style={{ color: badge.enabled ? '#16A34A' : '#A0998F' }}
                                    >
                                        {badge.enabled ? <FaToggleOn /> : <FaToggleOff />}
                                    </button>
                                </div>
                                {/* Subtitle */}
                                <input
                                    type="text"
                                    value={badge.subtitle}
                                    onChange={(e) => handleBadgeChange(i, 'subtitle', e.target.value)}
                                    placeholder="Subtitle"
                                    className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                                    style={{ background: '#FFFFFF', border: '1px solid #E8E3DB', color: '#7E7E7E' }}
                                />
                            </div>
                        ))}

                        <div className="flex items-center gap-3">
                            <button
                                onClick={saveBadges}
                                disabled={badgesSaving}
                                className="flex-1 py-3 text-white font-bold rounded-xl active:scale-[0.98] flex items-center justify-center gap-2"
                                style={{ background: 'linear-gradient(135deg, #C97B4B 0%, #E8956A 100%)', boxShadow: '0 4px 12px rgba(201,123,75,0.3)' }}
                            >
                                <FaSave size={12} /> {badgesSaving ? 'Saving...' : 'Save Badges'}
                            </button>
                            {badgesMsg && (
                                <span className="text-sm font-bold" style={{ color: badgesMsg.includes('✅') ? '#16A34A' : '#DC2626' }}>
                                    {badgesMsg}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Delivery Info */}
            <div className="p-5 rounded-2xl"
                style={{ background: '#FFFFFF', border: '2px solid #E8E3DB', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl">🚚</span>
                    <h3 className="font-bold" style={{ color: '#1C1C1C' }}>Delivery Policy</h3>
                </div>
                <div className="p-4 rounded-xl" style={{ background: '#FEF3E2', border: '1px solid #E8E3DB' }}>
                    <p className="text-sm font-semibold" style={{ color: '#C97B4B' }}>₹30 flat delivery fee</p>
                    <p className="text-xs mt-1" style={{ color: '#8B7355' }}>We only serve in Bharatpur city. A flat ₹30 delivery charge is automatically applied to all delivery orders.</p>
                </div>
            </div>

            {/* Admin Password */}
            <div className="p-5 rounded-2xl opacity-50"
                style={{ background: '#FFFFFF', border: '2px solid #E8E3DB' }}>
                <div className="flex items-center gap-3">
                    <FaLock style={{ color: '#A0998F' }} />
                    <div>
                        <h3 className="font-bold" style={{ color: '#7E7E7E' }}>Admin Password</h3>
                        <p className="text-xs" style={{ color: '#A0998F' }}>Change password — coming soon</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
