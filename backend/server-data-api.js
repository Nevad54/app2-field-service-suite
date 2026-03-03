const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3002;
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const JOB_UPLOADS_DIR = path.join(UPLOADS_DIR, 'jobs');
const DATA_DIR = path.join(__dirname, 'data');

// Mongo configuration
const ATLAS_DATA_API_URL = process.env.ATLAS_DATA_API_URL || 'https://data.mongodb-api.com/app/data-abcde/endpoint/data/v1';
const ATLAS_DATA_API_KEY = process.env.ATLAS_DATA_API_KEY || 'your-api-key';
const DB_NAME = process.env.DB_NAME || 'fieldservice';

const dataApiFetch = async (endpoint, method, body) => {
  const response = await fetch(`${ATLAS_DATA_API_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Request-Headers': '*',
      'api-key': ATLAS_DATA_API_KEY
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return response.json();
};

const find = async (collection, filter = {}) => {
  return dataApiFetch(`/action/find`, 'POST', { collection, database: DB_NAME, filter });
};

const findMany = async (collection, filter = {}, sort = {}) => {
  return dataApiFetch(`/action/find`, 'POST', { 
    collection, 
    database: DB_NAME, 
    filter,
    sort
  });
};

const insertOne = async (collection, document) => {
  return dataApiFetch(`/action/insertOne`, 'POST', { collection, database: DB_NAME, document });
};

const updateOne = async (collection, filter, update) => {
  return dataApiFetch(`/action/updateOne`, 'POST', { collection, database: DB_NAME, filter, update: { $set: update } });
};

const deleteOne = async (collection, filter) => {
  return dataApiFetch(`/action/deleteOne`, 'POST', { collection, database: DB_NAME, filter });
};

const countDocuments = async (collection, filter = {}) => {
  return dataApiFetch(`/action/count`, 'POST', { collection, database: DB_NAME, filter });
};

const startServer = async () => {
  fs.mkdirSync(JOB_UPLOADS_DIR, { recursive: true });
  fs.mkdirSync(DATA_DIR, { recursive: true });

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Status endpoint
  app.get('/api/status', (_req, res) => {
    res.json({ ok: true, service: 'app2-field-service-suite-backend', timestamp: new Date().toISOString(), database: 'mongodb-data-api' });
  });

  // Auth endpoints
  app.post('/api/auth/login', async (req, res) => {
    const username = String(req.body.username || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    
    try {
      const users = await findMany('users', { username: username.toLowerCase() });
      const user = users.documents?.[0];
      
      if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = crypto.randomBytes(24).toString('hex');
      sessions.set(token, { user: toSafeUser(user), createdAt: Date.now() });
      return res.json({ user: toSafeUser(user), token });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Database connection failed' });
    }
  });

  const sessions = new Map();

  const toSafeUser = (user) => ({
    id: user.id || user._id?.toString(),
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

  app.get('/api/auth/me', requireAuth, (req, res) => {
    res.json({ user: req.authUser });
  });

  app.post('/api/auth/logout', requireAuth, (req, res) => {
    sessions.delete(req.authToken);
    res.json({ ok: true });
  });

  // Customers endpoints
  app.get('/api/customers', requireAuth, async (req, res) => {
    try {
      const result = await findMany('customers', {}, { name: 1 });
      res.json(result.documents || []);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/customers', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
    const { name, email, phone, address } = req.body;
    if (!name) return res.status(400).json({ error: 'Customer name is required' });
    
    try {
      const countResult = await countDocuments('customers');
      const count = countResult.count || 0;
      const newCustomer = {
        id: `CUST-${String(count + 1).padStart(3, '0')}`,
        name,
        email: email || '',
        phone: phone || '',
        address: address || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await insertOne('customers', newCustomer);
      res.status(201).json(newCustomer);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Jobs endpoints - simplified for Data API
  app.get('/api/jobs', requireAuth, async (req, res) => {
    try {
      const result = await findMany('jobs', {}, { created_at: -1 });
      res.json(result.documents || []);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/jobs', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
    const { title, priority, assignedTo, location, customerId, scheduledDate, category, notes } = req.body;
    if (!title) return res.status(400).json({ error: 'Job title is required' });
    
    try {
      const countResult = await countDocuments('jobs');
      const count = countResult.count || 0;
      const now = new Date().toISOString();
      
      const newJob = {
        id: `JOB-${String(count + 1).padStart(4, '0')}`,
        title,
        status: assignedTo ? 'assigned' : 'new',
        priority: priority || 'medium',
        assignedTo: assignedTo || '',
        location: location || 'Unspecified',
        customerId: customerId || '',
        scheduledDate: scheduledDate || '',
        category: category || 'general',
        notes: notes || '',
        created_at: now,
        updated_at: now,
        partsUsed: [],
        materialsUsed: [],
        worklog: []
      };
      
      await insertOne('jobs', newJob);
      res.status(201).json(newJob);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Projects endpoints
  app.get('/api/projects', requireAuth, async (req, res) => {
    try {
      const result = await findMany('projects', {}, { created_at: -1 });
      res.json(result.documents || []);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Dashboard summary
  app.get('/api/dashboard/summary', requireAuth, async (req, res) => {
    try {
      const jobsResult = await findMany('jobs');
      const customersResult = await countDocuments('customers');
      const invoicesResult = await findMany('invoices');
      
      const allJobs = jobsResult.documents || [];
      const allInvoices = invoicesResult.documents || [];
      
      res.json({
        totalJobs: allJobs.length,
        newJobs: allJobs.filter(job => job.status === 'new').length,
        assignedJobs: allJobs.filter(job => job.status === 'assigned').length,
        inProgressJobs: allJobs.filter(job => job.status === 'in-progress').length,
        completedJobs: allJobs.filter(job => job.status === 'completed').length,
        totalCustomers: customersResult.count || 0,
        totalInvoices: allInvoices.length,
        paidInvoices: allInvoices.filter(i => i.status === 'paid').length,
        pendingInvoices: allInvoices.filter(i => i.status === 'pending').length,
        totalRevenue: allInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.amount || 0), 0),
        pendingRevenue: allInvoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + (i.amount || 0), 0),
        role: req.authUser.role,
        recentActivity: []
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Fallback for other endpoints - return empty array
  app.use('/api/*', (req, res) => {
    res.json([]);
  });

  app.listen(PORT, () => {
    console.log(`App 2 backend running on http://localhost:${PORT} (MongoDB Data API)`);
  });
};

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
