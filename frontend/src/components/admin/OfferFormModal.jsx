import React, { useState } from 'react';
import { createOffer, updateOffer } from '../../services/api';

const OfferFormModal = ({ offer, onClose, onSave }) => {
    const isEditing = !!offer;
    const [form, setForm] = useState({
        title: offer?.title || "",
        description: offer?.description || "",
        discountType: offer?.discountType || "percentage",
        discountValue: offer?.discountValue || "",
        maxDiscount: offer?.maxDiscount || "",
        code: offer?.code || "",
        validFrom: offer?.validFrom ? new Date(offer.validFrom).toISOString().split('T')[0] : "",
        validTo: offer?.validTo ? new Date(offer.validTo).toISOString().split('T')[0] : "",
        minOrderValue: offer?.minOrderValue || 0,
        maxUsageCount: offer?.maxUsageCount || "",
        isActive: offer?.isActive !== undefined ? offer.isActive : true,
        image: offer?.image || "",
    });
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("image", file);

            const { uploadImage } = await import("../../services/api");
            const { data } = await uploadImage(formData);

            setForm({ ...form, image: data.url });
        } catch (err) {
            console.error("Upload error:", err);
            alert("Failed to upload image. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...form,
                discountValue: Number(form.discountValue),
                minOrderValue: Number(form.minOrderValue) || 0,
                maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
                maxUsageCount: form.maxUsageCount ? Number(form.maxUsageCount) : null,
            };
            if (isEditing) {
                await updateOffer(offer._id, payload);
            } else {
                await createOffer(payload);
            }
            onSave();
        } catch (err) {
            alert(isEditing ? "Error updating offer" : "Error creating offer");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center">
            <div className="bg-white w-full rounded-t-3xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto" style={{ paddingBottom: '100px' }}>
                <div className="p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h3 className="text-xl font-bold text-gray-800">{isEditing ? 'Edit Offer' : 'Create Offer'}</h3>
                    <button onClick={onClose} className="text-gray-400 text-2xl">
                        &times;
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <input
                        type="text"
                        placeholder="Offer Title (e.g. Summer Sale)"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-base"
                        required
                    />
                    <textarea
                        placeholder="Description / Subtitle"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-base resize-none"
                        rows="2"
                    />

                    {/* Image Upload for Offer */}
                    <div>
                        <p className="text-sm font-bold text-gray-700 mb-2">
                            Ad Banner Image
                        </p>
                        <div className="flex gap-3 items-center">
                            {form.image ? (
                                <div
                                    className="w-full h-32 rounded-xl bg-cover bg-center border-2 border-gray-200"
                                    style={{ backgroundImage: `url(${form.image})` }}
                                ></div>
                            ) : (
                                <div className="w-full h-32 rounded-xl bg-gray-100 flex items-center justify-center text-3xl border-2 border-dashed border-gray-300">
                                    📢
                                </div>
                            )}
                        </div>
                        <label className="block mt-2">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                            <div
                                className={`w-full py-3 rounded-xl font-bold text-center cursor-pointer transition-all active:scale-95 ${uploading
                                    ? "bg-gray-200 text-gray-500"
                                    : "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-200"
                                    }`}
                            >
                                {uploading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"></div>
                                        Uploading...
                                    </span>
                                ) : form.image ? (
                                    "📸 Change Ad Image"
                                ) : (
                                    "📸 Upload Ad Image"
                                )}
                            </div>
                        </label>
                        {form.image && (
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, image: "" })}
                                className="text-red-500 text-sm font-medium mt-2 w-full text-center"
                            >
                                Remove Image
                            </button>
                        )}
                    </div>

                    {/* Discount Type + Value */}
                    <div className="grid grid-cols-2 gap-3">
                        <select
                            value={form.discountType}
                            onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-base"
                        >
                            <option value="percentage">Percentage (%)</option>
                            <option value="flat">Flat Amount (₹)</option>
                        </select>
                        <input
                            type="number"
                            placeholder="Value"
                            value={form.discountValue}
                            onChange={(e) =>
                                setForm({ ...form, discountValue: e.target.value })
                            }
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-base"
                            required
                        />
                    </div>

                    {/* Max Discount Cap (only for percentage) */}
                    {form.discountType === 'percentage' && (
                        <div>
                            <label className="text-xs text-gray-500 ml-1 mb-1 block">Max Discount Cap (₹)</label>
                            <input
                                type="number"
                                placeholder="e.g. 200 (leave empty for no cap)"
                                value={form.maxDiscount}
                                onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-base"
                            />
                        </div>
                    )}

                    <input
                        type="text"
                        placeholder="Coupon Code (e.g. SAVE20)"
                        value={form.code}
                        onChange={(e) =>
                            setForm({ ...form, code: e.target.value.toUpperCase() })
                        }
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 uppercase text-base"
                        required
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-gray-500 ml-1 mb-1 block">Valid From</label>
                            <input
                                type="date"
                                value={form.validFrom}
                                onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-base"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 ml-1 mb-1 block">Valid Until</label>
                            <input
                                type="date"
                                value={form.validTo}
                                onChange={(e) => setForm({ ...form, validTo: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-base"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-gray-500 ml-1 mb-1 block">Min Order (₹)</label>
                            <input
                                type="number"
                                placeholder="Min Order"
                                value={form.minOrderValue}
                                onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-base"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 ml-1 mb-1 block">Usage Limit</label>
                            <input
                                type="number"
                                placeholder="Unlimited"
                                value={form.maxUsageCount}
                                onChange={(e) => setForm({ ...form, maxUsageCount: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-base"
                            />
                        </div>
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3.5 border border-gray-200">
                        <span className="text-sm font-bold text-gray-700">Active</span>
                        <button
                            type="button"
                            onClick={() => setForm({ ...form, isActive: !form.isActive })}
                            className={`relative w-12 h-7 rounded-full transition-colors ${form.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                        >
                            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
                        </button>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 border-2 border-gray-200 rounded-xl font-bold text-gray-600"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-200 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : isEditing ? 'Update Offer' : 'Create Offer'}
                        </button>
                    </div>
                </form>
                <style>{`
            @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
            .animate-slide-up { animation: slide-up 0.3s ease-out; }
        `}</style>
            </div>
        </div>
    );
};

export default OfferFormModal;
