import React, { useState, useEffect, useCallback } from 'react';
import { FaTag, FaChevronDown, FaCheckCircle, FaPercent, FaRupeeSign, FaExclamationCircle } from 'react-icons/fa';
import { fetchOffers, validateCoupon } from '../services/api';

const OffersDropdown = ({ orderTotal = 0, onOfferSelect, selectedOffer = null }) => {
  const [offers, setOffers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  const loadOffers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchOffers();
      const data = response?.data || [];

      // Safely filter offers with defensive checks
      const activeOffers = Array.isArray(data)
        ? data.filter(offer => {
          // Basic validation
          if (!offer || !offer.isActive) return false;

          // Check minimum order value
          if (offer.minOrderValue && orderTotal < offer.minOrderValue) return false;

          // Exclude promotional combo offers (REP = Republic Day combos)
          // These are fixed-price deals, not discount codes
          if (offer.code && offer.code.startsWith('REP')) return false;

          return true;
        })
        : [];

      setOffers(activeOffers);
    } catch (err) {
      console.error('Error loading offers:', err);
      setError('Failed to load offers');
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, [orderTotal]);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  const calculateDiscount = useCallback((offer) => {
    if (!offer) return 0;

    const total = Number(orderTotal) || 0;
    const discountValue = Number(offer.discountValue) || 0;

    if (offer.discountType === 'percentage') {
      let discount = Math.round(total * (discountValue / 100));
      // Cap at maxDiscount if set
      if (offer.maxDiscount && discount > offer.maxDiscount) {
        discount = offer.maxDiscount;
      }
      return discount;
    }
    return discountValue;
  }, [orderTotal]);


  const handleSelectOffer = (offer) => {
    const discount = calculateDiscount(offer);
    onOfferSelect?.({
      ...offer,
      calculatedDiscount: discount
    });
    setIsOpen(false);
    setCouponCode('');
    setCouponError('');
  };

  const handleRemoveOffer = (e) => {
    e.stopPropagation();
    onOfferSelect?.(null);
    setCouponCode('');
    setCouponError('');
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    const code = couponCode.trim().toUpperCase();

    // Block promotional combo codes (not discount codes)
    if (code.startsWith('REP')) {
      setCouponError('This is a combo deal, not a discount code. Add the combo items to your cart.');
      return;
    }

    setCouponLoading(true);
    setCouponError('');

    try {
      const response = await validateCoupon(code, orderTotal);
      const offer = response?.data?.offer;

      if (offer) {
        handleSelectOffer(offer);
      } else {
        setCouponError('Invalid coupon code');
      }
    } catch (err) {
      console.error('Error validating coupon:', err);
      setCouponError(err.response?.data?.message || 'Invalid or expired coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-5 border border-gray-100 animate-pulse">
        <div className="h-14 bg-gray-100 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Selected Offer Display or Dropdown Trigger */}
      <div
        onClick={() => !selectedOffer && setIsOpen(!isOpen)}
        className={`w-full p-4 rounded-3xl border-2 flex items-center gap-4 transition-all cursor-pointer ${selectedOffer
            ? 'border-green-400 bg-green-50'
            : 'border-gray-200 bg-white hover:border-orange-300'
          }`}
      >
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedOffer
            ? 'bg-gradient-to-br from-green-400 to-emerald-500'
            : 'bg-gradient-to-br from-orange-400 to-orange-500'
          }`}>
          <FaTag className="text-white text-lg" />
        </div>

        <div className="flex-1 text-left" onClick={() => selectedOffer && setIsOpen(!isOpen)}>
          {selectedOffer ? (
            <>
              <p className="font-bold text-gray-800">{selectedOffer.title}</p>
              <p className="text-sm text-green-600 font-semibold">
                You save ₹{selectedOffer.calculatedDiscount}!
              </p>
            </>
          ) : (
            <>
              <p className="font-bold text-gray-800">Apply Coupon / Offer</p>
              <p className="text-sm text-gray-500">
                {offers.length > 0
                  ? `${offers.length} offer${offers.length !== 1 ? 's' : ''} available`
                  : 'Enter coupon code'}
              </p>
            </>
          )}
        </div>

        {selectedOffer ? (
          <button
            onClick={handleRemoveOffer}
            className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-sm font-bold hover:bg-red-200 transition-colors"
          >
            Remove
          </button>
        ) : (
          <FaChevronDown className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-fadeIn">
          {/* Coupon Code Input */}
          <div className="p-4 border-b border-gray-100">
            <label className="text-sm font-bold text-gray-700 mb-2 block">
              Have a coupon code?
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase());
                  setCouponError('');
                }}
                placeholder="Enter coupon code"
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium uppercase focus:outline-none focus:ring-2 focus:ring-orange-400"
                onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
              />
              <button
                onClick={handleApplyCoupon}
                disabled={couponLoading || !couponCode.trim()}
                className="px-5 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
              >
                {couponLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Apply'
                )}
              </button>
            </div>
            {couponError && (
              <p className="text-red-500 text-xs mt-2 font-medium flex items-center gap-1">
                <FaExclamationCircle size={10} />
                {couponError}
              </p>
            )}
          </div>

          {/* Available Offers */}
          {offers.length > 0 ? (
            <div className="p-2 max-h-[300px] overflow-y-auto">
              <p className="text-xs text-gray-400 font-bold uppercase px-2 py-1">
                Available Offers
              </p>
              {offers.map((offer) => {
                const discount = calculateDiscount(offer);
                const isSelected = selectedOffer?._id === offer._id;

                return (
                  <button
                    key={offer._id}
                    onClick={() => handleSelectOffer(offer)}
                    className={`w-full p-4 rounded-xl flex items-start gap-3 transition-all mb-1 last:mb-0 ${isSelected
                        ? 'bg-green-50 border-2 border-green-400'
                        : 'hover:bg-gray-50 border-2 border-transparent'
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${offer.discountType === 'percentage'
                        ? 'bg-purple-100 text-purple-600'
                        : 'bg-orange-100 text-orange-600'
                      }`}>
                      {offer.discountType === 'percentage' ? <FaPercent /> : <FaRupeeSign />}
                    </div>

                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-800">{offer.title}</p>
                        {isSelected && <FaCheckCircle className="text-green-500" />}
                      </div>
                      {offer.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{offer.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg font-bold">
                          {offer.discountType === 'percentage'
                            ? `${offer.discountValue}% OFF`
                            : `₹${offer.discountValue} OFF`}
                        </span>
                        <span className="text-xs text-gray-400">
                          Save ₹{discount}
                        </span>
                      </div>
                    </div>

                    {offer.code && (
                      <div className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-600">
                        {offer.code}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FaTag className="text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No offers available</p>
              <p className="text-xs text-gray-400 mt-1">
                Enter a coupon code above if you have one
              </p>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default OffersDropdown;

