import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import ProjectsPage from './ProjectsPage';
import ProjectPlanner from './ProjectPlanner';
import TeamPage from './TeamPage';
import InventoryPage from './InventoryPage';
import EquipmentPage from './EquipmentPage';
import QuotesPage from './QuotesPage';

const AUTH_STORAGE_KEY = 'app2_auth';
const CLIENT_AUTH_STORAGE_KEY = 'app2_client_auth';
const DARK_MODE_KEY = 'app2_dark_mode';
const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/+$/, '');
const apiUrl = (path) => `${API_BASE_URL}${path}`;

const loadStoredDarkMode = () => {
  try {
    const raw = localStorage.getItem(DARK_MODE_KEY);
    return raw === 'true';
  } catch (e) {
    return false;
  }
};

const toAuthHeader = (token) => (token ? { Authorization: `Bearer ${token}` } : {});

const loadStoredAuth = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.token || !parsed.user) return null;
    return parsed;
  } catch (e) {
    return null;
  }
};

const loadStoredClientAuth = () => {
  try {
    const raw = localStorage.getItem(CLIENT_AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.token || !parsed.user) return null;
    return parsed;
  } catch (e) {
    return null;
  }
};

async function apiFetch(path, { token, method = 'GET', body } = {}) {
  const response = await fetch(apiUrl(path), {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...toAuthHeader(token),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data && data.error) || 'Request failed');
  }
  return data;
}

// ============== HOME PAGE ==============
function HomePage() {
  return (
    <section className="card schedule-page">
      <div className="hero-section">
        <h1>Field Service Suite</h1>
        <p className="hero-subtitle">Dispatch jobs, track technicians, and manage service requests from one workspace.</p>
      </div>
      <div className="features-grid">
        <div className="feature-item">
          <div className="feature-icon">📅</div>
          <h3>Scheduling</h3>
          <p>Schedule jobs with calendar view</p>
        </div>
        <div className="feature-item">
          <div className="feature-icon">👥</div>
          <h3>Customers</h3>
          <p>Manage customer database</p>
        </div>
        <div className="feature-item">
          <div className="feature-icon">📊</div>
          <h3>Reports</h3>
          <p>Export data to CSV</p>
        </div>
        <div className="feature-item">
          <div className="feature-icon">📱</div>
          <h3>Mobile</h3>
          <p>Technician check-in/out</p>
        </div>
        <div className="feature-item">
          <div className="feature-icon">📄</div>
          <h3>Invoices</h3>
          <p>Generate and manage invoices</p>
        </div>
        <div className="feature-item">
          <div className="feature-icon">📸</div>
          <h3>Photos</h3>
          <p>Attach photos to jobs</p>
        </div>
        <div className="feature-item">
          <div className="feature-icon">🔍</div>
          <h3>Search</h3>
          <p>Find jobs and customers quickly</p>
        </div>
        <div className="feature-item">
          <div className="feature-icon">📈</div>
          <h3>Analytics</h3>
          <p>Business insights and reports</p>
        </div>
      </div>
      <div className="cta-section">
        <Link to="/login" className="btn-primary btn-large">Get Started</Link>
        <Link to="/client-login" className="btn-secondary btn-large">Client Portal</Link>
      </div>
    </section>
  );
}

// ============== LOGIN PAGE ==============
function LoginPage({ onLogin, isLoggedIn }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('1111');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isLoggedIn) navigate('/dashboard', { replace: true });
  }, [isLoggedIn, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onLogin(username, password);
      navigate('/dashboard', { replace: true });
    } catch (e) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <section className="card auth-card">
        <div className="auth-header">
          <h1>🔐 Login</h1>
          <p>Sign in to Field Service Suite</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input 
              id="username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              autoComplete="username"
              placeholder="Enter username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Enter password"
              />
              <button 
                type="button" 
                className="btn-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error ? <div className="form-error-box">{error}</div> : null}

          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        
        <div className="demo-accounts">
          <p className="demo-title">Demo Accounts:</p>
          <div className="demo-grid">
            <span className="demo-role admin">admin / 1111</span>
            <span className="demo-role dispatcher">dispatcher / 1111</span>
            <span className="demo-role technician">technician / 1111</span>
            <span className="demo-role client">client / 1111</span>
          </div>
        </div>
        
        <div className="client-portal-link">
          <p>Are you a customer? <Link to="/client-login">Login to Client Portal</Link></p>
        </div>
      </section>
    </div>
  );
}

// ============== CLIENT LOGIN PAGE ==============
function ClientLoginPage({ onClientLogin, isClientLoggedIn }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('contact@acme.com');
  const [password, setPassword] = useState('client');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isClientLoggedIn) navigate('/client-portal', { replace: true });
  }, [isClientLoggedIn, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onClientLogin(email, password);
      navigate('/client-portal', { replace: true });
    } catch (e) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <section className="card auth-card">
        <div className="auth-header">
          <h1>🏠 Client Portal</h1>
          <p>View your service jobs and invoices</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="client-email">Email</label>
            <input 
              id="client-email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              autoComplete="email"
              placeholder="your@email.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="client-password">Password</label>
            <div className="password-input">
              <input
                id="client-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Password"
              />
              <button 
                type="button" 
                className="btn-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error ? <div className="form-error-box">{error}</div> : null}

          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <div className="client-portal-link">
          <p><Link to="/login">← Back to Staff Login</Link></p>
        </div>
      </section>
    </div>
  );
}

// ============== CLIENT PORTAL PAGE ==============
function ClientPortalPage({ token, user, onLogout }) {
  const [jobs, setJobs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('jobs');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [jobsData, invoicesData] = await Promise.all([
        apiFetch('/api/client/jobs', { token }),
        apiFetch('/api/client/invoices', { token }),
      ]);
      setJobs(jobsData || []);
      setInvoices(invoicesData || []);
    } catch (e) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusBadge = (status) => {
    const statusClass = status === 'completed' ? 'status-completed' : 
                       status === 'in-progress' ? 'status-progress' :
                       status === 'assigned' ? 'status-assigned' : 'status-new';
    return <span className={`status-badge ${statusClass}`}>{status}</span>;
  };

  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  const inProgressJobs = jobs.filter(j => j.status === 'in-progress').length;
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.amount || 0), 0);

  return (
    <section className="card schedule-page">
      <div className="page-header">
        <div>
          <h1>My Service Portal</h1>
          <p>Welcome back, <strong>{user.username}</strong>!</p>
        </div>
        <button className="btn-secondary" onClick={onLogout}>Logout</button>
      </div>
      
      {error ? <div className="form-error-box">{error}</div> : null}

      <div className="client-stats">
        <div className="stat-card">
          <span className="stat-icon">📋</span>
          <div className="stat-info">
            <span className="stat-value">{jobs.length}</span>
            <span className="stat-label">Total Jobs</span>
          </div>
        </div>
        <div className="stat-card completed">
          <span className="stat-icon">✅</span>
          <div className="stat-info">
            <span className="stat-value">{completedJobs}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
        <div className="stat-card progress">
          <span className="stat-icon">🔄</span>
          <div className="stat-info">
            <span className="stat-value">{inProgressJobs}</span>
            <span className="stat-label">In Progress</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">💰</span>
          <div className="stat-info">
            <span className="stat-value">${totalRevenue.toFixed(2)}</span>
            <span className="stat-label">Total Paid</span>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          My Jobs ({jobs.length})
        </button>
        <button 
          className={`tab ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          Invoices ({invoices.length})
        </button>
      </div>

      {activeTab === 'jobs' && (
        <div className="tab-content">
          {loading ? <p className="loading">Loading...</p> : null}
          {!loading && jobs.length === 0 ? <p className="empty-state">No jobs found.</p> : null}
          {!loading && jobs.length > 0 && (
            <div className="jobs-list">
              {jobs.map(job => (
                <div key={job.id} className="job-item client-job">
                  <div className="job-header">
                    <div>
                      <h3>{job.id}</h3>
                      <p className="job-title">{job.title}</p>
                    </div>
                    {getStatusBadge(job.status)}
                  </div>
                  <div className="job-meta">
                    <span>📍 {job.location}</span>
                    {job.scheduledDate && <span>📅 {new Date(job.scheduledDate).toLocaleDateString()}</span>}
                    {job.category && <span>🏷️ {job.category}</span>}
                  </div>
                  {job.checkinTime && (
                    <div className="job-times">
                      <span>✅ Started: {new Date(job.checkinTime).toLocaleString()}</span>
                      {job.checkoutTime && <span>✅ Completed: {new Date(job.checkoutTime).toLocaleString()}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="tab-content">
          {!loading && invoices.length === 0 ? <p className="empty-state">No invoices found.</p> : null}
          {!loading && invoices.length > 0 && (
            <div className="invoices-list">
              {invoices.map(invoice => (
                <div key={invoice.id} className={`invoice-card client-invoice ${invoice.status}`}>
                  <div className="invoice-header">
                    <h3>{invoice.id}</h3>
                    <span className={`invoice-status ${invoice.status}`}>{invoice.status}</span>
                  </div>
                  <div className="invoice-details">
                    <p><strong>Job:</strong> {invoice.jobId} - {invoice.job?.title || 'N/A'}</p>
                    <p><strong>Amount:</strong> ${invoice.amount?.toFixed(2) || '0.00'}</p>
                    <p><strong>Created:</strong> {new Date(invoice.createdAt).toLocaleDateString()}</p>
                    {invoice.paidAt && <p><strong>Paid:</strong> {new Date(invoice.paidAt).toLocaleDateString()}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ============== DASHBOARD PAGE ==============
function DashboardPage({ token, user }) {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        setError('');
        const data = await apiFetch('/api/dashboard/summary', { token });
        if (!cancelled) setSummary(data);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [token, refreshKey]);

  const quickStats = [
    { key: 'newJobs', label: 'New', color: 'new', icon: '📋' },
    { key: 'assignedJobs', label: 'Assigned', color: 'assigned', icon: '👤' },
    { key: 'inProgressJobs', label: 'In Progress', color: 'progress', icon: '🔧' },
    { key: 'completedJobs', label: 'Completed', color: 'completed', icon: '✅' },
  ];

  return (
    <section className="card">
      <div className="page-header">
        <div>
          <h1>📊 Dashboard</h1>
          <p>Signed in as <strong>{user.username}</strong> ({user.role})</p>
        </div>
        <button className="btn-secondary" onClick={() => setRefreshKey(k => k + 1)}>🔄 Refresh</button>
      </div>

      {error ? <div className="form-error-box">{error}</div> : null}

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      ) : summary ? (
        <div className="dashboard-content">
          <div className="stats-grid">
            <div className="stat-card large">
              <span className="stat-icon">📋</span>
              <div className="stat-info">
                <span className="stat-value">{summary.totalJobs}</span>
                <span className="stat-label">Total Jobs</span>
              </div>
            </div>
            {quickStats.map(stat => (
              <div key={stat.key} className={`stat-card ${stat.color}`}>
                <span className="stat-icon">{stat.icon}</span>
                <div className="stat-info">
                  <span className="stat-value">{summary[stat.key] || 0}</span>
                  <span className="stat-label">{stat.label}</span>
                </div>
              </div>
            ))}
            {summary.totalCustomers !== undefined && (
              <div className="stat-card">
                <span className="stat-icon">👥</span>
                <div className="stat-info">
                  <span className="stat-value">{summary.totalCustomers}</span>
                  <span className="stat-label">Customers</span>
                </div>
              </div>
            )}
            {summary.totalRevenue !== undefined && (
              <div className="stat-card revenue">
                <span className="stat-icon">💰</span>
                <div className="stat-info">
                  <span className="stat-value">${summary.totalRevenue.toFixed(2)}</span>
                  <span className="stat-label">Revenue</span>
                </div>
              </div>
            )}
            {summary.pendingInvoices !== undefined && (
              <div className="stat-card pending">
                <span className="stat-icon">📄</span>
                <div className="stat-info">
                  <span className="stat-value">{summary.pendingInvoices}</span>
                  <span className="stat-label">Pending Invoices</span>
                </div>
              </div>
            )}
          </div>
          
          {summary.technicianStats && summary.technicianStats.length > 0 && (
            <div className="dashboard-section">
              <h2>👨‍🔧 Technician Performance</h2>
              <div className="tech-stats-grid">
                {summary.technicianStats.map(tech => (
                  <div key={tech.username} className="tech-stat-card">
                    <div className="tech-avatar">{tech.username.charAt(0).toUpperCase()}</div>
                    <div className="tech-info">
                      <h4>{tech.username}</h4>
                      <div className="tech-badges">
                        <span className="tech-badge total">{tech.totalJobs} total</span>
                        <span className="tech-badge completed">{tech.completed} done</span>
                        <span className="tech-badge progress">{tech.inProgress} active</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {summary.categoryStats && Object.keys(summary.categoryStats).length > 0 && (
            <div className="dashboard-section">
              <h2>📂 Jobs by Category</h2>
              <div className="category-stats">
                {Object.entries(summary.categoryStats).map(([cat, count]) => (
                  <div key={cat} className="category-bar">
                    <div className="category-info">
                      <span className="category-name">{cat}</span>
                      <span className="category-count">{count}</span>
                    </div>
                    <div className="category-progress">
                      <div 
                        className="category-fill" 
                        style={{ width: `${(count / summary.totalJobs) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {summary.recentActivity && summary.recentActivity.length > 0 && (
            <div className="dashboard-section">
              <h2>📝 Recent Activity</h2>
              <div className="activity-list">
                {summary.recentActivity.map(activity => (
                  <div key={activity.id} className="activity-item">
                    <span className="activity-time">{new Date(activity.timestamp).toLocaleString()}</span>
                    <span className="activity-desc">{activity.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="empty-state">No data available</p>
      )}
    </section>
  );
}

// ============== CUSTOMERS PAGE WITH SEARCH ==============
function CustomersPage({ token }) {
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [draft, setDraft] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/customers', { token });
      setCustomers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    const term = searchTerm.toLowerCase();
    return customers.filter(c => 
      c.name?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.phone?.toLowerCase().includes(term) ||
      c.address?.toLowerCase().includes(term)
    );
  }, [customers, searchTerm]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      if (editingId) {
        await apiFetch(`/api/customers/${encodeURIComponent(editingId)}`, { token, method: 'PUT', body: draft });
      } else {
        await apiFetch('/api/customers', { token, method: 'POST', body: draft });
      }
      setDraft({ name: '', email: '', phone: '', address: '', notes: '' });
      setShowForm(false);
      setEditingId(null);
      await fetchCustomers();
    } catch (e) {
      setError(e.message || 'Failed to save customer');
    }
  };

  const handleEdit = (customer) => {
    setDraft({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      notes: customer.notes,
    });
    setEditingId(customer.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    setError('');
    try {
      await apiFetch(`/api/customers/${encodeURIComponent(id)}`, { token, method: 'DELETE' });
      await fetchCustomers();
    } catch (e) {
      setError(e.message || 'Failed to delete customer');
    }
  };

  const cancelForm = () => {
    setDraft({ name: '', email: '', phone: '', address: '', notes: '' });
    setShowForm(false);
    setEditingId(null);
  };

  return (
    <section className="card">
      <div className="page-header">
        <h1>👥 Customers</h1>
        {!showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>+ Add Customer</button>
        )}
      </div>

      {error ? <div className="form-error-box">{error}</div> : null}

      {!showForm && (
        <div className="search-bar">
          <input
            type="text"
            placeholder="🔍 Search customers by name, email, phone, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <span className="search-count">
              {filteredCustomers.length} of {customers.length}
            </span>
          )}
        </div>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={cancelForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? '✏️ Edit Customer' : '➕ New Customer'}</h2>
              <button className="modal-close" onClick={cancelForm}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      value={draft.name}
                      onChange={(e) => setDraft(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Customer name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={draft.email}
                      onChange={(e) => setDraft(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      value={draft.phone}
                      onChange={(e) => setDraft(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="555-0100"
                    />
                  </div>
                  <div className="form-group">
                    <label>Address</label>
                    <input
                      value={draft.address}
                      onChange={(e) => setDraft(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="123 Main St, City"
                    />
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

      {loading ? <p className="loading">Loading customers...</p> : null}
      {!loading && !customers.length ? <p className="empty-state">No customers yet. Add your first customer!</p> : null}
      {!loading && customers.length > 0 && filteredCustomers.length === 0 ? (
        <p className="empty-state">No customers match your search.</p>
      ) : null}
      {!loading && filteredCustomers.length > 0 && (
        <div className="items-grid">
          {filteredCustomers.map((customer) => (
            <article key={customer.id} className="item-card">
              <div className="item-header">
                <h3>{customer.name}</h3>
                <span className="item-id">{customer.id}</span>
              </div>
              <div className="item-details">
                {customer.email && <p><strong>📧</strong> {customer.email}</p>}
                {customer.phone && <p><strong>📞</strong> {customer.phone}</p>}
                {customer.address && <p><strong>📍</strong> {customer.address}</p>}
                {customer.notes && <p className="notes"><strong>📝</strong> {customer.notes}</p>}
              </div>
              <div className="item-actions">
                <button className="btn-secondary" onClick={() => handleEdit(customer)}>✏️ Edit</button>
                <button className="btn-danger" onClick={() => handleDelete(customer.id)}>🗑️ Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

// ============== SCHEDULE PAGE ==============
function SchedulePage({ token }) {
  const [schedule, setSchedule] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [selectedDate, setSelectedDate] = useState(null);

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/schedule', { token });
      setSchedule(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'status-new';
      case 'assigned': return 'status-assigned';
      case 'in-progress': return 'status-progress';
      case 'completed': return 'status-completed';
      default: return '';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'new': return '📋';
      case 'assigned': return '👤';
      case 'in-progress': return '🔧';
      case 'completed': return '✅';
      default: return '📋';
    }
  };

  const getScheduleStatusClass = (status) => {
    switch (status) {
      case 'assigned': return 'schedule-assigned';
      case 'in-progress': return 'schedule-progress';
      case 'completed': return 'schedule-completed';
      default: return 'schedule-new';
    }
  };

  // Group jobs by date
  const jobsByDate = useMemo(() => {
    const grouped = {};
    schedule.forEach(job => {
      if (job.scheduledDate) {
        const date = job.scheduledDate;
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(job);
      }
    });
    return grouped;
  }, [schedule]);

  const sortedDates = Object.keys(jobsByDate).sort();

  return (
    <section className="card schedule-page">
      <div className="page-header">
        <h1>📅 Schedule / Calendar</h1>
        <div className="view-toggle">
          <button 
            className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            📋 List
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => setViewMode('calendar')}
          >
            📆 Calendar
          </button>
        </div>
      </div>

      {error ? <div className="form-error-box">{error}</div> : null}

      {loading ? <p className="loading">Loading schedule...</p> : null}
      {!loading && !schedule.length ? (
        <div className="empty-state">
          <p>No scheduled jobs.</p>
          <p className="hint">Add scheduled dates to jobs to see them here.</p>
        </div>
      ) : null}
      
      {!loading && viewMode === 'list' && schedule.length > 0 && (
        <div className="schedule-list">
          {sortedDates.map(date => (
            <div key={date} className="schedule-date-group">
              <h3 className="schedule-date">
                📅 {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h3>
              <div className="schedule-items">
                {jobsByDate[date].map(job => (
                  <div key={job.id} className={`schedule-item ${getScheduleStatusClass(job.status)}`}>
                    <div className="schedule-time">
                      <span className="status-icon">{getStatusIcon(job.status)}</span>
                    </div>
                    <div className="schedule-content">
                      <div className="schedule-header">
                        <h4>{job.id}</h4>
                        <span className={`status-badge ${getStatusColor(job.status)}`}>{job.status}</span>
                      </div>
                      <p className="schedule-title">{job.title}</p>
                      <div className="schedule-meta">
                        <span>👤 {job.customerName}</span>
                        <span>📍 {job.location}</span>
                        {job.assignedTo && <span>🔧 {job.assignedTo}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && viewMode === 'calendar' && schedule.length > 0 && (
        <div className="calendar-view">
          <div className="calendar-grid">
            {sortedDates.map(date => {
              const dateObj = new Date(date);
              return (
              <div key={date} className="calendar-day">
                <div className="calendar-day-header">
                  <span className="day-number">{dateObj.getDate()}</span>
                  <span className="day-name">{dateObj.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  <span className="day-month-year">{dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="calendar-jobs">
                  {jobsByDate[date].map(job => (
                    <div key={job.id} className={`calendar-job ${getScheduleStatusClass(job.status)}`}>
                      <span className="job-id">{job.id}</span>
                      <span className="job-title">{job.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )})}
          </div>
        </div>
      )}
    </section>
  );
}

// ============== JOBS PAGE WITH SEARCH & PHOTOS ==============
function JobsPage({ token, user }) {
  const [jobs, setJobs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [workingId, setWorkingId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showJobDetails, setShowJobDetails] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [worklogDrafts, setWorklogDrafts] = useState({});
  const canManageJobs = user.role === 'admin' || user.role === 'dispatcher';
  const isTechnician = user.role === 'technician';
  const canEditWorklog = canManageJobs || isTechnician;

  const [draft, setDraft] = useState({
    title: '',
    location: '',
    priority: 'medium',
    assignedTo: 'technician',
    customerId: '',
    scheduledDate: '',
    notes: '',
    category: 'general',
    projectId: '',
    taskId: '',
  });
  const [projects, setProjects] = useState([]);
  const [projectTasks, setProjectTasks] = useState({});

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/jobs', { token });
      setJobs(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchCustomers = useCallback(async () => {
    try {
      const data = await apiFetch('/api/customers', { token });
      setCustomers(Array.isArray(data) ? data : []);
    } catch (e) {
      // Ignore
    }
  }, [token]);

  useEffect(() => {
    fetchJobs();
    fetchCustomers();
  }, [fetchJobs, fetchCustomers]);

  const filteredJobs = useMemo(() => {
    let result = jobs;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(j => 
        j.id?.toLowerCase().includes(term) ||
        j.title?.toLowerCase().includes(term) ||
        j.location?.toLowerCase().includes(term) ||
        j.customerId?.toLowerCase().includes(term) ||
        j.assignedTo?.toLowerCase().includes(term)
      );
    }
    if (statusFilter) {
      result = result.filter(j => j.status === statusFilter);
    }
    return result;
  }, [jobs, searchTerm, statusFilter]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    try {
      await apiFetch('/api/jobs', { token, method: 'POST', body: draft });
      setDraft({ title: '', location: '', priority: 'medium', assignedTo: 'technician', customerId: '', scheduledDate: '', notes: '', category: 'general' });
      await fetchJobs();
      setSuccess('Job created successfully.');
    } catch (e) {
      setError(e.message || 'Failed to create job');
    }
  };

  const handleManagerUpdate = async (job) => {
    setWorkingId(job.id);
    setError('');
    setSuccess('');
    try {
      await apiFetch(`/api/jobs/${encodeURIComponent(job.id)}`, {
        token,
        method: 'PUT',
        body: {
          title: job.title,
          priority: job.priority,
          status: job.status,
          assignedTo: job.assignedTo,
          location: job.location,
          customerId: job.customerId,
          scheduledDate: job.scheduledDate,
          notes: job.notes,
          category: job.category,
        },
      });
      await fetchJobs();
      setSuccess(`Job ${job.id} saved.`);
    } catch (e) {
      setError(e.message || 'Failed to save job');
    } finally {
      setWorkingId('');
    }
  };

  const patchLocalJob = (jobId, field, value) => {
    setJobs((prev) => prev.map((item) => (item.id === jobId ? { ...item, [field]: value } : item)));
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : 'Unknown';
  };

  const handlePhotoUpload = async (jobId) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;

      const maxBytes = 5 * 1024 * 1024;
      const oversized = files.find((file) => file.size > maxBytes);
      if (oversized) {
        setError(`"${oversized.name}" is larger than 5MB.`);
        return;
      }

      const readAsDataURL = (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('Failed to read image file'));
          reader.readAsDataURL(file);
        });

      setWorkingId(jobId);
      setSuccess('');
      try {
        for (const file of files) {
          const dataUrl = await readAsDataURL(file);
          await apiFetch(`/api/jobs/${encodeURIComponent(jobId)}/photos`, {
            token,
            method: 'POST',
            body: { photo: dataUrl }
          });
        }
        await fetchJobs();
        setSuccess('Photo uploaded successfully.');
      } catch (err) {
        setError(err.message || 'Failed to upload photo');
      } finally {
        setWorkingId('');
      }
    };
    input.click();
  };

  const handlePhotoRemove = async (jobId, photoId) => {
    setWorkingId(jobId);
    setSuccess('');
    try {
      await apiFetch(`/api/jobs/${encodeURIComponent(jobId)}/photos/${encodeURIComponent(photoId)}`, {
        token,
        method: 'DELETE',
      });
      await fetchJobs();
      setSuccess('Photo removed.');
    } catch (err) {
      setError(err.message || 'Failed to remove photo');
    } finally {
      setWorkingId('');
    }
  };

  const handleCheckin = async (jobId) => {
    setWorkingId(jobId);
    setSuccess('');
    try {
      await apiFetch(`/api/jobs/${encodeURIComponent(jobId)}/checkin`, { token, method: 'POST' });
      await fetchJobs();
      setSuccess(`Checked in to ${jobId}.`);
    } catch (e) {
      setError(e.message || 'Failed to check in');
    } finally {
      setWorkingId('');
    }
  };

  const handleCheckout = async (jobId) => {
    const finalNotes = prompt('Enter job completion notes:') || '';
    setWorkingId(jobId);
    setSuccess('');
    try {
      await apiFetch(`/api/jobs/${encodeURIComponent(jobId)}/checkout`, { token, method: 'POST', body: { notes: finalNotes } });
      await fetchJobs();
      setSuccess(`Completed ${jobId}.`);
    } catch (e) {
      setError(e.message || 'Failed to check out');
    } finally {
      setWorkingId('');
    }
  };

  const getWorklogDraft = (job) => {
    const existing = worklogDrafts[job.id];
    if (existing) return existing;
    const partsText = Array.isArray(job.partsUsed) ? job.partsUsed.map((item) => String(item)).join(', ') : '';
    const materialsText = Array.isArray(job.materialsUsed) ? job.materialsUsed.map((item) => String(item)).join(', ') : '';
    return {
      technicianNotes: job.technicianNotes || '',
      partsText,
      materialsText,
    };
  };

  const updateWorklogDraft = (jobId, key, value) => {
    setWorklogDrafts((prev) => ({
      ...prev,
      [jobId]: {
        ...(prev[jobId] || {}),
        [key]: value,
      },
    }));
  };

  const parseList = (text) =>
    String(text || '')
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);

  const formatUsageItem = (item) => {
    if (item && typeof item === 'object') {
      const name = String(item.name || '').trim();
      const qty = item.qty ?? item.quantity;
      if (name && qty !== undefined && qty !== null && qty !== '') return `${name} x${qty}`;
      return name || JSON.stringify(item);
    }
    return String(item || '').trim();
  };

  const getLatestWorklog = (job) => (Array.isArray(job.worklog) && job.worklog.length > 0 ? job.worklog[0] : null);

  const handleSaveWorklog = async (job) => {
    const draftValues = getWorklogDraft(job);
    setWorkingId(job.id);
    setError('');
    setSuccess('');
    try {
      await apiFetch(`/api/jobs/${encodeURIComponent(job.id)}/worklog`, {
        token,
        method: 'PATCH',
        body: {
          technicianNotes: draftValues.technicianNotes || '',
          partsUsed: parseList(draftValues.partsText),
          materialsUsed: parseList(draftValues.materialsText),
        },
      });
      await fetchJobs();
      setSuccess(`Worklog saved for ${job.id}.`);
    } catch (e) {
      setError(e.message || 'Failed to save worklog');
    } finally {
      setWorkingId('');
    }
  };

  const handleJobDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) return;
    setError('');
    setSuccess('');
    try {
      await apiFetch(`/api/jobs/${encodeURIComponent(jobId)}`, { token, method: 'DELETE' });
      await fetchJobs();
      setSuccess(`Job ${jobId} deleted successfully.`);
    } catch (e) {
      setError(e.message || 'Failed to delete job');
    }
  };

  return (
    <section className="card">
      <div className="page-header">
        <h1>📋 Jobs</h1>
        <div className="job-counts">
          <span className="count total">Total: {jobs.length}</span>
          {canManageJobs && !showCreateForm && (
            <button className="btn-primary btn-small" onClick={() => setShowCreateForm(true)}>+ Create Job</button>
          )}
          <span className="count new">New: {jobs.filter(j => j.status === 'new').length}</span>
          <span className="count progress">In Progress: {jobs.filter(j => j.status === 'in-progress').length}</span>
          <span className="count completed">Completed: {jobs.filter(j => j.status === 'completed').length}</span>
      </div>

      {error ? <div className="form-error-box">{error}</div> : null}
      {success ? <div className="form-success-box">{success}</div> : null}

      {showCreateForm && (
        <div className="modal-backdrop" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Create New Job</h2>
              <button className="modal-close" onClick={() => setShowCreateForm(false)}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-section">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Job Title *</label>
                    <input
                      placeholder="Enter job title"
                      value={draft.title}
                      onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select value={draft.category} onChange={(e) => setDraft((prev) => ({ ...prev, category: e.target.value }))}>
                      <option value="general">General</option>
                      <option value="hvac">HVAC</option>
                      <option value="electrical">Electrical</option>
                      <option value="plumbing">Plumbing</option>
                      <option value="repair">Repair</option>
                      <option value="installation">Installation</option>
                      <option value="inspection">Inspection</option>
                    </select>
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
                    <label>Assign To</label>
                    <select value={draft.assignedTo} onChange={(e) => setDraft((prev) => ({ ...prev, assignedTo: e.target.value }))}>
                      <option value="">Unassigned</option>
                      <option value="technician">technician</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Customer</label>
                    <select value={draft.customerId} onChange={(e) => setDraft((prev) => ({ ...prev, customerId: e.target.value }))}>
                      <option value="">No Customer</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Scheduled Date</label>
                    <input
                      type="date"
                      value={draft.scheduledDate}
                      onChange={(e) => setDraft((prev) => ({ ...prev, scheduledDate: e.target.value }))}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Location</label>
                    <input
                      placeholder="Job location"
                      value={draft.location}
                      onChange={(e) => setDraft((prev) => ({ ...prev, location: e.target.value }))}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Notes</label>
                    <textarea
                      placeholder="Job notes..."
                      value={draft.notes}
                      onChange={(e) => setDraft((prev) => ({ ...prev, notes: e.target.value }))}
                      rows={2}
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary">Create Job</button>
                  <button type="button" className="btn-secondary" onClick={() => setShowCreateForm(false)}>Cancel</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {!showCreateForm && (
      <div className="search-filter-bar">
        <input
          type="text"
          placeholder="🔍 Search jobs by ID, title, location, customer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="assigned">Assigned</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      )}

      {loading ? <p className="loading">Loading jobs...</p> : null}
      {!loading && !jobs.length ? <p className="empty-state">No jobs available. Create your first job!</p> : null}
      {!loading && jobs.length > 0 && filteredJobs.length === 0 ? (
        <p className="empty-state">No jobs match your search.</p>
      ) : null}
      {!loading && filteredJobs.length > 0 && (
        <div className="jobs-list">
          {filteredJobs.map((job) => (
            <article key={job.id} className="job-item">
              <div className="job-header">
                <div className="job-id-row">
                  <h3>{job.id}</h3>
                  <span className={`category-tag ${job.category}`}>{job.category}</span>
                </div>
                <div className="job-actions-row">
                  {canManageJobs ? (
                    <button
                      type="button"
                      className="btn-icon btn-danger"
                      onClick={() => handleJobDelete(job.id)}
                      title="Delete job"
                      disabled={workingId === job.id}
                    >
                      Delete
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => setShowJobDetails(showJobDetails === job.id ? null : job.id)}
                    title={showJobDetails === job.id ? 'Hide details' : 'Show details'}
                  >
                    {showJobDetails === job.id ? 'Hide' : 'Details'}
                  </button>
                </div>
              </div>

              {canManageJobs ? (
                <input 
                  className="job-title-input"
                  value={job.title} 
                  onChange={(e) => patchLocalJob(job.id, 'title', e.target.value)} 
                />
              ) : (
                <p className="job-title">{job.title}</p>
              )}

              {job.customerId && (
                <p className="job-customer">Customer: {getCustomerName(job.customerId)}</p>
              )}

              {getLatestWorklog(job) && (
                <div className="job-worklog-preview">
                  <strong>Latest update:</strong>{' '}
                  <span>{new Date(getLatestWorklog(job).at).toLocaleString()}</span>
                  {getLatestWorklog(job).technicianNotes ? (
                    <p>{getLatestWorklog(job).technicianNotes}</p>
                  ) : null}
                </div>
              )}

              {showJobDetails === job.id && (
                <div className="job-details">
                  <div className="job-meta-grid">
                    <label>
                      Priority
                      {canManageJobs ? (
                        <select value={job.priority} onChange={(e) => patchLocalJob(job.id, 'priority', e.target.value)}>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      ) : <strong>{job.priority}</strong>}
                    </label>

                    <label>
                      Status
                      {canManageJobs ? (
                        <select value={job.status} onChange={(e) => patchLocalJob(job.id, 'status', e.target.value)}>
                          <option value="new">new</option>
                          <option value="assigned">assigned</option>
                          <option value="in-progress">in-progress</option>
                          <option value="completed">completed</option>
                        </select>
                      ) : <strong>{job.status}</strong>}
                    </label>

                    <label>
                      Assigned To
                      {canManageJobs ? (
                        <select value={job.assignedTo || ''} onChange={(e) => patchLocalJob(job.id, 'assignedTo', e.target.value)}>
                          <option value="">Unassigned</option>
                          <option value="technician">technician</option>
                        </select>
                      ) : <strong>{job.assignedTo || 'Unassigned'}</strong>}
                    </label>

                    <label>
                      Location
                      {canManageJobs ? (
                        <input value={job.location || ''} onChange={(e) => patchLocalJob(job.id, 'location', e.target.value)} />
                      ) : <strong>{job.location || 'Unspecified'}</strong>}
                    </label>
                    
                    <label>
                      Scheduled
                      {canManageJobs ? (
                        <input type="date" value={job.scheduledDate || ''} onChange={(e) => patchLocalJob(job.id, 'scheduledDate', e.target.value)} />
                      ) : <strong>{job.scheduledDate || 'Not scheduled'}</strong>}
                    </label>

                    <label>
                      Category
                      {canManageJobs ? (
                        <select value={job.category || 'general'} onChange={(e) => patchLocalJob(job.id, 'category', e.target.value)}>
                          <option value="general">General</option>
                          <option value="hvac">HVAC</option>
                          <option value="electrical">Electrical</option>
                          <option value="plumbing">Plumbing</option>
                          <option value="repair">Repair</option>
                          <option value="installation">Installation</option>
                          <option value="inspection">Inspection</option>
                        </select>
                      ) : <strong>{job.category || 'general'}</strong>}
                    </label>
                  </div>

                  {job.notes && (
                    <div className="job-notes">
                      <strong>Notes:</strong> {job.notes}
                    </div>
                  )}

                  <div className="job-worklog">
                    <strong>Worklog</strong>
                    {canEditWorklog ? (
                      <>
                        <textarea
                          rows={3}
                          placeholder="Technician notes"
                          value={getWorklogDraft(job).technicianNotes}
                          onChange={(e) => updateWorklogDraft(job.id, 'technicianNotes', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Parts used (comma separated)"
                          value={getWorklogDraft(job).partsText}
                          onChange={(e) => updateWorklogDraft(job.id, 'partsText', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Materials used (comma separated)"
                          value={getWorklogDraft(job).materialsText}
                          onChange={(e) => updateWorklogDraft(job.id, 'materialsText', e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => handleSaveWorklog(job)}
                          disabled={workingId === job.id}
                        >
                          {workingId === job.id ? 'Saving...' : 'Save Worklog'}
                        </button>
                      </>
                    ) : (
                      <>
                        <p>{job.technicianNotes || 'No technician notes yet.'}</p>
                        <p><strong>Parts:</strong> {Array.isArray(job.partsUsed) && job.partsUsed.length ? job.partsUsed.map(formatUsageItem).filter(Boolean).join(', ') : 'None'}</p>
                        <p><strong>Materials:</strong> {Array.isArray(job.materialsUsed) && job.materialsUsed.length ? job.materialsUsed.map(formatUsageItem).filter(Boolean).join(', ') : 'None'}</p>
                      </>
                    )}

                    {Array.isArray(job.worklog) && job.worklog.length > 0 && (
                      <div className="job-worklog-history">
                        <strong>Recent timeline</strong>
                        {job.worklog.slice(0, 3).map((entry, idx) => (
                          <div key={`${job.id}-worklog-${idx}`} className="job-worklog-entry">
                            <div className="job-worklog-entry-head">
                              <span>{new Date(entry.at || Date.now()).toLocaleString()}</span>
                              <span>{entry.by || 'unknown'}</span>
                            </div>
                            {entry.technicianNotes ? <p>{entry.technicianNotes}</p> : null}
                            <p>
                              <strong>Parts:</strong>{' '}
                              {Array.isArray(entry.partsUsed) && entry.partsUsed.length
                                ? entry.partsUsed.map(formatUsageItem).filter(Boolean).join(', ')
                                : 'None'}
                            </p>
                            <p>
                              <strong>Materials:</strong>{' '}
                              {Array.isArray(entry.materialsUsed) && entry.materialsUsed.length
                                ? entry.materialsUsed.map(formatUsageItem).filter(Boolean).join(', ')
                                : 'None'}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {job.photos && job.photos.length > 0 && (
                    <div className="job-photos">
                      <strong>Photos:</strong>
                      <div className="photos-grid">
                        {job.photos.map((photo, idx) => (
                          <div key={photo.id || idx} className="photo-item">
                            <img src={photo.data || photo} alt={`Job photo ${idx + 1}`} />
                            {canManageJobs ? (
                              <button
                                type="button"
                                className="photo-delete-btn"
                                onClick={() => handlePhotoRemove(job.id, photo.id || String(idx))}
                                title="Remove photo"
                                disabled={workingId === job.id}
                              >
                                ×
                              </button>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {job.invoiceId && (
                    <div className="job-invoice">
                      <span className="invoice-badge">📄 Invoice: {job.invoiceId}</span>
                    </div>
                  )}

                  {job.checkinTime && (
                    <div className="job-times">
                      <span>✅ Checked in: {new Date(job.checkinTime).toLocaleString()}</span>
                      {job.checkoutTime && <span>✅ Completed: {new Date(job.checkoutTime).toLocaleString()}</span>}
                    </div>
                  )}

                  <div className="job-action-buttons">
                    {canManageJobs && (
                      <>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => handleManagerUpdate(job)}
                          disabled={workingId === job.id}
                        >
                          {workingId === job.id ? 'Saving...' : '💾 Save Changes'}
                        </button>
                        <button
                          type="button"
                          className="btn-danger"
                          onClick={() => handleJobDelete(job.id)}
                          disabled={workingId === job.id}
                        >
                          🗑️ Delete Job
                        </button>
                      </>
                    )}
                    
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => handlePhotoUpload(job.id)}
                      disabled={workingId === job.id}
                    >
                      📷 Add Photo
                    </button>
                  </div>
                </div>
              )}

              {isTechnician && job.assignedTo === user.username && (
                <div className="tech-actions">
                  {!job.checkinTime && job.status !== 'completed' && (
                    <button
                      type="button"
                      className="btn-success"
                      onClick={() => handleCheckin(job.id)}
                      disabled={workingId === job.id}
                    >
                      📍 Check In
                    </button>
                  )}
                  {job.checkinTime && !job.checkoutTime && (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => handleCheckout(job.id)}
                      disabled={workingId === job.id}
                    >
                      ✅ Complete Job
                    </button>
                  )}
                  {job.checkoutTime && (
                    <span className="completed-badge">🎉 Job Completed</span>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

// ============== INVOICES PAGE ==============
function InvoicesPage({ token }) {
  const [invoices, setInvoices] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [draft, setDraft] = useState({
    jobId: '',
    customerId: '',
    amount: '',
    items: [{ description: '', quantity: 1, rate: 0 }],
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [invoicesData, jobsData, customersData] = await Promise.all([
        apiFetch('/api/invoices', { token }),
        apiFetch('/api/jobs', { token }),
        apiFetch('/api/customers', { token }),
      ]);
      setInvoices(invoicesData || []);
      setJobs(jobsData || []);
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

  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return invoices;
    const term = searchTerm.toLowerCase();
    return invoices.filter(inv => 
      inv.id?.toLowerCase().includes(term) ||
      inv.jobId?.toLowerCase().includes(term) ||
      inv.customerId?.toLowerCase().includes(term)
    );
  }, [invoices, searchTerm]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await apiFetch('/api/invoices', { 
        token, 
        method: 'POST', 
        body: {
          jobId: draft.jobId,
          customerId: draft.customerId,
          amount: parseFloat(draft.amount) || 0,
          items: draft.items.filter(i => i.description),
        }
      });
      setDraft({ jobId: '', customerId: '', amount: '', items: [{ description: '', quantity: 1, rate: 0 }] });
      setShowForm(false);
      await fetchData();
    } catch (e) {
      setError(e.message || 'Failed to create invoice');
    }
  };

  const handleStatusChange = async (invoiceId, status) => {
    setError('');
    try {
      await apiFetch(`/api/invoices/${encodeURIComponent(invoiceId)}/status`, { 
        token, 
        method: 'PATCH', 
        body: { status } 
      });
      await fetchData();
    } catch (e) {
      setError(e.message || 'Failed to update invoice');
    }
  };

  const handleDownloadPDF = async (invoiceId) => {
    try {
      const response = await fetch(apiUrl(`/api/invoices/${invoiceId}/pdf`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      setError(e.message || 'Failed to download invoice');
    }
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : 'Unknown';
  };

  const getJobTitle = (jobId) => {
    const job = jobs.find(j => j.id === jobId);
    return job ? job.title : 'Unknown Job';
  };

  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalPending = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + (i.amount || 0), 0);

  return (
    <section className="card">
      <div className="page-header">
        <h1>📄 Invoices</h1>
        {!showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>+ Create Invoice</button>
        )}
      </div>

      {error ? <div className="form-error-box">{error}</div> : null}

      {!showForm && (
        <div className="invoice-summary">
          <div className="summary-card total">
            <span className="summary-label">Total Invoices</span>
            <span className="summary-value">{invoices.length}</span>
          </div>
          <div className="summary-card paid">
            <span className="summary-label">Total Paid</span>
            <span className="summary-value">${totalPaid.toFixed(2)}</span>
          </div>
          <div className="summary-card pending">
            <span className="summary-label">Total Pending</span>
            <span className="summary-value">${totalPending.toFixed(2)}</span>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Create Invoice</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Job *</label>
                    <select 
                      value={draft.jobId} 
                      onChange={(e) => {
                        const job = jobs.find(j => j.id === e.target.value);
                        setDraft(prev => ({ 
                          ...prev, 
                          jobId: e.target.value,
                          customerId: job?.customerId || ''
                        }));
                      }} 
                      required
                    >
                      <option value="">Select Job</option>
                      {jobs.filter(j => !j.invoiceId).map(job => (
                        <option key={job.id} value={job.id}>{job.id} - {job.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={draft.amount}
                      onChange={(e) => setDraft(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Description</label>
                    <input
                      placeholder="Service description"
                      value={draft.items[0].description}
                      onChange={(e) => setDraft(prev => ({ ...prev, items: [{ ...prev.items[0], description: e.target.value }] }))}
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary">Create Invoice</button>
                  <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {!showForm && (
        <div className="search-bar">
          <input
            type="text"
            placeholder="🔍 Search invoices by ID, job, or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {loading ? <p className="loading">Loading invoices...</p> : null}
      {!loading && !invoices.length ? <p className="empty-state">No invoices yet.</p> : null}
      {!loading && invoices.length > 0 && filteredInvoices.length === 0 ? (
        <p className="empty-state">No invoices match your search.</p>
      ) : null}
      {!loading && filteredInvoices.length > 0 && (
        <div className="invoices-list">
          {filteredInvoices.map((invoice) => (
            <div key={invoice.id} className={`invoice-card ${invoice.status}`}>
              <div className="invoice-header">
                <div>
                  <h3>{invoice.id}</h3>
                  <span className={`invoice-status ${invoice.status}`}>{invoice.status}</span>
                </div>
                <div className="invoice-amount">${invoice.amount?.toFixed(2) || '0.00'}</div>
              </div>
              <div className="invoice-details">
                <p><strong>Job:</strong> {invoice.jobId} - {getJobTitle(invoice.jobId)}</p>
                <p><strong>Customer:</strong> {getCustomerName(invoice.customerId)}</p>
                <p><strong>Created:</strong> {new Date(invoice.createdAt).toLocaleDateString()}</p>
                {invoice.paidAt && <p><strong>Paid:</strong> {new Date(invoice.paidAt).toLocaleDateString()}</p>}
              </div>
              <div className="invoice-actions">
                <button className="btn-secondary" onClick={() => handleDownloadPDF(invoice.id)}>
                  📥 Download
                </button>
                {invoice.status === 'pending' && (
                  <>
                    <button className="btn-success" onClick={() => handleStatusChange(invoice.id, 'paid')}>
                      ✓ Mark Paid
                    </button>
                    <button className="btn-danger" onClick={() => handleStatusChange(invoice.id, 'cancelled')}>
                      ✕ Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ============== ACTIVITY PAGE ==============
function ActivityPage({ token }) {
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    setError('');
    apiFetch('/api/activity', { token })
      .then(data => setActivities(data || []))
      .catch(e => setError(e.message || 'Failed to load activity'))
      .finally(() => setLoading(false));
  }, [token]);

  const getActivityIcon = (action) => {
    if (action.includes('login')) return '🔑';
    if (action.includes('logout')) return '🚪';
    if (action.includes('created')) return '➕';
    if (action.includes('updated')) return '✏️';
    if (action.includes('deleted')) return '🗑️';
    if (action.includes('checkin')) return '📍';
    if (action.includes('checkout')) return '✅';
    if (action.includes('invoice')) return '📄';
    if (action.includes('status')) return '🔄';
    return '📋';
  };

  const filteredActivities = useMemo(() => {
    if (filter === 'all') return activities;
    return activities.filter(a => a.action?.includes(filter));
  }, [activities, filter]);

  return (
    <section className="card">
      <div className="page-header">
        <h1>📝 Activity Log</h1>
        <div className="filter-buttons">
          <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
          <button className={`filter-btn ${filter === 'job' ? 'active' : ''}`} onClick={() => setFilter('job')}>Jobs</button>
          <button className={`filter-btn ${filter === 'customer' ? 'active' : ''}`} onClick={() => setFilter('customer')}>Customers</button>
          <button className={`filter-btn ${filter === 'invoice' ? 'active' : ''}`} onClick={() => setFilter('invoice')}>Invoices</button>
          <button className={`filter-btn ${filter === 'login' ? 'active' : ''}`} onClick={() => setFilter('login')}>Auth</button>
        </div>
      </div>

      {error ? <div className="form-error-box">{error}</div> : null}

      {loading ? <p className="loading">Loading activity...</p> : null}
      {!loading && !activities.length ? <p className="empty-state">No activity yet.</p> : null}
      {!loading && filteredActivities.length > 0 && (
        <div className="activity-feed">
          {filteredActivities.map((activity) => (
            <div key={activity.id} className="activity-entry">
              <span className="activity-icon">{getActivityIcon(activity.action)}</span>
              <div className="activity-content">
                <p className="activity-description">{activity.description}</p>
                <span className="activity-meta">
                  {activity.userId} • {new Date(activity.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ============== EXPORT PAGE ==============
function ExportPage({ token }) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [lastExport, setLastExport] = useState(null);

  const handleExport = async (type) => {
    setExporting(true);
    setError('');
    try {
      const response = await fetch(apiUrl(`/api/export/${type}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await response.json();
          throw new Error(data.error || 'Export failed');
        }
        const text = await response.text();
        throw new Error(text || 'Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setLastExport({ type, time: new Date() });
    } catch (e) {
      setError(e.message || 'Failed to export');
    } finally {
      setExporting(false);
    }
  };

  const exportOptions = [
    { type: 'jobs', icon: '📋', title: 'Jobs Export', description: 'Export all jobs with status, priority, customer, dates, and notes' },
    { type: 'customers', icon: '👥', title: 'Customers Export', description: 'Export all customers with contact information and notes' },
  ];

  return (
    <section className="card">
      <h1>📊 Export Reports</h1>
      <p>Download your data in CSV format for use in Excel, Google Sheets, or other tools.</p>
      
      {error ? <div className="form-error-box">{error}</div> : null}
      
      {lastExport && (
        <div className="export-success">
          ✓ Successfully exported {lastExport.type} at {lastExport.time.toLocaleTimeString()}
        </div>
      )}

      <div className="export-grid">
        {exportOptions.map(opt => (
          <div key={opt.type} className="export-card">
            <div className="export-icon">{opt.icon}</div>
            <h3>{opt.title}</h3>
            <p>{opt.description}</p>
            <button 
              className="btn-primary" 
              onClick={() => handleExport(opt.type)}
              disabled={exporting}
            >
              {exporting ? '⏳ Exporting...' : '📥 Download CSV'}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

// ============== PROTECTED ROUTE ==============
function ProtectedRoute({ isAuthed, children }) {
  if (!isAuthed) return <Navigate to="/login" replace />;
  return children;
}

// ============== MAIN APP ==============
export default function App() {
  const location = useLocation();
  const [auth, setAuth] = useState(() => loadStoredAuth());
  const [clientAuth, setClientAuth] = useState(() => loadStoredClientAuth());
  const [darkMode, setDarkMode] = useState(() => loadStoredDarkMode());
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isAuthed = Boolean(auth && auth.token && auth.user);
  const isClientAuthed = Boolean(clientAuth && clientAuth.token && clientAuth.user);

  // Apply dark mode to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem(DARK_MODE_KEY, String(darkMode));
  }, [darkMode]);

  // Fetch notifications
  useEffect(() => {
    if (!isAuthed) return;
    let cancelled = false;
    const fetchNotifications = async () => {
      try {
        const data = await apiFetch('/api/notifications', { token: auth.token });
        if (!cancelled) setNotifications(data || []);
      } catch (e) {
        // Ignore
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isAuthed, auth?.token]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev);
  }, []);

  const persistAuth = useCallback((nextAuth) => {
    setAuth(nextAuth);
    if (!nextAuth) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
  }, []);

  const login = useCallback(async (username, password) => {
    const payload = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: { username, password },
    });
    persistAuth(payload);
    return payload;
  }, [persistAuth]);

  const logout = useCallback(async () => {
    if (auth && auth.token) {
      try {
        await apiFetch('/api/auth/logout', { token: auth.token, method: 'POST' });
      } catch (_) {}
    }
    persistAuth(null);
  }, [auth, persistAuth]);

  const persistClientAuth = useCallback((nextAuth) => {
    setClientAuth(nextAuth);
    if (!nextAuth) {
      localStorage.removeItem(CLIENT_AUTH_STORAGE_KEY);
      return;
    }
    localStorage.setItem(CLIENT_AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
  }, []);

  const clientLogin = useCallback(async (email, password) => {
    const payload = await apiFetch('/api/client/login', {
      method: 'POST',
      body: { email, password },
    });
    persistClientAuth(payload);
    return payload;
  }, [persistClientAuth]);

  const clientLogout = useCallback(async () => {
    persistClientAuth(null);
  }, [persistClientAuth]);

  const canManageCustomers = auth?.user?.role === 'admin' || auth?.user?.role === 'dispatcher';
  const unreadCount = notifications.filter(n => !n.read).length;

    const navLinks = useMemo(() => (
    <>
      <NavLink to="/" end onClick={() => setMobileNavOpen(false)}>Home</NavLink>
      {isAuthed ? <NavLink to="/dashboard" onClick={() => setMobileNavOpen(false)}>Dashboard</NavLink> : null}
      {isAuthed ? <NavLink to="/jobs" onClick={() => setMobileNavOpen(false)}>Jobs</NavLink> : null}
      {isAuthed ? <NavLink to="/schedule" onClick={() => setMobileNavOpen(false)}>Schedule</NavLink> : null}
      {isAuthed && canManageCustomers ? <NavLink to="/customers" onClick={() => setMobileNavOpen(false)}>Customers</NavLink> : null}
      {isAuthed && canManageCustomers ? <NavLink to="/invoices" onClick={() => setMobileNavOpen(false)}>Invoices</NavLink> : null}
      {isAuthed && canManageCustomers ? <NavLink to="/activity" onClick={() => setMobileNavOpen(false)}>Activity</NavLink> : null}
      {isAuthed && canManageCustomers ? <NavLink to="/projects" onClick={() => setMobileNavOpen(false)}>Projects</NavLink> : null}
      {isAuthed && canManageCustomers ? <NavLink to="/project-planner" onClick={() => setMobileNavOpen(false)}>Planner</NavLink> : null}
      {isAuthed && canManageCustomers ? <NavLink to="/team" onClick={() => setMobileNavOpen(false)}>Team</NavLink> : null}
      {isAuthed && canManageCustomers ? (
        <div className="dropdown-container">
          <button className="dropdown-toggle" onClick={() => setShowToolsDropdown(!showToolsDropdown)}>
            Tools ▾
          </button>
          {showToolsDropdown && (
            <div className="dropdown-menu">
              <NavLink to="/inventory" onClick={() => { setMobileNavOpen(false); setShowToolsDropdown(false); }}>📦 Inventory</NavLink>
              <NavLink to="/equipment" onClick={() => { setMobileNavOpen(false); setShowToolsDropdown(false); }}>🔧 Equipment</NavLink>
              <NavLink to="/quotes" onClick={() => { setMobileNavOpen(false); setShowToolsDropdown(false); }}>📝 Quotes</NavLink>
              <NavLink to="/export" onClick={() => { setMobileNavOpen(false); setShowToolsDropdown(false); }}>📊 Export</NavLink>
            </div>
          )}
        </div>
      ) : null}
      {!isAuthed ? <NavLink to="/login" onClick={() => setMobileNavOpen(false)}>Login</NavLink> : null}
    </>
  ), [isAuthed, canManageCustomers, showToolsDropdown]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileNavOpen]);

  // Close tools dropdown when clicking outside
  useEffect(() => {
    if (!showToolsDropdown) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown-container')) {
        setShowToolsDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showToolsDropdown]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-section">
          <button
            type="button"
            className="btn-icon mobile-menu-btn"
            onClick={() => setMobileNavOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileNavOpen}
          >
            {mobileNavOpen ? '✕' : '☰'}
          </button>
          <Link to="/" className="brand">Field Service Suite</Link>
        </div>
        <nav className="nav-links desktop-nav">
          {navLinks}
        </nav>
        <div className="user-section">
          {isAuthed && (
            <button 
              type="button" 
              className="btn-icon notifications-btn" 
              onClick={() => setShowNotifications(!showNotifications)}
              title="Notifications"
            >
              🔔 {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>
          )}
          <button 
            type="button" 
            className="btn-icon dark-mode-toggle" 
            onClick={toggleDarkMode}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          {isAuthed ? (
            <div className="user-menu">
              <span className="user-name">{auth.user.username}</span>
              {String(auth.user.role || '').toLowerCase() !== String(auth.user.username || '').toLowerCase() ? (
                <span className="user-role">{auth.user.role}</span>
              ) : null}
              <button type="button" className="btn-secondary" onClick={logout}>
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <div
        className={`mobile-nav-overlay ${mobileNavOpen ? 'open' : ''}`}
        onClick={() => setMobileNavOpen(false)}
      />
      <aside className={`mobile-nav-drawer ${mobileNavOpen ? 'open' : ''}`}>
        <div className="mobile-nav-header">
          <strong>Navigation</strong>
          <button type="button" className="btn-icon" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation">
            ✕
          </button>
        </div>
        <nav className="mobile-nav-links">
          {navLinks}
        </nav>
        {isAuthed ? (
          <div className="mobile-nav-account">
            <div className="mobile-account-meta">
              <strong>{auth.user.username}</strong>
              <span>{auth.user.role}</span>
            </div>
            <button type="button" className="btn-secondary btn-full" onClick={() => { setMobileNavOpen(false); logout(); }}>
              Logout
            </button>
          </div>
        ) : null}
      </aside>

      {showNotifications && (
        <div className="notifications-panel">
          <h3>🔔 Notifications</h3>
          <div className="notifications-list">
            {notifications.length === 0 ? <p className="empty-state">No notifications yet.</p> : null}
            {notifications.slice(0, 10).map(notif => (
              <div key={notif.id} className={`notification-item ${notif.read ? 'read' : 'unread'}`}>
                <strong>{notif.title}</strong>
                <p>{notif.message}</p>
                <span className="notification-time">
                  {new Date(notif.createdAt || notif.timestamp || Date.now()).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <main className="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage onLogin={login} isLoggedIn={isAuthed} />} />
          <Route
            path="/dashboard"
            element={(
              <ProtectedRoute isAuthed={isAuthed}>
                <DashboardPage token={auth?.token} user={auth?.user} />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/jobs"
            element={(
              <ProtectedRoute isAuthed={isAuthed}>
                <JobsPage token={auth?.token} user={auth?.user} />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/schedule"
            element={(
              <ProtectedRoute isAuthed={isAuthed}>
                <SchedulePage token={auth?.token} />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/customers"
            element={(
              <ProtectedRoute isAuthed={isAuthed}>
                <CustomersPage token={auth?.token} />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/invoices"
            element={(
              <ProtectedRoute isAuthed={isAuthed}>
                <InvoicesPage token={auth?.token} />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/activity"
            element={(
              <ProtectedRoute isAuthed={isAuthed}>
                <ActivityPage token={auth?.token} />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/projects"
            element={(
              <ProtectedRoute isAuthed={isAuthed}>
                <ProjectsPage token={auth?.token} />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/project-planner"
            element={(
              <ProtectedRoute isAuthed={isAuthed}>
                <ProjectPlanner token={auth?.token} />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/project-planner/:projectId"
            element={(
              <ProtectedRoute isAuthed={isAuthed}>
                <ProjectPlanner token={auth?.token} />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/team"
            element={(
              <ProtectedRoute isAuthed={isAuthed}>
                <TeamPage token={auth?.token} />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/equipment"
            element={(
              <ProtectedRoute isAuthed={isAuthed}>
                <EquipmentPage token={auth?.token} />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/quotes"
            element={(
              <ProtectedRoute isAuthed={isAuthed}>
                <QuotesPage token={auth?.token} />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/inventory"
            element={(
              <ProtectedRoute isAuthed={isAuthed}>
                <InventoryPage token={auth?.token} />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/export"
            element={(
              <ProtectedRoute isAuthed={isAuthed}>
                <ExportPage token={auth?.token} />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/client-login"
            element={<ClientLoginPage onClientLogin={clientLogin} isClientLoggedIn={isClientAuthed} />}
          />
          <Route
            path="/client-portal"
            element={(
              <ProtectedRoute isAuthed={isClientAuthed}>
                <ClientPortalPage token={clientAuth?.token} user={clientAuth?.user} onLogout={clientLogout} />
              </ProtectedRoute>
            )}
          />
        </Routes>
      </main>
    </div>
  );
}
