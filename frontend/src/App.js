import React from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';

function HomePage() {
  return (
    <section className="card">
      <h1>Field Service Suite</h1>
      <p>Dispatch jobs, track technicians, and manage service requests from one workspace.</p>
    </section>
  );
}

function LoginPage() {
  return (
    <section className="card">
      <h1>Login</h1>
      <p>Auth flow will be added in Sprint 2.</p>
    </section>
  );
}

function DashboardPage() {
  return (
    <section className="card">
      <h1>Dashboard</h1>
      <p>Operational KPIs and recent job activity will appear here.</p>
    </section>
  );
}

function JobsPage() {
  return (
    <section className="card">
      <h1>Jobs</h1>
      <p>Work order board scaffold is ready for CRUD integration.</p>
    </section>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">App 2 - Field Service</Link>
        <nav>
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/login">Login</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/jobs">Jobs</NavLink>
        </nav>
      </header>

      <main className="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/jobs" element={<JobsPage />} />
        </Routes>
      </main>
    </div>
  );
}
