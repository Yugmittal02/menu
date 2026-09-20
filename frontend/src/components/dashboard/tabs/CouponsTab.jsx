import React, { useState } from 'react';
import {
  FiTag,
  FiPlus,
  FiTrash2,
  FiCopy,
  FiCheck,
  FiClock,
  FiX
} from 'react-icons/fi';
import EmptyState from '../ui/EmptyState';
import ConfirmModal from '../ui/ConfirmModal';

const CouponsTab = ({
  coupons = [],
  onCreateCoupon,
  onDeleteCoupon,
  onToggleCoupon
}) => {
  const [showModal, setShowModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');
  const [couponToDelete, setCouponToDelete] = useState(null);

  const [form, setForm] = useState({
    code: '',
    type: 'percentage',
    value: '',
    minOrder: '',
    maxDiscount: '',
    usageLimit: '',
    expiresAt: ''
  });

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 1500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onCreateCoupon({
      code: form.code.toUpperCase().trim(),
      type: form.type,
      value: parseFloat(form.value),
      minOrder: parseFloat(form.minOrder) || 0,
      maxDiscount: parseFloat(form.maxDiscount) || 0,
      usageLimit: parseInt(form.usageLimit) || 0,
      expiresAt: form.expiresAt || null
    });

    setForm({
      code: '',
      type: 'percentage',
      value: '',
      minOrder: '',
      maxDiscount: '',
      usageLimit: '',
      expiresAt: ''
    });
    setShowModal(false);
  };

  const activeCount = coupons.filter((c) => c.isActive).length;

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Top Header Card */}
      <div
        className="p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        style={{
          backgroundColor: '#11111D',
          border: '1px solid rgba(255, 255, 255, 0.07)'
        }}
      >
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base md:text-lg font-bold text-white">Coupons & Offers</h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#7C3AED]/20 text-[#A78BFA]">
              {activeCount} active
            </span>
          </div>
          <p className="text-xs text-[#8E8EA8] mt-0.5">
            Boost repeat orders and reward diners with promotional discounts
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          data-tour="coupons-create-btn"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:brightness-110 active:scale-95 shadow-md self-start sm:self-auto"
          style={{
            background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
          }}
        >
          <FiPlus size={15} />
          <span>New Coupon</span>
        </button>
      </div>

      {/* Coupons List */}
      {coupons.length === 0 ? (
        <EmptyState
          emoji="🎫"
          title="No coupons yet"
          description="Create your first promotional coupon to offer percentage or flat discounts during customer checkout."
          actionText="Create Coupon"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div data-tour="coupons-table" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((c) => {
            const isPercentage = c.type === 'percentage';
            const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();

            return (
              <div
                key={c._id}
                className={`rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 border relative ${
                  !c.isActive || isExpired ? 'opacity-60' : 'hover:border-white/[0.15]'
                }`}
                style={{
                  backgroundColor: '#11111D',
                  borderColor: 'rgba(255, 255, 255, 0.07)'
                }}
              >
                <div>
                  {/* Top: Code + Status Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <button
                      onClick={() => copyCode(c.code)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold tracking-widest text-[#A78BFA] bg-[#7C3AED]/15 border border-[#7C3AED]/30 hover:bg-[#7C3AED]/25 transition-colors"
                      title="Click to copy coupon code"
                    >
                      <span>{c.code}</span>
                      {copiedCode === c.code ? (
                        <FiCheck size={12} className="text-[#10B981]" />
                      ) : (
                        <FiCopy size={12} className="text-[#707089]" />
                      )}
                    </button>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        c.isActive && !isExpired
                          ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/25'
                          : 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/25'
                      }`}
                    >
                      {isExpired ? 'Expired' : c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Value / Offer amount */}
                  <div className="mb-3">
                    <div className="text-2xl font-extrabold font-mono text-white">
                      {isPercentage ? `${c.value}% OFF` : `₹${c.value} OFF`}
                    </div>
                    <p className="text-xs text-[#8E8EA8] mt-0.5">
                      {c.minOrder > 0
                        ? `Valid on orders above ₹${c.minOrder}`
                        : 'Valid on any order value'}
                    </p>
                  </div>

                  {/* Details / Rules */}
                  <div className="space-y-1.5 py-3 border-t border-white/[0.05] text-xs text-[#707089]">
                    {c.maxDiscount > 0 && isPercentage && (
                      <div className="flex justify-between">
                        <span>Max Discount:</span>
                        <span className="text-white font-mono">₹{c.maxDiscount}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span>Usage:</span>
                      <span className="text-white font-mono">
                        {c.usedCount} {c.usageLimit > 0 ? `/ ${c.usageLimit}` : 'times'}
                      </span>
                    </div>

                    {c.expiresAt && (
                      <div className="flex justify-between">
                        <span>Expires:</span>
                        <span className="text-white">
                          {new Date(c.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                  <button
                    data-tour="coupon-toggle"
                    onClick={() => onToggleCoupon(c._id)}
                    className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors ${
                      c.isActive
                        ? 'text-[#EF4444] hover:bg-[#EF4444]/10'
                        : 'text-[#10B981] hover:bg-[#10B981]/10'
                    }`}
                  >
                    {c.isActive ? 'Deactivate' : 'Activate'}
                  </button>

                  <button
                    onClick={() => setCouponToDelete(c)}
                    className="p-1.5 text-[#707089] hover:text-[#EF4444] rounded-lg hover:bg-white/5 transition-colors"
                    title="Delete coupon"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Coupon Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div
            className="w-full max-w-md rounded-2xl p-6 shadow-2xl transition-all"
            style={{
              backgroundColor: '#151523',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FiTag className="text-[#A78BFA]" />
                <span>Create New Coupon</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#707089] hover:text-white p-1 rounded-lg"
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-[#8E8EA8] block mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WELCOME20"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 rounded-xl text-xs md:text-sm text-white font-mono uppercase bg-[#11111D] border border-white/[0.08] outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#8E8EA8] block mb-1">Discount Type *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs text-white bg-[#11111D] border border-white/[0.08] outline-none cursor-pointer focus:border-[#7C3AED]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-[#8E8EA8] block mb-1">
                    Value ({form.type === 'percentage' ? '%' : '₹'}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder={form.type === 'percentage' ? '20' : '50'}
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-xs md:text-sm text-white bg-[#11111D] border border-white/[0.08] outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#8E8EA8] block mb-1">Min Order (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 = no minimum"
                    value={form.minOrder}
                    onChange={(e) => setForm({ ...form, minOrder: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-xs md:text-sm text-white bg-[#11111D] border border-white/[0.08] outline-none focus:border-[#7C3AED]"
                  />
                </div>

                {form.type === 'percentage' && (
                  <div>
                    <label className="text-xs text-[#8E8EA8] block mb-1">Max Discount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0 = no cap"
                      value={form.maxDiscount}
                      onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl text-xs md:text-sm text-white bg-[#11111D] border border-white/[0.08] outline-none focus:border-[#7C3AED]"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs text-[#8E8EA8] block mb-1">Usage Limit</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 = unlimited"
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-xs md:text-sm text-white bg-[#11111D] border border-white/[0.08] outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#8E8EA8] block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl text-xs text-white bg-[#11111D] border border-white/[0.08] outline-none focus:border-[#7C3AED]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#A1A1B5] hover:text-white bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#7C3AED] hover:bg-[#6D28D9] transition-all shadow-md active:scale-95"
                >
                  Create Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmModal
        isOpen={!!couponToDelete}
        title="Delete Coupon"
        message={`Are you sure you want to delete coupon code "${couponToDelete?.code}"? Customers will no longer be able to use it.`}
        confirmText="Delete"
        danger
        onCancel={() => setCouponToDelete(null)}
        onConfirm={async () => {
          if (couponToDelete) {
            await onDeleteCoupon(couponToDelete._id);
            setCouponToDelete(null);
          }
        }}
      />
    </div>
  );
};

export default CouponsTab;
