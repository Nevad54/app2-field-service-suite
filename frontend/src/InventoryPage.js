import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from './api';

export default function InventoryPage({ token }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/inventory', { token });
      setItems(data || []);
    } catch (e) {
      setError(e.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const categories = useMemo(() => {
    const cats = new Set(items.map(i => i.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = items;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(i =>
        i.name?.toLowerCase().includes(term) ||
        i.sku?.toLowerCase().includes(term) ||
        i.supplier?.toLowerCase().includes(term)
      );
    }
    if (filterCategory) {
      result = result.filter(i => i.category === filterCategory);
    }
    return result;
  }, [items, searchTerm, filterCategory]);

  const [draft, setDraft] = useState({
    name: '',
    sku: '',
    category: 'General',
    quantity: 0,
    unit_price: 0,
    reorder_level: 5,
    location: '',
    supplier: '',
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      if (editingId) {
        await apiFetch(`/api/inventory/${encodeURIComponent(editingId)}`, { token, method: 'PUT', body: draft });
      } else {
        await apiFetch('/api/inventory', { token, method: 'POST', body: draft });
      }
      setDraft({ name: '', sku: '', category: 'General', quantity: 0, unit_price: 0, reorder_level: 5, location: '', supplier: '' });
      setShowForm(false);
      setEditingId(null);
      await fetchItems();
    } catch (e) {
      setError(e.message || 'Failed to save item');
    }
  };

  const handleEdit = (item) => {
    setDraft({
      name: item.name,
      sku: item.sku || '',
      category: item.category || 'General',
      quantity: item.quantity || 0,
      unit_price: item.unit_price || 0,
      reorder_level: item.reorder_level || 5,
      location: item.location || '',
      supplier: item.supplier || '',
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    setError('');
    try {
      await apiFetch(`/api/inventory/${encodeURIComponent(id)}`, { token, method: 'DELETE' });
      await fetchItems();
    } catch (e) {
      setError(e.message || 'Failed to delete item');
    }
  };

  const cancelForm = () => {
    setDraft({ name: '', sku: '', category: 'General', quantity: 0, unit_price: 0, reorder_level: 5, location: '', supplier: '' });
    setShowForm(false);
    setEditingId(null);
  };

  const lowStockCount = items.filter(i => i.quantity <= i.reorder_level).length;
  const totalValue = items.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0);

  return (
    <section className="card">
      <div className="page-header">
        <h1>📦 Inventory / Parts</h1>
        {!showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>+ Add Part</button>
        )}
      </div>

      {error ? <div className="form-error-box">{error}</div> : null}

      <div className="stats-grid stats-section">
        <div className="stat-card">
          <span className="stat-icon">📦</span>
          <div className="stat-info">
            <span className="stat-value">{items.length}</span>
            <span className="stat-label">Total Items</span>
          </div>
        </div>
        <div className={`stat-card ${lowStockCount > 0 ? 'pending' : ''}`}>
          <span className="stat-icon">⚠️</span>
          <div className="stat-info">
            <span className="stat-value">{lowStockCount}</span>
            <span className="stat-label">Low Stock</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">💵</span>
          <div className="stat-info">
            <span className="stat-value">${totalValue.toFixed(2)}</span>
            <span className="stat-label">Total Value</span>
          </div>
        </div>
      </div>

      {!showForm && (
        <div className="search-filter-bar">
          <input
            type="text"
            placeholder="🔍 Search by name, SKU, or supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            aria-label="Search inventory"
          />
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="filter-select"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={cancelForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? '✏️ Edit Part' : '➕ Add New Part'}</h2>
              <button type="button" className="modal-close" onClick={cancelForm} aria-label="Close dialog">×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Part Name *</label>
                    <input
                      value={draft.name}
                      onChange={(e) => setDraft(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter part name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>SKU</label>
                    <input
                      value={draft.sku}
                      onChange={(e) => setDraft(prev => ({ ...prev, sku: e.target.value }))}
                      placeholder="SKU-12345"
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={draft.category}
                      onChange={(e) => setDraft(prev => ({ ...prev, category: e.target.value }))}
                    >
                      <option value="General">General</option>
                      <option value="Filters">Filters</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Plumbing">Plumbing</option>
                      <option value="HVAC">HVAC</option>
                      <option value="Refrigerant">Refrigerant</option>
                      <option value="Controls">Controls</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Quantity</label>
                    <input
                      type="number"
                      value={draft.quantity}
                      onChange={(e) => setDraft(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Unit Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={draft.unit_price}
                      onChange={(e) => setDraft(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Reorder Level</label>
                    <input
                      type="number"
                      value={draft.reorder_level}
                      onChange={(e) => setDraft(prev => ({ ...prev, reorder_level: parseInt(e.target.value) || 0 }))}
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Location</label>
                    <input
                      value={draft.location}
                      onChange={(e) => setDraft(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Warehouse A"
                    />
                  </div>
                  <div className="form-group">
                    <label>Supplier</label>
                    <input
                      value={draft.supplier}
                      onChange={(e) => setDraft(prev => ({ ...prev, supplier: e.target.value }))}
                      placeholder="Supplier name"
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Create'}</button>
                  <button type="button" className="btn-secondary" onClick={cancelForm}>Cancel</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <p className="loading">Loading inventory...</p> : null}
      {!loading && !items.length ? <p className="empty-state">No inventory items. Add your first part!</p> : null}
      {!loading && items.length > 0 && filteredItems.length === 0 ? (
        <p className="empty-state">No items match your search.</p>
      ) : null}
      {!loading && filteredItems.length > 0 && (
        <div className="items-grid">
          {filteredItems.map((item) => (
            <article key={item.id} className="item-card">
              <div className="item-header">
                <h3>{item.name}</h3>
                <span className="item-id">{item.id}</span>
              </div>
              <div className="item-details">
                {item.sku && <p><strong>SKU:</strong> {item.sku}</p>}
                <p><strong>Category:</strong> {item.category}</p>
                <p><strong>Quantity:</strong> {item.quantity}</p>
                <p className={item.quantity <= item.reorder_level ? 'low-stock' : ''}>
                  <strong>Status:</strong> {item.quantity <= item.reorder_level ? '⚠️ Low Stock' : '✅ In Stock'}
                </p>
                <p><strong>Unit Price:</strong> ${item.unit_price?.toFixed(2)}</p>
                <p><strong>Location:</strong> {item.location || 'N/A'}</p>
                {item.supplier && <p><strong>Supplier:</strong> {item.supplier}</p>}
              </div>
              <div className="item-actions">
                <button className="btn-secondary" onClick={() => handleEdit(item)}>✏️ Edit</button>
                <button className="btn-danger" onClick={() => handleDelete(item.id)}>🗑️ Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
