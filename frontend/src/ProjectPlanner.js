// ============== PROJECT PLANNER - EXCEL-STYLE TIMELINE SCHEDULER ==============
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import './ProjectPlanner.css';


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
    throw new Error((data && data.error) || 'Request failed');
  }
  return data;
}

// ============== HELPER FUNCTIONS ==============
const calculateDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end - start;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 ? diffDays + 1 : 0;
};

const calculateStatus = (progress, endDate) => {
  if (!progress || progress === 0) return 'not_started';
  if (progress === 100) return 'completed';
  
  if (endDate) {
    const today = new Date();
    const end = new Date(endDate);
    if (end < today && progress < 100) {
      return 'delayed';
    }
  }
  return 'in_progress';
};

const calculateContribution = (progress, weight) => {
  if (!weight || !progress) return 0;
  return (progress * weight) / 100;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatShortDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
const toIsoDate = (date) => date.toISOString().split('T')[0];
const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};
const dateKey = (date) => toIsoDate(new Date(date));

const PHASE_ACTIVITY_LIBRARY = [
  {
    phase: 'Phase 1: Mobilization, 5S, Permitting',
    durationDays: 14,
    weight: 12,
    activities: [
      { name: '5S Setup & Safety Orientation', trade: 'General', scope: 'Work area setup, toolbox talks, safety controls' },
      { name: 'Survey, Layout & Marking', trade: 'Civil', scope: 'Site checks, dimensions, service route markings' },
      { name: 'Permitting & Approvals', trade: 'Admin/Engineering', scope: 'Permit filing, approvals, authority coordination' },
    ],
  },
  {
    phase: 'Phase 2: Civil, Structural & Utilities Prep',
    durationDays: 21,
    weight: 18,
    activities: [
      { name: 'Demolition & Hauling', trade: 'Civil', scope: 'Selective demolition, debris hauling, disposal' },
      { name: 'Hot Works (Cutting/Welding)', trade: 'Welding', scope: 'Bracket, support, and steel modification works' },
      { name: 'Piping Rough-In', trade: 'Piping', scope: 'Hot/cold water and drainage pipe rough-ins' },
      { name: 'Electrical Raceway Rough-In', trade: 'Electrical', scope: 'Conduits, cable trays, junction box prep' },
    ],
  },
  {
    phase: 'Phase 3: MEP Installation',
    durationDays: 28,
    weight: 24,
    activities: [
      { name: 'Electrical Wiring & Panel Work', trade: 'Electrical', scope: 'Feeder pulls, branch circuits, panel terminations' },
      { name: 'Piping Installation (Hot & Cold)', trade: 'Piping', scope: 'Pipe installation, supports, insulation prep' },
      { name: 'HVAC Ducting & Equipment Set', trade: 'Mechanical', scope: 'Duct routes, AHU/FCU placements, connections' },
      { name: 'Welding/Fabrication Adjustments', trade: 'Welding', scope: 'Site-fit fabrication and weld corrections' },
    ],
  },
  {
    phase: 'Phase 4: Finishes, Testing & Commissioning',
    durationDays: 21,
    weight: 24,
    activities: [
      { name: 'Painting & Surface Restoration', trade: 'Finishes', scope: 'Patch, prime, and paint all affected areas' },
      { name: 'Electrical Testing & Energization', trade: 'Electrical', scope: 'Megger tests, continuity, energization sequence' },
      { name: 'Piping Pressure Test & Flushing', trade: 'Piping', scope: 'Leak test, flushing, and balancing support' },
      { name: 'Cold Works Commissioning', trade: 'Mechanical', scope: 'Startup checks and cooling performance tests' },
    ],
  },
  {
    phase: 'Phase 5: Inspections, Closeout & Handover',
    durationDays: 14,
    weight: 22,
    activities: [
      { name: 'Authority Inspection Walkthrough', trade: 'QA/QC', scope: 'Final punchlist and authority walkthrough' },
      { name: 'Permit Closure Documentation', trade: 'Admin/Engineering', scope: 'As-builts, test reports, permit closeout pack' },
      { name: 'Client Training & Handover', trade: 'Operations', scope: 'O&M orientation, turnover checklist, sign-off' },
    ],
  },
];

const isSameDay = (d1, d2) => {
  if (!d1 || !d2) return false;
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
};

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

// ============== MAIN COMPONENT ==============
export default function ProjectPlanner({ token }) {
  const { projectId } = useParams();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [plannerActionBusy, setPlannerActionBusy] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [timelineScale, setTimelineScale] = useState('week');
  const [hourlyFocusDate, setHourlyFocusDate] = useState('');
  const [editingCell, setEditingCell] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'sort_order', direction: 'asc' });
  const [showActivities, setShowActivities] = useState(false);

  const formatActivityTaskName = (activity) => `${activity.name} - ${activity.trade}`;
  const normalizeActivityKey = (name) =>
    String(name || '')
      .toLowerCase()
      .split(' - ')[0]
      .replace(/[^a-z0-9 ]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  
  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Load project data when selected
  useEffect(() => {
    if (projectId) {
      loadProjectData(projectId);
    } else if (selectedProject) {
      loadProjectData(selectedProject.id);
    }
  }, [projectId, selectedProject]);

  useEffect(() => {
    if (!hourlyFocusDate) {
      const base = selectedProject?.start_date || tasks.find((t) => t.start_date)?.start_date || toIsoDate(new Date());
      setHourlyFocusDate(base);
    }
  }, [selectedProject, tasks, hourlyFocusDate]);

  const loadProjects = async () => {
    try {
      const data = await apiFetch('/api/projects', { token });
      setProjects(data);
      if (data.length > 0 && !projectId) {
        setSelectedProject(data[0]);
      }
      if (projectId) {
        const project = data.find(p => p.id === projectId);
        if (project) setSelectedProject(project);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const loadProjectData = async (pid) => {
    try {
      setLoading(true);
      const [plannerData] = await Promise.all([
        apiFetch(`/api/projects/${pid}/planner`, { token })
      ]);
      setTasks(plannerData.tasks || []);
      setSummary(plannerData.summary || null);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Sorting function
  const sortedTasks = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];
    
    const sorted = [...tasks].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      // Handle dates
      if (sortConfig.key === 'start_date' || sortConfig.key === 'end_date') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }
      
      // Handle status
      if (sortConfig.key === 'status') {
        const statusOrder = { not_started: 0, in_progress: 1, delayed: 2, completed: 3 };
        aValue = statusOrder[aValue] || 0;
        bValue = statusOrder[bValue] || 0;
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [tasks, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const updateTask = async (taskId, updates) => {
    try {
      const updated = await apiFetch(`/api/tasks/${taskId}`, {
        token,
        method: 'PUT',
        body: updates
      });
      
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updated } : t));
      
      // Reload summary for accurate progress
      if (selectedProject) {
        const plannerData = await apiFetch(`/api/projects/${selectedProject.id}/planner`, { token });
        setSummary(plannerData.summary);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const updateTaskProgress = async (taskId, progress) => {
    try {
      const updated = await apiFetch(`/api/tasks/${taskId}/progress`, {
        token,
        method: 'PATCH',
        body: { progress_percent: progress }
      });
      
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updated } : t));
      
      // Reload summary
      if (selectedProject) {
        const plannerData = await apiFetch(`/api/projects/${selectedProject.id}/planner`, { token });
        setSummary(plannerData.summary);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const updateTaskDates = async (taskId, startDate, endDate) => {
    try {
      const updated = await apiFetch(`/api/tasks/${taskId}/dates`, {
        token,
        method: 'PATCH',
        body: { start_date: startDate, end_date: endDate }
      });
      
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updated } : t));
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await apiFetch(`/api/tasks/${taskId}`, { token, method: 'DELETE' });
      setTasks(prev => prev.filter(t => t.id !== taskId));
      
      // Reload summary
      if (selectedProject) {
        const plannerData = await apiFetch(`/api/projects/${selectedProject.id}/planner`, { token });
        setSummary(plannerData.summary);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const addTask = async (parentId = null) => {
    if (!selectedProject) return;
    
    try {
      const newTask = await apiFetch('/api/tasks', {
        token,
        method: 'POST',
        body: {
          project_id: selectedProject.id,
          parent_task_id: parentId,
          name: 'New Task',
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          progress_percent: 0,
          weight: 1
        }
      });
      
      setTasks(prev => [...prev, newTask]);
      
      // Reload summary
      const plannerData = await apiFetch(`/api/projects/${selectedProject.id}/planner`, { token });
      setSummary(plannerData.summary);
    } catch (err) {
      setError(err.message);
    }
  };

  const addStandardPhaseTemplate = async () => {
    if (!selectedProject || plannerActionBusy) return;
    setError('');
    setNotice('');
    setPlannerActionBusy(true);

    const parentCount = tasks.filter((t) => !t.parent_task_id).length;
    if (parentCount > 0) {
      const shouldContinue = window.confirm(
        'This project already has tasks. Add the standard phase template anyway?'
      );
      if (!shouldContinue) {
        setPlannerActionBusy(false);
        return;
      }
    }

    try {
      const latest = await apiFetch(`/api/projects/${selectedProject.id}/planner`, { token });
      const latestTasks = Array.isArray(latest.tasks) ? [...latest.tasks] : [];
      const newTasks = [];

      const startBase = selectedProject.start_date
        ? new Date(selectedProject.start_date)
        : new Date();
      let cursor = new Date(startBase);
      const sortSeed = latestTasks.length + 1;

      for (let p = 0; p < PHASE_ACTIVITY_LIBRARY.length; p += 1) {
        const phase = PHASE_ACTIVITY_LIBRARY[p];
        const phaseStart = new Date(cursor);
        const phaseEnd = addDays(phaseStart, phase.durationDays - 1);

        let parent = latestTasks.find(
          (t) => !t.parent_task_id && normalizeActivityKey(t.name) === normalizeActivityKey(phase.phase)
        );

        if (!parent) {
          parent = await apiFetch('/api/tasks', {
            token,
            method: 'POST',
            body: {
              project_id: selectedProject.id,
              parent_task_id: null,
              name: phase.phase,
              start_date: toIsoDate(phaseStart),
              end_date: toIsoDate(phaseEnd),
              progress_percent: 0,
              weight: phase.weight,
              notes: 'Auto-generated phase template',
              sort_order: sortSeed + p,
            },
          });
          latestTasks.push(parent);
          newTasks.push(parent);
        }

        const subDuration = Math.max(1, Math.floor(phase.durationDays / phase.activities.length));
        let subCursor = new Date(phaseStart);

        for (let s = 0; s < phase.activities.length; s += 1) {
          const activity = phase.activities[s];
          const name = formatActivityTaskName(activity);
          const exists = latestTasks.some(
            (t) => t.parent_task_id === parent.id && normalizeActivityKey(t.name) === normalizeActivityKey(name)
          );

          const isLast = s === phase.activities.length - 1;
          const subStart = new Date(subCursor);
          const subEnd = isLast ? new Date(phaseEnd) : addDays(subStart, subDuration - 1);

          if (!exists) {
            const child = await apiFetch('/api/tasks', {
              token,
              method: 'POST',
              body: {
                project_id: selectedProject.id,
                parent_task_id: parent.id,
                name,
                start_date: toIsoDate(subStart),
                end_date: toIsoDate(subEnd),
                progress_percent: 0,
                weight: 1,
                notes: `Trade: ${activity.trade}. Scope: ${activity.scope}.`,
                sort_order: s + 1,
              },
            });
            latestTasks.push(child);
            newTasks.push(child);
          }

          subCursor = addDays(subEnd, 1);
        }

        cursor = addDays(phaseEnd, 1);
      }

      const plannerData = await apiFetch(`/api/projects/${selectedProject.id}/planner`, { token });
      setTasks(plannerData.tasks || []);
      setSummary(plannerData.summary || null);
      setNotice(
        newTasks.length > 0
          ? `Standard template updated (${newTasks.length} new tasks).`
          : 'Template already exists. No new tasks added.'
      );
    } catch (err) {
      setError(err.message || 'Failed to add standard phase template');
    } finally {
      setPlannerActionBusy(false);
    }
  };

  const populateActivitiesForExistingPhases = async () => {
    if (!selectedProject || plannerActionBusy) return;
    setError('');
    setNotice('');
    setPlannerActionBusy(true);

    try {
      const latest = await apiFetch(`/api/projects/${selectedProject.id}/planner`, { token });
      const latestTasks = Array.isArray(latest.tasks) ? [...latest.tasks] : [];
      const parentTasks = latestTasks.filter((t) => !t.parent_task_id);

      if (parentTasks.length === 0) {
        setError('No phases found. Add phases first, then populate activities.');
        return;
      }

      const createdTasks = [];

      for (let p = 0; p < parentTasks.length; p += 1) {
        const phaseTask = parentTasks[p];
        const lib = PHASE_ACTIVITY_LIBRARY[p % PHASE_ACTIVITY_LIBRARY.length];
        const existingChildren = latestTasks.filter((t) => t.parent_task_id === phaseTask.id);

        const missing = lib.activities.filter((activity) => {
          const key = normalizeActivityKey(activity.name);
          return !existingChildren.some((child) => normalizeActivityKey(child.name) === key);
        });

        if (missing.length === 0) continue;

        const phaseStart = phaseTask.start_date ? new Date(phaseTask.start_date) : new Date();
        const phaseEnd = phaseTask.end_date
          ? new Date(phaseTask.end_date)
          : addDays(phaseStart, Math.max(7, missing.length * 2));
        const phaseDuration = Math.max(1, calculateDuration(toIsoDate(phaseStart), toIsoDate(phaseEnd)));
        const subDuration = Math.max(1, Math.floor(phaseDuration / missing.length));
        let subCursor = new Date(phaseStart);

        for (let i = 0; i < missing.length; i += 1) {
          const activity = missing[i];
          const isLast = i === missing.length - 1;
          const subStart = new Date(subCursor);
          const subEnd = isLast ? new Date(phaseEnd) : addDays(subStart, subDuration - 1);

          const created = await apiFetch('/api/tasks', {
            token,
            method: 'POST',
            body: {
              project_id: selectedProject.id,
              parent_task_id: phaseTask.id,
              name: formatActivityTaskName(activity),
              start_date: toIsoDate(subStart),
              end_date: toIsoDate(subEnd),
              progress_percent: 0,
              weight: 1,
              notes: `Trade: ${activity.trade}. Scope: ${activity.scope}.`,
              sort_order: existingChildren.length + i + 1,
            },
          });
          createdTasks.push(created);
          latestTasks.push(created);
          subCursor = addDays(subEnd, 1);
        }
      }

      const plannerData = await apiFetch(`/api/projects/${selectedProject.id}/planner`, { token });
      setTasks(plannerData.tasks || []);
      setSummary(plannerData.summary || null);
      setNotice(
        createdTasks.length > 0
          ? `Populated ${createdTasks.length} activity tasks across phases.`
          : 'All phases already have activities from the template.'
      );
    } catch (err) {
      setError(err.message || 'Failed to populate phase activities');
    } finally {
      setPlannerActionBusy(false);
    }
  };

  const cleanDuplicateActivities = async () => {
    if (!selectedProject || plannerActionBusy) return;
    setError('');
    setNotice('');
    setPlannerActionBusy(true);
    try {
      const latest = await apiFetch(`/api/projects/${selectedProject.id}/planner`, { token });
      const latestTasks = Array.isArray(latest.tasks) ? latest.tasks : [];
      const parents = latestTasks.filter((t) => !t.parent_task_id);
      const toDelete = [];

      parents.forEach((parent) => {
        const children = latestTasks.filter((t) => t.parent_task_id === parent.id);
        const seen = new Set();
        children.forEach((child) => {
          const key = normalizeActivityKey(child.name);
          if (seen.has(key)) toDelete.push(child.id);
          else seen.add(key);
        });
      });

      if (toDelete.length === 0) {
        setNotice('No duplicate activities found.');
        return;
      }

      for (const taskId of toDelete) {
        await apiFetch(`/api/tasks/${taskId}`, { token, method: 'DELETE' });
      }

      const plannerData = await apiFetch(`/api/projects/${selectedProject.id}/planner`, { token });
      setTasks(plannerData.tasks || []);
      setSummary(plannerData.summary || null);
      setNotice(`Removed ${toDelete.length} duplicate activity tasks.`);
    } catch (err) {
      setError(err.message || 'Failed to clean duplicate activities');
    } finally {
      setPlannerActionBusy(false);
    }
  };

  // Timeline calculations
  const timelineRange = useMemo(() => {
    if (!tasks.length) {
      const today = new Date();
      return {
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: new Date(today.getFullYear(), today.getMonth() + 2, 0)
      };
    }
    
    let minDate = null;
    let maxDate = null;
    
    tasks.forEach(task => {
      if (task.start_date) {
        const start = new Date(task.start_date);
        if (!minDate || start < minDate) minDate = new Date(start);
      }
      if (task.end_date) {
        const end = new Date(task.end_date);
        if (!maxDate || end > maxDate) maxDate = new Date(end);
      }
    });
    
    // Default if no dates found
    if (!minDate) minDate = new Date();
    if (!maxDate) maxDate = new Date();
    
    // Add padding (1 week before, 2 weeks after)
    minDate = new Date(minDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    maxDate = new Date(maxDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    
    return { start: minDate, end: maxDate };
  }, [tasks]);

  const timelineColumns = useMemo(() => {
    const slots = [];
    const rangeStart = new Date(timelineRange.start);
    const rangeEnd = new Date(timelineRange.end);

    if (timelineScale === 'hour') {
      const focus = hourlyFocusDate ? new Date(hourlyFocusDate) : new Date();
      const start = new Date(focus.getFullYear(), focus.getMonth(), focus.getDate(), 0, 0, 0, 0);
      for (let h = 0; h < 24; h += 1) {
        const slotStart = new Date(start.getTime() + h * 60 * 60 * 1000);
        const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
        slots.push({ start: slotStart, end: slotEnd });
      }
      return slots;
    }

    const stepDays = timelineScale === 'week' ? 7 : 1;
    const maxSlots = timelineScale === 'week' ? 20 : 30;
    let current = new Date(rangeStart);
    let count = 0;
    while (current <= rangeEnd && count < maxSlots) {
      const slotStart = new Date(current);
      const slotEnd = addDays(slotStart, stepDays);
      slots.push({ start: slotStart, end: slotEnd });
      current = slotEnd;
      count += 1;
    }
    return slots;
  }, [timelineRange, timelineScale, hourlyFocusDate]);

  const timelineRows = useMemo(() => {
    const parents = sortedTasks.filter((t) => !t.parent_task_id);
    if (timelineScale !== 'hour') return parents;

    const focus = hourlyFocusDate ? new Date(hourlyFocusDate) : new Date();
    const focusKey = dateKey(focus);
    const inFocus = sortedTasks.filter((task) => {
      if (!task.start_date || !task.end_date) return false;
      return task.start_date <= focusKey && task.end_date >= focusKey;
    });

    if (inFocus.length > 0) return inFocus.slice(0, 20);
    return sortedTasks.slice(0, 20);
  }, [sortedTasks, timelineScale, hourlyFocusDate]);

  const getTaskPosition = (task, rowIndex = 0) => {
    if (!task.start_date || !task.end_date) return null;

    const start = new Date(task.start_date);
    const end = new Date(task.end_date);

    const rangeStart = timelineColumns[0]?.start?.getTime();
    const rangeEnd = timelineColumns[timelineColumns.length - 1]?.end?.getTime();
    const totalRange = (rangeEnd || 0) - (rangeStart || 0);
    if (totalRange <= 0) return null;

    const startMs = start.getTime();
    const endMs = end.getTime() + 24 * 60 * 60 * 1000;

    if (timelineScale === 'hour') {
      const focus = hourlyFocusDate ? new Date(hourlyFocusDate) : new Date();
      const dayStart = new Date(focus.getFullYear(), focus.getMonth(), focus.getDate(), 0, 0, 0, 0).getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      // If the task overlaps focus day, render a practical work window so hourly view stays populated and readable.
      if (endMs <= dayStart || startMs >= dayEnd) return null;
      const overlapStart = Math.max(startMs, dayStart);
      const overlapEnd = Math.min(endMs, dayEnd);
      const overlapHours = Math.max(1, (overlapEnd - overlapStart) / (60 * 60 * 1000));
      const baseHour = 6 + ((rowIndex * 2) % 10); // 6:00 -> 24:00 stagger
      const blockHours = Math.max(2, Math.min(10, Math.round(overlapHours)));
      const visStart = dayStart + baseHour * 60 * 60 * 1000;
      const visEnd = Math.min(dayEnd, visStart + blockHours * 60 * 60 * 1000);
      const left = ((visStart - dayStart) / (dayEnd - dayStart)) * 100;
      const width = Math.max(2, ((visEnd - visStart) / (dayEnd - dayStart)) * 100);
      return { left, width };
    }

    let left = ((startMs - rangeStart) / totalRange) * 100;
    let width = ((endMs - startMs) / totalRange) * 100;

    // Clamp values
    left = Math.max(-10, Math.min(110, left));
    width = Math.max(2, Math.min(120, width));

    return { left, width };
  };


  // Render calendar view
  const renderCalendarView = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: '', otherMonth: true });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i);
      const dateStr = date.toISOString().split('T')[0];
      const dayTasks = tasks.filter(t => {
        if (!t.start_date || !t.end_date) return false;
        return dateStr >= t.start_date && dateStr <= t.end_date;
      });
      days.push({ day: i, date: dateStr, tasks: dayTasks, today: isSameDay(date, today) });
    }
    
    return (
      <div className="calendar-view">
        <div className="calendar-header">
          <h3>{today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
        </div>
        <div className="calendar-grid">
          <div className="calendar-day-headers">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="calendar-day-header">{d}</div>
            ))}
          </div>
          <div className="calendar-days">
            {days.map((d, idx) => (
              <div key={idx} className={`calendar-day ${d.otherMonth ? 'other-month' : ''} ${d.today ? 'today' : ''}`}>
                {d.day && (
                  <>
                    <span className="day-number">{d.day}</span>
                    <div className="day-tasks">
                      {d.tasks && d.tasks.slice(0, 3).map(task => (
                        <div key={task.id} className={`calendar-task ${task.status}`}>
                          {task.name.substring(0, 15)}
                        </div>
                      ))}
                      {d.tasks && d.tasks.length > 3 && (
                        <div className="more-tasks">+{d.tasks.length - 3} more</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="calendar-legend">
          <div className="legend-item"><span className="legend-dot not_started"></span> Not Started</div>
          <div className="legend-item"><span className="legend-dot in_progress"></span> In Progress</div>
          <div className="legend-item"><span className="legend-dot completed"></span> Completed</div>
          <div className="legend-item"><span className="legend-dot delayed"></span> Delayed</div>
        </div>
      </div>
    );
  };

  // Sort indicator component
  const SortIndicator = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <span className="sort-indicator">↕</span>;
    return <span className="sort-indicator active">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <section className="planner">
      <div className="planner-header">
        <div className="planner-title">
          <h2>📊 Project Planner</h2>
          <select 
            value={selectedProject?.id || ''} 
            onChange={(e) => {
              const project = projects.find(p => p.id === e.target.value);
              setSelectedProject(project);
            }}
            className="project-select"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
        
        {summary && (
          <div className="project-summary">
            <div className="summary-item">
              <span className="summary-label">Overall Progress</span>
              <span className="summary-value progress">{summary.overallProgress}%</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Tasks</span>
              <span className="summary-value">{summary.total}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Completed</span>
              <span className="summary-value completed">{summary.completed}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">In Progress</span>
              <span className="summary-value in-progress">{summary.inProgress}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Delayed</span>
              <span className="summary-value delayed">{summary.delayed}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Weight</span>
              <span className="summary-value">{summary.totalWeight}</span>
            </div>
          </div>
        )}
        
        <div className="planner-actions">
          <div className="view-toggle">
            <button 
              className={viewMode === 'table' ? 'active' : ''} 
              onClick={() => setViewMode('table')}
            >
              📋 Table
            </button>
            <button 
              className={viewMode === 'timeline' ? 'active' : ''} 
              onClick={() => setViewMode('timeline')}
            >
              📊 Timeline
            </button>
            <button 
              className={viewMode === 'calendar' ? 'active' : ''} 
              onClick={() => setViewMode('calendar')}
            >
              📅 Calendar
            </button>
          </div>
          <button className="btn-add" onClick={() => addTask(null)} disabled={plannerActionBusy}>
            + Add Task
          </button>
          <button className="btn-secondary" onClick={() => setShowActivities((prev) => !prev)}>
            {showActivities ? 'Hide Activities' : 'Show Activities'}
          </button>
          <button className="btn-secondary" onClick={addStandardPhaseTemplate} disabled={plannerActionBusy}>
            + Add Standard Template
          </button>
          <button className="btn-secondary" onClick={populateActivitiesForExistingPhases} disabled={plannerActionBusy}>
            + Populate Activities
          </button>
          <button className="btn-secondary" onClick={cleanDuplicateActivities} disabled={plannerActionBusy}>
            + Clean Duplicates
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {notice && <div className="info-message">{notice}</div>}

      {loading ? (
        <div className="loading">Loading project data...</div>
      ) : (
        <div className="planner-content">
          {/* Table View */}
          {viewMode === 'table' && (
            <div className={`table-container ${showActivities ? '' : 'compact-table'}`}>
              <table className={`planner-table ${showActivities ? '' : 'compact'}`}>
                <thead>
                  <tr>
                    <th className="col-task" onClick={() => handleSort('name')}>
                      Task / Phase Name <SortIndicator columnKey="name" />
                    </th>
                    <th className="col-assignee">Assignee</th>
                    <th className="col-date" onClick={() => handleSort('start_date')}>
                      Start Date <SortIndicator columnKey="start_date" />
                    </th>
                    <th className="col-date" onClick={() => handleSort('end_date')}>
                      End Date <SortIndicator columnKey="end_date" />
                    </th>
                    <th className="col-duration">Duration</th>
                    <th className="col-weight" onClick={() => handleSort('weight')}>
                      Weight <SortIndicator columnKey="weight" />
                    </th>
                    <th className="col-progress">Progress %</th>
                    <th className="col-contribution">Contribution</th>
                    <th className="col-cost">Est. Cost</th>
                    <th className="col-cost">Actual Cost</th>
                    <th className="col-status" onClick={() => handleSort('status')}>
                      Status <SortIndicator columnKey="status" />
                    </th>
                    <th className="col-milestone">Milestone</th>
                    <th className="col-notes">Notes</th>
                    <th className="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTasks
                    .filter(t => !t.parent_task_id)
                    .map(task => (
                    <React.Fragment key={task.id}>
                      <tr className={`task-row ${task.status}`}>
                        <td className="col-task" data-label="Task / Phase">
                          <input
                            type="text"
                            value={task.name}
                            onChange={(e) => updateTask(task.id, { name: e.target.value })}
                            className="cell-input"
                          />
                        </td>
                        <td className="col-date" data-label="Start Date">
                          <input
                            type="date"
                            value={task.start_date || ''}
                            onChange={(e) => updateTaskDates(task.id, e.target.value, task.end_date)}
                            className="cell-input date-input"
                          />
                        </td>
                        <td className="col-date" data-label="End Date">
                          <input
                            type="date"
                            value={task.end_date || ''}
                            onChange={(e) => updateTaskDates(task.id, task.start_date, e.target.value)}
                            className="cell-input date-input"
                          />
                        </td>
                        <td className="col-duration" data-label="Duration">{task.duration_days || calculateDuration(task.start_date, task.end_date)} days</td>
                        <td className="col-weight" data-label="Weight">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={task.weight || 1}
                            onChange={(e) => updateTask(task.id, { weight: parseInt(e.target.value) || 1 })}
                            className="cell-input weight-input"
                          />
                        </td>
                        <td className="col-progress" data-label="Progress">
                          <div className="progress-cell">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={task.progress_percent || 0}
                              onChange={(e) => updateTaskProgress(task.id, parseInt(e.target.value))}
                              className="progress-slider"
                            />
                            <span className="progress-value">{task.progress_percent || 0}%</span>
                          </div>
                        </td>
                        <td className="col-contribution" data-label="Contribution">
                          {calculateContribution(task.progress_percent, task.weight).toFixed(2)}
                        </td>
                        <td className="col-status" data-label="Status">
                          <span className={`status-badge ${task.status}`}>
                            {task.status === 'not_started' ? 'Not Started' : 
                             task.status === 'in_progress' ? 'In Progress' :
                             task.status === 'completed' ? 'Completed' : 'Delayed'}
                          </span>
                        </td>
                        <td className="col-notes" data-label="Notes">
                          <input
                            type="text"
                            value={task.notes || ''}
                            onChange={(e) => updateTask(task.id, { notes: e.target.value })}
                            className="cell-input notes-input"
                            placeholder="Add notes..."
                          />
                        </td>
                        <td className="col-actions" data-label="Actions">
                          <button 
                            className="btn-delete"
                            onClick={() => deleteTask(task.id)}
                            title="Delete task"
                          >
                            🗑️
                          </button>
                          <button 
                            className="btn-add-child"
                            onClick={() => addTask(task.id)}
                            title="Add subtask"
                          >
                            +
                          </button>
                        </td>
                      </tr>
                      {/* Subtasks */}
                      {showActivities && sortedTasks
                        .filter(t => t.parent_task_id === task.id)
                        .map(subtask => (
                          <tr key={subtask.id} className={`task-row subtask ${subtask.status}`}>
                            <td className="col-task subtask-row" data-label="Activity">
                              <span className="subtask-indent">↳ </span>
                              <input
                                type="text"
                                value={subtask.name}
                                onChange={(e) => updateTask(subtask.id, { name: e.target.value })}
                                className="cell-input"
                              />
                            </td>
                            <td className="col-date" data-label="Start Date">
                              <input
                                type="date"
                                value={subtask.start_date || ''}
                                onChange={(e) => updateTaskDates(subtask.id, e.target.value, subtask.end_date)}
                                className="cell-input date-input"
                              />
                            </td>
                            <td className="col-date" data-label="End Date">
                              <input
                                type="date"
                                value={subtask.end_date || ''}
                                onChange={(e) => updateTaskDates(subtask.id, subtask.start_date, e.target.value)}
                                className="cell-input date-input"
                              />
                            </td>
                            <td className="col-duration" data-label="Duration">{subtask.duration_days || calculateDuration(subtask.start_date, subtask.end_date)} days</td>
                            <td className="col-weight" data-label="Weight">
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={subtask.weight || 1}
                                onChange={(e) => updateTask(subtask.id, { weight: parseInt(e.target.value) || 1 })}
                                className="cell-input weight-input"
                              />
                            </td>
                            <td className="col-progress" data-label="Progress">
                              <div className="progress-cell">
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={subtask.progress_percent || 0}
                                  onChange={(e) => updateTaskProgress(subtask.id, parseInt(e.target.value))}
                                  className="progress-slider"
                                />
                                <span className="progress-value">{subtask.progress_percent || 0}%</span>
                              </div>
                            </td>
                            <td className="col-contribution" data-label="Contribution">
                              {calculateContribution(subtask.progress_percent, subtask.weight).toFixed(2)}
                            </td>
                            <td className="col-status" data-label="Status">
                              <span className={`status-badge ${subtask.status}`}>
                                {subtask.status === 'not_started' ? 'Not Started' : 
                                 subtask.status === 'in_progress' ? 'In Progress' :
                                 subtask.status === 'completed' ? 'Completed' : 'Delayed'}
                              </span>
                            </td>
                            <td className="col-notes" data-label="Notes">
                              <input
                                type="text"
                                value={subtask.notes || ''}
                                onChange={(e) => updateTask(subtask.id, { notes: e.target.value })}
                                className="cell-input notes-input"
                              />
                            </td>
                            <td className="col-actions" data-label="Actions">
                              <button 
                                className="btn-delete"
                                onClick={() => deleteTask(subtask.id)}
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Timeline View */}
          {viewMode === 'timeline' && (
            <div className="timeline-container">
              <div className="timeline-header">
                <h3>📊 Timeline View</h3>
                <div className="timeline-scale">
                  <button 
                    className={timelineScale === 'week' ? 'active' : ''}
                    onClick={() => setTimelineScale('week')}
                  >
                    Weekly
                  </button>
                  <button 
                    className={timelineScale === 'day' ? 'active' : ''}
                    onClick={() => setTimelineScale('day')}
                  >
                    Daily
                  </button>
                  <button
                    className={timelineScale === 'hour' ? 'active' : ''}
                    onClick={() => setTimelineScale('hour')}
                  >
                    Hourly
                  </button>
                </div>
                {timelineScale === 'hour' && (
                  <input
                    type="date"
                    className="timeline-focus-date"
                    value={hourlyFocusDate}
                    onChange={(e) => setHourlyFocusDate(e.target.value)}
                    aria-label="Hourly timeline date"
                  />
                )}
              </div>
              <div className="timeline-wrapper">
                <div className={`timeline-grid ${timelineScale === 'hour' ? 'hour-mode' : ''}`}>
                  <div className="timeline-labels">
                    {timelineRows.map(task => (
                      <div key={task.id} className="timeline-row-label" title={task.name}>
                        <span className="task-name">{task.name.substring(0, 22)}{task.name.length > 22 ? '...' : ''}</span>
                        <span className="task-dates">{formatShortDate(task.start_date)} - {formatShortDate(task.end_date)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="timeline-bars-container">
                    <div className="timeline-columns">
                      {timelineColumns.map((slot, idx) => (
                        <div
                          key={idx}
                          className="timeline-col-header"
                          title={
                            timelineScale === 'hour'
                              ? `${formatDate(slot.start)} ${slot.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                              : formatDate(slot.start)
                          }
                        >
                          <span className="day-name">
                            {timelineScale === 'hour'
                              ? slot.start.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
                              : slot.start.toLocaleDateString('en-US', { weekday: 'short' })}
                          </span>
                          <span className="date-num">
                            {timelineScale === 'hour'
                              ? slot.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : slot.start.getDate()}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="timeline-rows">
                      {timelineRows.map((task, rowIndex) => {
                        const position = getTaskPosition(task, rowIndex);
                        const status = calculateStatus(task.progress_percent, task.end_date);
                        const duration = calculateDuration(task.start_date, task.end_date);
                        return (
                          <div key={task.id} className="timeline-row">
                            {position && (
                              <div
                                className={`timeline-bar ${status}`}
                                style={{
                                  left: `${position.left}%`,
                                  width: `${position.width}%`,
                                }}
                                title={`${task.name}: ${task.progress_percent || 0}% complete, ${duration} days`}
                              >
                                <div 
                                  className="timeline-bar-fill" 
                                  style={{ width: `${task.progress_percent || 0}%` }}
                                ></div>
                                <span className="timeline-bar-label">
                                  {task.progress_percent || 0}%
                                  {position.width > 15 && <span className="duration-label"> ({duration}d)</span>}
                                </span>
                              </div>
                            )}
                            {!position && (
                              <span className="no-dates-msg">Set dates to view</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <div className="timeline-legend">
                <div className="legend-item"><span className="legend-dot not_started"></span> Not Started</div>
                <div className="legend-item"><span className="legend-dot in_progress"></span> In Progress</div>
                <div className="legend-item"><span className="legend-dot completed"></span> Completed</div>
                <div className="legend-item"><span className="legend-dot delayed"></span> Delayed</div>
              </div>
            </div>
          )}


          {/* Calendar View */}
          {viewMode === 'calendar' && renderCalendarView()}
        </div>
      )}
    </section>
  );
}
