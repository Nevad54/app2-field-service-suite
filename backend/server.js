const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const users = [
  { id: 'u-admin', username: 'admin', password: '1111', role: 'admin' },
  { id: 'u-dispatch', username: 'dispatcher', password: '1111', role: 'dispatcher' },
  { id: 'u-tech', username: 'technician', password: '1111', role: 'technician' },
  { id: 'u-client', username: 'client', password: '1111', role: 'client' },
];

const jobs = [
  { id: 'JOB-1001', title: 'HVAC preventive maintenance', status: 'new', priority: 'medium', assignedTo: 'technician', location: 'Building A' },
  { id: 'JOB-1002', title: 'Generator inspection', status: 'assigned', priority: 'high', assignedTo: 'technician', location: 'Warehouse North' },
  { id: 'JOB-1003', title: 'Electrical panel audit', status: 'in-progress', priority: 'high', assignedTo: 'technician', location: 'Main Plant' },
];

const sessions = new Map();

const toSafeUser = (user) => ({
  id: user.id,
  username: user.username,
  role: user.role,
});

const getBearerToken = (req) => {
  const raw = String(req.headers.authorization || '');
  if (!raw.toLowerCase().startsWith('bearer ')) return '';
  return raw.slice(7).trim();
};

const requireAuth = (req, res, next) => {
  const token = getBearerToken(req);
  const session = sessions.get(token);
  if (!token || !session) return res.status(401).json({ error: 'Unauthorized' });
  req.authUser = session.user;
  req.authToken = token;
  return next();
};

const requireRoles = (allowedRoles) => (req, res, next) => {
  if (!req.authUser || !allowedRoles.includes(req.authUser.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  return next();
};

const nextJobId = () => {
  const max = jobs.reduce((acc, item) => {
    const n = Number(String(item.id || '').replace('JOB-', '')) || 0;
    return n > acc ? n : acc;
  }, 1000);
  return `JOB-${String(max + 1).padStart(4, '0')}`;
};

const findJobById = (id) => jobs.find((item) => String(item.id) === String(id));
const technicianUsernames = users.filter((u) => u.role === 'technician').map((u) => u.username);

app.get('/api/status', (_req, res) => {
  res.json({ ok: true, service: 'app2-field-service-suite-backend', timestamp: new Date().toISOString() });
});

app.post('/api/auth/login', (req, res) => {
  const username = String(req.body.username || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = users.find((item) => item.username.toLowerCase() === username && item.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const token = crypto.randomBytes(24).toString('hex');
  const safeUser = toSafeUser(user);
  sessions.set(token, { user: safeUser, createdAt: Date.now() });
  return res.json({ user: safeUser, token });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.authUser });
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  sessions.delete(req.authToken);
  res.json({ ok: true });
});

app.get('/api/jobs', requireAuth, (req, res) => {
  if (req.authUser.role === 'technician') {
    return res.json(jobs.filter((job) => job.assignedTo === req.authUser.username));
  }
  return res.json(jobs);
});

app.post('/api/jobs', requireAuth, requireRoles(['admin', 'dispatcher']), (req, res) => {
  const title = String(req.body.title || '').trim();
  const priority = String(req.body.priority || 'medium').trim().toLowerCase();
  const assignedTo = String(req.body.assignedTo || '').trim();
  const location = String(req.body.location || '').trim();

  if (!title) return res.status(400).json({ error: 'Job title is required' });
  if (!['low', 'medium', 'high'].includes(priority)) return res.status(400).json({ error: 'Invalid priority' });
  if (assignedTo && !technicianUsernames.includes(assignedTo)) {
    return res.status(400).json({ error: 'Assigned technician not found' });
  }

  const created = {
    id: nextJobId(),
    title,
    status: assignedTo ? 'assigned' : 'new',
    priority,
    assignedTo: assignedTo || '',
    location: location || 'Unspecified',
  };
  jobs.unshift(created);
  return res.status(201).json(created);
});

app.put('/api/jobs/:id', requireAuth, requireRoles(['admin', 'dispatcher']), (req, res) => {
  const existing = findJobById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Job not found' });

  const title = req.body.title !== undefined ? String(req.body.title || '').trim() : existing.title;
  const priority = req.body.priority !== undefined ? String(req.body.priority || '').trim().toLowerCase() : existing.priority;
  const assignedTo = req.body.assignedTo !== undefined ? String(req.body.assignedTo || '').trim() : existing.assignedTo;
  const status = req.body.status !== undefined ? String(req.body.status || '').trim().toLowerCase() : existing.status;
  const location = req.body.location !== undefined ? String(req.body.location || '').trim() : existing.location;

  if (!title) return res.status(400).json({ error: 'Job title is required' });
  if (!['low', 'medium', 'high'].includes(priority)) return res.status(400).json({ error: 'Invalid priority' });
  if (!['new', 'assigned', 'in-progress', 'completed'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  if (assignedTo && !technicianUsernames.includes(assignedTo)) return res.status(400).json({ error: 'Assigned technician not found' });

  existing.title = title;
  existing.priority = priority;
  existing.assignedTo = assignedTo;
  existing.status = assignedTo ? status : 'new';
  existing.location = location || 'Unspecified';

  return res.json(existing);
});

app.patch('/api/jobs/:id/status', requireAuth, (req, res) => {
  const existing = findJobById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Job not found' });

  const status = String(req.body.status || '').trim().toLowerCase();
  if (!['assigned', 'in-progress', 'completed'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

  if (req.authUser.role === 'technician') {
    if (existing.assignedTo !== req.authUser.username) return res.status(403).json({ error: 'Forbidden' });
    if (status === 'assigned') return res.status(400).json({ error: 'Technicians cannot set assigned status' });
  } else if (!['admin', 'dispatcher'].includes(req.authUser.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  existing.status = status;
  return res.json(existing);
});

app.get('/api/dashboard/summary', requireAuth, (req, res) => {
  const total = jobs.length;
  const newCount = jobs.filter((job) => job.status === 'new').length;
  const assignedCount = jobs.filter((job) => job.status === 'assigned').length;
  const inProgressCount = jobs.filter((job) => job.status === 'in-progress').length;
  const completedCount = jobs.filter((job) => job.status === 'completed').length;

  res.json({
    totalJobs: total,
    newJobs: newCount,
    assignedJobs: assignedCount,
    inProgressJobs: inProgressCount,
    completedJobs: completedCount,
    role: req.authUser.role,
  });
});

app.listen(PORT, () => {
  console.log(`App 2 backend running on http://localhost:${PORT}`);
});
