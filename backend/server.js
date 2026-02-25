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
  { id: 'JOB-1001', title: 'HVAC preventive maintenance', status: 'new', priority: 'medium', assignedTo: 'technician' },
  { id: 'JOB-1002', title: 'Generator inspection', status: 'assigned', priority: 'high', assignedTo: 'technician' },
  { id: 'JOB-1003', title: 'Electrical panel audit', status: 'in-progress', priority: 'high', assignedTo: 'technician' },
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
