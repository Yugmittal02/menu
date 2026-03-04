import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaImage } from 'react-icons/fa';
import { fetchCategories, createCategory, updateCategory, deleteCategory, uploadImage } from '../../services/api';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', image: '', icon: '📦',
    colorFrom: '#F97316', colorTo: '#FB923C',
    isActive: true, isQuickPick: false, sortOrder: 0
  });

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    try {
      const { data } = await fetchCategories();
      setCategories(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const resetForm = () => {
    setForm({ name: '', description: '', image: '', icon: '📦', colorFrom: '#F97316', colorTo: '#FB923C', isActive: true, isQuickPick: false, sortOrder: 0 });
    setEditing(null);
  };

  const openAdd = () => { resetForm(); setShowModal(true); };
  const openEdit = (cat) => {
    setEditing(cat);
    setForm({
      name: cat.name, description: cat.description || '', image: cat.image || '',
      icon: cat.icon || '📦', colorFrom: cat.colorFrom || '#F97316', colorTo: cat.colorTo || '#FB923C',
      isActive: cat.isActive, isQuickPick: cat.isQuickPick || false, sortOrder: cat.sortOrder || 0
    });
    setShowModal(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await uploadImage(formData);
      setForm(prev => ({ ...prev, image: data.url }));
    } catch (err) { alert('Image upload failed'); }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return alert('Category name is required');
    try {
      if (editing) {
        await updateCategory(editing._id, form);
      } else {
        await createCategory(form);
      }
      setShowModal(false);
      resetForm();
      loadCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete "${cat.name}"?\n\nThis will fail if products are still assigned to this category.`)) return;
    try {
      await deleteCategory(cat._id);
      loadCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleToggleActive = async (cat) => {
    try {
      await updateCategory(cat._id, { isActive: !cat.isActive });
      loadCategories();
    } catch (err) { alert('Failed to update'); }
  };

  if (loading) return (
    <div className="p-4 space-y-3">
      {[1,2,3].map(i => (
        <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: '#E8E3DB' }} />
      ))}
    </div>
  );

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-bold" style={{ color: '#1C1C1C' }}>Categories</h2>
          <p className="text-xs" style={{ color: '#A0998F' }}>{categories.length} categories</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm active:scale-[0.97]"
          style={{ background: 'linear-gradient(135deg, #C97B4B, #E8956A)', boxShadow: '0 4px 12px rgba(201,123,75,0.3)' }}>
          <FaPlus size={12} /> Add Category
        </button>
      </div>

      {/* Category Cards */}
      <div className="space-y-3">
        {categories.map(cat => (
          <div key={cat._id} className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: '#FFFFFF', border: '1px solid #E8E3DB', opacity: cat.isActive ? 1 : 0.6 }}>
            
            {/* Icon with gradient */}
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${cat.colorFrom}, ${cat.colorTo})` }}>
              {cat.icon || '📦'}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm truncate" style={{ color: '#1C1C1C' }}>{cat.name}</h3>
                {!cat.isActive && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: '#FEE2E2', color: '#DC2626' }}>Hidden</span>
                )}
                {cat.isQuickPick && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: '#DCFCE7', color: '#16A34A' }}>Quick</span>
                )}
              </div>
              <p className="text-xs mt-0.5" style={{ color: '#A0998F' }}>
                {cat.productCount || 0} products • Sort: {cat.sortOrder || 0}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={() => handleToggleActive(cat)}
                className="p-2 rounded-lg" style={{ color: cat.isActive ? '#16A34A' : '#A0998F' }}>
                {cat.isActive ? <FaToggleOn size={18} /> : <FaToggleOff size={18} />}
              </button>
              <button onClick={() => openEdit(cat)} className="p-2 rounded-lg" style={{ color: '#C97B4B' }}>
                <FaEdit size={14} />
              </button>
              <button onClick={() => handleDelete(cat)} className="p-2 rounded-lg" style={{ color: '#DC2626' }}>
                <FaTrash size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end justify-center"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 20px)' }}>
            
            <div className="sticky top-0 bg-white px-5 pt-5 pb-3 border-b" style={{ borderColor: '#E8E3DB' }}>
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3" />
              <h2 className="text-lg font-bold" style={{ color: '#1C1C1C' }}>
                {editing ? 'Edit Category' : 'Add Category'}
              </h2>
            </div>

            <div className="p-5 space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: '#7E7E7E' }}>Name *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium"
                  style={{ background: '#FAF7F2', border: '2px solid #E8E3DB', color: '#1C1C1C' }}
                  placeholder="e.g. Cake" />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: '#7E7E7E' }}>Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl text-sm resize-none"
                  style={{ background: '#FAF7F2', border: '2px solid #E8E3DB', color: '#1C1C1C' }}
                  rows={2} placeholder="Optional description" />
              </div>

              {/* Icon + Sort Order row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: '#7E7E7E' }}>Icon (emoji)</label>
                  <input value={form.icon} onChange={e => setForm({...form, icon: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl text-center text-2xl"
                    style={{ background: '#FAF7F2', border: '2px solid #E8E3DB' }} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: '#7E7E7E' }}>Sort Order</label>
                  <input type="number" value={form.sortOrder} onChange={e => setForm({...form, sortOrder: Number(e.target.value)})}
                    className="w-full px-4 py-3 rounded-xl text-sm"
                    style={{ background: '#FAF7F2', border: '2px solid #E8E3DB', color: '#1C1C1C' }} />
                </div>
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: '#7E7E7E' }}>Color From</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.colorFrom} onChange={e => setForm({...form, colorFrom: e.target.value})}
                      className="w-10 h-10 rounded-lg border-0 cursor-pointer" />
                    <input value={form.colorFrom} onChange={e => setForm({...form, colorFrom: e.target.value})}
                      className="flex-1 px-3 py-2.5 rounded-xl text-xs font-mono"
                      style={{ background: '#FAF7F2', border: '2px solid #E8E3DB' }} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: '#7E7E7E' }}>Color To</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.colorTo} onChange={e => setForm({...form, colorTo: e.target.value})}
                      className="w-10 h-10 rounded-lg border-0 cursor-pointer" />
                    <input value={form.colorTo} onChange={e => setForm({...form, colorTo: e.target.value})}
                      className="flex-1 px-3 py-2.5 rounded-xl text-xs font-mono"
                      style={{ background: '#FAF7F2', border: '2px solid #E8E3DB' }} />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: '#7E7E7E' }}>Preview</label>
                <div className="h-16 rounded-xl flex items-center justify-center gap-2"
                  style={{ background: `linear-gradient(135deg, ${form.colorFrom}, ${form.colorTo})` }}>
                  <span className="text-2xl">{form.icon}</span>
                  <span className="text-white font-bold">{form.name || 'Category'}</span>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: '#7E7E7E' }}>Image</label>
                {form.image && (
                  <img src={form.image} alt="" className="w-full h-32 object-cover rounded-xl mb-2" />
                )}
                <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer text-sm font-medium"
                  style={{ background: '#FAF7F2', border: '2px dashed #E8E3DB', color: '#7E7E7E' }}>
                  <FaImage /> {uploading ? 'Uploading...' : 'Upload Image'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
              </div>

              {/* Toggles */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive}
                    onChange={e => setForm({...form, isActive: e.target.checked})}
                    className="w-5 h-5 rounded" />
                  <span className="text-sm font-medium" style={{ color: '#1C1C1C' }}>Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isQuickPick}
                    onChange={e => setForm({...form, isQuickPick: e.target.checked})}
                    className="w-5 h-5 rounded" />
                  <span className="text-sm font-medium" style={{ color: '#1C1C1C' }}>Quick Pick</span>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <div className="sticky bottom-0 p-5 bg-white border-t" style={{ borderColor: '#E8E3DB' }}>
              <div className="flex gap-3">
                <button onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 py-3.5 rounded-xl font-bold text-sm"
                  style={{ background: '#FAF7F2', color: '#7E7E7E', border: '2px solid #E8E3DB' }}>
                  Cancel
                </button>
                <button onClick={handleSave}
                  className="flex-1 py-3.5 rounded-xl font-bold text-sm text-white active:scale-[0.97]"
                  style={{ background: 'linear-gradient(135deg, #C97B4B, #E8956A)', boxShadow: '0 4px 12px rgba(201,123,75,0.3)' }}>
                  {editing ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
