import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

const HOUR_WIDTH = 64;
const EXPAND_HOURS = 24;
const EDGE_THRESHOLD = 240;

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
  if (!response.ok) throw new Error((data && data.error) || 'Request failed');
  return data;
}

const toIsoHour = (value) => {
  const d = new Date(value || Date.now());
  d.setMinutes(0, 0, 0);
  return d.toISOString();
};

const addHoursIso = (iso, hours) => new Date(new Date(iso).getTime() + hours * 3600000).toISOString();
const hoursBetween = (a, b) => (new Date(b).getTime() - new Date(a).getTime()) / 3600000;
const formatHour = (iso) => new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric' });
const formatDateTimeInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const tzOffset = d.getTimezoneOffset() * 60000;
  const local = new Date(d.getTime() - tzOffset);
  return local.toISOString().slice(0, 16);
};

const statusColor = {
  scheduled: 'fp-status-scheduled',
  in_progress: 'fp-status-progress',
  paused: 'fp-status-paused',
  completed: 'fp-status-completed',
};

export default function ProjectPlanner({ token }) {
  const { projectId } = useParams();

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  const [timelineStart, setTimelineStart] = useState(() => addHoursIso(toIsoHour(new Date()), -24));
  const [timelineEnd, setTimelineEnd] = useState(() => addHoursIso(toIsoHour(new Date()), 72));

  const [draft, setDraft] = useState({
    name: '',
    assignedUserId: 'technician',
    plannedStart: formatDateTimeInput(addHoursIso(toIsoHour(new Date()), 1)),
    plannedEnd: formatDateTimeInput(addHoursIso(toIsoHour(new Date()), 5)),
  });

  const scrollRef = useRef(null);
  const extendingRef = useRef(false);

  const canManage = ['admin', 'dispatcher'].includes(currentUser?.role);

  const loadProjects = useCallback(async () => {
    const data = await apiFetch('/api/projects', { token });
    const list = Array.isArray(data) ? data : [];
    setProjects(list);
    if (!selectedProjectId && list.length) {
      setSelectedProjectId(list[0].id);
    }
  }, [token, selectedProjectId]);

  const loadTasks = useCallback(async () => {
    if (!selectedProjectId) {
      setTasks([]);
      return;
    }

    const data = await apiFetch(`/api/projects/${encodeURIComponent(selectedProjectId)}/tasks`, { token });
    const list = Array.isArray(data) ? data : [];
    setTasks(list);

    if (list.length) {
      const starts = list.map((t) => new Date(t.plannedStart).getTime()).filter((v) => !Number.isNaN(v));
      const ends = list.map((t) => new Date(t.plannedEnd).getTime()).filter((v) => !Number.isNaN(v));
      if (starts.length && ends.length) {
        const min = new Date(Math.min(...starts));
        const max = new Date(Math.max(...ends));
        min.setHours(min.getHours() - 12, 0, 0, 0);
        max.setHours(max.getHours() + 24, 0, 0, 0);
        setTimelineStart(min.toISOString());
        setTimelineEnd(max.toISOString());
      }
    }
  }, [selectedProjectId, token]);

  const loadUser = useCallback(async () => {
    const data = await apiFetch('/api/auth/me', { token });
    setCurrentUser(data.user || null);
  }, [token]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        await Promise.all([loadProjects(), loadUser()]);
      } catch (e) {
        if (active) setError(e.message || 'Failed to load planner');
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => { active = false; };
  }, [loadProjects, loadUser]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        await loadTasks();
      } catch (e) {
        if (active) setError(e.message || 'Failed to load tasks');
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => { active = false; };
  }, [loadTasks]);

  const timelineHours = useMemo(() => {
    const count = Math.max(1, Math.ceil(hoursBetween(timelineStart, timelineEnd)));
    return Array.from({ length: count }, (_, i) => addHoursIso(timelineStart, i));
  }, [timelineStart, timelineEnd]);

  const nowLineLeft = useMemo(() => {
    const now = new Date().toISOString();
    const h = hoursBetween(timelineStart, now);
    return h * HOUR_WIDTH;
  }, [timelineStart]);

  const computeMetrics = (task) => {
    const planned = Math.max(0, hoursBetween(task.plannedStart, task.plannedEnd));
    const actual = task.actualStart
      ? Math.max(0, hoursBetween(task.actualStart, task.actualEnd || new Date().toISOString()))
      : 0;
    const variance = task.actualEnd ? actual - planned : null;
    return { planned, actual, variance };
  };

  const applyTaskUpdate = (taskId, updater) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updater } : t)));
  };

  const refreshTasks = async () => {
    try {
      await loadTasks();
    } catch (_) {}
  };

  const doAttendance = async (task, action) => {
    const prev = task;
    const optimistic = { ...task };
    if (action === 'start') {
      optimistic.actualStart = optimistic.actualStart || new Date().toISOString();
      optimistic.status = 'in_progress';
    }
    if (action === 'pause') optimistic.status = 'paused';
    if (action === 'resume') {
      optimistic.actualStart = optimistic.actualStart || new Date().toISOString();
      optimistic.status = 'in_progress';
    }
    if (action === 'finish') {
      optimistic.actualStart = optimistic.actualStart || new Date().toISOString();
      optimistic.actualEnd = new Date().toISOString();
      optimistic.status = 'completed';
    }

    applyTaskUpdate(task.id, optimistic);

    try {
      const updated = await apiFetch(`/api/tasks/${encodeURIComponent(task.id)}/${action}`, { token, method: 'POST' });
      applyTaskUpdate(task.id, updated);
    } catch (e) {
      applyTaskUpdate(task.id, prev);
      setError(e.message || 'Attendance action failed');
    }
  };

  const saveTaskSchedule = async (task) => {
    try {
      const updated = await apiFetch(`/api/tasks/${encodeURIComponent(task.id)}`, {
        token,
        method: 'PUT',
        body: {
          name: task.name,
          assignedUserId: task.assignedUserId,
          plannedStart: task.plannedStart,
          plannedEnd: task.plannedEnd,
          status: task.status,
        },
      });
      applyTaskUpdate(task.id, updated);
    } catch (e) {
      setError(e.message || 'Failed to save task');
      await refreshTasks();
    }
  };

  const createTask = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        name: draft.name,
        assignedUserId: draft.assignedUserId,
        plannedStart: new Date(draft.plannedStart).toISOString(),
        plannedEnd: new Date(draft.plannedEnd).toISOString(),
      };
      const created = await apiFetch(`/api/projects/${encodeURIComponent(selectedProjectId)}/tasks`, { token, method: 'POST', body: payload });
      setTasks((prev) => [created, ...prev]);
      setDraft((prev) => ({ ...prev, name: '' }));
    } catch (e) {
      setError(e.message || 'Failed to create task');
    }
  };

  const canControlAttendance = (task) => {
    if (!currentUser) return false;
    if (['admin', 'dispatcher'].includes(currentUser.role)) return true;
    return currentUser.role === 'technician' && String(task.assignedUserId || task.assignedTo) === String(currentUser.username);
  };

  const onScrollTimeline = () => {
    const node = scrollRef.current;
    if (!node || extendingRef.current) return;

    const nearLeft = node.scrollLeft < EDGE_THRESHOLD;
    const nearRight = node.scrollLeft + node.clientWidth > node.scrollWidth - EDGE_THRESHOLD;

    if (nearLeft) {
      extendingRef.current = true;
      setTimelineStart((prev) => {
        const next = addHoursIso(prev, -EXPAND_HOURS);
        setTimeout(() => {
          if (scrollRef.current) scrollRef.current.scrollLeft += EXPAND_HOURS * HOUR_WIDTH;
          extendingRef.current = false;
        }, 0);
        return next;
      });
      return;
    }

    if (nearRight) {
      extendingRef.current = true;
      setTimelineEnd((prev) => {
        const next = addHoursIso(prev, EXPAND_HOURS);
        setTimeout(() => {
          extendingRef.current = false;
        }, 0);
        return next;
      });
    }
  };

  return (
    <div className="fp-shell">
      <div className="fp-toolbar">
        <h2>Project Planner</h2>
        <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}>
          <option value="">Select project...</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </div>

      {error ? <div className="fp-error">{error}</div> : null}
      {loading ? <div className="fp-loading">Loading...</div> : null}

      {!loading && selectedProjectId ? (
        <div className="fp-layout">
          <section className="fp-left">
            {canManage ? (
              <form className="fp-create" onSubmit={createTask}>
                <input
                  placeholder="Task name"
                  value={draft.name}
                  onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
                <input
                  type="datetime-local"
                  value={draft.plannedStart}
                  onChange={(e) => setDraft((prev) => ({ ...prev, plannedStart: e.target.value }))}
                  required
                />
                <input
                  type="datetime-local"
                  value={draft.plannedEnd}
                  onChange={(e) => setDraft((prev) => ({ ...prev, plannedEnd: e.target.value }))}
                  required
                />
                <select value={draft.assignedUserId} onChange={(e) => setDraft((prev) => ({ ...prev, assignedUserId: e.target.value }))}>
                  <option value="technician">technician</option>
                  <option value="dispatcher">dispatcher</option>
                  <option value="admin">admin</option>
                </select>
                <button type="submit">Add Task</button>
              </form>
            ) : null}

            <div className="fp-task-table">
              {tasks.map((task) => {
                const metrics = computeMetrics(task);
                return (
                  <div key={task.id} className="fp-task-row">
                    <input
                      value={task.name}
                      disabled={!canManage}
                      onChange={(e) => applyTaskUpdate(task.id, { name: e.target.value })}
                      onBlur={() => canManage && saveTaskSchedule(task)}
                    />
                    <input
                      type="datetime-local"
                      value={formatDateTimeInput(task.plannedStart)}
                      disabled={!canManage}
                      onChange={(e) => applyTaskUpdate(task.id, { plannedStart: new Date(e.target.value).toISOString() })}
                      onBlur={() => canManage && saveTaskSchedule(task)}
                    />
                    <input
                      type="datetime-local"
                      value={formatDateTimeInput(task.plannedEnd)}
                      disabled={!canManage}
                      onChange={(e) => applyTaskUpdate(task.id, { plannedEnd: new Date(e.target.value).toISOString() })}
                      onBlur={() => canManage && saveTaskSchedule(task)}
                    />
                    <div className="fp-metrics">P {metrics.planned.toFixed(1)}h</div>
                    <div className="fp-metrics">A {metrics.actual.toFixed(1)}h</div>
                    <div className="fp-metrics">V {metrics.variance == null ? '-' : metrics.variance.toFixed(1) + 'h'}</div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="fp-right">
            <div className="fp-hours" ref={scrollRef} onScroll={onScrollTimeline}>
              <div className="fp-hours-inner" style={{ width: `${timelineHours.length * HOUR_WIDTH}px` }}>
                <div className="fp-hours-header">
                  {timelineHours.map((h) => (
                    <div key={h} className="fp-hour" style={{ width: `${HOUR_WIDTH}px` }}>{formatHour(h)}</div>
                  ))}
                </div>

                <div className="fp-now" style={{ left: `${nowLineLeft}px` }} />

                {tasks.map((task) => {
                  const left = hoursBetween(timelineStart, task.plannedStart) * HOUR_WIDTH;
                  const width = Math.max(HOUR_WIDTH / 2, hoursBetween(task.plannedStart, task.plannedEnd) * HOUR_WIDTH);
                  const actualWidth = task.actualStart
                    ? Math.max(0, Math.min(width, hoursBetween(task.plannedStart, task.actualEnd || new Date().toISOString()) * HOUR_WIDTH))
                    : 0;

                  return (
                    <div key={task.id} className="fp-track-row">
                      <div className={`fp-bar ${statusColor[task.status] || 'fp-status-scheduled'}`} style={{ left: `${left}px`, width: `${width}px` }}>
                        <div className="fp-bar-fill" style={{ width: `${actualWidth}px` }} />
                        <span className="fp-bar-label">{task.name}</span>
                        <span className="fp-bar-time">{formatHour(task.plannedStart)} - {formatHour(task.plannedEnd)}</span>
                      </div>

                      {canControlAttendance(task) ? (
                        <div className="fp-actions">
                          {task.status === 'scheduled' ? <button onClick={() => doAttendance(task, 'start')}>Start</button> : null}
                          {task.status === 'in_progress' ? <button onClick={() => doAttendance(task, 'pause')}>Pause</button> : null}
                          {task.status === 'in_progress' ? <button onClick={() => doAttendance(task, 'finish')}>Finish</button> : null}
                          {task.status === 'paused' ? <button onClick={() => doAttendance(task, 'resume')}>Resume</button> : null}
                          {task.status === 'paused' ? <button onClick={() => doAttendance(task, 'finish')}>Finish</button> : null}
                        </div>
                      ) : (
                        <div className="fp-actions fp-readonly">Read only</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
