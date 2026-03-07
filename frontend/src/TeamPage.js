import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from './api';

// ============== TEAM PAGE COMPONENT ==============
export default function TeamPage({ token }) {
  const [technicians, setTechnicians] = useState([]);
  const [skills, setSkills] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [draft, setDraft] = useState({
    name: '',
    email: '',
    phone: '',
    skills: [],
    hourly_rate: 50,
    certifications: [],
    status: 'active',
    color: '#0ea5e9',
    notes: '',
    availability: {
      monday: { start: '08:00', end: '17:00' },
      tuesday: { start: '08:00', end: '17:00' },
      wednesday: { start: '08:00', end: '17:00' },
      thursday: { start: '08:00', end: '17:00' },
      friday: { start: '08:00', end: '17:00' },
      saturday: null,
      sunday: null
    }
  });

  const fetchTechnicians = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/technicians', { token });
      setTechnicians(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Failed to load technicians');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchSkills = useCallback(async () => {
    try {
      const data = await apiFetch('/api/technicians/skills', { token });
      setSkills(Array.isArray(data) ? data : []);
    } catch (e) {
      // Ignore
    }
  }, [token]);

  useEffect(() => {
    fetchTechnicians();
    fetchSkills();
  }, [fetchTechnicians, fetchSkills]);

  const filteredTechnicians = useMemo(() => {
    if (!searchTerm) return technicians;
    const term = searchTerm.toLowerCase();
    return technicians.filter(t => 
      t.name?.toLowerCase().includes(term) ||
      t.email?.toLowerCase().includes(term) ||
      t.phone?.toLowerCase().includes(term) ||
      t.skills?.some(s => s.toLowerCase().includes(term))
    );
  }, [technicians, searchTerm]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (editingId) {
        await apiFetch(`/api/technicians/${encodeURIComponent(editingId)}`, { 
          token, 
          method: 'PUT', 
          body: draft 
        });
        setSuccess('Technician updated successfully.');
      } else {
        await apiFetch('/api/technicians', { token, method: 'POST', body: draft });
        setSuccess('Technician created successfully.');
      }
      setDraft({
        name: '',
        email: '',
        phone: '',
        skills: [],
        hourly_rate: 50,
        certifications: [],
        status: 'active',
        color: '#0ea5e9',
        notes: '',
        availability: {
          monday: { start: '08:00', end: '17:00' },
          tuesday: { start: '08:00', end: '17:00' },
          wednesday: { start: '08:00', end: '17:00' },
          thursday: { start: '08:00', end: '17:00' },
          friday: { start: '08:00', end: '17:00' },
          saturday: null,
          sunday: null
        }
      });
      setShowForm(false);
      setEditingId(null);
      await fetchTechnicians();
    } catch (e) {
      setError(e.message || 'Failed to save technician');
    }
  };

  const handleEdit = (tech) => {
    setDraft({
      name: tech.name || '',
      email: tech.email || '',
      phone: tech.phone || '',
      skills: tech.skills || [],
      hourly_rate: tech.hourly_rate || 50,
      certifications: tech.certifications || [],
      status: tech.status || 'active',
      color: tech.color || '#0ea5e9',
      notes: tech.notes || '',
      availability: tech.availability || {
        monday: { start: '08:00', end: '17:00' },
        tuesday: { start: '08:00', end: '17:00' },
        wednesday: { start: '08:00', end: '17:00' },
        thursday: { start: '08:00', end: '17:00' },
        friday: { start: '08:00', end: '17:00' },
        saturday: null,
        sunday: null
      }
    });
    setEditingId(tech.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this technician?')) return;
    setError('');
    try {
      await apiFetch(`/api/technicians/${encodeURIComponent(id)}`, { token, method: 'DELETE' });
      await fetchTechnicians();
      setSuccess('Technician deleted.');
    } catch (e) {
      setError(e.message || 'Failed to delete technician');
    }
  };

  const cancelForm = () => {
    setDraft({
      name: '',
      email: '',
      phone: '',
      skills: [],
      hourly_rate: 50,
      certifications: [],
      status: 'active',
      color: '#0ea5e9',
      notes: '',
      availability: {
        monday: { start: '08:00', end: '17:00' },
        tuesday: { start: '08:00', end: '17:00' },
        wednesday: { start: '08:00', end: '17:00' },
        thursday: { start: '08:00', end: '17:00' },
        friday: { start: '08:00', end: '17:00' },
        saturday: null,
        sunday: null
      }
    });
    setShowForm(false);
    setEditingId(null);
  };

  const getStatusBadge = (status) => {
    const normalized = normalizeTechnicianStatus(status);
    return <span className={`status-badge ${normalized}`}>{formatTechnicianStatus(normalized)}</span>;
  };

  const getWorkloadColor = (percent) => {
    if (percent < 50) return '#10b981';
    if (percent < 80) return '#f59e0b';
    return '#ef4444';
  };

  const activeCount = technicians.filter((t) => normalizeTechnicianStatus(t.status) === 'active').length;
  const onLeaveCount = technicians.filter((t) => normalizeTechnicianStatus(t.status) === 'on_leave').length;
  const unavailableCount = technicians.filter((t) => normalizeTechnicianStatus(t.status) === 'unavailable').length;

  return (
    <section className="card">
      <div className="page-header">
        <h1>Team Management</h1>
        {!showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>+ Add Technician</button>
        )}
      </div>

      {error ? <div className="form-error-box">{error}</div> : null}
      {success ? <div className="form-success-box">{success}</div> : null}

      {!showForm && (
        <div className="team-stats">
          <div className="team-stat">
            <span className="team-stat-value">{technicians.length}</span>
            <span className="team-stat-label">Total</span>
          </div>
          <div className="team-stat active">
            <span className="team-stat-value">{activeCount}</span>
            <span className="team-stat-label">Active</span>
          </div>
          <div className="team-stat on-leave">
            <span className="team-stat-value">{onLeaveCount}</span>
            <span className="team-stat-label">On Leave</span>
          </div>
          <div className="team-stat unavailable">
            <span className="team-stat-value">{unavailableCount}</span>
            <span className="team-stat-label">Unavailable</span>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={cancelForm}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Technician' : 'New Technician'}</h2>
              <button type="button" className="modal-close" onClick={cancelForm} aria-label="Close dialog">×</button>
            </div>
            <form className="form-section" onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    value={draft.name}
                    onChange={(e) => setDraft(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Full name"
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
                  <label>Hourly Rate ($)</label>
                  <input
                    type="number"
                    value={draft.hourly_rate}
                    onChange={(e) => setDraft(prev => ({ ...prev, hourly_rate: parseFloat(e.target.value) || 0 }))}
                    placeholder="50"
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={draft.status}
                    onChange={(e) => setDraft(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Color</label>
                  <input
                    type="color"
                    value={draft.color}
                    onChange={(e) => setDraft(prev => ({ ...prev, color: e.target.value }))}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Skills (comma-separated)</label>
                  <input
                    value={draft.skills.join(', ')}
                    onChange={(e) => setDraft(prev => ({ 
                      ...prev, 
                      skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    }))}
                    placeholder="HVAC, Electrical, Plumbing"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Certifications (comma-separated)</label>
                  <input
                    value={draft.certifications.join(', ')}
                    onChange={(e) => setDraft(prev => ({ 
                      ...prev, 
                      certifications: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    }))}
                    placeholder="EPA 608, OSHA 10"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Notes</label>
                  <textarea
                    value={draft.notes}
                    onChange={(e) => setDraft(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes..."
                    rows={2}
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Create'}</button>
                <button type="button" className="btn-secondary" onClick={cancelForm}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!showForm && (
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search technicians by name, email, phone, or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search technicians"
          />
        </div>
      )}

      {loading ? <p className="loading">Loading technicians...</p> : null}
      {!loading && !technicians.length ? <p className="empty-state">No technicians yet. Add your first team member!</p> : null}
      {!loading && technicians.length > 0 && filteredTechnicians.length === 0 ? (
        <p className="empty-state">No technicians match your search.</p>
      ) : null}
      {!loading && filteredTechnicians.length > 0 && (
        <div className="team-grid">
          {filteredTechnicians.map((tech) => (
            <div key={tech.id} className="team-card">
              <div className="team-card-header">
                <div 
                  className="team-avatar" 
                  style={{ backgroundColor: tech.color || '#0ea5e9' }}
                >
                  {tech.name?.charAt(0).toUpperCase() || 'T'}
                </div>
                <div className="team-info">
                  <h3>{tech.name}</h3>
                  <p className="team-email">{tech.email}</p>
                  <p className="team-phone">{tech.phone}</p>
                </div>
                {getStatusBadge(tech.status)}
              </div>

              <div className="team-skills">
                {tech.skills && tech.skills.length > 0 ? (
                  tech.skills.map((skill, idx) => (
                    <span key={idx} className="skill-tag">{skill}</span>
                  ))
                ) : (
                  <span className="no-skills">No skills listed</span>
                )}
              </div>

              {tech.workload && (
                <div className="team-workload">
                  <div className="workload-header">
                    <span>Workload</span>
                    <span>{tech.workload.workloadPercent}%</span>
                  </div>
                  <div className="workload-bar">
                    <div 
                      className="workload-fill" 
                      style={{ 
                        width: `${tech.workload.workloadPercent}%`,
                        backgroundColor: getWorkloadColor(tech.workload.workloadPercent)
                      }}
                    />
                  </div>
                  <div className="workload-details">
                    <span>{tech.workload.jobCount} jobs</span>
                    <span>{tech.workload.taskCount} tasks</span>
                    <span>{tech.workload.totalHours}h estimated</span>
                  </div>
                </div>
              )}

              {tech.certifications && tech.certifications.length > 0 && (
                <div className="team-certifications">
                  <strong>Certifications:</strong>
                  <div className="cert-list">
                    {tech.certifications.map((cert, idx) => (
                      <span key={idx} className="cert-badge">{cert}</span>
                    ))}
                  </div>
                </div>
              )}

              {tech.hourly_rate && (
                <div className="team-rate">
                  <span className="rate-label">Rate:</span>
                  <span className="rate-value">${tech.hourly_rate}/hr</span>
                </div>
              )}

              <div className="team-actions">
                <button className="btn-secondary" onClick={() => handleEdit(tech)}>Edit</button>
                <button className="btn-danger" onClick={() => handleDelete(tech.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
  const normalizeTechnicianStatus = (status) => {
    const value = String(status || '').trim().toLowerCase().replace(/[-\s]+/g, '_');
    if (value === 'active' || value === 'on_leave' || value === 'unavailable') return value;
    return 'unknown';
  };

  const formatTechnicianStatus = (status) => {
    if (status === 'on_leave') return 'On Leave';
    if (status === 'unavailable') return 'Unavailable';
    if (status === 'active') return 'Active';
    return 'Unknown';
  };
