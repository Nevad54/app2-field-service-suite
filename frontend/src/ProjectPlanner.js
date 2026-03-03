// ============== PROJECT PLANNER - EXCEL-STYLE TIMELINE SCHEDULER ==============
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

const TIMELINE_CENTER_STORAGE_KEY = 'app2_planner_timeline_center';

const loadStoredTimelineCenter = () => {
  try {
    const raw = localStorage.getItem(TIMELINE_CENTER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.scale || !parsed.date) return null;
    return parsed;
  } catch (e) {
    return null;
  }
};

const storeTimelineCenter = (payload) => {
  try {
    localStorage.setItem(TIMELINE_CENTER_STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    // ignore storage failures
  }
};

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
const toIsoDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
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
  const [sortConfig, setSortConfig] = useState({ key: 'sort_order', direction: 'asc' });
  const [showActivities, setShowActivities] = useState(false);
  const [calendarCursor, setCalendarCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  
  // Timeline View Enhancements
  const [zoomLevel, setZoomLevel] = useState(1);
  const [timelineScrollPosition, setTimelineScrollPosition] = useState(0);
  const [todayPosition, setTodayPosition] = useState(null);
  const timelineScrollRef = useRef(null);
  const lastTimelineExtendAtRef = useRef(0);
  const [shouldScrollToToday, setShouldScrollToToday] = useState(false);
  const pendingScrollToCenterRef = useRef(false);
  const centerDateRef = useRef(null);
  const persistCenterTimerRef = useRef(null);
  const [timelineWindow, setTimelineWindow] = useState(null);

  // Scroll to today functionality
  const scrollToToday = () => {
    const timelineContainer = timelineScrollRef.current;
    if (!timelineContainer || todayPosition === null) return;
    const containerWidth = timelineContainer.clientWidth;
    const scrollPosition = todayPosition - (containerWidth / 2);
    timelineContainer.scrollTo({ left: scrollPosition, behavior: 'smooth' });
  };

  const initializeTimelineWindowAroundToday = useCallback(() => {
    const baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0);

    centerDateRef.current = {
      scale: timelineScale,
      date: toIsoDate(baseDate),
    };

    if (timelineScale === 'hour') return;

    if (timelineScale === 'week') {
      const weekStart = addDays(baseDate, -baseDate.getDay());
      setTimelineWindow({
        start: addDays(weekStart, -7 * 8),
        end: addDays(weekStart, 7 * 18),
      });
      return;
    }

    setTimelineWindow({
      start: addDays(baseDate, -30),
      end: addDays(baseDate, 60),
    });
  }, [timelineScale]);

  useEffect(() => {
    if (viewMode !== 'timeline') return;
    initializeTimelineWindowAroundToday();
    const timeout = setTimeout(() => setShouldScrollToToday(true), 0);
    return () => clearTimeout(timeout);
  }, [viewMode, timelineScale, initializeTimelineWindowAroundToday]);

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 2));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  const handleZoomReset = () => setZoomLevel(1);

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

  useEffect(() => {
    if (timelineScale !== 'hour') return;
    if (hourlyFocusDate) return;
    setHourlyFocusDate(toIsoDate(new Date()));
  }, [timelineScale, hourlyFocusDate]);

  useEffect(() => {
    if (timelineScale !== 'hour') return;
    const stored = loadStoredTimelineCenter();
    if (stored && stored.scale === 'hour' && stored.date) {
      setHourlyFocusDate(stored.date);
      return;
    }
    setHourlyFocusDate(toIsoDate(new Date()));
  }, [timelineScale]);

  const shiftHourlyFocusDate = (deltaDays) => {
    const base = hourlyFocusDate ? new Date(hourlyFocusDate) : new Date();
    const next = addDays(base, deltaDays);
    setHourlyFocusDate(toIsoDate(next));
  };

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
      console.log('Updating task progress:', taskId, progress);
      const response = await fetch(`/api/tasks/${taskId}/progress`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ progress_percent: progress })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }
      
      const updated = await response.json();
      console.log('Task progress updated:', updated);
      
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updated } : t));
      
      // Reload summary
      if (selectedProject) {
        const plannerData = await apiFetch(`/api/projects/${selectedProject.id}/planner`, { token });
        setSummary(plannerData.summary);
      }
    } catch (err) {
      console.error('Error updating task progress:', err);
      setError(err.message);
    }
  };

  const updateTaskDates = async (taskId, startDate, endDate) => {
    try {
      console.log('Updating task dates:', { taskId, startDate, endDate });
      const updated = await apiFetch(`/api/tasks/${taskId}/dates`, {
        token,
        method: 'PATCH',
        body: { start_date: startDate, end_date: endDate }
      });
      
      console.log('Task dates updated successfully:', updated);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updated } : t));
    } catch (err) {
      console.error('Error updating task dates:', err);
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
          start_date: toIsoDate(new Date()),
          end_date: toIsoDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
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
    if (timelineWindow) return timelineWindow;
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

    if (!minDate) minDate = new Date();
    if (!maxDate) maxDate = new Date();

    minDate = new Date(minDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    maxDate = new Date(maxDate.getTime() + 60 * 24 * 60 * 60 * 1000);

    return { start: minDate, end: maxDate };
  }, [tasks, timelineWindow]);

  useEffect(() => {
    if (timelineWindow) return;
    if (!tasks.length) return;
    setTimelineWindow(timelineRange);
  }, [tasks, timelineRange, timelineWindow]);

  const timelineColumns = useMemo(() => {
    const slots = [];
    if (!timelineRange) return slots;
    
    const rangeStart = new Date(timelineRange.start);
    const rangeEnd = new Date(timelineRange.end);

    if (timelineScale === 'hour') {
      const focus = hourlyFocusDate ? new Date(hourlyFocusDate) : new Date();
      const start = new Date(focus.getFullYear(), focus.getMonth(), focus.getDate() - 7, 0, 0, 0, 0);
      for (let h = 0; h < 336; h += 1) {
        const slotStart = new Date(start.getTime() + h * 60 * 60 * 1000);
        const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
        slots.push({ start: slotStart, end: slotEnd });
      }
      return slots;
    }

    const stepDays = timelineScale === 'week' ? 7 : 1;
    let current = new Date(rangeStart);
    while (current <= rangeEnd) {
      const slotStart = new Date(current);
      const slotEnd = addDays(slotStart, stepDays);
      slots.push({ start: slotStart, end: slotEnd });
      current = slotEnd;
    }
    return slots;
  }, [timelineRange, timelineScale, hourlyFocusDate]);

  const handleTimelineScroll = useCallback((e) => {
    const el = e.currentTarget;
    setTimelineScrollPosition(el.scrollLeft);

    if (persistCenterTimerRef.current) {
      window.clearTimeout(persistCenterTimerRef.current);
    }

    persistCenterTimerRef.current = window.setTimeout(() => {
      if (!timelineColumns || timelineColumns.length === 0) return;
      const colWidth = timelineColWidthPx || 90;
      const centerPx = el.scrollLeft + (el.clientWidth / 2);
      const idx = Math.max(0, Math.min(timelineColumns.length - 1, Math.floor(centerPx / colWidth)));
      const colDate = timelineColumns[idx]?.start;
      if (!colDate) return;
      storeTimelineCenter({
        scale: timelineScale,
        date: toIsoDate(colDate),
      });
    }, 250);

    if (!timelineWindow) return;
    if (timelineScale === 'hour') return;

    const now = Date.now();
    if (now - lastTimelineExtendAtRef.current < 900) return;

    const thresholdPx = 24;
    const atLeft = el.scrollLeft < thresholdPx;
    const atRight = (el.scrollLeft + el.clientWidth) > (el.scrollWidth - thresholdPx);
    if (!atLeft && !atRight) return;

    const extendDays = timelineScale === 'week' ? 56 : 60;
    const colWidth = 90 * zoomLevel;
    const colsToShift = timelineScale === 'week' ? Math.ceil(extendDays / 7) : extendDays;
    const pxShift = colsToShift * colWidth;

    if (atLeft) {
      lastTimelineExtendAtRef.current = now;
      const newStart = addDays(timelineWindow.start, -extendDays);
      setTimelineWindow(prev => ({ ...prev, start: newStart }));
      requestAnimationFrame(() => {
        el.scrollLeft = el.scrollLeft + pxShift;
      });
    }

    if (atRight) {
      lastTimelineExtendAtRef.current = now;
      const newEnd = addDays(timelineWindow.end, extendDays);
      setTimelineWindow(prev => ({ ...prev, end: newEnd }));
    }
  }, [timelineWindow, timelineScale, zoomLevel, timelineColumns]);

  const timelineColWidthPx = useMemo(() => {
    const base = timelineScale === 'hour' ? 64 : 90;
    return Math.round(base * zoomLevel);
  }, [timelineScale, zoomLevel]);

  const timelineHeaderTotalHeightPx = useMemo(() => 60, []);

  const timelineAnchorDate = useMemo(() => {
    if (!timelineColumns || timelineColumns.length === 0) return null;
    if (timelineScale === 'hour') {
      return hourlyFocusDate ? new Date(hourlyFocusDate) : new Date();
    }
    const colWidth = timelineColWidthPx || 90;
    const scrollContainer = timelineScrollRef.current;
    const effectiveScrollLeft = scrollContainer ? scrollContainer.scrollLeft : (timelineScrollPosition || 0);
    const viewportCenter = effectiveScrollLeft + (scrollContainer?.clientWidth || 800) / 2;
    const idx = Math.max(0, Math.min(timelineColumns.length - 1, Math.floor(viewportCenter / colWidth)));
    return timelineColumns[idx]?.start || null;
  }, [timelineColumns, timelineScale, hourlyFocusDate, timelineColWidthPx, timelineScrollPosition]);

  const timelineHeaderLabel = useMemo(() => {
    if (!timelineAnchorDate) return '';
    if (timelineScale === 'day' || timelineScale === 'week') {
      return timelineAnchorDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    if (timelineScale === 'hour') {
      return timelineAnchorDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    return '';
  }, [timelineAnchorDate, timelineScale]);

  // Calculate today marker
  useEffect(() => {
    if (timelineColumns && timelineColumns.length > 0 && timelineRange) {
      const today = new Date();
      const colWidth = timelineColWidthPx || 90;

      if (timelineScale === 'hour') {
        const focus = hourlyFocusDate ? new Date(hourlyFocusDate) : new Date();
        const sameDay = focus.toDateString() === today.toDateString();
        if (!sameDay) {
          setTodayPosition(null);
          return;
        }
        const minutes = today.getHours() * 60 + today.getMinutes();
        const leftPx = (minutes / (24 * 60)) * (24 * colWidth);
        setTodayPosition(leftPx + (colWidth / 2));
        return;
      }

      const stepMs = timelineScale === 'week' ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      const rangeStartMs = new Date(timelineColumns[0].start).getTime();
      const idx = Math.floor((today.getTime() - rangeStartMs) / stepMs);
      if (idx < 0 || idx > timelineColumns.length) {
        setTodayPosition(null);
        return;
      }
      setTodayPosition(idx * colWidth + (colWidth / 2));
    } else {
      setTodayPosition(null);
    }
  }, [timelineColumns, timelineRange, timelineScale, hourlyFocusDate, timelineColWidthPx]);

  // Auto-scroll to today
  useEffect(() => {
    if (viewMode !== 'timeline') return;
    if (!shouldScrollToToday) return;
    const el = timelineScrollRef.current;
    if (!el) return;
    if (!timelineColumns || timelineColumns.length === 0) return;

    const today = new Date();
    const colWidth = timelineColWidthPx || 90;

    let scrollLeft;
    if (timelineScale === 'hour') {
      const focus = hourlyFocusDate ? new Date(hourlyFocusDate) : new Date();
      const dayStart = new Date(focus.getFullYear(), focus.getMonth(), focus.getDate(), 0, 0, 0, 0).getTime();
      const currentHour = today.getHours();
      const currentMinute = today.getMinutes();
      const hourWidth = colWidth;
      const leftPx = (currentHour * hourWidth) + (currentMinute / 60) * hourWidth;
      scrollLeft = leftPx - (el.clientWidth / 2);
    } else {
      const stepMs = timelineScale === 'week' ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      const rangeStartMs = new Date(timelineColumns[0].start).getTime();
      const idx = Math.floor((today.getTime() - rangeStartMs) / stepMs);
    
      if (idx < 0 || idx >= timelineColumns.length) {
        setShouldScrollToToday(false);
        return;
      }

      const leftPx = idx * colWidth + (colWidth / 2);
      scrollLeft = leftPx - (el.clientWidth / 2);
    }
    
    const handle = window.requestAnimationFrame(() => {
      el.scrollTo({ left: scrollLeft, behavior: 'auto' });
      setShouldScrollToToday(false);
    });
    return () => window.cancelAnimationFrame(handle);
  }, [viewMode, timelineColumns, timelineScale, timelineColWidthPx, shouldScrollToToday, hourlyFocusDate]);

  useEffect(() => {
    if (viewMode !== 'timeline') return;
    if (!pendingScrollToCenterRef.current) return;
    const el = timelineScrollRef.current;
    if (!el) return;
    if (!timelineColumns || timelineColumns.length === 0) return;

    const stored = loadStoredTimelineCenter();
    const targetIso = stored?.date || centerDateRef.current?.date;
    if (!targetIso) {
      pendingScrollToCenterRef.current = false;
      return;
    }

    const target = new Date(targetIso);
    target.setHours(0, 0, 0, 0);

    const colWidth = timelineColWidthPx || 90;
    const stepMs = timelineScale === 'week' ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const rangeStartMs = new Date(timelineColumns[0].start).getTime();
    const idx = Math.floor((target.getTime() - rangeStartMs) / stepMs);
    if (idx < 0 || idx > timelineColumns.length) {
      pendingScrollToCenterRef.current = false;
      return;
    }

    const leftPx = idx * colWidth + (colWidth / 2);
    const scrollLeft = leftPx - (el.clientWidth / 2);
    const raf = window.requestAnimationFrame(() => {
      el.scrollTo({ left: scrollLeft, behavior: 'auto' });
      pendingScrollToCenterRef.current = false;
    });
    return () => window.cancelAnimationFrame(raf);
  }, [viewMode, timelineScale, timelineColumns, timelineColWidthPx]);

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
    if (!timelineColumns || timelineColumns.length === 0) return null;

    const start = new Date(task.start_date);
    const end = new Date(task.end_date);

    const rangeStart = timelineColumns[0]?.start?.getTime();
    const rangeEnd = timelineColumns[timelineColumns.length - 1]?.end?.getTime();
    const totalRange = (rangeEnd || 0) - (rangeStart || 0);
    if (totalRange <= 0) return null;

    const startMs = start.getTime();
    const endMs = end.getTime() + 24 * 60 * 60 * 1000;

    if (timelineScale === 'hour') {
      const colWidth = timelineColWidthPx || 64;
      const focus = hourlyFocusDate ? new Date(hourlyFocusDate) : new Date();
      const viewStart = new Date(focus.getFullYear(), focus.getMonth(), focus.getDate() - 3, 0, 0, 0, 0).getTime();
      const viewEnd = viewStart + 336 * 60 * 60 * 1000;

      if (endMs <= viewStart || startMs >= viewEnd) return null;
      
      const overlapStart = Math.max(startMs, viewStart);
      const overlapEnd = Math.min(endMs, viewEnd);
      const overlapDurationMs = overlapEnd - overlapStart;
      
      const taskStartOffset = startMs - viewStart;
      
      const hourWidth = colWidth;
      const left = (taskStartOffset / (24 * 60 * 60 * 1000)) * (24 * hourWidth);
      const width = Math.max(hourWidth / 2, (overlapDurationMs / (24 * 60 * 60 * 1000)) * (24 * hourWidth));
      
      return { left, width, unit: 'px' };
    }

    const totalWidthPx = timelineColumns.length * (timelineColWidthPx || 90);
    let left = ((startMs - rangeStart) / totalRange) * totalWidthPx;
    let width = ((endMs - startMs) / totalRange) * totalWidthPx;

    left = Math.max(-40, Math.min(totalWidthPx + 40, left));
    width = Math.max(8, Math.min(totalWidthPx + 80, width));

    return { left, width, unit: 'px' };
  };

  // Render calendar view
  const renderCalendarView = () => {
    const today = new Date();
    const currentMonth = calendarCursor.getMonth();
    const currentYear = calendarCursor.getFullYear();
    
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: '', otherMonth: true });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i);
      const dateStr = toIsoDate(date);
      const dayTasks = tasks.filter(t => {
        if (!t.start_date || !t.end_date) return false;
        return dateStr >= t.start_date && dateStr <= t.end_date;
      });
      days.push({ day: i, date: dateStr, tasks: dayTasks, today: isSameDay(date, today) });
    }
    
    return (
      <div className="calendar-view">
        <div className="calendar-header">
          <button
            type="button"
            className="calendar-nav-btn"
            onClick={() => setCalendarCursor(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
            aria-label="Previous month"
          >
            ‹
          </button>
          <h3>{calendarCursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
          <button
            type="button"
            className="calendar-nav-btn"
            onClick={() => setCalendarCursor(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
            aria-label="Next month"
          >
            ›
          </button>
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
          <div className="planner-actions-left">
            <div className="view-toggle">
              <button 
                className={viewMode === 'table' ? 'active' : ''} 
                onClick={() => setViewMode('table')}
                title="Table View"
              >
                <span>📋</span> Table
              </button>
              <button 
                className={viewMode === 'timeline' ? 'active' : ''} 
                onClick={() => setViewMode('timeline')}
                title="Timeline View"
              >
                <span>📊</span> Timeline
              </button>
              <button 
                className={viewMode === 'calendar' ? 'active' : ''} 
                onClick={() => setViewMode('calendar')}
                title="Calendar View"
              >
                <span>📅</span> Calendar
              </button>
            </div>
          </div>
          <div className="planner-actions-right">
            <button className="btn-add" onClick={() => addTask(null)} disabled={plannerActionBusy} title="Add New Task">
              <span>+</span> Add Task
            </button>
            {viewMode === 'table' && (
              <>
                <button className="btn-secondary" onClick={() => setShowActivities((prev) => !prev)} title="Toggle Sub-tasks">
                  {showActivities ? 'Hide Activities' : 'Show Activities'}
                </button>
                <button className="btn-secondary" onClick={addStandardPhaseTemplate} disabled={plannerActionBusy} title="Add Standard Template">
                  + Template
                </button>
                <button className="btn-secondary" onClick={populateActivitiesForExistingPhases} disabled={plannerActionBusy} title="Populate Activities">
                  + Activities
                </button>
                <button className="btn-secondary" onClick={cleanDuplicateActivities} disabled={plannerActionBusy} title="Clean Duplicates">
                  Clean
                </button>
              </>
            )}
          </div>
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
                    <th className="col-date" onClick={() => handleSort('start_date')}>
                      Start <SortIndicator columnKey="start_date" />
                    </th>
                    <th className="col-date" onClick={() => handleSort('end_date')}>
                      End <SortIndicator columnKey="end_date" />
                    </th>
                    <th className="col-duration">Days</th>
                    <th className="col-progress">Progress</th>
                    <th className="col-status" onClick={() => handleSort('status')}>
                      Status <SortIndicator columnKey="status" />
                    </th>
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
                            className="cell-input task-name-input"
                            title={task.name}
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
                        <td className="col-duration" data-label="Duration">
                          <span className="duration-badge">{task.duration_days || calculateDuration(task.start_date, task.end_date)}d</span>
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
                        <td className="col-status" data-label="Status">
                          <span className={`status-badge ${task.status}`}>
                            {task.status === 'not_started' ? 'Not Started' : 
                             task.status === 'in_progress' ? 'In Progress' :
                             task.status === 'completed' ? 'Completed' : 'Delayed'}
                          </span>
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
                                className="cell-input task-name-input"
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
                            <td className="col-duration" data-label="Duration">
                              <span className="duration-badge">{subtask.duration_days || calculateDuration(subtask.start_date, subtask.end_date)}d</span>
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
                            <td className="col-status" data-label="Status">
                              <span className={`status-badge ${subtask.status}`}>
                                {subtask.status === 'not_started' ? 'Not Started' : 
                                 subtask.status === 'in_progress' ? 'In Progress' :
                                 subtask.status === 'completed' ? 'Completed' : 'Delayed'}
                              </span>
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
                  <div className="timeline-hour-controls">
                    <button
                      type="button"
                      className="timeline-hour-nav"
                      onClick={() => shiftHourlyFocusDate(-1)}
                      aria-label="Previous day"
                      title="Previous day"
                    >
                      ‹
                    </button>
                    <input
                      type="date"
                      className="timeline-focus-date"
                      value={hourlyFocusDate}
                      onChange={(e) => setHourlyFocusDate(e.target.value)}
                      aria-label="Hourly timeline date"
                    />
                    <button
                      type="button"
                      className="timeline-hour-nav"
                      onClick={() => shiftHourlyFocusDate(1)}
                      aria-label="Next day"
                      title="Next day"
                    >
                      ›
                    </button>
                  </div>
                )}
                {timelineHeaderLabel ? (
                  <div className="timeline-month-label" aria-label="Current timeline context">
                    {timelineHeaderLabel}
                  </div>
                ) : null}

                {/* Zoom Controls */}
                <div className="timeline-zoom-controls">
                  <button className="zoom-btn" onClick={handleZoomOut} title="Zoom Out">−</button>
                  <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
                  <button className="zoom-btn" onClick={handleZoomIn} title="Zoom In">+</button>
                  <button className="zoom-btn" onClick={handleZoomReset} title="Reset Zoom" style={{fontSize: '0.9rem'}}>⟲</button>
                </div>
                {todayPosition !== null && (
                  <button className="btn-today" onClick={scrollToToday} title="Scroll to Today">
                    📍 Today
                  </button>
                )}
              </div>
              <div className="timeline-viewport">
                <div className="timeline-labels">
                  <div className="timeline-labels-header" />
                  {timelineRows && timelineRows.map(task => (
                    <div key={task.id} className="timeline-row-label" title={task.name}>
                      <span className="task-name">{task.name.substring(0, 22)}{task.name.length > 22 ? '...' : ''}</span>
                      <span className="task-dates">{formatShortDate(task.start_date)} - {formatShortDate(task.end_date)}</span>
                    </div>
                  ))}
                </div>

                <div
                  className="timeline-scroll"
                  ref={timelineScrollRef}
                  onScroll={handleTimelineScroll}
                  style={{
                    ['--timeline-col-width']: `${timelineColWidthPx}px`,
                    ['--timeline-header-total-height']: `${timelineHeaderTotalHeightPx}px`,
                  }}
                >
                  <div className={`timeline-grid ${timelineScale === 'hour' ? 'hour-mode' : ''}`}>
                    <div className="timeline-bars-container">
                      <div className="timeline-columns">
                        {timelineColumns && timelineColumns.map((slot, idx) => (
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
                                ? slot.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : timelineScale === 'week'
                                  ? slot.start.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
                                  : slot.start.toLocaleDateString('en-US', { weekday: 'short' })}
                            </span>
                            <span className="date-num">
                              {timelineScale === 'hour'
                                ? ''
                                : timelineScale === 'week'
                                  ? (() => {
                                      const weekStart = slot.start;
                                      const weekEnd = addDays(weekStart, 6);
                                      const sameMonth = weekStart.getMonth() === weekEnd.getMonth() && weekStart.getFullYear() === weekEnd.getFullYear();
                                      if (sameMonth) return `${weekStart.getDate()}-${weekEnd.getDate()}`;
                                      const startLabel = weekStart.toLocaleDateString('en-US', { month: 'short' });
                                      const endLabel = weekEnd.toLocaleDateString('en-US', { month: 'short' });
                                      return `${startLabel} ${weekStart.getDate()}-${endLabel} ${weekEnd.getDate()}`;
                                    })()
                                  : slot.start.getDate()}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="timeline-rows">
                        {todayPosition !== null && (
                          <div
                            className="timeline-today-indicator"
                            style={{ left: `${todayPosition}px` }}
                          />
                        )}
                        {timelineRows && timelineRows.map((task, rowIndex) => {
                          const position = getTaskPosition(task, rowIndex);
                          const status = calculateStatus(task.progress_percent, task.end_date);
                          const duration = calculateDuration(task.start_date, task.end_date);
                          return (
                            <div key={task.id} className="timeline-row" style={position ? { position: 'relative' } : {}}>
                              {position && (
                                <div
                                  className={`timeline-bar ${status}`}
                                  style={{
                                    left: position.unit === 'px' ? `${position.left}px` : `${position.left}%`,
                                    width: position.unit === 'px' ? `${position.width}px` : `${position.width}%`,
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
