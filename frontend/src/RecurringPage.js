import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from './api';

export default function RecurringPage({ token }) {
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [draft, setDraft] = useState({
    customerId: '',
    title: '',
    description: '',
    frequency: 'monthly',
    interval_value: 1,
    interval_unit: 'months',
    start_date: '',
    end_date: '',
    status: 'active',
    assignedTo: '',
    category: 'maintenance',
    priority: 'medium',
    estimated_duration_hours: 1,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [recurringData, customersData] = await Promise.all([
        apiFetch('/api/recurring', { token }),
        apiFetch('/api/customers', { token }),
      ]);
      setItems(Array.isArray(recurringData) ? recurringData : []);
      setCustomers(Array.isArray(customersData) ? customersData : []);
    } catch (e) {
      setError(e.message || 'Failed to load recurring maintenance data');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const customerName = useCallback((customerId) => {
    const match = customers.find((c) => c.id === customerId);
    return match ? match.name : customerId || 'Unknown';
  }, [customers]);

  const filteredItems = useMemo(() => {
    let result = items;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((item) =>
        item.id?.toLowerCase().includes(term) ||
        item.title?.toLowerCase().includes(term) ||
        customerName(item.customerId)?.toLowerCase().includes(term)
      );
    }
    if (statusFilter) {
      result = result.filter((item) => item.status === statusFilter);
    }
    return result;
  }, [items, searchTerm, statusFilter, customerName]);

  const resetDraft = () => {
    setDraft({
      customerId: '',
      title: '',
      description: '',
      frequency: 'monthly',
      interval_value: 1,
      interval_unit: 'months',
      start_date: '',
      end_date: '',
      status: 'active',
      assignedTo: '',
      category: 'maintenance',
      priority: 'medium',
      estimated_duration_hours: 1,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    try {
      const payload = {
        ...draft,
        interval_value: Number(draft.interval_value || 1),
        estimated_duration_hours: Number(draft.estimated_duration_hours || 1),
      };
      if (editingId) {
        await apiFetch(`/api/recurring/${encodeURIComponent(editingId)}`, {
          token,
          method: 'PUT',
          body: payload,
        });
        setSuccess('Recurring maintenance updated.');
      } else {
        await apiFetch('/api/recurring', {
          token,
          method: 'POST',
          body: payload,
        });
        setSuccess('Recurring maintenance created.');
      }
      resetDraft();
      await fetchData();
    } catch (e) {
      setError(e.message || 'Failed to save recurring maintenance');
    }
  };

  const handleEdit = (item) => {
    setDraft({
      customerId: item.customerId || '',
      title: item.title || '',
      description: item.description || '',
      frequency: item.frequency || 'monthly',
      interval_value: Number(item.interval_value || 1),
      interval_unit: item.interval_unit || 'months',
      start_date: item.start_date || '',
      end_date: item.end_date || '',
      status: item.status || 'active',
      assignedTo: item.assignedTo || '',
      category: item.category || 'maintenance',
      priority: item.priority || 'medium',
      estimated_duration_hours: Number(item.estimated_duration_hours || 1),
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this recurring maintenance plan?')) return;
    setError('');
    setSuccess('');
    try {
      await apiFetch(`/api/recurring/${encodeURIComponent(id)}`, { token, method: 'DELETE' });
      setSuccess('Recurring maintenance deleted.');
      await fetchData();
    } catch (e) {
      setError(e.message || 'Failed to delete recurring maintenance');
    }
  };

  const handleQuickStatus = async (item, status) => {
    setError('');
    setSuccess('');
    try {
      await apiFetch(`/api/recurring/${encodeURIComponent(item.id)}`, {
        token,
        method: 'PUT',
        body: { status },
      });
      setSuccess(`Recurring maintenance marked ${status}.`);
      await fetchData();
    } catch (e) {
      setError(e.message || 'Failed to update recurring maintenance status');
    }
  };

  const activeCount = items.filter((item) => item.status === 'active').length;
  const pausedCount = items.filter((item) => item.status === 'paused').length;

  return (
    <section className="card">
      <div className="page-header">
        <h1>Recurring Maintenance</h1>
        {!showForm ? (
          <button type="button" className="btn-primary" onClick={() => setShowForm(true)}>
            + Add Plan
          </button>
        ) : null}
      </div>

      {error ? <div className="form-error-box">{error}</div> : null}
      {success ? <div className="form-success-box">{success}</div> : null}

      <div className="stats-grid stats-section">
        <div className="stat-card">
          <span className="stat-icon">R</span>
          <div className="stat-info">
            <span className="stat-value">{items.length}</span>
            <span className="stat-label">Total Plans</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">A</span>
          <div className="stat-info">
            <span className="stat-value">{activeCount}</span>
            <span className="stat-label">Active</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">P</span>
          <div className="stat-info">
            <span className="stat-value">{pausedCount}</span>
            <span className="stat-label">Paused</span>
          </div>
        </div>
      </div>

      {!showForm ? (
        <div className="search-filter-bar">
          <input
            type="text"
            className="search-input"
            placeholder="Search by plan id, title, or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search recurring plans"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="ended">Ended</option>
          </select>
        </div>
      ) : null}

      {showForm ? (
        <div className="modal-backdrop" onClick={resetDraft}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Recurring Plan' : 'Add Recurring Plan'}</h2>
              <button type="button" className="modal-close" onClick={resetDraft} aria-label="Close dialog">×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Customer *</label>
                    <select value={draft.customerId} onChange={(e) => setDraft((prev) => ({ ...prev, customerId: e.target.value }))} required>
                      <option value="">Select customer</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>{customer.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Plan Title *</label>
                    <input value={draft.title} onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>Frequency *</label>
                    <select value={draft.frequency} onChange={(e) => setDraft((prev) => ({ ...prev, frequency: e.target.value }))} required>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Every</label>
                    <div className="inline-input-group">
                      <input type="number" min="1" value={draft.interval_value} onChange={(e) => setDraft((prev) => ({ ...prev, interval_value: e.target.value }))} />
                      <select value={draft.interval_unit} onChange={(e) => setDraft((prev) => ({ ...prev, interval_unit: e.target.value }))}>
                        <option value="weeks">Weeks</option>
                        <option value="months">Months</option>
                        <option value="years">Years</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Priority</label>
                    <select value={draft.priority} onChange={(e) => setDraft((prev) => ({ ...prev, priority: e.target.value }))}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Est. Hours</label>
                    <input type="number" min="1" value={draft.estimated_duration_hours} onChange={(e) => setDraft((prev) => ({ ...prev, estimated_duration_hours: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Start Date</label>
                    <input type="date" value={draft.start_date} onChange={(e) => setDraft((prev) => ({ ...prev, start_date: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>End Date</label>
                    <input type="date" value={draft.end_date} onChange={(e) => setDraft((prev) => ({ ...prev, end_date: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <input value={draft.category} onChange={(e) => setDraft((prev) => ({ ...prev, category: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Assigned To</label>
                    <input value={draft.assignedTo} onChange={(e) => setDraft((prev) => ({ ...prev, assignedTo: e.target.value }))} placeholder="technician username" />
                  </div>
                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea rows={3} value={draft.description} onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={resetDraft}>Cancel</button>
                <button type="submit" className="btn-primary">{editingId ? 'Save Changes' : 'Create Plan'}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {loading ? (
        <p>Loading recurring plans...</p>
      ) : (
        <div className="items-grid">
          {filteredItems.length === 0 ? (
            <p className="empty-state">No recurring plans found.</p>
          ) : filteredItems.map((item) => (
            <article key={item.id} className="item-card">
              <h3>{item.title}</h3>
              <div className="item-details">
                <p><strong>ID:</strong> {item.id}</p>
                <p><strong>Customer:</strong> {customerName(item.customerId)}</p>
                <p><strong>Frequency:</strong> {item.frequency} ({item.interval_value} {item.interval_unit})</p>
                <p><strong>Status:</strong> {item.status}</p>
                <p><strong>Priority:</strong> {item.priority}</p>
                <p><strong>Est. Hours:</strong> {item.estimated_duration_hours}</p>
                {item.start_date ? <p><strong>Start:</strong> {item.start_date}</p> : null}
                {item.end_date ? <p><strong>End:</strong> {item.end_date}</p> : null}
                {item.description ? <p className="notes">{item.description}</p> : null}
              </div>
              <div className="item-actions">
                <button type="button" className="btn-secondary" onClick={() => handleEdit(item)}>Edit</button>
                {item.status === 'active' ? (
                  <button type="button" className="btn-secondary" onClick={() => handleQuickStatus(item, 'paused')}>Pause</button>
                ) : (
                  <button type="button" className="btn-success" onClick={() => handleQuickStatus(item, 'active')}>Activate</button>
                )}
                <button type="button" className="btn-danger" onClick={() => handleDelete(item.id)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
