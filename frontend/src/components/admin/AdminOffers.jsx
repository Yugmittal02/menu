import React, { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaTimes, FaTag, FaSpinner, FaPercent } from 'react-icons/fa';
import { fetchAllOffers, createOffer, updateOffer, deleteOffer, toggleOffer } from '../../services/api';

const emptyForm = {
    title: '',
    description: '',
    discountType: 'flat',
    discountValue: '',
    code: '',
    minOrderValue: '',
    validFrom: '',
    validTo: '',
    isActive: true,
};

const AdminOffers = () => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    const loadOffers = useCallback(async () => {
        try {
            const { data } = await fetchAllOffers();
            setOffers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadOffers(); }, [loadOffers]);

    const resetForm = () => {
        setForm(emptyForm);
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (offer) => {
        setForm({
            title: offer.title || '',
            description: offer.description || '',
            discountType: offer.discountType || 'flat',
            discountValue: offer.discountValue || '',
            code: offer.code || '',
            minOrderValue: offer.minOrderValue || '',
            validFrom: offer.validFrom ? new Date(offer.validFrom).toISOString().split('T')[0] : '',
            validTo: offer.validTo ? new Date(offer.validTo).toISOString().split('T')[0] : '',
            isActive: offer.isActive,
        });
        setEditingId(offer._id);
        setShowForm(true);
    };

    const handleSubmit = async () => {
        if (!form.title.trim()) return;
        setSaving(true);
        try {
            const payload = {
                ...form,
                discountValue: Number(form.discountValue) || 0,
                minOrderValue: Number(form.minOrderValue) || 0,
                validFrom: form.validFrom || undefined,
                validTo: form.validTo || undefined,
            };
            if (editingId) {
                await updateOffer(editingId, payload);
            } else {
                await createOffer(payload);
            }
            await loadOffers();
            resetForm();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save offer');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this offer?')) return;
        try {
            await deleteOffer(id);
            await loadOffers();
        } catch (_) {
            alert('Failed to delete offer');
        }
    };

    const handleToggle = async (id) => {
        try {
            await toggleOffer(id);
            await loadOffers();
        } catch (_) {
            alert('Failed to toggle offer');
        }
    };

    const formatDate = (d) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <FaSpinner className="animate-spin mb-3" size={24} color="#C97B4B" />
                <p className="text-sm" style={{ color: '#A0998F' }}>Loading offers...</p>
            </div>
        );
    }

    return (
        <div className="px-4 py-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <FaTag size={16} color="#C97B4B" />
                    <h2 className="font-bold text-lg" style={{ color: '#1C1C1C' }}>Offers</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#FEF3E2', color: '#C97B4B' }}>
                        {offers.length}
                    </span>
                </div>
                <button onClick={() => { resetForm(); setShowForm(true); }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #C97B4B, #E8956A)' }}>
                    <FaPlus size={12} /> Add Offer
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="font-bold text-lg" style={{ color: '#1C1C1C' }}>
                                {editingId ? 'Edit Offer' : 'New Offer'}
                            </h3>
                            <button onClick={resetForm} className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 active:scale-90">
                                <FaTimes size={14} color="#666" />
                            </button>
                        </div>
                        <div className="p-4 space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 mb-1 block">Title *</label>
                                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    placeholder="e.g. 20% Off on Cakes"
                                    className="w-full px-3 py-2.5 rounded-xl text-sm bg-gray-50 border border-gray-200 outline-none focus:border-orange-400" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 mb-1 block">Description</label>
                                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    placeholder="Offer details..."
                                    rows={2} className="w-full px-3 py-2.5 rounded-xl text-sm bg-gray-50 border border-gray-200 outline-none focus:border-orange-400 resize-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Discount Type</label>
                                    <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}
                                        className="w-full px-3 py-2.5 rounded-xl text-sm bg-gray-50 border border-gray-200 outline-none focus:border-orange-400">
                                        <option value="flat">Flat (₹)</option>
                                        <option value="percentage">Percentage (%)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1 block">
                                        Discount Value {form.discountType === 'percentage' ? '(%)' : '(₹)'}
                                    </label>
                                    <input type="number" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                                        placeholder="0"
                                        className="w-full px-3 py-2.5 rounded-xl text-sm bg-gray-50 border border-gray-200 outline-none focus:border-orange-400" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Coupon Code</label>
                                    <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                                        placeholder="e.g. SAVE20"
                                        className="w-full px-3 py-2.5 rounded-xl text-sm bg-gray-50 border border-gray-200 outline-none focus:border-orange-400 uppercase" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Min Order (₹)</label>
                                    <input type="number" value={form.minOrderValue} onChange={e => setForm(f => ({ ...f, minOrderValue: e.target.value }))}
                                        placeholder="0"
                                        className="w-full px-3 py-2.5 rounded-xl text-sm bg-gray-50 border border-gray-200 outline-none focus:border-orange-400" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Valid From</label>
                                    <input type="date" value={form.validFrom} onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))}
                                        className="w-full px-3 py-2.5 rounded-xl text-sm bg-gray-50 border border-gray-200 outline-none focus:border-orange-400" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Valid To</label>
                                    <input type="date" value={form.validTo} onChange={e => setForm(f => ({ ...f, validTo: e.target.value }))}
                                        className="w-full px-3 py-2.5 rounded-xl text-sm bg-gray-50 border border-gray-200 outline-none focus:border-orange-400" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                                <button onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                                    className="flex items-center gap-2 text-sm font-medium">
                                    {form.isActive
                                        ? <FaToggleOn size={24} color="#22C55E" />
                                        : <FaToggleOff size={24} color="#D1D5DB" />}
                                    <span style={{ color: form.isActive ? '#22C55E' : '#9CA3AF' }}>
                                        {form.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-2 p-4 border-t border-gray-100">
                            <button onClick={resetForm}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600 active:scale-95 transition-all">
                                Cancel
                            </button>
                            <button onClick={handleSubmit} disabled={saving || !form.title.trim()}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white active:scale-95 transition-all disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg, #C97B4B, #E8956A)' }}>
                                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Offers List */}
            {offers.length === 0 ? (
                <div className="text-center py-16 rounded-2xl" style={{ background: 'white', border: '1px solid #F3F0EB' }}>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: '#FEF3E2' }}>
                        <span className="text-3xl">🏷️</span>
                    </div>
                    <p className="font-semibold text-sm" style={{ color: '#1C1C1C' }}>No offers yet</p>
                    <p className="text-xs mt-1 mb-4" style={{ color: '#A0998F' }}>Create your first offer to attract customers</p>
                    <button onClick={() => { resetForm(); setShowForm(true); }}
                        className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm active:scale-95 transition-all"
                        style={{ background: 'linear-gradient(135deg, #C97B4B, #E8956A)' }}>
                        <FaPlus size={10} className="inline mr-1" /> Create Offer
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {offers.map(offer => {
                        const isExpired = offer.validTo && new Date(offer.validTo) < new Date();
                        return (
                            <div key={offer._id} className="p-4 rounded-xl bg-white transition-all"
                                style={{ border: '1px solid #F3F0EB', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', opacity: isExpired ? 0.6 : 1 }}>
                                {/* Top row */}
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="font-bold text-sm" style={{ color: '#1C1C1C' }}>{offer.title}</h4>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${offer.isActive && !isExpired ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {isExpired ? 'EXPIRED' : offer.isActive ? 'ACTIVE' : 'INACTIVE'}
                                            </span>
                                        </div>
                                        {offer.description && (
                                            <p className="text-xs mt-0.5" style={{ color: '#A0998F' }}>{offer.description}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Details row */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: '#FEF3E2', color: '#C97B4B' }}>
                                        {offer.discountType === 'percentage' ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`}
                                    </span>
                                    {offer.code && (
                                        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700">
                                            {offer.code}
                                        </span>
                                    )}
                                    {offer.minOrderValue > 0 && (
                                        <span className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600">
                                            Min ₹{offer.minOrderValue}
                                        </span>
                                    )}
                                </div>

                                {/* Dates */}
                                <p className="text-[10px] mb-3" style={{ color: '#A0998F' }}>
                                    {formatDate(offer.validFrom)} → {formatDate(offer.validTo)}
                                </p>

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px dashed #F3F0EB' }}>
                                    <button onClick={() => handleToggle(offer._id)}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95"
                                        style={{ background: offer.isActive ? '#F0FDF4' : '#F9FAFB', color: offer.isActive ? '#22C55E' : '#9CA3AF' }}>
                                        {offer.isActive ? <FaToggleOn size={14} /> : <FaToggleOff size={14} />}
                                        {offer.isActive ? 'On' : 'Off'}
                                    </button>
                                    <button onClick={() => handleEdit(offer)}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 transition-all active:scale-95">
                                        <FaEdit size={11} /> Edit
                                    </button>
                                    <button onClick={() => handleDelete(offer._id)}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-500 transition-all active:scale-95 ml-auto">
                                        <FaTrash size={10} /> Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AdminOffers;
