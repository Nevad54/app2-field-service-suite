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

export default function QuotesPage({ token }) {
  const [quotes, setQuotes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [quotesData, customersData] = await Promise.all([
        apiFetch('/api/quotes', { token }),
        apiFetch('/api/customers', { token })
      ]);
      setQuotes(quotesData || []);
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

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : 'Unknown';
  };

  const filteredQuotes = useMemo(() => {
    let result = quotes;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(q =>
        q.title?.toLowerCase().includes(term) ||
        q.id?.toLowerCase().includes(term)
      );
    }
    if (filterStatus) {
      result = result.filter(q => q.status === filterStatus);
    }
    return result;
  }, [quotes, searchTerm, filterStatus]);

  const [draft, setDraft] = useState({
    customerId: '',
    title: '',
    description: '',
    total_amount: 0,
    valid_until: '',
    items: [{ description: '', quantity: 1, unit_price: 0 }],
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const total = draft.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const quoteData = {
        ...draft,
        total_amount: total
      };
      
      if (editingId) {
        await apiFetch(`/api/quotes/${encodeURIComponent(editingId)}`, { token, method: 'PUT', body: quoteData });
      } else {
        await apiFetch('/api/quotes', { token, method: 'POST', body: quoteData });
      }
      setDraft({ customerId: '', title: '', description: '', total_amount: 0, valid_until: '', items: [{ description: '', quantity: 1, unit_price: 0 }] });
      setShowForm(false);
      setEditingId(null);
      await fetchData();
    } catch (e) {
      setError(e.message || 'Failed to save quote');
    }
  };

  const handleEdit = (quote) => {
    setDraft({
      customerId: quote.customerId,
      title: quote.title,
      description: quote.description || '',
      total_amount: quote.total_amount,
      valid_until: quote.valid_until || '',
      items: quote.items && quote.items.length > 0 ? quote.items : [{ description: '', quantity: 1, unit_price: 0 }],
    });
    setEditingId(quote.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this quote?')) return;
    setError('');
    try {
      await apiFetch(`/api/quotes/${encodeURIComponent(id)}`, { token, method: 'DELETE' });
      await fetchData();
    } catch (e) {
      setError(e.message || 'Failed to delete quote');
    }
  };

  const handleAccept = async (id) => {
    setError('');
    setSuccess('');
    try {
      await apiFetch(`/api/quotes/${encodeURIComponent(id)}/accept`, { token, method: 'POST' });
      setSuccess('Quote accepted successfully!');
      await fetchData();
    } catch (e) {
      setError(e.message || 'Failed to accept quote');
    }
  };

  const handleReject = async (id) => {
    setError('');
    try {
      await apiFetch(`/api/quotes/${encodeURIComponent(id)}/reject`, { token, method: 'POST' });
      await fetchData();
    } catch (e) {
      setError(e.message || 'Failed to reject quote');
    }
  };

  const handleConvertToJob = async (quote) => {
    const scheduledDate = prompt('Enter scheduled date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!scheduledDate) return;
    
    setError('');
    try {
      await apiFetch(`/api/quotes/${encodeURIComponent(quote.id)}/convert`, { 
        token, 
        method: 'POST', 
        body: { scheduledDate } 
      });
      setSuccess('Quote converted to job successfully!');
      await fetchData();
    } catch (e) {
      setError(e.message || 'Failed to convert quote to job');
    }
  };

  const addItem = () => {
    setDraft(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unit_price: 0 }]
    }));
  };

  const removeItem = (index) => {
    setDraft(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index, field, value) => {
    setDraft(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const calculateTotal = () => {
    return draft.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const cancelForm = () => {
    setDraft({ customerId: '', title: '', description: '', total_amount: 0, valid_until: '', items: [{ description: '', quantity: 1, unit_price: 0 }] });
    setShowForm(false);
    setEditingId(null);
  };

  const pendingCount = quotes.filter(q => q.status === 'pending').length;
  const acceptedCount = quotes.filter(q => q.status === 'accepted').length;
  const totalValue = quotes.reduce((sum, q) => sum + (q.total_amount || 0), 0);

  const getStatusBadge = (status) => {
    const statusClass = status === 'accepted' ? 'status-completed' : 
                       status === 'pending' ? 'status-progress' : 
                       status === 'rejected' ? 'status-new' : 'status-new';
    return <span className={`status-badge ${statusClass}`}>{status}</span>;
  };

  return (
    <section className="card">
      <div className="page-header">
        <h1>📝 Quotes / Estimates</h1>
        {!showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>+ Create Quote</button>
        )}
      </div>

      {error ? <div className="form-error-box">{error}</div> : null}
      {success ? <div className="form-success-box">{success}</div> : null}

      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <span className="stat-icon">📝</span>
          <div className="stat-info">
            <span className="stat-value">{quotes.length}</span>
            <span className="stat-label">Total Quotes</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⏳</span>
          <div className="stat-info">
            <span className="stat-value">{pendingCount}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">✅</span>
          <div className="stat-info">
            <span className="stat-value">{acceptedCount}</span>
            <span className="stat-label">Accepted</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">💰</span>
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
            placeholder="🔍 Search quotes..."
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
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={cancelForm}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? '✏️ Edit Quote' : '➕ Create Quote'}</h2>
              <button className="modal-close" onClick={cancelForm}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Customer *</label>
                    <select
                      value={draft.customerId}
                      onChange={(e) => setDraft(prev => ({ ...prev, customerId: e.target.value }))}
                      required
                    >
                      <option value="">Select Customer</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Title *</label>
                    <input
                      value={draft.title}
                      onChange={(e) => setDraft(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Quote title"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Valid Until</label>
                    <input
                      type="date"
                      value={draft.valid_until}
                      onChange={(e) => setDraft(prev => ({ ...prev, valid_until: e.target.value }))}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea
                      value={draft.description}
                      onChange={(e) => setDraft(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Quote description"
                      rows={2}
                    />
                  </div>
                </div>

                <h3 style={{ marginTop: '20px', marginBottom: '15px' }}>Line Items</h3>
                <div className="line-items-table">
                  <div className="line-items-header">
                    <span style={{ flex: 3 }}>Description</span>
                    <span style={{ flex: 1 }}>Qty</span>
                    <span style={{ flex: 1 }}>Unit Price</span>
                    <span style={{ flex: 1 }}>Total</span>
                    <span style={{ width: '40px' }}></span>
                  </div>
                  {draft.items.map((item, index) => (
                    <div key={index} className="line-item-row">
                      <input
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="Service description"
                      />
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        min="1"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        min="0"
                      />
                      <input
                        value={'$' + (item.quantity * item.unit_price).toFixed(2)}
                        disabled
                      />
                      <button 
                        type="button" 
                        className="btn-danger btn-sm" 
                        onClick={() => removeItem(index)}
                        disabled={draft.items.length === 1}
                        title="Remove item"
                      >×</button>
                    </div>
                  ))}
                  <div className="line-items-footer">
                    <span className="text-right"><strong>Total:</strong></span>
                    <span className="text-right"><strong>${calculateTotal().toFixed(2)}</strong></span>
                  </div>
                </div>

                <button type="button" className="btn-secondary" onClick={addItem} style={{ marginTop: '10px', marginBottom: '20px' }}>+ Add Line Item</button>

                <div className="form-actions">
                  <button type="submit" className="btn-primary">{editingId ? 'Update Quote' : 'Create Quote'}</button>
                  <button type="button" className="btn-secondary" onClick={cancelForm}>Cancel</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <p className="loading">Loading quotes...</p> : null}
      {!loading && !quotes.length ? <p className="empty-state">No quotes yet. Create your first quote!</p> : null}
      {!loading && quotes.length > 0 && filteredQuotes.length === 0 ? (
        <p className="empty-state">No quotes match your search.</p>
      ) : null}
      {!loading && filteredQuotes.length > 0 && (
        <div className="invoices-list">
          {filteredQuotes.map((quote) => (
            <div key={quote.id} className={`invoice-card ${quote.status}`}>
              <div className="invoice-header">
                <div>
                  <h3>{quote.id}</h3>
                  {getStatusBadge(quote.status)}
                </div>
                <div className="invoice-amount">${quote.total_amount?.toFixed(2) || '0.00'}</div>
              </div>
              <div className="invoice-details">
                <p><strong>Customer:</strong> {getCustomerName(quote.customerId)}</p>
                <p><strong>Title:</strong> {quote.title}</p>
                {quote.description && <p><strong>Description:</strong> {quote.description}</p>}
                <p><strong>Created:</strong> {new Date(quote.created_at).toLocaleDateString()}</p>
                {quote.valid_until && <p><strong>Valid Until:</strong> {new Date(quote.valid_until).toLocaleDateString()}</p>}
                {quote.jobId && <p><strong>Job Created:</strong> {quote.jobId}</p>}
              </div>
              <div className="invoice-actions">
                {quote.status === 'pending' && (
                  <>
                    <button className="btn-success" onClick={() => handleAccept(quote.id)}>✓ Accept</button>
                    <button className="btn-danger" onClick={() => handleReject(quote.id)}>✕ Reject</button>
                  </>
                )}
                {quote.status === 'accepted' && !quote.jobId && (
                  <button className="btn-primary" onClick={() => handleConvertToJob(quote)}>📋 Create Job</button>
                )}
                <button className="btn-secondary" onClick={() => handleEdit(quote)}>✏️ Edit</button>
                <button className="btn-danger" onClick={() => handleDelete(quote.id)}>🗑️ Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
