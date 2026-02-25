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
        const response = await fetch('/api/dashboard/summary', {
          headers: { Accept: 'application/json', ...toAuthHeader(token) },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load dashboard');
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

function JobsPage({ token }) {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setError('');
        const response = await fetch('/api/jobs', { headers: { Accept: 'application/json', ...toAuthHeader(token) } });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load jobs');
        if (!cancelled) setJobs(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load jobs');
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <section className="card">
      <h1>Jobs</h1>
      {error ? <p className="form-error">{error}</p> : null}
      {!jobs.length ? (
        <p>No jobs available.</p>
      ) : (
        <div className="jobs-list">
          {jobs.map((job) => (
            <article key={job.id} className="job-item">
              <h3>{job.id} - {job.title}</h3>
              <p>Status: <strong>{job.status}</strong></p>
              <p>Priority: <strong>{job.priority}</strong></p>
              {job.assignedTo ? <p>Assigned: <strong>{job.assignedTo}</strong></p> : null}
            </article>
          ))}
        </div>
      )}
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
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Login failed');
    persistAuth(payload);
    return payload;
  }, [persistAuth]);

  const logout = useCallback(async () => {
    if (auth && auth.token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Accept: 'application/json', ...toAuthHeader(auth.token) },
        });
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
                <JobsPage token={auth?.token} />
              </ProtectedRoute>
            )}
          />
        </Routes>
      </main>
    </div>
  );
}
