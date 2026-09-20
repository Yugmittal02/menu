import React, { useState, useEffect } from 'react';
import {
  FiEdit2,
  FiSave,
  FiX,
  FiVolume2,
  FiVolumeX,
  FiClock,
  FiPhone,
  FiMapPin,
  FiLayers,
  FiImage,
  FiTag,
  FiFileText,
  FiInstagram,
  FiFacebook,
  FiGlobe
} from 'react-icons/fi';
import { themes } from '../../../utils/themes';

const SettingsTab = ({
  cafe,
  onSaveSettings,
  soundOn,
  onToggleSound
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const getInitialForm = (c) => ({
    name: c?.name || '',
    ownerName: c?.ownerName || '',
    phone: c?.phone || '',
    tableCount: c?.tableCount || 10,
    openTime: c?.openTime || '10:00',
    closeTime: c?.closeTime || '23:00',
    address: c?.address || '',
    city: c?.city || '',
    theme: c?.theme || 'classic-dark',
    taxPercent: c?.taxPercent ?? 0,
    taxLabel: c?.taxLabel || 'GST',
    currency: c?.currency || '₹',
    autoAcceptOrders: c?.autoAcceptOrders || false,
    kotPrefix: c?.kotPrefix || 'KOT',
    invoicePrefix: c?.invoicePrefix || 'INV',
    businessType: c?.businessType || 'cafe',
    footerText: c?.footerText || '',
    logo: c?.logo || '',
    tagline: c?.tagline || '',
    description: c?.description || '',
    coverImage: c?.coverImage || '',
    socialLinks: {
      instagram: c?.socialLinks?.instagram || '',
      facebook: c?.socialLinks?.facebook || '',
      website: c?.socialLinks?.website || '',
      mapsUrl: c?.socialLinks?.mapsUrl || ''
    }
  });

  const [form, setForm] = useState(() => getInitialForm(cafe));

  useEffect(() => {
    if (cafe && !isEditing) {
      setForm(getInitialForm(cafe));
    }
  }, [cafe, isEditing]);

  const handleStartEdit = () => {
    setForm(getInitialForm(cafe));
    setIsEditing(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSaveSettings(form);
    setIsEditing(false);
  };

  const activeTheme = themes[form.theme] || themes['classic-dark'];

  return (
    <div className="space-y-6 max-w-4xl animate-fadeIn">
      {/* Settings Header */}
      <div
        className="p-4 rounded-2xl flex items-center justify-between"
        style={{
          backgroundColor: '#11111D',
          border: '1px solid rgba(255, 255, 255, 0.07)'
        }}
      >
        <div>
          <h2 className="text-base md:text-lg font-bold text-white">Cafe Settings</h2>
          <p className="text-xs text-[#8E8EA8]">
            Configure restaurant profile, opening hours, customer menu theme, and operational rules.
          </p>
        </div>

        {!isEditing ? (
          <button
            onClick={handleStartEdit}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-[#151523] border border-white/[0.08] hover:bg-[#1A1A2A] transition-colors"
          >
            <FiEdit2 size={13} />
            <span>Edit Profile</span>
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(false)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-[#A1A1B5] hover:text-white"
          >
            <FiX size={14} />
            <span>Cancel</span>
          </button>
        )}
      </div>

      {isEditing ? (
        /* Edit Mode Form */
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Restaurant Profile Section */}
          <div
            className="p-5 rounded-2xl space-y-4"
            style={{
              backgroundColor: '#11111D',
              border: '1px solid rgba(255, 255, 255, 0.07)'
            }}
          >
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-white/[0.06]">
              <span>🏪 Restaurant Profile</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#8E8EA8] block mb-1">Cafe Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl text-xs md:text-sm text-white bg-[#151523] border border-white/[0.08] outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="text-xs text-[#8E8EA8] block mb-1">Owner Name *</label>
                <input
                  type="text"
                  required
                  value={form.ownerName}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl text-xs md:text-sm text-white bg-[#151523] border border-white/[0.08] outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="text-xs text-[#8E8EA8] block mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  title="Please enter a 10-digit phone number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl text-xs md:text-sm text-white bg-[#151523] border border-white/[0.08] outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="text-xs text-[#8E8EA8] block mb-1">Number of Tables *</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={form.tableCount}
                  onChange={(e) =>
                    setForm({ ...form, tableCount: parseInt(e.target.value) || 1 })
                  }
                  className="w-full px-3.5 py-2 rounded-xl text-xs md:text-sm text-white bg-[#151523] border border-white/[0.08] outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="text-xs text-[#8E8EA8] block mb-1">Opening Time</label>
                <input
                  type="time"
                  value={form.openTime}
                  onChange={(e) => setForm({ ...form, openTime: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl text-xs text-white bg-[#151523] border border-white/[0.08] outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="text-xs text-[#8E8EA8] block mb-1">Closing Time</label>
                <input
                  type="time"
                  value={form.closeTime}
                  onChange={(e) => setForm({ ...form, closeTime: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl text-xs text-white bg-[#151523] border border-white/[0.08] outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="text-xs text-[#8E8EA8] block mb-1">Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl text-xs md:text-sm text-white bg-[#151523] border border-white/[0.08] outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="text-xs text-[#8E8EA8] block mb-1">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl text-xs md:text-sm text-white bg-[#151523] border border-white/[0.08] outline-none focus:border-[#7C3AED]"
                />
              </div>
            </div>
          </div>

          {/* Brand Identity & Online Presence Section */}
          <div
            className="p-5 rounded-2xl space-y-4"
            style={{
              backgroundColor: '#11111D',
              border: '1px solid rgba(255, 255, 255, 0.07)'
            }}
          >
            <div className="pb-2 border-b border-white/[0.06]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>🎨 Brand Identity & Online Presence</span>
              </h3>
              <p className="text-xs text-[#8E8EA8]">
                Configure brand logo, custom tagline, restaurant story, and customer-facing digital links.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Brand Logo URL with Live Preview */}
              <div className="sm:col-span-2">
                <label className="text-xs text-[#8E8EA8] block mb-1">
                  Brand Logo Image URL
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border border-white/10 bg-[#151523] flex items-center justify-center text-lg font-bold text-white shadow-inner">
                    {form.logo ? (
                      <img
                        src={form.logo}
                        alt="Logo preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <span>{(form.name || 'C').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="url"
                      value={form.logo}
                      onChange={(e) => setForm({ ...form, logo: e.target.value })}
                      placeholder="https://images.unsplash.com/... or https://yourdomain.com/logo.png"
                      className="w-full px-3.5 py-2 rounded-xl text-xs md:text-sm text-white bg-[#151523] border border-white/[0.08] outline-none focus:border-[#7C3AED]"
                    />
                    <span className="text-[10px] text-[#8E8EA8] mt-1 block">
                      Direct image URL (PNG, JPG, SVG, WebP). Displayed in customer menu header and footer.
                    </span>
                  </div>
                </div>
              </div>

              {/* Brand Tagline */}
              <div className="sm:col-span-2">
                <label className="text-xs text-[#8E8EA8] block mb-1">
                  Brand Tagline (Shown on customer menu)
                </label>
                <input
                  type="text"
                  maxLength={70}
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  placeholder="e.g. Artisanal Sourdough & Specialty Roasts"
                  className="w-full px-3.5 py-2 rounded-xl text-xs md:text-sm text-white bg-[#151523] border border-white/[0.08] outline-none focus:border-[#7C3AED]"
                />
                {form.tagline ? (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[10px] text-[#8E8EA8]">Customer Header Preview:</span>
                    <span className="text-[10px] font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-white/5 text-amber-300/90 border border-white/10">
                      {form.tagline}
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-[#8E8EA8] mt-1 block">
                    A catchy slogan or theme description for your cafe.
                  </span>
                )}
              </div>

              {/* About / Description */}
              <div className="sm:col-span-2">
                <label className="text-xs text-[#8E8EA8] block mb-1">
                  About / Bio (Shown in Cafe Info Modal & Footer)
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief story, culinary philosophy, or specialty of your dining spot..."
                  className="w-full px-3.5 py-2 rounded-xl text-xs md:text-sm text-white bg-[#151523] border border-white/[0.08] outline-none focus:border-[#7C3AED] resize-none"
                />
              </div>

              {/* Cover Banner Image URL */}
              <div className="sm:col-span-2">
                <label className="text-xs text-[#8E8EA8] block mb-1">
                  Cover / Banner Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={form.coverImage}
                  onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                  placeholder="https://images.unsplash.com/.../banner.jpg"
                  className="w-full px-3.5 py-2 rounded-xl text-xs md:text-sm text-white bg-[#151523] border border-white/[0.08] outline-none focus:border-[#7C3AED]"
                />
              </div>

              {/* Social Links */}
              <div>
                <label className="text-xs text-[#8E8EA8] block mb-1 flex items-center gap-1.5">
                  <FiInstagram className="text-pink-400" />
                  <span>Instagram Handle / Link</span>
                </label>
                <input
                  type="text"
                  value={form.socialLinks?.instagram || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      socialLinks: { ...form.socialLinks, instagram: e.target.value }
                    })
                  }
                  placeholder="@yourcafe or https://instagram.com/..."
                  className="w-full px-3.5 py-2 rounded-xl text-xs md:text-sm text-white bg-[#151523] border border-white/[0.08] outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="text-xs text-[#8E8EA8] block mb-1 flex items-center gap-1.5">
                  <FiFacebook className="text-blue-400" />
                  <span>Facebook Page Link</span>
                </label>
                <input
                  type="text"
                  value={form.socialLinks?.facebook || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      socialLinks: { ...form.socialLinks, facebook: e.target.value }
                    })
                  }
                  placeholder="https://facebook.com/yourcafe"
                  className="w-full px-3.5 py-2 rounded-xl text-xs md:text-sm text-white bg-[#151523] border border-white/[0.08] outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="text-xs text-[#8E8EA8] block mb-1 flex items-center gap-1.5">
                  <FiGlobe className="text-emerald-400" />
                  <span>Official Website</span>
                </label>
                <input
                  type="text"
                  value={form.socialLinks?.website || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      socialLinks: { ...form.socialLinks, website: e.target.value }
                    })
                  }
                  placeholder="https://yourcafe.com"
                  className="w-full px-3.5 py-2 rounded-xl text-xs md:text-sm text-white bg-[#151523] border border-white/[0.08] outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="text-xs text-[#8E8EA8] block mb-1 flex items-center gap-1.5">
                  <FiMapPin className="text-amber-400" />
                  <span>Google Maps Directions Link</span>
                </label>
                <input
                  type="url"
                  value={form.socialLinks?.mapsUrl || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      socialLinks: { ...form.socialLinks, mapsUrl: e.target.value }
                    })
                  }
                  placeholder="https://maps.google.com/..."
                  className="w-full px-3.5 py-2 rounded-xl text-xs md:text-sm text-white bg-[#151523] border border-white/[0.08] outline-none focus:border-[#7C3AED]"
                />
              </div>
            </div>
          </div>

          {/* Tax & Billing Settings */}
          <div
            className="p-5 rounded-2xl space-y-4"
            style={{
              backgroundColor: '#11111D',
              border: '1px solid rgba(255, 255, 255, 0.07)'
            }}
          >
            <div className="pb-2 border-b border-white/[0.06]">
              <h3 className="text-sm font-bold text-white">🧾 Tax & Billing Rules</h3>
              <p className="text-xs text-[#8E8EA8]">
                Configure GST/tax percentages, receipt invoice numbering, and footer messages.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-[#8E8EA8] block mb-1">Tax / GST Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.taxPercent}
                  onChange={(e) => setForm({ ...form, taxPercent: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2 rounded-xl text-xs md:text-sm text-white bg-[#151523] border border-white/[0.08] outline-none focus:border-[#7C3AED]"
                  placeholder="e.g. 5"
                />
              </div>

              <div>
                <label className="text-xs text-[#8E8EA8] block mb-1">Tax Label on Receipts</label>
                <input
                  type="text"
                  value={form.taxLabel}
                  onChange={(e) => setForm({ ...form, taxLabel: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl text-xs md:text-sm text-white bg-[#151523] border border-white/[0.08] outline-none focus:border-[#7C3AED]"
                  placeholder="GST / VAT"
                />
              </div>

              <div>
                <label className="text-xs text-[#8E8EA8] block mb-1">Invoice Prefix</label>
                <input
                  type="text"
                  value={form.invoicePrefix}
                  onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2 rounded-xl text-xs md:text-sm text-white bg-[#151523] border border-white/[0.08] outline-none focus:border-[#7C3AED]"
                  placeholder="INV"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="text-xs text-[#8E8EA8] block mb-1">Thermal Receipt Footer Message</label>
                <input
                  type="text"
                  value={form.footerText}
                  onChange={(e) => setForm({ ...form, footerText: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl text-xs md:text-sm text-white bg-[#151523] border border-white/[0.08] outline-none focus:border-[#7C3AED]"
                  placeholder="Thank you for dining with us! Please visit again."
                />
              </div>
            </div>
          </div>

          {/* POS & Operations Settings */}
          <div
            className="p-5 rounded-2xl space-y-4"
            style={{
              backgroundColor: '#11111D',
              border: '1px solid rgba(255, 255, 255, 0.07)'
            }}
          >
            <div className="pb-2 border-b border-white/[0.06]">
              <h3 className="text-sm font-bold text-white">⚡ POS & Kitchen Operations</h3>
              <p className="text-xs text-[#8E8EA8]">
                Kitchen ticket prefixes, business category, and automated order processing.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-[#8E8EA8] block mb-1">Business Type</label>
                <select
                  value={form.businessType}
                  onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl text-xs md:text-sm text-white bg-[#151523] border border-white/[0.08] outline-none focus:border-[#7C3AED]"
                >
                  <option value="cafe">Cafe / Bistro</option>
                  <option value="restaurant">Full Dine-In Restaurant</option>
                  <option value="bakery">Bakery & Patisserie</option>
                  <option value="bar">Bar & Lounge</option>
                  <option value="cloud-kitchen">Cloud Kitchen / QSR</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-[#8E8EA8] block mb-1">KOT Prefix</label>
                <input
                  type="text"
                  value={form.kotPrefix}
                  onChange={(e) => setForm({ ...form, kotPrefix: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2 rounded-xl text-xs md:text-sm text-white bg-[#151523] border border-white/[0.08] outline-none focus:border-[#7C3AED]"
                  placeholder="KOT"
                />
              </div>

              <div className="flex flex-col justify-center">
                <label className="text-xs text-[#8E8EA8] block mb-1.5">Auto-Accept QR Orders</label>
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-white">
                  <input
                    type="checkbox"
                    checked={form.autoAcceptOrders}
                    onChange={(e) => setForm({ ...form, autoAcceptOrders: e.target.checked })}
                    className="w-4 h-4 accent-[#7C3AED] rounded"
                  />
                  <span>Direct to Kitchen (Skip Pending)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Customer Menu Theme Selector */}
          <div
            className="p-5 rounded-2xl space-y-4"
            style={{
              backgroundColor: '#11111D',
              border: '1px solid rgba(255, 255, 255, 0.07)'
            }}
          >
            <div className="pb-2 border-b border-white/[0.06]">
              <h3 className="text-sm font-bold text-white">🎨 Customer Menu Theme</h3>
              <p className="text-xs text-[#8E8EA8]">
                Select the visual theme applied to digital menus when customers scan your table QR codes.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(themes).map(([key, t]) => {
                const isSelected = form.theme === key;
                return (
                  <label
                    key={key}
                    onClick={() => setForm({ ...form, theme: key })}
                    className={`cursor-pointer rounded-xl p-3 border-2 transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#7C3AED] shadow-md shadow-[#7C3AED]/20 scale-[1.02]'
                        : 'border-white/[0.08] hover:border-white/20'
                    }`}
                    style={{ backgroundColor: t.cardBg }}
                  >
                    <div>
                      <div
                        className="w-full h-8 rounded-lg mb-2 flex items-center justify-center text-[10px] font-bold"
                        style={{ background: t.background, color: t.textPrimary }}
                      >
                        Menu Preview
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: t.primary }}
                        />
                        <span className="text-xs font-semibold text-white truncate">
                          {t.name}
                        </span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Live Preview Box */}
            <div
              className="p-4 rounded-xl border flex items-center gap-3.5"
              style={{
                background: activeTheme.glassBg,
                borderColor: `${activeTheme.primary}40`
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white"
                style={{
                  background: `linear-gradient(135deg, ${activeTheme.primary}, ${activeTheme.primaryDark})`
                }}
              >
                {form.name ? form.name.charAt(0) : '☕'}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider font-mono text-[#8E8EA8]">
                  Customer Menu Appearance
                </p>
                <p className="text-sm font-bold" style={{ color: activeTheme.textPrimary }}>
                  {form.name || 'Your Restaurant Name'}
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#A1A1B5] hover:text-white bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#7C3AED] hover:bg-[#6D28D9] transition-all shadow-md active:scale-95"
            >
              <FiSave size={14} />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      ) : (
        /* View Mode Card */
        <div className="space-y-5">
          {/* Restaurant Profile Card */}
          <div
            data-tour="settings-profile-card"
            className="p-5 rounded-2xl"
            style={{
              backgroundColor: '#11111D',
              border: '1px solid rgba(255, 255, 255, 0.07)'
            }}
          >
            <h3 className="text-sm font-bold text-white mb-3">Restaurant Information</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs divide-y sm:divide-y-0 divide-white/[0.04]">
              <div className="flex justify-between sm:flex-col py-1">
                <span className="text-[#8E8EA8]">Cafe Name</span>
                <span className="text-white font-semibold text-sm">{cafe?.name || '—'}</span>
              </div>

              <div className="flex justify-between sm:flex-col py-1">
                <span className="text-[#8E8EA8]">Unique Cafe ID</span>
                <span className="font-mono text-white font-bold text-sm text-[#A78BFA]">
                  {cafe?.cafeId || '—'}
                </span>
              </div>

              <div className="flex justify-between sm:flex-col py-1">
                <span className="text-[#8E8EA8]">Owner Name</span>
                <span className="text-white font-medium">{cafe?.ownerName || '—'}</span>
              </div>

              <div className="flex justify-between sm:flex-col py-1">
                <span className="text-[#8E8EA8]">Phone Number</span>
                <span className="text-white font-mono">{cafe?.phone || '—'}</span>
              </div>

              <div className="flex justify-between sm:flex-col py-1">
                <span className="text-[#8E8EA8]">Operating Hours</span>
                <span className="text-white">
                  {cafe?.openTime || '10:00'} — {cafe?.closeTime || '23:00'}
                </span>
              </div>

              <div className="flex justify-between sm:flex-col py-1">
                <span className="text-[#8E8EA8]">Active Tables</span>
                <span className="text-white font-bold">{cafe?.tableCount || 10} tables</span>
              </div>

              <div className="flex justify-between sm:flex-col py-1 sm:col-span-2">
                <span className="text-[#8E8EA8]">Address</span>
                <span className="text-white">
                  {cafe?.address || '—'}
                  {cafe?.city ? `, ${cafe.city}` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Brand Identity & Online Presence Card */}
          <div
            className="p-5 rounded-2xl"
            style={{
              backgroundColor: '#11111D',
              border: '1px solid rgba(255, 255, 255, 0.07)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white mb-0.5">🎨 Brand Identity & Online Presence</h3>
                <p className="text-xs text-[#8E8EA8]">
                  Brand logo, tagline, and customer-facing digital touchpoints.
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                  cafe?.logo
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}
              >
                {cafe?.logo ? 'Logo Active' : 'Default Monogram'}
              </span>
            </div>

            {/* Brand Header Display */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-black/20 border border-white/5 mb-4">
              <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-white/10 bg-[#151523] flex items-center justify-center text-lg font-bold text-white shadow-md">
                {cafe?.logo ? (
                  <img
                    src={cafe.logo}
                    alt={cafe?.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <span>{(cafe?.name || 'C').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-white truncate">{cafe?.name || 'Your Cafe'}</h4>
                {cafe?.tagline ? (
                  <p className="text-xs text-amber-300/90 font-medium tracking-wide uppercase mt-0.5 truncate">
                    {cafe.tagline}
                  </p>
                ) : (
                  <p className="text-xs text-[#8E8EA8] italic mt-0.5">
                    No custom tagline set (displays description or city on menu)
                  </p>
                )}
              </div>
            </div>

            {/* Description / Story */}
            {cafe?.description && (
              <div className="mb-4 p-3 rounded-xl bg-black/10 border border-white/5 text-xs text-[#A1A1B5] leading-relaxed">
                <span className="text-[#8E8EA8] font-semibold block mb-1">About / Bio:</span>
                {cafe.description}
              </div>
            )}

            {/* Social Links Badges */}
            <div className="pt-2 border-t border-white/[0.04]">
              <span className="text-xs text-[#8E8EA8] block mb-2 font-medium">Digital Links & Channels</span>
              <div className="flex flex-wrap items-center gap-2">
                {cafe?.socialLinks?.instagram ? (
                  <a
                    href={
                      cafe.socialLinks.instagram.startsWith('http')
                        ? cafe.socialLinks.instagram
                        : `https://instagram.com/${cafe.socialLinks.instagram.replace('@', '')}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-pink-300 bg-pink-500/10 border border-pink-500/20 hover:bg-pink-500/20 transition"
                  >
                    <FiInstagram size={13} />
                    <span>Instagram</span>
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-[#707089] bg-white/[0.03] border border-white/[0.05]">
                    <FiInstagram size={12} />
                    <span>No Instagram</span>
                  </span>
                )}

                {cafe?.socialLinks?.facebook ? (
                  <a
                    href={
                      cafe.socialLinks.facebook.startsWith('http')
                        ? cafe.socialLinks.facebook
                        : `https://facebook.com/${cafe.socialLinks.facebook}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-300 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition"
                  >
                    <FiFacebook size={13} />
                    <span>Facebook</span>
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-[#707089] bg-white/[0.03] border border-white/[0.05]">
                    <FiFacebook size={12} />
                    <span>No Facebook</span>
                  </span>
                )}

                {cafe?.socialLinks?.website ? (
                  <a
                    href={
                      cafe.socialLinks.website.startsWith('http')
                        ? cafe.socialLinks.website
                        : `https://${cafe.socialLinks.website}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition"
                  >
                    <FiGlobe size={13} />
                    <span>Website</span>
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-[#707089] bg-white/[0.03] border border-white/[0.05]">
                    <FiGlobe size={12} />
                    <span>No Website</span>
                  </span>
                )}

                {cafe?.socialLinks?.mapsUrl ? (
                  <a
                    href={cafe.socialLinks.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition"
                  >
                    <FiMapPin size={13} />
                    <span>Google Maps</span>
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-[#707089] bg-white/[0.03] border border-white/[0.05]">
                    <FiMapPin size={12} />
                    <span>No Maps Link</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tax & Billing Card */}
          <div
            data-tour="settings-tax-section"
            className="p-5 rounded-2xl"
            style={{
              backgroundColor: '#11111D',
              border: '1px solid rgba(255, 255, 255, 0.07)'
            }}
          >
            <h3 className="text-sm font-bold text-white mb-3">🧾 Tax, Currency & Billing Configuration</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-3 gap-x-6 text-xs divide-y sm:divide-y-0 divide-white/[0.04]">
              <div className="flex justify-between sm:flex-col py-1">
                <span className="text-[#8E8EA8]">GST / Tax Rate</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {cafe?.taxPercent || 0}% ({cafe?.taxLabel || 'GST'})
                </span>
              </div>
              <div className="flex justify-between sm:flex-col py-1">
                <span className="text-[#8E8EA8]">Currency Symbol</span>
                <span className="text-white font-bold text-sm font-mono">{cafe?.currency || '₹'}</span>
              </div>
              <div className="flex justify-between sm:flex-col py-1">
                <span className="text-[#8E8EA8]">Invoice Numbering</span>
                <span className="text-white font-mono">{cafe?.invoicePrefix || 'INV'}-YYYYMMDD-###</span>
              </div>
              <div className="flex justify-between sm:flex-col py-1 sm:col-span-3">
                <span className="text-[#8E8EA8]">Receipt Footer</span>
                <span className="text-slate-300 italic">{cafe?.footerText || 'Thank you for dining with us! Please visit again.'}</span>
              </div>
            </div>
          </div>

          {/* POS & Kitchen Rules / Payments Card */}
          <div
            data-tour="settings-payment-rules"
            className="p-5 rounded-2xl"
            style={{
              backgroundColor: '#11111D',
              border: '1px solid rgba(255, 255, 255, 0.07)'
            }}
          >
            <h3 className="text-sm font-bold text-white mb-3">⚡ POS, Kitchen Flow & Payment Rules</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-3 gap-x-6 text-xs divide-y sm:divide-y-0 divide-white/[0.04]">
              <div className="flex justify-between sm:flex-col py-1">
                <span className="text-[#8E8EA8]">Business Category</span>
                <span className="text-white font-semibold capitalize">{cafe?.businessType || 'Cafe'}</span>
              </div>
              <div className="flex justify-between sm:flex-col py-1">
                <span className="text-[#8E8EA8]">KOT Prefix</span>
                <span className="text-emerald-400 font-mono font-bold">{cafe?.kotPrefix || 'KOT'}-####</span>
              </div>
              <div className="flex justify-between sm:flex-col py-1">
                <span className="text-[#8E8EA8]">Auto-Accept QR Orders</span>
                <span className={cafe?.autoAcceptOrders ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                  {cafe?.autoAcceptOrders ? 'Enabled (Direct to Kitchen)' : 'Manual (Requires Accept)'}
                </span>
              </div>
              <div className="flex justify-between sm:flex-col py-1 sm:col-span-3 pt-2">
                <span className="text-[#8E8EA8]">Supported Settlement Modes</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 font-medium">Cash</span>
                  <span className="px-2 py-0.5 rounded-md bg-violet-500/15 text-violet-300 border border-violet-500/20 font-medium">UPI QR</span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/20 font-medium">Card POS</span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/20 font-medium">Split Bill</span>
                </div>
              </div>
            </div>
          </div>

          {/* Thermal Printer & Hardware Card */}
          <div
            data-tour="settings-printer-card"
            className="p-5 rounded-2xl"
            style={{
              backgroundColor: '#11111D',
              border: '1px solid rgba(255, 255, 255, 0.07)'
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-white mb-0.5">🖨️ Thermal Receipt & KOT Printers</h3>
                <p className="text-xs text-[#8E8EA8]">
                  Support for 80mm and 58mm ESC/POS thermal printers via USB, Network LAN, and Bluetooth.
                </p>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-violet-300 bg-violet-600/20 border border-violet-500/30 hover:bg-violet-600/30 transition-all cursor-pointer"
              >
                <span>Test Thermal Print</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                <span className="text-[#8E8EA8] block mb-1">Standard Paper Width</span>
                <span className="text-white font-bold font-mono">80mm (ESC/POS)</span>
              </div>
              <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                <span className="text-[#8E8EA8] block mb-1">Receipt Auto-Cut</span>
                <span className="text-emerald-400 font-bold">Enabled</span>
              </div>
              <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                <span className="text-[#8E8EA8] block mb-1">Kitchen Delta Printing</span>
                <span className="text-violet-400 font-bold">Active (New Items Only)</span>
              </div>
            </div>
          </div>

          {/* Active Theme Badge Card */}
          <div
            className="p-5 rounded-2xl flex items-center justify-between"
            style={{
              backgroundColor: '#11111D',
              border: '1px solid rgba(255, 255, 255, 0.07)'
            }}
          >
            <div>
              <h3 className="text-sm font-bold text-white mb-0.5">Active Menu Theme</h3>
              <p className="text-xs text-[#8E8EA8]">
                Currently rendered for diners scanning table QR codes.
              </p>
            </div>

            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border"
              style={{
                backgroundColor: activeTheme.cardBg,
                borderColor: `${activeTheme.primary}40`
              }}
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: activeTheme.primary }}
              />
              <span className="text-xs font-bold text-white">{activeTheme.name}</span>
            </div>
          </div>

          {/* Sound & Buzzer Alerts Card */}
          <div
            className="p-5 rounded-2xl flex items-center justify-between"
            style={{
              backgroundColor: '#11111D',
              border: '1px solid rgba(255, 255, 255, 0.07)'
            }}
          >
            <div>
              <h3 className="text-sm font-bold text-white mb-0.5">Sound & Audio Alerts</h3>
              <p className="text-xs text-[#8E8EA8]">
                Chime on new incoming orders and audio warning buzzer when orders remain pending for over 1 minute.
              </p>
            </div>

            <button
              onClick={onToggleSound}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                soundOn
                  ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                  : 'bg-white/5 text-[#707089] border border-white/10'
              }`}
            >
              {soundOn ? <FiVolume2 size={15} /> : <FiVolumeX size={15} />}
              <span>{soundOn ? 'Alerts Enabled' : 'Alerts Muted'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsTab;
