import React, { useState, useEffect } from 'react';
import { useOnboarding } from '../../context/OnboardingContext';
import { updateMyCafe, addMenuItem } from '../../services/api';
import { themes } from '../../utils/themes';
import {
  LuCircleCheck,
  LuStore,
  LuReceipt,
  LuLayoutGrid,
  LuQrCode,
  LuUtensils,
  LuCreditCard,
  LuArrowRight,
  LuChevronLeft,
  LuSave,
  LuSparkles
} from 'react-icons/lu';

const SETUP_STEPS = [
  { id: 'profile', name: 'Restaurant Profile', required: true, icon: LuStore, desc: 'Set your official cafe identity, address, and primary contact number.' },
  { id: 'tax', name: 'Business & Tax', required: true, icon: LuReceipt, desc: 'Configure GST / tax percentages, currency, and invoice numbering.' },
  { id: 'tables', name: 'Tables & Layout', required: false, icon: LuLayoutGrid, desc: 'Define your table count for QR code generation and live floor tracking.' },
  { id: 'theme', name: 'QR Menu Branding', required: false, icon: LuQrCode, desc: 'Pick the digital menu visual theme rendered when customers scan table QRs.' },
  { id: 'menu', name: 'Starter Menu', required: false, icon: LuUtensils, desc: 'Add your first menu categories and signature bestseller items.' },
  { id: 'payments', name: 'Payment Settings', required: false, icon: LuCreditCard, desc: 'Enable Cash, dynamic UPI QR codes, and card terminal options.' }
];

export default function EssentialSetupModal({ cafe, onUpdateCafeData }) {
  const {
    phase,
    finishEssentialSetup,
    completedSetupSteps,
    setCompletedSetupSteps,
    skippedSetupSteps,
    setSkippedSetupSteps,
    persistOnboarding
  } = useOnboarding();

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form state initialized from cafe data
  const [formData, setFormData] = useState({
    name: cafe?.name || '',
    ownerName: cafe?.ownerName || '',
    phone: cafe?.phone || '',
    address: cafe?.address || '',
    city: cafe?.city || '',
    businessType: cafe?.businessType || 'cafe',
    taxPercent: cafe?.taxPercent ?? 5,
    taxLabel: cafe?.taxLabel || 'GST',
    currency: cafe?.currency || '₹',
    invoicePrefix: cafe?.invoicePrefix || 'INV',
    autoAcceptOrders: cafe?.autoAcceptOrders || false,
    tableCount: cafe?.tableCount || 12,
    theme: cafe?.theme || 'classic-dark',
    allowCashPayment: cafe?.orderingConfig?.allowCashPayment ?? true,
    allowUpi: cafe?.orderingConfig?.allowUpi ?? true,
    allowOnlinePayment: cafe?.orderingConfig?.allowOnlinePayment ?? false
  });

  // Starter dish draft
  const [starterDish, setStarterDish] = useState({
    name: 'Artisan Woodfired Margherita',
    category: 'Pizzas',
    price: 380,
    isVeg: true,
    description: 'San Marzano tomato sauce, fresh buffalo mozzarella, fresh sweet basil'
  });

  useEffect(() => {
    if (cafe) {
      setFormData(prev => ({
        ...prev,
        name: cafe.name || prev.name,
        ownerName: cafe.ownerName || prev.ownerName,
        phone: cafe.phone || prev.phone,
        address: cafe.address || prev.address,
        city: cafe.city || prev.city,
        taxPercent: cafe.taxPercent ?? prev.taxPercent,
        taxLabel: cafe.taxLabel || prev.taxLabel,
        tableCount: cafe.tableCount || prev.tableCount,
        theme: cafe.theme || prev.theme
      }));
    }
  }, [cafe]);

  if (phase !== 'essential_setup') return null;

  const activeStep = SETUP_STEPS[currentStepIdx];
  const isLastStep = currentStepIdx === SETUP_STEPS.length - 1;

  const handleSaveAndAdvance = async () => {
    setSaving(true);
    setSuccessMsg(null);
    try {
      // Build cafe payload
      const payload = {
        name: formData.name,
        ownerName: formData.ownerName,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        businessType: formData.businessType,
        taxPercent: Number(formData.taxPercent),
        taxLabel: formData.taxLabel,
        currency: formData.currency,
        invoicePrefix: formData.invoicePrefix,
        autoAcceptOrders: formData.autoAcceptOrders,
        tableCount: Number(formData.tableCount),
        theme: formData.theme,
        orderingConfig: {
          ...(cafe?.orderingConfig || {}),
          allowCashPayment: formData.allowCashPayment,
          allowUpi: formData.allowUpi,
          allowOnlinePayment: formData.allowOnlinePayment
        }
      };

      // Save starter dish if on menu step and dish name provided
      if (activeStep.id === 'menu' && starterDish.name) {
        try {
          await addMenuItem(starterDish);
        } catch (e) {
          // ignore if duplicate
        }
      }

      await updateMyCafe(payload);
      onUpdateCafeData?.(payload);

      const updatedCompleted = Array.from(new Set([...completedSetupSteps, activeStep.id]));
      setCompletedSetupSteps(updatedCompleted);

      persistOnboarding({
        completed_setup_steps: updatedCompleted,
        current_setup_step: currentStepIdx + 1
      });

      setSuccessMsg('Settings saved!');
      setTimeout(() => setSuccessMsg(null), 1500);

      if (isLastStep) {
        finishEssentialSetup();
      } else {
        setCurrentStepIdx(prev => prev + 1);
      }
    } catch (err) {
      console.error('Save essential step error:', err);
      // Even if network fails offline, allow advancing
      if (isLastStep) {
        finishEssentialSetup();
      } else {
        setCurrentStepIdx(prev => prev + 1);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSkipStep = () => {
    const updatedSkipped = Array.from(new Set([...skippedSetupSteps, activeStep.id]));
    setSkippedSetupSteps(updatedSkipped);
    persistOnboarding({
      skipped_setup_steps: updatedSkipped,
      current_setup_step: currentStepIdx + 1
    });

    if (isLastStep) {
      finishEssentialSetup();
    } else {
      setCurrentStepIdx(prev => prev + 1);
    }
  };

  const activeThemeObj = themes[formData.theme] || themes['classic-dark'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl bg-[#10101C] border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Wizard Progress Top Bar */}
        <div className="px-6 py-4 border-b border-white/[0.08] bg-[#141424] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-bold text-sm font-mono">
              {currentStepIdx + 1}
            </span>
            <div>
              <span className="text-[11px] font-bold text-violet-400 uppercase tracking-wider block">
                Essential Setup • Step {currentStepIdx + 1} of {SETUP_STEPS.length}
              </span>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                {activeStep.name}
                {activeStep.required ? (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Required
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.2 rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/30">
                    Optional
                  </span>
                )}
              </h2>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            {SETUP_STEPS.map((s, idx) => (
              <div
                key={s.id}
                className={`w-6 h-1.5 rounded-full transition-all ${
                  idx < currentStepIdx
                    ? 'bg-emerald-400'
                    : idx === currentStepIdx
                    ? 'bg-violet-500 w-10'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Explanation Banner */}
        <div className="px-6 py-3 bg-violet-950/20 border-b border-white/[0.06] flex items-center gap-2.5 text-xs text-violet-300">
          <LuSparkles className="w-4 h-4 text-violet-400 flex-shrink-0" />
          <span>{activeStep.desc}</span>
        </div>

        {/* Step Configuration Form Area */}
        <div className="p-6 overflow-y-auto max-h-[52vh] space-y-4">
          {/* STEP 1: RESTAURANT PROFILE */}
          {activeStep.id === 'profile' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="text-slate-300 font-semibold block mb-1.5">Restaurant / Cafe Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#171727] border border-white/10 text-white placeholder-slate-500 outline-none focus:border-violet-500 text-sm"
                  placeholder="e.g. The Rustic Bean Bistro"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">Owner / Manager Name *</label>
                <input
                  type="text"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#171727] border border-white/10 text-white placeholder-slate-500 outline-none focus:border-violet-500"
                  placeholder="e.g. Vikram Sharma"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">Primary Contact Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#171727] border border-white/10 text-white placeholder-slate-500 outline-none focus:border-violet-500"
                  placeholder="e.g. +91 98765 43210"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">Business Category</label>
                <select
                  value={formData.businessType}
                  onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#171727] border border-white/10 text-white outline-none focus:border-violet-500"
                >
                  <option value="cafe">Cafe / Bistro</option>
                  <option value="restaurant">Full Dine-In Restaurant</option>
                  <option value="bakery">Bakery & Patisserie</option>
                  <option value="bar">Bar & Lounge</option>
                  <option value="cloud-kitchen">Cloud Kitchen / QSR</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#171727] border border-white/10 text-white placeholder-slate-500 outline-none focus:border-violet-500"
                  placeholder="e.g. Bengaluru"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-slate-300 font-semibold block mb-1.5">Street Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#171727] border border-white/10 text-white placeholder-slate-500 outline-none focus:border-violet-500"
                  placeholder="e.g. 14, Galleria Market, Sector 29"
                />
              </div>
            </div>
          )}

          {/* STEP 2: BUSINESS & TAX */}
          {activeStep.id === 'tax' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">GST / Tax Percentage (%) *</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={formData.taxPercent}
                  onChange={(e) => setFormData({ ...formData, taxPercent: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#171727] border border-white/10 text-white placeholder-slate-500 outline-none focus:border-violet-500 font-mono text-sm"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  e.g. 5% standard for restaurant dining in India, or 0% if non-composite.
                </span>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">Tax Label *</label>
                <input
                  type="text"
                  value={formData.taxLabel}
                  onChange={(e) => setFormData({ ...formData, taxLabel: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#171727] border border-white/10 text-white placeholder-slate-500 outline-none focus:border-violet-500 font-mono"
                  placeholder="GST"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Printed on thermal receipt (GST, VAT, Service Tax).
                </span>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">Currency Symbol</label>
                <input
                  type="text"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#171727] border border-white/10 text-white placeholder-slate-500 outline-none focus:border-violet-500 font-mono text-sm"
                  placeholder="₹"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">Invoice Prefix</label>
                <input
                  type="text"
                  value={formData.invoicePrefix}
                  onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#171727] border border-white/10 text-white placeholder-slate-500 outline-none focus:border-violet-500 font-mono"
                  placeholder="INV"
                />
              </div>

              <div className="sm:col-span-2 p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white">Auto-Accept QR Orders</h3>
                  <p className="text-[11px] text-slate-400">
                    Send orders directly to kitchen tickets without requiring manual cashier acceptance.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.autoAcceptOrders}
                    onChange={(e) => setFormData({ ...formData, autoAcceptOrders: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                </label>
              </div>
            </div>
          )}

          {/* STEP 3: TABLES & AREAS */}
          {activeStep.id === 'tables' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">Total Physical Tables</label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={formData.tableCount}
                  onChange={(e) => setFormData({ ...formData, tableCount: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#171727] border border-white/10 text-white placeholder-slate-500 outline-none focus:border-violet-500 font-mono text-sm"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  The system will automatically generate QR codes and floor tracking cards for Tables 1 through {formData.tableCount || 1}.
                </span>
              </div>

              {/* Visual preview grid of generated tables */}
              <div>
                <span className="text-slate-300 font-semibold block mb-2">Floor View Preview:</span>
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-2 bg-[#0B0B14] rounded-xl border border-white/5">
                  {Array.from({ length: Math.min(18, Number(formData.tableCount) || 6) }).map((_, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg bg-[#161626] border border-white/10 text-center"
                    >
                      <span className="text-xs font-bold text-white block">T{i + 1}</span>
                      <span className="text-[9px] text-emerald-400">Available</span>
                    </div>
                  ))}
                  {Number(formData.tableCount) > 18 && (
                    <div className="p-2 rounded-lg bg-white/5 flex items-center justify-center text-[10px] text-slate-400">
                      +{Number(formData.tableCount) - 18} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: QR MENU BRANDING THEME */}
          {activeStep.id === 'theme' && (
            <div className="space-y-3.5">
              <span className="text-xs text-slate-300 font-semibold block">Select Customer Mobile Theme:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {Object.entries(themes).map(([key, t]) => {
                  const isSelected = formData.theme === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormData({ ...formData, theme: key })}
                      className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-violet-500 shadow-lg shadow-violet-500/20 scale-[1.02]'
                          : 'border-white/10 hover:border-white/25 bg-[#141424]'
                      }`}
                      style={{ backgroundColor: t.cardBg }}
                    >
                      <div
                        className="w-full h-8 rounded-lg mb-2 flex items-center justify-center text-[10px] font-bold"
                        style={{ background: t.background, color: t.textPrimary }}
                      >
                        Preview
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.primary }} />
                        <span className="text-xs font-semibold text-white truncate">{t.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div
                className="p-3.5 rounded-xl border flex items-center gap-3"
                style={{ background: activeThemeObj.glassBg, borderColor: `${activeThemeObj.primary}40` }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow"
                  style={{ background: `linear-gradient(135deg, ${activeThemeObj.primary}, ${activeThemeObj.primaryDark})` }}
                >
                  {formData.name ? formData.name.charAt(0) : '☕'}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Diner Interface Appearance</span>
                  <span className="text-xs font-bold" style={{ color: activeThemeObj.textPrimary }}>
                    {formData.name || 'Your Restaurant'} • {activeThemeObj.name}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: STARTER MENU */}
          {activeStep.id === 'menu' && (
            <div className="space-y-3.5 text-xs">
              <p className="text-slate-300">
                Add a sample bestselling item so your customer menu has immediate demonstration content:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-slate-400 block mb-1">Item Name</label>
                  <input
                    type="text"
                    value={starterDish.name}
                    onChange={(e) => setStarterDish({ ...starterDish, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#171727] border border-white/10 text-white outline-none focus:border-violet-500"
                    placeholder="e.g. Classic Cappuccino"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Category</label>
                  <input
                    type="text"
                    value={starterDish.category}
                    onChange={(e) => setStarterDish({ ...starterDish, category: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#171727] border border-white/10 text-white outline-none focus:border-violet-500"
                    placeholder="e.g. Beverages"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={starterDish.price}
                    onChange={(e) => setStarterDish({ ...starterDish, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#171727] border border-white/10 text-white outline-none focus:border-violet-500"
                    placeholder="180"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-400 block mb-1">Short Description</label>
                  <input
                    type="text"
                    value={starterDish.description}
                    onChange={(e) => setStarterDish({ ...starterDish, description: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#171727] border border-white/10 text-white outline-none focus:border-violet-500"
                    placeholder="Double shot espresso with steamed textured milk"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: PAYMENTS */}
          {activeStep.id === 'payments' && (
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white">Cash at Counter</h3>
                  <p className="text-[11px] text-slate-400">Accept paper currency at front-desk cashier settlement.</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.allowCashPayment}
                  onChange={(e) => setFormData({ ...formData, allowCashPayment: e.target.checked })}
                  className="w-4 h-4 accent-violet-600 rounded cursor-pointer"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white">Dynamic UPI QR Codes</h3>
                  <p className="text-[11px] text-slate-400">Generate on-screen UPI QR codes for Instant GPay, PhonePe, and Paytm scans.</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.allowUpi}
                  onChange={(e) => setFormData({ ...formData, allowUpi: e.target.checked })}
                  className="w-4 h-4 accent-violet-600 rounded cursor-pointer"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white">Card / POS Swiping Terminals</h3>
                  <p className="text-[11px] text-slate-400">Enable card swipe/tap reference logging on invoices.</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.allowOnlinePayment}
                  onChange={(e) => setFormData({ ...formData, allowOnlinePayment: e.target.checked })}
                  className="w-4 h-4 accent-violet-600 rounded cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="p-6 border-t border-white/[0.08] bg-[#141424] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {currentStepIdx > 0 && (
              <button
                onClick={() => setCurrentStepIdx(prev => prev - 1)}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <LuChevronLeft size={14} />
                <span>Previous</span>
              </button>
            )}

            {!activeStep.required && (
              <button
                onClick={handleSkipStep}
                className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Skip Step
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {successMsg && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                <LuCircleCheck size={14} />
                {successMsg}
              </span>
            )}

            <button
              onClick={handleSaveAndAdvance}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-600/30 active:scale-95 transition-all cursor-pointer"
            >
              <span>{isLastStep ? 'Complete Setup & Enter Tour' : 'Save & Continue'}</span>
              <LuArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
