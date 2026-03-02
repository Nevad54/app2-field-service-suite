import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

async function apiFetch(path, { token, method = 'GET', body } = {}) {
  const response = await fetch(path, {
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
    const errorMsg = (data && data.error) || `Request failed (${response.status})`;
    console.error('API Error:', path, response.status, data);
    throw new Error(errorMsg);
  }
  return data;
}

// ============== PROJECTS PAGE ==============
export default function ProjectsPage({ token }) {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  const [draft, setDraft] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    priority: 'medium',
    status: 'not_started',
  });


  const [taskDraft, setTaskDraft] = useState({
    name: '',
    description: '',
    assignedTo: '',
    startDate: '',
    dueDate: '',
    status: 'pending',
    progress: 0,
    notes: '',
  });

  // Debug: Log token presence
  useEffect(() => {
    console.log('ProjectsPage received token:', token ? 'Token present' : 'NO TOKEN');
  }, [token]);

  const fetchProjects = useCallback(async () => {
    if (!token) {
      setError('Not authenticated. Please login again.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      console.log('Fetching projects with token...');
      const data = await apiFetch('/api/projects', { token });
      console.log('Projects loaded:', data);
      setProjects(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load projects:', e);
      setError(e.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchTasks = useCallback(async (projectId) => {
    try {
      const data = await apiFetch(`/api/projects/${encodeURIComponent(projectId)}/tasks`, { token });
      setTasks(prev => ({ ...prev, [projectId]: Array.isArray(data) ? data : [] }));
    } catch (e) {
      console.error('Failed to load tasks:', e);
    }
  }, [token]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (selectedProject) {
      fetchTasks(selectedProject.id);
    }
  }, [selectedProject, fetchTasks]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      if (editingId) {
        await apiFetch(`/api/projects/${encodeURIComponent(editingId)}`, { token, method: 'PUT', body: draft });
      } else {
        await apiFetch('/api/projects', { token, method: 'POST', body: draft });
      }
      setDraft({ title: '', description: '', start_date: '', end_date: '', priority: 'medium', status: 'not_started' });
      setShowForm(false);
      setEditingId(null);
      await fetchProjects();
    } catch (e) {
      setError(e.message || 'Failed to save project');
    }
  };


  const handleTaskSubmit = async (event) => {
    event.preventDefault();
    if (!selectedProject) return;
    setError('');
    try {
      await apiFetch(`/api/projects/${encodeURIComponent(selectedProject.id)}/tasks`, { token, method: 'POST', body: taskDraft });
      setTaskDraft({ name: '', description: '', assignedTo: '', startDate: '', dueDate: '', status: 'pending', progress: 0, notes: '' });
      setShowTaskForm(false);
      await fetchTasks(selectedProject.id);
      await fetchProjects();
    } catch (e) {
      setError(e.message || 'Failed to save task');
    }
  };

  const handleEdit = (project) => {
    setDraft({
      title: project.title,
      description: project.description || '',
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      priority: project.priority || 'medium',
      status: project.status || 'not_started',
    });
    setEditingId(project.id);
    setShowForm(true);
  };


  const handleTaskUpdate = async (taskId, updates) => {
    try {
      await apiFetch(`/api/tasks/${encodeURIComponent(taskId)}`, { token, method: 'PUT', body: updates });
      if (selectedProject) {
        await fetchTasks(selectedProject.id);
        await fetchProjects();
      }
    } catch (e) {
      setError(e.message || 'Failed to update task');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project? All tasks will also be deleted.')) return;
    setError('');
    try {
      await apiFetch(`/api/projects/${encodeURIComponent(id)}`, { token, method: 'DELETE' });
      await fetchProjects();
    } catch (e) {
      setError(e.message || 'Failed to delete project');
    }
  };

  const cancelForm = () => {
    setDraft({ title: '', description: '', start_date: '', end_date: '', priority: 'medium', status: 'not_started' });

    setShowForm(false);
    setEditingId(null);
  };

  const cancelTaskForm = () => {
    setTaskDraft({ name: '', description: '', assignedTo: '', startDate: '', dueDate: '', status: 'pending', progress: 0, notes: '' });
    setShowTaskForm(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'not_started': return 'status-new';
      case 'planning': return 'status-new';
      case 'in_progress': return 'status-progress';
      case 'active': return 'status-progress';
      case 'on_hold': return 'status-assigned';
      case 'delayed': return 'status-overdue';
      case 'completed': return 'status-completed';
      default: return '';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'not_started': return 'Not Started';
      case 'planning': return 'Planning';
      case 'in_progress': return 'In Progress';
      case 'active': return 'Active';
      case 'on_hold': return 'On Hold';
      case 'delayed': return 'Delayed';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const getTaskStatusLabel = (status) => {
    const normalized = String(status || '').trim().toLowerCase().replace(/-/g, '_');
    switch (normalized) {
      case 'not_started': return 'Not Started';
      case 'in_progress': return 'In Progress';
      case 'pending': return 'Pending';
      case 'completed': return 'Completed';
      case 'delayed': return 'Delayed';
      default:
        return String(status || '')
          .replace(/[_-]/g, ' ')
          .replace(/\b\w/g, (m) => m.toUpperCase());
    }
  };

  const getTaskStatusClass = (status) => {
    const normalized = String(status || '').trim().toLowerCase().replace(/-/g, '_');
    if (normalized === 'completed') return 'status-completed';
    if (normalized === 'in_progress') return 'status-progress';
    if (normalized === 'delayed') return 'status-overdue';
    return 'status-new';
  };


  const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'in_progress' || p.status === 'not_started' || p.status === 'planning');
  const completedProjects = projects.filter(p => p.status === 'completed');
  const overdueProjects = projects.filter(p => p.status === 'delayed' || p.status === 'overdue');


  return (
    <section className="card">
      <div className="page-header">
        <h1>📁 Projects</h1>
        <div className="header-actions">
          <div className="view-toggle">
            <button className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>▦ Grid</button>
            <button className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>☰ List</button>
            <button className={`toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`} onClick={() => setViewMode('kanban')}>▦ Kanban</button>
          </div>
          {!showForm && <button className="btn-primary" onClick={() => setShowForm(true)}>+ New Project</button>}
        </div>
      </div>

      {error ? <div className="form-error-box">{error}</div> : null}

      <div className="project-stats">
        <div className="stat-card">
          <span className="stat-icon">📋</span>
          <div className="stat-info">
            <span className="stat-value">{projects.length}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>
        <div className="stat-card active">
          <span className="stat-icon">🔄</span>
          <div className="stat-info">
            <span className="stat-value">{activeProjects.length}</span>
            <span className="stat-label">Active</span>
          </div>
        </div>
        <div className="stat-card completed">
          <span className="stat-icon">✅</span>
          <div className="stat-info">
            <span className="stat-value">{completedProjects.length}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
        <div className="stat-card overdue">
          <span className="stat-icon">⚠️</span>
          <div className="stat-info">
            <span className="stat-value">{overdueProjects.length}</span>
            <span className="stat-label">Overdue</span>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="modal-backdrop" onClick={cancelForm}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? '✏️ Edit Project' : '➕ New Project'}</h2>
              <button className="modal-close" onClick={cancelForm}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Project Title *</label>
                    <input value={draft.title} onChange={(e) => setDraft(prev => ({ ...prev, title: e.target.value }))} placeholder="Enter project title" required />
                  </div>
                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea value={draft.description} onChange={(e) => setDraft(prev => ({ ...prev, description: e.target.value }))} placeholder="Project description..." rows={3} />
                  </div>
                  <div className="form-group">
                    <label>Start Date</label>
                    <input type="date" value={draft.start_date} onChange={(e) => setDraft(prev => ({ ...prev, start_date: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Target Deadline</label>
                    <input type="date" value={draft.end_date} onChange={(e) => setDraft(prev => ({ ...prev, end_date: e.target.value }))} />
                  </div>

                  <div className="form-group">
                    <label>Priority</label>
                    <select value={draft.priority} onChange={(e) => setDraft(prev => ({ ...prev, priority: e.target.value }))}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  {editingId && (
                    <div className="form-group">
                      <label>Status</label>
                      <select value={draft.status} onChange={(e) => setDraft(prev => ({ ...prev, status: e.target.value }))}>
                        <option value="not_started">Not Started</option>
                        <option value="planning">Planning</option>
                        <option value="in_progress">In Progress</option>
                        <option value="active">Active</option>
                        <option value="on_hold">On Hold</option>
                        <option value="delayed">Delayed</option>
                        <option value="completed">Completed</option>
                      </select>

                    </div>
                  )}
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

      {loading ? <p className="loading">Loading projects...</p> : null}
      {!loading && !projects.length ? <p className="empty-state">No projects yet. Create your first project!</p> : null}

      {!loading && viewMode === 'grid' && projects.length > 0 && (
        <div className="projects-grid">
          {projects.map(project => (
            <article key={project.id} className="project-card">
              <div className="project-header">
                <h3>{project.title}</h3>
                <span className={`status-badge ${getStatusColor(project.status)}`}>{getStatusLabel(project.status)}</span>
              </div>
              {project.description && <p className="project-description">{project.description}</p>}
              <div className="project-progress">
                <div className="progress-header">
                  <span>Progress</span>
                  <span>{project.overall_progress || 0}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${project.overall_progress || 0}%` }}></div>
                </div>
              </div>

              <div className="project-meta">
                <span className={`priority-badge ${project.priority}`}>{project.priority}</span>
                {project.start_date && <span>📅 {new Date(project.start_date).toLocaleDateString()}</span>}
                {project.end_date && <span>⏰ {new Date(project.end_date).toLocaleDateString()}</span>}
                <span>📋 {project.taskCount || 0} tasks</span>
              </div>

              <div className="project-actions">
                <button className="btn-secondary" onClick={() => { setSelectedProject(project); setActiveTab('details'); }}>👁️ View</button>
                <Link to={`/project-planner/${encodeURIComponent(project.id)}`} className="btn-secondary">📊 Planner</Link>
                <button className="btn-secondary" onClick={() => handleEdit(project)}>✏️ Edit</button>
                <button className="btn-danger" onClick={() => handleDelete(project.id)}>🗑️</button>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && viewMode === 'list' && projects.length > 0 && (
        <div className="projects-list">
          <table className="data-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Progress</th>
                <th>Start</th>
                <th>Deadline</th>
                <th>Tasks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(project => (
                <tr key={project.id}>
                  <td><strong>{project.title}</strong></td>
                  <td><span className={`status-badge ${getStatusColor(project.status)}`}>{getStatusLabel(project.status)}</span></td>
                  <td><span className={`priority-badge ${project.priority}`}>{project.priority}</span></td>
                <td><div className="mini-progress"><div className="mini-progress-fill" style={{ width: `${project.overall_progress || 0}%` }}></div><span>{project.overall_progress || 0}%</span></div></td>
                <td>{project.start_date ? new Date(project.start_date).toLocaleDateString() : '-'}</td>
                <td>{project.end_date ? new Date(project.end_date).toLocaleDateString() : '-'}</td>

                  <td>{project.taskCount || 0}</td>
                  <td>
                    <button className="btn-icon" onClick={() => handleEdit(project)}>✏️</button>
                    <button className="btn-icon btn-danger" onClick={() => handleDelete(project.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && viewMode === 'kanban' && projects.length > 0 && (
        <div className="kanban-board">
          <div className="kanban-column">
            <h3>📋 Not Started ({projects.filter(p => p.status === 'not_started' || p.status === 'planning').length})</h3>
            <div className="kanban-cards">
              {projects.filter(p => p.status === 'not_started' || p.status === 'planning').map(project => (

              <div key={project.id} className="kanban-card" onClick={() => setSelectedProject(project)}>
                <h4>{project.title}</h4>
                <div className="kanban-meta"><span className={`priority-badge ${project.priority}`}>{project.priority}</span><span>{project.overall_progress || 0}%</span></div>
              </div>

              ))}
            </div>
          </div>
          <div className="kanban-column">
            <h3>🔄 Active ({projects.filter(p => p.status === 'active' || p.status === 'in_progress').length})</h3>
            <div className="kanban-cards">
              {projects.filter(p => p.status === 'active' || p.status === 'in_progress').map(project => (

              <div key={project.id} className="kanban-card" onClick={() => setSelectedProject(project)}>
                <h4>{project.title}</h4>
                <div className="kanban-progress"><div className="progress-bar"><div className="progress-fill" style={{ width: `${project.overall_progress || 0}%` }}></div></div><span>{project.overall_progress || 0}%</span></div>
              </div>

              ))}
            </div>
          </div>
          <div className="kanban-column">
            <h3>⚠️ Delayed ({projects.filter(p => p.status === 'delayed').length})</h3>
            <div className="kanban-cards">
              {projects.filter(p => p.status === 'delayed').map(project => (

                <div key={project.id} className="kanban-card" onClick={() => setSelectedProject(project)}><h4>{project.title}</h4></div>
              ))}
            </div>
          </div>
          <div className="kanban-column">
            <h3>✅ Completed ({projects.filter(p => p.status === 'completed').length})</h3>
            <div className="kanban-cards">
              {projects.filter(p => p.status === 'completed').map(project => (
                <div key={project.id} className="kanban-card completed" onClick={() => setSelectedProject(project)}><h4>{project.title}</h4></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedProject && (
        <div className="modal-overlay" onClick={() => setSelectedProject(null)}>
          <div className="modal-content project-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedProject.title}</h2>
              <button className="btn-icon" onClick={() => setSelectedProject(null)}>✕</button>
            </div>
            <div className="tabs">
              <button className={`tab ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>Details</button>
              <button className={`tab ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>Tasks ({tasks[selectedProject.id]?.length || 0})</button>
            </div>
            {activeTab === 'details' && (
              <div className="tab-content">
                <div className="detail-row"><span>Status:</span><span className={`status-badge ${getStatusColor(selectedProject.status)}`}>{getStatusLabel(selectedProject.status)}</span></div>
                <div className="detail-row"><span>Priority:</span><span className={`priority-badge ${selectedProject.priority}`}>{selectedProject.priority}</span></div>
                <div className="detail-row"><span>Progress:</span><span>{selectedProject.overall_progress || 0}%</span></div>
                <div className="detail-row"><span>Start Date:</span><span>{selectedProject.start_date ? new Date(selectedProject.start_date).toLocaleDateString() : '-'}</span></div>
                <div className="detail-row"><span>Deadline:</span><span>{selectedProject.end_date ? new Date(selectedProject.end_date).toLocaleDateString() : '-'}</span></div>

                {selectedProject.description && <div className="detail-row"><span>Description:</span><span>{selectedProject.description}</span></div>}
              </div>
            )}
            {activeTab === 'tasks' && (
              <div className="tab-content">
                <div className="tasks-header">
                  <h3>Tasks</h3>
                  <button className="btn-primary" onClick={() => setShowTaskForm(true)}>+ Add Task</button>
                </div>
                {showTaskForm && (
                  <form className="form-section task-form" onSubmit={handleTaskSubmit}>
                    <div className="form-grid">
                      <div className="form-group full-width">
                        <label>Task Name *</label>
                        <input value={taskDraft.name} onChange={(e) => setTaskDraft(prev => ({ ...prev, name: e.target.value }))} placeholder="Task name" required />
                      </div>
                      <div className="form-group full-width">
                        <label>Description</label>
                        <textarea value={taskDraft.description} onChange={(e) => setTaskDraft(prev => ({ ...prev, description: e.target.value }))} placeholder="Task description..." rows={2} />
                      </div>
                      <div className="form-group">
                        <label>Start Date</label>
                        <input type="date" value={taskDraft.startDate} onChange={(e) => setTaskDraft(prev => ({ ...prev, startDate: e.target.value }))} />
                      </div>
                      <div className="form-group">
                        <label>Due Date</label>
                        <input type="date" value={taskDraft.dueDate} onChange={(e) => setTaskDraft(prev => ({ ...prev, dueDate: e.target.value }))} />
                      </div>
                      <div className="form-group">
                        <label>Status</label>
                        <select value={taskDraft.status} onChange={(e) => setTaskDraft(prev => ({ ...prev, status: e.target.value }))}>
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Progress %</label>
                        <input type="number" min="0" max="100" value={taskDraft.progress} onChange={(e) => setTaskDraft(prev => ({ ...prev, progress: parseInt(e.target.value) || 0 }))} />
                      </div>
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn-primary">Add Task</button>
                      <button type="button" className="btn-secondary" onClick={cancelTaskForm}>Cancel</button>
                    </div>
                  </form>
                )}
                <div className="tasks-list">
                  {(tasks[selectedProject.id] || []).map(task => (
                    <div key={task.id} className={`task-item ${task.status}`}>
                      <div className="task-header">
                        <h4>{task.name}</h4>
                        <span className={`status-badge ${getTaskStatusClass(task.status)}`}>{getTaskStatusLabel(task.status)}</span>
                      </div>
                      {task.description && <p>{task.description}</p>}
                      <div className="task-meta">
                        <span>📅 {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</span>
                        <span>📊 {task.progress}%</span>
                      </div>
                      <div className="task-progress">
                        <div className="progress-bar"><div className="progress-fill" style={{ width: `${task.progress}%` }}></div></div>
                      </div>
                      <div className="task-actions">
                        <button
                          className="btn-secondary"
                          onClick={() => {
                            const normalized = String(task.status || '').trim().toLowerCase().replace(/-/g, '_');
                            const nextStatus = task.progress === 100
                              ? 'pending'
                              : (normalized === 'pending' || normalized === 'not_started')
                                ? 'in-progress'
                                : task.progress === 75
                                  ? 'completed'
                                  : task.status;
                            handleTaskUpdate(task.id, {
                              progress: task.progress === 100 ? 0 : task.progress + 25,
                              status: nextStatus
                            });
                          }}
                        >
                          {(() => {
                            const normalized = String(task.status || '').trim().toLowerCase().replace(/-/g, '_');
                            if (normalized === 'pending' || normalized === 'not_started') return '▶️ Start';
                            if (normalized === 'in_progress') return '✅ Complete';
                            return '🔄 Reopen';
                          })()}
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!tasks[selectedProject.id] || tasks[selectedProject.id].length === 0) && <p className="empty-state">No tasks yet.</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
