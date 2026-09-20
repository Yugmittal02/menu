import React, { useState } from 'react';
import {
  FiX,
  FiCheckCircle,
  FiArrowRight,
  FiArrowLeft,
  FiGrid,
  FiUser,
  FiPhone,
  FiMail,
  FiMapPin,
  FiBriefcase,
  FiCheckSquare,
  FiCopy,
  FiCheck,
} from 'react-icons/fi';
import { submitApplication } from '../services/api';
import { trackEvent } from '../utils/analytics';

const ApplicationModal = ({ isOpen, onClose, isInline = false }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    restaurantName: '',
    ownerName: '',
    phone: '',
    email: '',
    businessType: 'Restaurant',
    city: '',
    address: '',
    tables: 10,
    menuRequirements: ['Digital Menu', 'Table QR Codes', 'Live Order Dashboard'],
    estimatedDailyOrders: '25-50',
    message: '',
    confirmedAccurate: false,
  });

  if (!isOpen && !isInline) return null;

  const handleChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    if (errorMsg) setErrorMsg('');
  };

  const handleRequirementToggle = (option) => {
    setFormData((prev) => {
      const exists = prev.menuRequirements.includes(option);
      return {
        ...prev,
        menuRequirements: exists
          ? prev.menuRequirements.filter((i) => i !== option)
          : [...prev.menuRequirements, option],
      };
    });
  };

  const validateStep1 = () => {
    if (!formData.restaurantName.trim()) return 'Restaurant / Cafe Name is required';
    if (!formData.ownerName.trim()) return 'Owner / Manager Name is required';
    if (!formData.phone.trim()) return 'Phone Number is required';
    if (!formData.email.trim()) return 'Email Address is required';
    return null;
  };

  const validateStep2 = () => {
    if (!formData.city.trim()) return 'City is required';
    if (!formData.address.trim()) return 'Restaurant Address is required';
    if (!formData.tables || formData.tables < 1) return 'Valid number of tables is required';
    return null;
  };

  const handleNext = () => {
    let err = null;
    if (step === 1) {
      err = validateStep1();
      if (!err) trackEvent('Application Started', { step: 1 });
    } else if (step === 2) {
      err = validateStep2();
    }

    if (err) {
      setErrorMsg(err);
      return;
    }

    setErrorMsg('');
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setErrorMsg('');
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.confirmedAccurate) {
      setErrorMsg('Please confirm that the information provided is accurate.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const { data } = await submitApplication({
        restaurantName: formData.restaurantName,
        ownerName: formData.ownerName,
        phone: formData.phone,
        email: formData.email,
        businessType: formData.businessType,
        city: formData.city,
        address: formData.address,
        tables: Number(formData.tables),
        menuRequirements: formData.menuRequirements,
        estimatedDailyOrders: formData.estimatedDailyOrders,
        message: formData.message,
      });

      trackEvent('Application Completed', { applicationId: data.applicationId });
      setSuccessData(data);
    } catch (err) {
      console.error('Submit app error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to submit application. Please check fields.');
    } finally {
      setLoading(false);
    }
  };

  const copyRefId = () => {
    if (successData?.applicationId) {
      navigator.clipboard.writeText(successData.applicationId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSuccessData(null);
    setErrorMsg('');
    if (onClose) onClose();
  };

  const requirementOptions = [
    'Digital Menu',
    'Table QR Codes',
    'Online Ordering',
    'Live Order Dashboard',
    'Menu Management',
    'Analytics',
  ];

  return (
    <div
      className={
        isInline
          ? 'w-full max-w-3xl mx-auto my-8'
          : 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200'
      }
    >
      <div
        id="apply"
        className="glass-card w-full max-w-2xl rounded-3xl border-purple-500/30 bg-[#0E1322] shadow-2xl p-6 md:p-8 relative overflow-hidden text-left"
      >
        {/* Close Button (if modal mode) */}
        {!isInline && onClose && (
          <button
            onClick={resetForm}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <FiX className="text-xl" />
          </button>
        )}

        {/* Form Content */}
        {!successData ? (
          <div>
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">
                <FiGrid /> Restaurant Onboarding
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                Get Your Restaurant on QR Menu
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Start accepting digital orders with your own QR menu.
              </p>
            </div>

            {/* Stepper Bar */}
            <div className="flex items-center justify-between gap-2 mb-8 bg-white/5 p-2 rounded-2xl border border-white/5">
              {[
                { s: 1, label: 'Details' },
                { s: 2, label: 'Business' },
                { s: 3, label: 'Requirements' },
                { s: 4, label: 'Review' },
              ].map((st) => (
                <div
                  key={st.s}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                    step === st.s
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : step > st.s
                      ? 'bg-purple-950/40 text-purple-300'
                      : 'text-gray-500'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">
                    {st.s}
                  </span>
                  <span className="hidden sm:inline">{st.label}</span>
                </div>
              ))}
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-medium">
                {errorMsg}
              </div>
            )}

            {/* Step 1: Restaurant Details */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                  <FiUser className="text-purple-400" /> Step 1: Restaurant Details
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Restaurant / Cafe Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. The Artisan Bakery & Cafe"
                    className="input-field"
                    value={formData.restaurantName}
                    onChange={(e) => handleChange('restaurantName', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Owner / Manager Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    className="input-field"
                    value={formData.ownerName}
                    onChange={(e) => handleChange('ownerName', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+1 (555) 019-2834"
                      className="input-field"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="owner@artisancafe.com"
                      className="input-field"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Business Info */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                  <FiBriefcase className="text-purple-400" /> Step 2: Business Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Business Type *
                    </label>
                    <select
                      className="input-field"
                      value={formData.businessType}
                      onChange={(e) => handleChange('businessType', e.target.value)}
                    >
                      <option value="Cafe">Cafe</option>
                      <option value="Restaurant">Restaurant</option>
                      <option value="Cloud Kitchen">Cloud Kitchen</option>
                      <option value="Hotel">Hotel</option>
                      <option value="Food Court">Food Court</option>
                      <option value="Bakery">Bakery</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. San Francisco, CA"
                      className="input-field"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Restaurant Address *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Full street address..."
                    className="input-field"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Approximate Number of Tables *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    required
                    className="input-field"
                    value={formData.tables}
                    onChange={(e) => handleChange('tables', parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
            )}

            {/* Step 3: QR Menu Requirements */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                  <FiCheckSquare className="text-purple-400" /> Step 3: QR Menu Requirements
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2">
                    What features do you need?
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {requirementOptions.map((opt, i) => {
                      const isSelected = formData.menuRequirements.includes(opt);
                      return (
                        <button
                          type="button"
                          key={i}
                          onClick={() => handleRequirementToggle(opt)}
                          className={`p-3 rounded-xl text-xs font-medium text-left flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-purple-600/20 border border-purple-500/50 text-white'
                              : 'bg-white/5 border border-white/5 text-gray-400 hover:text-white'
                          }`}
                        >
                          <span>{opt}</span>
                          {isSelected && <FiCheck className="text-purple-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Estimated Daily Orders
                  </label>
                  <select
                    className="input-field"
                    value={formData.estimatedDailyOrders}
                    onChange={(e) => handleChange('estimatedDailyOrders', e.target.value)}
                  >
                    <option value="Under 25">Under 25</option>
                    <option value="25-50">25-50</option>
                    <option value="50-100">50-100</option>
                    <option value="100-250">100-250</option>
                    <option value="250+">250+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Anything else we should know? (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Specific requests, point of sale notes, onboarding questions..."
                    className="input-field"
                    value={formData.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Review & Submit */}
            {step === 4 && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                  <FiCheckCircle className="text-purple-400" /> Step 4: Review & Submit
                </h3>

                <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-xs space-y-2 text-gray-300">
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-gray-400">Restaurant:</span>
                    <span className="font-bold text-white">{formData.restaurantName}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-gray-400">Owner Name:</span>
                    <span className="text-white">{formData.ownerName}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-gray-400">Contact:</span>
                    <span className="text-white">{formData.phone} | {formData.email}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-gray-400">Business Type & City:</span>
                    <span className="text-white">{formData.businessType} in {formData.city}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-gray-400">Tables & Daily Volume:</span>
                    <span className="text-white">{formData.tables} tables ({formData.estimatedDailyOrders} orders/day)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Selected Requirements:</span>
                    <span className="text-purple-300 font-medium">
                      {formData.menuRequirements.join(', ') || 'Standard Menu'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <input
                    type="checkbox"
                    id="confirmAccurate"
                    className="mt-0.5 w-4 h-4 accent-purple-600 rounded cursor-pointer"
                    checked={formData.confirmedAccurate}
                    onChange={(e) => handleChange('confirmedAccurate', e.target.checked)}
                  />
                  <label htmlFor="confirmAccurate" className="text-xs text-gray-300 cursor-pointer">
                    I confirm that the information provided is accurate and I agree to be contacted for onboarding setup.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading || !formData.confirmedAccurate}
                  className="btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-xl shadow-purple-600/30"
                >
                  {loading ? 'Submitting Application...' : 'Submit Application'}
                  {!loading && <FiArrowRight />}
                </button>
              </form>
            )}

            {/* Stepper Navigation Actions */}
            {step < 4 && (
              <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="btn-ghost text-xs py-2 px-4 flex items-center gap-1.5"
                  >
                    <FiArrowLeft /> Back
                  </button>
                ) : <div />}

                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-primary text-xs py-2.5 px-6 font-bold flex items-center gap-2"
                >
                  Next Step <FiArrowRight />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Success State */
          <div className="text-center py-6 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-3xl mx-auto animate-bounce">
              <FiCheckCircle />
            </div>

            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-emerald-400">
                Onboarding Requested
              </span>
              <h3 className="text-2xl font-extrabold text-white mt-1">Application Received</h3>
              <p className="text-sm text-gray-300 mt-2 max-w-md mx-auto leading-relaxed">
                Thank you for applying for QR Menu. Our team will review your details and contact you regarding the next steps.
              </p>
            </div>

            {/* Reference Number Box */}
            <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 max-w-sm mx-auto">
              <p className="text-xs text-gray-400 mb-1">Application Reference Number</p>
              <div className="flex items-center justify-center gap-2">
                <code className="text-base font-mono font-bold text-purple-300">
                  {successData.applicationId}
                </code>
                <button
                  onClick={copyRefId}
                  className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 hover:text-white"
                  title="Copy Reference ID"
                >
                  {copied ? <FiCheck className="text-emerald-400" /> : <FiCopy />}
                </button>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button onClick={resetForm} className="btn-primary text-xs py-2.5 px-6">
                Back to Home
              </button>
              <a
                href="mailto:support@qrmenu.app"
                className="btn-outline text-xs py-2.5 px-6 border-purple-500/30 text-gray-300"
              >
                Contact Support
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationModal;
