import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';

const AUTH_STORAGE_KEY = 'app2_auth';

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

async function apiFetch(path, { token, method = 'GET', body } = {}) {
  const response = await fetch(path, {
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

function HomePage() {
  return (
    <section className="card">
      <h1>Field Service Suite</h1>
      <p>Dispatch jobs, track technicians, and manage service requests from one workspace.</p>
    </section>
  );
}

function LoginPage({ onLogin, isLoggedIn }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('1111');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <section className="card">
      <h1>Login</h1>
      <p>Use any demo account (admin/dispatcher/technician/client) with password `1111`.</p>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label htmlFor="username">Username</label>
        <input id="username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        {error ? <p className="form-error">{error}</p> : null}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </section>
  );
}

function DashboardPage({ token, user }) {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setError('');
        const data = await apiFetch('/api/dashboard/summary', { token });
        if (!cancelled) setSummary(data);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load dashboard');
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <section className="card">
      <h1>Dashboard</h1>
      <p>Signed in as <strong>{user.username}</strong> ({user.role}).</p>
      {error ? <p className="form-error">{error}</p> : null}
      {summary ? (
        <div className="stats-grid">
          <div className="stat"><span>Total jobs</span><strong>{summary.totalJobs}</strong></div>
          <div className="stat"><span>New</span><strong>{summary.newJobs}</strong></div>
          <div className="stat"><span>Assigned</span><strong>{summary.assignedJobs}</strong></div>
          <div className="stat"><span>In progress</span><strong>{summary.inProgressJobs}</strong></div>
          <div className="stat"><span>Completed</span><strong>{summary.completedJobs}</strong></div>
        </div>
      ) : (
        <p>Loading dashboard summary...</p>
      )}
    </section>
  );
}

function JobsPage({ token, user }) {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [workingId, setWorkingId] = useState('');
  const canManageJobs = user.role === 'admin' || user.role === 'dispatcher';
  const isTechnician = user.role === 'technician';

  const [draft, setDraft] = useState({
    title: '',
    location: '',
    priority: 'medium',
    assignedTo: 'technician',
  });

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

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await apiFetch('/api/jobs', { token, method: 'POST', body: draft });
      setDraft({ title: '', location: '', priority: 'medium', assignedTo: 'technician' });
      await fetchJobs();
    } catch (e) {
      setError(e.message || 'Failed to create job');
    }
  };

  const handleStatus = async (jobId, status) => {
    setWorkingId(jobId);
    setError('');
    try {
      await apiFetch(`/api/jobs/${encodeURIComponent(jobId)}/status`, { token, method: 'PATCH', body: { status } });
      await fetchJobs();
    } catch (e) {
      setError(e.message || 'Failed to update status');
    } finally {
      setWorkingId('');
    }
  };

  const handleManagerUpdate = async (job) => {
    setWorkingId(job.id);
    setError('');
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
        },
      });
      await fetchJobs();
    } catch (e) {
      setError(e.message || 'Failed to save job');
    } finally {
      setWorkingId('');
    }
  };

  const patchLocalJob = (jobId, field, value) => {
    setJobs((prev) => prev.map((item) => (item.id === jobId ? { ...item, [field]: value } : item)));
  };

  return (
    <section className="card">
      <h1>Jobs</h1>
      {error ? <p className="form-error">{error}</p> : null}

      {canManageJobs ? (
        <form className="job-create-form" onSubmit={handleCreate}>
          <h2>Create Job</h2>
          <div className="grid-2">
            <input
              placeholder="Job title"
              value={draft.title}
              onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
            />
            <input
              placeholder="Location"
              value={draft.location}
              onChange={(e) => setDraft((prev) => ({ ...prev, location: e.target.value }))}
            />
            <select value={draft.priority} onChange={(e) => setDraft((prev) => ({ ...prev, priority: e.target.value }))}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <select value={draft.assignedTo} onChange={(e) => setDraft((prev) => ({ ...prev, assignedTo: e.target.value }))}>
              <option value="">Unassigned</option>
              <option value="technician">technician</option>
            </select>
          </div>
          <button type="submit" className="btn-primary">Create Job</button>
        </form>
      ) : null}

      {loading ? <p>Loading jobs...</p> : null}
      {!loading && !jobs.length ? <p>No jobs available.</p> : null}
      {!loading && jobs.length ? (
        <div className="jobs-list">
          {jobs.map((job) => (
            <article key={job.id} className="job-item">
              <h3>{job.id}</h3>
              {canManageJobs ? (
                <input value={job.title} onChange={(e) => patchLocalJob(job.id, 'title', e.target.value)} />
              ) : (
                <p className="job-title">{job.title}</p>
              )}

              <div className="job-meta">
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
                  Assigned
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
              </div>

              {canManageJobs ? (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleManagerUpdate(job)}
                  disabled={workingId === job.id}
                >
                  {workingId === job.id ? 'Saving...' : 'Save Job'}
                </button>
              ) : null}

              {isTechnician ? (
                <div className="job-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => handleStatus(job.id, 'in-progress')}
                    disabled={workingId === job.id || job.status === 'in-progress' || job.status === 'completed'}
                  >
                    Start
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => handleStatus(job.id, 'completed')}
                    disabled={workingId === job.id || job.status === 'completed'}
                  >
                    Complete
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ProtectedRoute({ isAuthed, children }) {
  if (!isAuthed) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [auth, setAuth] = useState(() => loadStoredAuth());
  const isAuthed = Boolean(auth && auth.token && auth.user);

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

  const navLinks = useMemo(() => (
    <>
      <NavLink to="/" end>Home</NavLink>
      {isAuthed ? <NavLink to="/dashboard">Dashboard</NavLink> : null}
      {isAuthed ? <NavLink to="/jobs">Jobs</NavLink> : null}
      {!isAuthed ? <NavLink to="/login">Login</NavLink> : null}
    </>
  ), [isAuthed]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">App 2 - Field Service</Link>
        <nav>
          {navLinks}
          {isAuthed ? (
            <button type="button" className="btn-link" onClick={logout}>
              Logout ({auth.user.username})
            </button>
          ) : null}
        </nav>
      </header>

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
        </Routes>
      </main>
    </div>
  );
}
