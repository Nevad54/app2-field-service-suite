import React, { useCallback, useEffect, useMemo, useState } from 'react';

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/+$/, '');
const apiUrl = (path) => `${API_BASE_URL}${path}`;

async function apiFetch(path, { token, method = 'GET', body } = {}) {
  const response = await fetch(apiUrl(path), {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data && data.error) || 'Request failed');
  }
  return data;
}

export default function EquipmentPage({ token }) {
  const [equipment, setEquipment] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [equipmentData, customersData] = await Promise.all([
        apiFetch('/api/equipment', { token }),
        apiFetch('/api/customers', { token })
      ]);
      setEquipment(equipmentData || []);
      setCustomers(customersData || []);
    } catch (e) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const types = useMemo(() => {
    const t = new Set(equipment.map(e => e.type).filter(Boolean));
    return Array.from(t).sort();
  }, [equipment]);

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : 'Unknown';
  };

  const filteredEquipment = useMemo(() => {
    let result = equipment;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(e =>
        e.name?.toLowerCase().includes(term) ||
        e.serial_number?.toLowerCase().includes(term) ||
        e.location?.toLowerCase().includes(term)
      );
    }
    if (filterStatus) {
      result = result.filter(e => e.status === filterStatus);
    }
    if (filterType) {
      result = result.filter(e => e.type === filterType);
    }
    return result;
  }, [equipment, searchTerm, filterStatus, filterType]);

  const [draft, setDraft] = useState({
    name: '',
    type: 'HVAC',
    customerId: '',
    location: '',
    serial_number: '',
    install_date: '',
    status: 'operational',
    notes: '',
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      if (editingId) {
        await apiFetch(`/api/equipment/${encodeURIComponent(editingId)}`, { token, method: 'PUT', body: draft });
      } else {
        await apiFetch('/api/equipment', { token, method: 'POST', body: draft });
      }
      setDraft({ name: '', type: 'HVAC', customerId: '', location: '', serial_number: '', install_date: '', status: 'operational', notes: '' });
      setShowForm(false);
      setEditingId(null);
      await fetchData();
    } catch (e) {
      setError(e.message || 'Failed to save equipment');
    }
  };

  const handleEdit = (item) => {
    setDraft({
      name: item.name,
      type: item.type || 'HVAC',
      customerId: item.customerId || '',
      location: item.location || '',
      serial_number: item.serial_number || '',
      install_date: item.install_date || '',
      status: item.status || 'operational',
      notes: item.notes || '',
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this equipment?')) return;
    setError('');
    try {
      await apiFetch(`/api/equipment/${encodeURIComponent(id)}`, { token, method: 'DELETE' });
      await fetchData();
    } catch (e) {
      setError(e.message || 'Failed to delete equipment');
    }
  };

  const cancelForm = () => {
    setDraft({ name: '', type: 'HVAC', customerId: '', location: '', serial_number: '', install_date: '', status: 'operational', notes: '' });
    setShowForm(false);
    setEditingId(null);
  };

  const operationalCount = equipment.filter(e => e.status === 'operational').length;
  const maintenanceCount = equipment.filter(e => e.status === 'needs_maintenance').length;

  const getStatusBadge = (status) => {
    const statusClass = status === 'operational' ? 'status-completed' : 
                       status === 'needs_maintenance' ? 'status-progress' : 'status-new';
    return <span className={`status-badge ${statusClass}`}>{status.replace('_', ' ')}</span>;
  };

  return (
    <section className="card">
      <div className="page-header">
        <h1>🔧 Equipment / Assets</h1>
        {!showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>+ Add Equipment</button>
        )}
      </div>

      {error ? <div className="form-error-box">{error}</div> : null}

      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <span className="stat-icon">🔧</span>
          <div className="stat-info">
            <span className="stat-value">{equipment.length}</span>
            <span className="stat-label">Total Equipment</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">✅</span>
          <div className="stat-info">
            <span className="stat-value">{operationalCount}</span>
            <span className="stat-label">Operational</span>
          </div>
        </div>
        <div className="stat-card" style={{ background: maintenanceCount > 0 ? 'var(--warning-light)' : 'var(--bg-secondary)' }}>
          <span className="stat-icon">⚠️</span>
          <div className="stat-info">
            <span className="stat-value">{maintenanceCount}</span>
            <span className="stat-label">Needs Maintenance</span>
          </div>
        </div>
      </div>

      {!showForm && (
        <div className="search-filter-bar">
          <input
            type="text"
            placeholder="🔍 Search by name, serial number, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            <option value="operational">Operational</option>
            <option value="needs_maintenance">Needs Maintenance</option>
            <option value="out_of_service">Out of Service</option>
          </select>
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="">All Types</option>
            {types.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={cancelForm}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? '✏️ Edit Equipment' : '➕ Add New Equipment'}</h2>
              <button className="modal-close" onClick={cancelForm}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Equipment Name *</label>
                    <input
                      value={draft.name}
                      onChange={(e) => setDraft(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter equipment name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Type</label>
                    <select
                      value={draft.type}
                      onChange={(e) => setDraft(prev => ({ ...prev, type: e.target.value }))}
                    >
                      <option value="HVAC">HVAC</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Plumbing">Plumbing</option>
                      <option value="Security">Security</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Customer</label>
                    <select
                      value={draft.customerId}
                      onChange={(e) => setDraft(prev => ({ ...prev, customerId: e.target.value }))}
                    >
                      <option value="">No Customer</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Location</label>
                    <input
                      value={draft.location}
                      onChange={(e) => setDraft(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Location"
                    />
                  </div>
                  <div className="form-group">
                    <label>Serial Number</label>
                    <input
                      value={draft.serial_number}
                      onChange={(e) => setDraft(prev => ({ ...prev, serial_number: e.target.value }))}
                      placeholder="Serial number"
                    />
                  </div>
                  <div className="form-group">
                    <label>Install Date</label>
                    <input
                      type="date"
                      value={draft.install_date}
                      onChange={(e) => setDraft(prev => ({ ...prev, install_date: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={draft.status}
                      onChange={(e) => setDraft(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="operational">Operational</option>
                      <option value="needs_maintenance">Needs Maintenance</option>
                      <option value="out_of_service">Out of Service</option>
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label>Notes</label>
                    <textarea
                      value={draft.notes}
                      onChange={(e) => setDraft(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes..."
                      rows={3}
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

      {loading ? <p className="loading">Loading equipment...</p> : null}
      {!loading && !equipment.length ? <p className="empty-state">No equipment. Add your first asset!</p> : null}
      {!loading && equipment.length > 0 && filteredEquipment.length === 0 ? (
        <p className="empty-state">No equipment matches your search.</p>
      ) : null}
      {!loading && filteredEquipment.length > 0 && (
        <div className="items-grid">
          {filteredEquipment.map((item) => (
            <article key={item.id} className="item-card">
              <div className="item-header">
                <h3>{item.name}</h3>
                <span className="item-id">{item.id}</span>
              </div>
              <div className="item-details">
                <p><strong>Type:</strong> {item.type}</p>
                <p><strong>Customer:</strong> {item.customerId ? getCustomerName(item.customerId) : 'N/A'}</p>
                <p><strong>Location:</strong> {item.location || 'N/A'}</p>
                <p><strong>Serial #:</strong> {item.serial_number || 'N/A'}</p>
                {item.install_date && <p><strong>Installed:</strong> {new Date(item.install_date).toLocaleDateString()}</p>}
                <p><strong>Status:</strong> {getStatusBadge(item.status)}</p>
                {item.notes && <p><strong>Notes:</strong> {item.notes}</p>}
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
