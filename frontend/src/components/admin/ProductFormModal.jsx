import React, { useState, useEffect } from 'react';
import { updateProduct, createProduct, fetchCategories as fetchCategoriesAPI } from '../../services/api';
import { FaTimes, FaCamera, FaPlus } from 'react-icons/fa';

const ProductFormModal = ({ product, onClose, onSave }) => {
    // Resolve category to its _id whether it's a string, ObjectId, or populated object
    const resolveCategory = (cat) => {
        if (!cat) return '';
        if (typeof cat === 'string') return cat;
        if (cat._id) return cat._id;
        return '';
    };

    const [form, setForm] = useState({
        name: product?.name || "",
        description: product?.description || "",
        category: resolveCategory(product?.category),
        basePrice: product?.basePrice || "",
        image: product?.image || "",
        sizes: product?.sizes || [],
        addons: product?.addons || [],
        isBestseller: product?.isBestseller || false,
    });
    const [newSize, setNewSize] = useState({ name: "", price: "" });
    const [newAddon, setNewAddon] = useState({ name: "", price: "" });
    const [uploading, setUploading] = useState(false);

    // Category state — fetched from API
    const [categories, setCategories] = useState([]);
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const { data } = await fetchCategoriesAPI();
                setCategories(data);
            } catch (err) {
                console.error('Failed to load categories:', err);
            }
        };
        loadCategories();
    }, []);

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
            alert("Failed to upload image.");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (product) {
                await updateProduct(product._id, form);
            } else {
                await createProduct(form);
            }
            onSave();
        } catch (err) {
            alert("Error saving product");
        }
    };

    const addSize = () => {
        if (newSize.name && newSize.price) {
            setForm({ ...form, sizes: [...form.sizes, { name: newSize.name, price: Number(newSize.price) }] });
            setNewSize({ name: "", price: "" });
        }
    };

    const addAddon = () => {
        if (newAddon.name && newAddon.price) {
            setForm({ ...form, addons: [...form.addons, { name: newAddon.name, price: Number(newAddon.price) }] });
            setNewAddon({ name: "", price: "" });
        }
    };

    const removeSize = (index) => setForm({ ...form, sizes: form.sizes.filter((_, i) => i !== index) });
    const removeAddon = (index) => setForm({ ...form, addons: form.addons.filter((_, i) => i !== index) });

    const selectCategory = (catId) => {
        setForm({ ...form, category: catId });
        setCategoryDropdownOpen(false);
    };

    // Find the selected category object for display
    const selectedCat = categories.find(c => c._id === form.category);

    const inputStyle = {
        background: '#FAF7F2',
        border: '2px solid #E8E3DB',
        color: '#1C1C1C',
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end justify-center">
            <div className="w-full max-w-lg rounded-t-3xl max-h-[92vh] overflow-hidden shadow-2xl animate-slide-up"
                style={{ background: '#FFFFFF' }}>
                {/* Header */}
                <div className="p-4 flex justify-between items-center sticky top-0 z-10"
                    style={{ background: '#FFFFFF', borderBottom: '2px solid #E8E3DB' }}>
                    <h3 className="text-lg font-bold" style={{ color: '#C97B4B' }}>
                        {product ? "✏️ Edit" : "➕ Add"} Product
                    </h3>
                    <button onClick={onClose}
                        className="w-9 h-9 rounded-full flex items-center justify-center"
                        style={{ background: '#FAF7F2', border: '2px solid #E8E3DB' }}>
                        <FaTimes size={14} style={{ color: '#7E7E7E' }} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4"
                    style={{ maxHeight: 'calc(92vh - 60px)', paddingBottom: '24px' }}>

                    {/* Image Upload */}
                    <div>
                        <p className="text-xs font-bold uppercase mb-2" style={{ color: '#8B7355' }}>Product Image</p>
                        <div className="flex gap-3 items-center">
                            {form.image ? (
                                <div className="w-20 h-20 rounded-2xl bg-cover bg-center overflow-hidden flex-shrink-0"
                                    style={{ backgroundImage: `url(${form.image})`, border: '3px solid #E8E3DB' }} />
                            ) : (
                                <div className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: '#FEF3E2', border: '3px dashed #C97B4B' }}>
                                    <FaCamera size={20} style={{ color: '#C97B4B' }} />
                                </div>
                            )}
                            <label className="flex-1">
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                <div className="w-full py-3 rounded-xl font-bold text-center text-sm cursor-pointer active:scale-95 transition-all"
                                    style={uploading
                                        ? { background: '#E8E3DB', color: '#7E7E7E' }
                                        : { background: 'linear-gradient(135deg, #C97B4B 0%, #E8956A 100%)', color: '#FFFFFF' }
                                    }>
                                    {uploading ? 'Uploading...' : form.image ? '📷 Change' : '📷 Upload Image'}
                                </div>
                            </label>
                        </div>
                        {form.image && (
                            <button type="button" onClick={() => setForm({ ...form, image: "" })}
                                className="text-xs font-medium mt-1" style={{ color: '#DC2626' }}>
                                Remove Image
                            </button>
                        )}
                    </div>

                    {/* Name */}
                    <div>
                        <p className="text-xs font-bold uppercase mb-1.5" style={{ color: '#8B7355' }}>Product Name</p>
                        <input
                            type="text" placeholder="e.g. Chocolate Truffle Cake" value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full rounded-xl p-3 text-sm outline-none"
                            style={inputStyle} required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <p className="text-xs font-bold uppercase mb-1.5" style={{ color: '#8B7355' }}>Description</p>
                        <input
                            type="text" placeholder="Rich chocolate layers with ganache..." value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="w-full rounded-xl p-3 text-sm outline-none"
                            style={inputStyle}
                        />
                    </div>

                    {/* Category Dropdown */}
                    <div className="relative">
                        <p className="text-xs font-bold uppercase mb-1.5" style={{ color: '#8B7355' }}>Category</p>

                        {/* Selected / Trigger */}
                        <button
                            type="button"
                            onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                            className="w-full rounded-xl p-3 text-sm outline-none text-left flex justify-between items-center"
                            style={inputStyle}
                        >
                            <span style={{ color: selectedCat ? '#1C1C1C' : '#A0998F' }}>
                                {selectedCat ? `${selectedCat.icon || ''} ${selectedCat.name}` : 'Select a category...'}
                            </span>
                            <span style={{ color: '#A0998F', transform: categoryDropdownOpen ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }}>▼</span>
                        </button>

                        {/* Dropdown */}
                        {categoryDropdownOpen && (
                            <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-xl overflow-hidden"
                                style={{ background: '#FFFFFF', border: '2px solid #E8E3DB', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                                <div className="max-h-48 overflow-y-auto">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat._id}
                                            type="button"
                                            onClick={() => selectCategory(cat._id)}
                                            className="w-full text-left px-4 py-3 text-sm font-medium transition-colors flex items-center justify-between"
                                            style={{
                                                color: form.category === cat._id ? '#C97B4B' : '#1C1C1C',
                                                background: form.category === cat._id ? '#FEF3E2' : 'transparent',
                                                borderBottom: '1px solid #F5F0E8'
                                            }}
                                        >
                                            <span>{cat.icon || '📦'} {cat.name}</span>
                                            {form.category === cat._id && <span style={{ color: '#C97B4B' }}>✓</span>}
                                        </button>
                                    ))}
                                    {categories.length === 0 && (
                                        <p className="px-4 py-3 text-xs" style={{ color: '#A0998F' }}>No categories yet. Create one in the Categories tab.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Price */}
                    <div>
                        <p className="text-xs font-bold uppercase mb-1.5" style={{ color: '#8B7355' }}>Base Price (₹)</p>
                        <input
                            type="number" placeholder="299" value={form.basePrice}
                            onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                            className="w-full rounded-xl p-3 text-sm outline-none"
                            style={inputStyle} required
                        />
                    </div>

                    {/* Bestseller Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-xl" style={{ ...inputStyle }}>
                        <div>
                            <p className="text-sm font-bold" style={{ color: '#1C1C1C' }}>⭐ Mark as Bestseller</p>
                            <p className="text-xs" style={{ color: '#A0998F' }}>Show in Bestsellers section on homepage</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setForm({ ...form, isBestseller: !form.isBestseller })}
                            className={`relative w-12 h-7 rounded-full transition-colors ${form.isBestseller ? 'bg-orange-500' : 'bg-gray-300'}`}
                        >
                            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${form.isBestseller ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
                        </button>
                    </div>

                    {/* Sizes */}
                    <div>
                        <p className="text-xs font-bold uppercase mb-1.5" style={{ color: '#8B7355' }}>Sizes</p>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {form.sizes.map((s, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1"
                                    style={{ background: '#FEF3E2', color: '#C97B4B', border: '1px solid #E8E3DB' }}>
                                    {s.name}: ₹{s.price}
                                    <button type="button" onClick={() => removeSize(i)} className="ml-1 hover:text-red-500">×</button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input placeholder="Size name" value={newSize.name}
                                onChange={(e) => setNewSize({ ...newSize, name: e.target.value })}
                                className="flex-1 rounded-xl p-2.5 text-sm outline-none" style={inputStyle} />
                            <input type="number" placeholder="₹" value={newSize.price}
                                onChange={(e) => setNewSize({ ...newSize, price: e.target.value })}
                                className="w-16 rounded-xl p-2.5 text-sm outline-none" style={inputStyle} />
                            <button type="button" onClick={addSize}
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                                style={{ background: '#C97B4B' }}>
                                <FaPlus size={12} />
                            </button>
                        </div>
                    </div>

                    {/* Add-ons */}
                    <div>
                        <p className="text-xs font-bold uppercase mb-1.5" style={{ color: '#8B7355' }}>Add-ons</p>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {form.addons.map((a, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1"
                                    style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #DBEAFE' }}>
                                    {a.name}: ₹{a.price}
                                    <button type="button" onClick={() => removeAddon(i)} className="ml-1 hover:text-red-500">×</button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input placeholder="Add-on name" value={newAddon.name}
                                onChange={(e) => setNewAddon({ ...newAddon, name: e.target.value })}
                                className="flex-1 rounded-xl p-2.5 text-sm outline-none" style={inputStyle} />
                            <input type="number" placeholder="₹" value={newAddon.price}
                                onChange={(e) => setNewAddon({ ...newAddon, price: e.target.value })}
                                className="w-16 rounded-xl p-2.5 text-sm outline-none" style={inputStyle} />
                            <button type="button" onClick={addAddon}
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                                style={{ background: '#2563EB' }}>
                                <FaPlus size={12} />
                            </button>
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-3 pt-3">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-3.5 rounded-xl font-bold text-sm active:scale-95 transition-transform"
                            style={{ background: '#FAF7F2', color: '#7E7E7E', border: '2px solid #E8E3DB' }}>
                            Cancel
                        </button>
                        <button type="submit"
                            className="flex-1 py-3.5 rounded-xl font-bold text-sm text-white active:scale-95 transition-transform"
                            style={{ background: 'linear-gradient(135deg, #C97B4B 0%, #E8956A 100%)', boxShadow: '0 4px 16px rgba(201, 123, 75, 0.3)' }}>
                            {product ? '💾 Update' : '✨ Add Product'}
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

export default ProductFormModal;
