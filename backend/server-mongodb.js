const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3002;
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const JOB_UPLOADS_DIR = path.join(UPLOADS_DIR, 'jobs');
const DATA_DIR = path.join(__dirname, 'data');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://fieldservice-user:app2field@ac-fqpvl13-shard-00-00.76mgxvb.mongodb.net:27017/?replicaSet=atlas-iupd3z-shard-0&authSource=admin&directConnection=true';
const DB_NAME = process.env.DB_NAME || 'fieldservice';

let db = null;
let client = null;

const connectDB = async () => {
  try {
    client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 30000, connectTimeoutMS: 30000 });
    await client.connect();
    db = client.db(DB_NAME);
    console.log(`MongoDB connected to ${DB_NAME}`);
    
    
    await createIndexes();
    
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    throw error;
  }
};

const createIndexes = async () => {
  try {
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    await db.collection('jobs').createIndex({ status: 1 });
    await db.collection('jobs').createIndex({ assignedTo: 1 });
    await db.collection('jobs').createIndex({ customerId: 1 });
    await db.collection('jobs').createIndex({ scheduledDate: 1 });
    await db.collection('customers').createIndex({ email: 1 }, { unique: true });
    await db.collection('invoices').createIndex({ jobId: 1 });
    await db.collection('invoices').createIndex({ customerId: 1 });
    await db.collection('invoices').createIndex({ status: 1 });
    await db.collection('projects').createIndex({ status: 1 });
    await db.collection('tasks').createIndex({ project_id: 1 });
    await db.collection('tasks').createIndex({ parent_task_id: 1 });
    await db.collection('activityLogs').createIndex({ timestamp: -1 });
    await db.collection('activityLogs').createIndex({ entity_id: 1 });
    await db.collection('notifications').createIndex({ user_id: 1 });
    await db.collection('notifications').createIndex({ read: 1 });
    await db.collection('sessions').createIndex({ token: 1 }, { unique: true });
    console.log('Database indexes created');
  } catch (error) {
    console.error('Error creating indexes:', error.message);
  }
};

const getCollection = (name) => db.collection(name);

const calculateDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end - start;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 ? diffDays + 1 : 0;
};

const calculateTaskStatus = (progress, endDate) => {
  if (progress === 0) return 'not_started';
  if (progress === 100) return 'completed';
  if (endDate) {
    const today = new Date();
    const end = new Date(endDate);
    if (end < today && progress < 100) return 'delayed';
  }
  return 'in_progress';
};

const calculateProjectProgress = async (projectId) => {
  const tasks = await getCollection('tasks').find({ project_id: projectId, parent_task_id: null }).toArray();
  if (!tasks || tasks.length === 0) return 0;
  let totalWeightedProgress = 0;
  let totalWeight = 0;
  tasks.forEach(task => {
    const weight = task.weight || 1;
    totalWeightedProgress += (task.progress_percent || 0) * weight;
    totalWeight += weight;
  });
  if (totalWeight === 0) return 0;
  return Math.round(totalWeightedProgress / totalWeight);
};

const calculateProjectStatus = async (projectId) => {
  const tasks = await getCollection('tasks').find({ project_id: projectId }).toArray();
  if (!tasks || tasks.length === 0) return 'planning';
  const completed = tasks.every(t => t.progress_percent === 100);
  if (completed) return 'completed';
  const anyInProgress = tasks.some(t => t.progress_percent > 0 && t.progress_percent < 100);
  if (anyInProgress) return 'in_progress';
  const anyDelayed = tasks.some(t => calculateTaskStatus(t.progress_percent, t.end_date) === 'delayed');
  if (anyDelayed) return 'delayed';
  return 'planning';
};

const logActivity = async (entityType, entityId, userId, action, description) => {
  const activityLogs = getCollection('activityLogs');
  await activityLogs.insertOne({
    id: `act-${Date.now()}`,
    entity_type: entityType,
    entity_id: entityId,
    user_id: userId,
    action,
    description,
    timestamp: new Date().toISOString()
  });
};

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

const startServer = async () => {
  fs.mkdirSync(JOB_UPLOADS_DIR, { recursive: true });
  fs.mkdirSync(DATA_DIR, { recursive: true });

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Status endpoint
  app.get('/api/status', (_req, res) => {
    res.json({ ok: true, service: 'app2-field-service-suite-backend', timestamp: new Date().toISOString(), database: 'mongodb' });
  });

  // Auth endpoints
  app.post('/api/auth/login', async (req, res) => {
    const username = String(req.body.username || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    
    const users = getCollection('users');
    const user = await users.findOne({ username: username.toLowerCase() });
    
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

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

  // Customers endpoints
  app.get('/api/customers', requireAuth, async (req, res) => {
    const customers = getCollection('customers');
    res.json(await customers.find().sort({ name: 1 }).toArray());
  });

  app.post('/api/customers', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
    const { name, email, phone, address } = req.body;
    if (!name) return res.status(400).json({ error: 'Customer name is required' });
    
    const customers = getCollection('customers');
    const count = await customers.countDocuments();
    const newCustomer = {
      id: `CUST-${String(count + 1).padStart(3, '0')}`,
      name,
      email: email || '',
      phone: phone || '',
      address: address || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await customers.insertOne(newCustomer);
    await logActivity('customer', newCustomer.id, req.authUser.username, 'created', `New customer added: ${name}`);
    res.status(201).json(newCustomer);
  });

  app.put('/api/customers/:id', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
    const customers = getCollection('customers');
    const customer = await customers.findOne({ id: req.params.id });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    
    const { name, email, phone, address } = req.body;
    const update = {};
    if (name) update.name = name;
    if (email !== undefined) update.email = email;
    if (phone !== undefined) update.phone = phone;
    if (address !== undefined) update.address = address;
    update.updated_at = new Date().toISOString();
    
    await customers.updateOne({ id: req.params.id }, { $set: update });
    const updated = await customers.findOne({ id: req.params.id });
    await logActivity('customer', updated.id, req.authUser.username, 'updated', `Customer ${updated.name} updated`);
    res.json(updated);
  });

  app.delete('/api/customers/:id', requireAuth, requireRoles(['admin']), async (req, res) => {
    const customers = getCollection('customers');
    const customer = await customers.findOne({ id: req.params.id });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    
    await customers.deleteOne({ id: req.params.id });
    await logActivity('customer', customer.id, req.authUser.username, 'deleted', `Customer ${customer.name} deleted`);
    res.json({ ok: true });
  });

  // Technicians endpoints
  app.get('/api/technicians', requireAuth, async (req, res) => {
    const technicians = getCollection('technicians');
    res.json(await technicians.find().toArray());
  });

  app.get('/api/technicians/:id', requireAuth, async (req, res) => {
    const technicians = getCollection('technicians');
    const technician = await technicians.findOne({ id: req.params.id });
    if (!technician) return res.status(404).json({ error: 'Technician not found' });
    res.json(technician);
  });

  app.post('/api/technicians', requireAuth, requireRoles(['admin']), async (req, res) => {
    const { name, email, phone, skills, hourly_rate, certifications, availability, status, color, hire_date, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Technician name is required' });
    
    const technicians = getCollection('technicians');
    const newTech = {
      id: `tech-${Date.now()}`,
      name,
      email: email || '',
      phone: phone || '',
      role: 'technician',
      skills: skills || [],
      hourly_rate: hourly_rate || 50,
      certifications: certifications || [],
      availability: availability || {
        monday: { start: '08:00', end: '17:00' },
        tuesday: { start: '08:00', end: '17:00' },
        wednesday: { start: '08:00', end: '17:00' },
        thursday: { start: '08:00', end: '17:00' },
        friday: { start: '08:00', end: '17:00' },
        saturday: null,
        sunday: null
      },
      status: status || 'active',
      color: color || '#0ea5e9',
      hire_date: hire_date || new Date().toISOString().split('T')[0],
      notes: notes || ''
    };
    
    await technicians.insertOne(newTech);
    await logActivity('technician', newTech.id, req.authUser.username, 'created', `New technician added: ${name}`);
    res.status(201).json(newTech);
  });

  app.put('/api/technicians/:id', requireAuth, requireRoles(['admin']), async (req, res) => {
    const technicians = getCollection('technicians');
    const technician = await technicians.findOne({ id: req.params.id });
    if (!technician) return res.status(404).json({ error: 'Technician not found' });
    
    const { name, email, phone, skills, hourly_rate, certifications, availability, status, color, notes } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (email !== undefined) update.email = email;
    if (phone !== undefined) update.phone = phone;
    if (skills !== undefined) update.skills = skills;
    if (hourly_rate !== undefined) update.hourly_rate = hourly_rate;
    if (certifications !== undefined) update.certifications = certifications;
    if (availability !== undefined) update.availability = availability;
    if (status !== undefined) update.status = status;
    if (color !== undefined) update.color = color;
    if (notes !== undefined) update.notes = notes;
    
    await technicians.updateOne({ id: req.params.id }, { $set: update });
    const updated = await technicians.findOne({ id: req.params.id });
    await logActivity('technician', updated.id, req.authUser.username, 'updated', `Technician ${updated.name} updated`);
    res.json(updated);
  });

  app.delete('/api/technicians/:id', requireAuth, requireRoles(['admin']), async (req, res) => {
    const technicians = getCollection('technicians');
    const technician = await technicians.findOne({ id: req.params.id });
    if (!technician) return res.status(404).json({ error: 'Technician not found' });
    
    await technicians.deleteOne({ id: req.params.id });
    await logActivity('technician', technician.id, req.authUser.username, 'deleted', `Technician ${technician.name} deleted`);
    res.json({ ok: true });
  });

  app.get('/api/technicians/skills', requireAuth, async (req, res) => {
    const technicians = getCollection('technicians');
    const allTechs = await technicians.find().toArray();
    const allSkills = new Set();
    allTechs.forEach(tech => {
      if (tech.skills) tech.skills.forEach(skill => allSkills.add(skill));
    });
    res.json(Array.from(allSkills).sort());
  });

  // Jobs endpoints
  app.get('/api/jobs', requireAuth, async (req, res) => {
    const jobs = getCollection('jobs');
    let allJobs = await jobs.find().sort({ created_at: -1 }).toArray();
    
    if (req.authUser.role === 'technician') {
      allJobs = allJobs.filter(job => job.assignedTo === req.authUser.username);
    } else if (req.authUser.role === 'client') {
      allJobs = allJobs.filter(job => job.customerId === req.authUser.id);
    }
    
    res.json(allJobs);
  });

  app.post('/api/jobs', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
    const { title, priority, assignedTo, location, customerId, scheduledDate, category, notes, projectId, taskId } = req.body;
    if (!title) return res.status(400).json({ error: 'Job title is required' });
    
    const jobs = getCollection('jobs');
    const count = await jobs.countDocuments();
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
      worklog: [],
      technicianNotes: '',
      completionNotes: '',
      projectId: projectId || null,
      taskId: taskId || null
    };
    
    await jobs.insertOne(newJob);
    await logActivity('job', newJob.id, req.authUser.username, 'created', `Created job: ${title}`);
    res.status(201).json(newJob);
  });

  app.put('/api/jobs/:id', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
    const jobs = getCollection('jobs');
    const job = await jobs.findOne({ id: req.params.id });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    
    const { title, priority, assignedTo, status, location, customerId, scheduledDate, category, notes, projectId, taskId } = req.body;
    const update = {};
    if (title) update.title = title;
    if (priority) update.priority = priority;
    if (assignedTo !== undefined) update.assignedTo = assignedTo;
    if (status) update.status = status;
    if (location !== undefined) update.location = location;
    if (customerId !== undefined) update.customerId = customerId;
    if (scheduledDate !== undefined) update.scheduledDate = scheduledDate;
    if (category !== undefined) update.category = category;
    if (notes !== undefined) update.notes = notes;
    if (projectId !== undefined) update.projectId = projectId || null;
    if (taskId !== undefined) update.taskId = taskId || null;
    update.updated_at = new Date().toISOString();
    
    await jobs.updateOne({ id: req.params.id }, { $set: update });
    res.json(await jobs.findOne({ id: req.params.id }));
  });

  app.patch('/api/jobs/:id/status', requireAuth, async (req, res) => {
    const jobs = getCollection('jobs');
    const job = await jobs.findOne({ id: req.params.id });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    
    const status = String(req.body.status || '').trim().toLowerCase();
    if (!['assigned', 'in-progress', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    if (req.authUser.role === 'technician') {
      if (job.assignedTo !== req.authUser.username) return res.status(403).json({ error: 'Forbidden' });
      if (status === 'assigned') return res.status(400).json({ error: 'Technicians cannot set assigned status' });
    } else if (!['admin', 'dispatcher'].includes(req.authUser.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    await jobs.updateOne({ id: req.params.id }, { $set: { status, updated_at: new Date().toISOString() } });
    const updated = await jobs.findOne({ id: req.params.id });
    await logActivity('job', updated.id, req.authUser.username, 'status_changed', `Job ${updated.id} status changed to ${status}`);
    res.json(updated);
  });

  app.delete('/api/jobs/:id', requireAuth, requireRoles(['admin']), async (req, res) => {
    const jobs = getCollection('jobs');
    const job = await jobs.findOne({ id: req.params.id });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    
    await jobs.deleteOne({ id: req.params.id });
    await logActivity('job', job.id, req.authUser.username, 'deleted', `Job ${job.id} deleted`);
    res.json({ ok: true });
  });

  app.post('/api/jobs/:id/checkin', requireAuth, async (req, res) => {
    const jobs = getCollection('jobs');
    const job = await jobs.findOne({ id: req.params.id });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    
    if (req.authUser.role === 'technician') {
      if (job.assignedTo !== req.authUser.username) return res.status(403).json({ error: 'Forbidden' });
    } else if (!['admin', 'dispatcher'].includes(req.authUser.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    if (job.checkoutTime) return res.status(400).json({ error: 'Job already checked out' });
    if (job.checkinTime) return res.status(400).json({ error: 'Job already checked in' });
    
    const update = {
      checkinTime: new Date().toISOString(),
      status: (job.status === 'new' || job.status === 'assigned') ? 'in-progress' : job.status,
      updated_at: new Date().toISOString()
    };
    
    await jobs.updateOne({ id: req.params.id }, { $set: update });
    const updated = await jobs.findOne({ id: req.params.id });
    await logActivity('job', updated.id, req.authUser.username, 'checkin', `Checked in to ${updated.id}`);
    res.json(updated);
  });

  app.post('/api/jobs/:id/checkout', requireAuth, async (req, res) => {
    const jobs = getCollection('jobs');
    const job = await jobs.findOne({ id: req.params.id });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    
    if (req.authUser.role === 'technician') {
      if (job.assignedTo !== req.authUser.username) return res.status(403).json({ error: 'Forbidden' });
    } else if (!['admin', 'dispatcher'].includes(req.authUser.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    if (!job.checkinTime) return res.status(400).json({ error: 'Check in first before checkout' });
    if (job.checkoutTime) return res.status(400).json({ error: 'Job already checked out' });
    
    const update = {
      checkoutTime: new Date().toISOString(),
      status: 'completed',
      completionNotes: typeof req.body.notes === 'string' ? req.body.notes : '',
      updated_at: new Date().toISOString()
    };
    
    await jobs.updateOne({ id: req.params.id }, { $set: update });
    const updated = await jobs.findOne({ id: req.params.id });
    await logActivity('job', updated.id, req.authUser.username, 'checkout', `Checked out from ${updated.id}`);
    res.json(updated);
  });

  app.patch('/api/jobs/:id/worklog', requireAuth, async (req, res) => {
    const jobs = getCollection('jobs');
    const job = await jobs.findOne({ id: req.params.id });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    
    const isTechAssigned = req.authUser.role === 'technician' && job.assignedTo === req.authUser.username;
    const isManager = ['admin', 'dispatcher'].includes(req.authUser.role);
    if (!isTechAssigned && !isManager) return res.status(403).json({ error: 'Forbidden' });
    
    const { technicianNotes, partsUsed, materialsUsed } = req.body || {};
    const worklogEntry = {
      at: new Date().toISOString(),
      by: req.authUser.username,
      technicianNotes: technicianNotes || '',
      partsUsed: Array.isArray(partsUsed) ? partsUsed : [],
      materialsUsed: Array.isArray(materialsUsed) ? materialsUsed : []
    };
    
    const update = {
      technicianNotes: technicianNotes !== undefined ? String(technicianNotes || '') : job.technicianNotes,
      partsUsed: partsUsed !== undefined ? (Array.isArray(partsUsed) ? partsUsed : []) : (job.partsUsed || []),
      materialsUsed: materialsUsed !== undefined ? (Array.isArray(materialsUsed) ? materialsUsed : []) : (job.materialsUsed || []),
      worklog: [worklogEntry, ...(job.worklog || [])],
      updated_at: new Date().toISOString()
    };
    
    await jobs.updateOne({ id: req.params.id }, { $set: update });
    const updated = await jobs.findOne({ id: req.params.id });
    await logActivity('job', updated.id, req.authUser.username, 'worklog_updated', `Updated worklog for ${updated.id}`);
    res.json(updated);
  });

  // Schedule endpoint
  app.get('/api/schedule', requireAuth, async (req, res) => {
    const jobs = getCollection('jobs');
    let scheduledJobs = await jobs.find({ scheduledDate: { $exists: true, $ne: '' } }).toArray();
    
    if (req.authUser.role === 'technician') {
      scheduledJobs = scheduledJobs.filter(job => job.assignedTo === req.authUser.username);
    } else if (req.authUser.role === 'client') {
      scheduledJobs = scheduledJobs.filter(job => job.customerId === req.authUser.id);
    }
    
    res.json(scheduledJobs);
  });

  // Invoices endpoints
  app.get('/api/invoices', requireAuth, async (req, res) => {
    const invoices = getCollection('invoices');
    let allInvoices = await invoices.find().sort({ issued_date: -1, id: -1 }).toArray();
    
    if (req.authUser.role === 'client') {
      allInvoices = allInvoices.filter(inv => inv.customerId === req.authUser.id);
    }
    
    res.json(allInvoices);
  });

  app.get('/api/invoices/:id', requireAuth, async (req, res) => {
    const invoices = getCollection('invoices');
    const invoice = await invoices.findOne({ id: req.params.id });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    
    if (req.authUser.role === 'client' && invoice.customerId !== req.authUser.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const jobs = getCollection('jobs');
    const job = await jobs.findOne({ id: invoice.jobId });
    res.json({ ...invoice, job: job || null });
  });

  app.post('/api/invoices', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
    const { jobId, customerId, amount, description } = req.body;
    if (!jobId || !customerId || !amount) {
      return res.status(400).json({ error: 'Job ID, Customer ID, and Amount are required' });
    }
    
    const invoices = getCollection('invoices');
    const year = new Date().getFullYear();
    const count = await invoices.countDocuments({ id: { $regex: `^INV-${year}-` } });
    
    const newInvoice = {
      id: `INV-${year}-${String(count + 1).padStart(3, '0')}`,
      jobId,
      customerId,
      amount: parseFloat(amount),
      status: 'pending',
      issuedDate: new Date().toISOString().split('T')[0],
      paidDate: null,
      description: description || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await invoices.insertOne(newInvoice);
    await logActivity('invoice', newInvoice.id, req.authUser.username, 'created', `Invoice ${newInvoice.id} created for $${amount}`);
    res.status(201).json(newInvoice);
  });

  app.patch('/api/invoices/:id/status', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
    const invoices = getCollection('invoices');
    const invoice = await invoices.findOne({ id: req.params.id });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    
    const { status } = req.body;
    if (!['pending', 'paid'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const update = { status, updated_at: new Date().toISOString() };
    if (status === 'paid') {
      update.paidDate = new Date().toISOString().split('T')[0];
    }
    
    await invoices.updateOne({ id: req.params.id }, { $set: update });
    const updated = await invoices.findOne({ id: req.params.id });
    await logActivity('invoice', updated.id, req.authUser.username, status === 'paid' ? 'paid' : 'status_changed', 
      `Invoice ${updated.id} ${status === 'paid' ? 'paid in full' : 'status changed to ' + status}`);
    res.json(updated);
  });

  // Activity endpoint
  app.get('/api/activity', requireAuth, async (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    const activityLogs = getCollection('activityLogs');
    const logs = await activityLogs.find().sort({ timestamp: -1 }).limit(limit).toArray();
    res.json(logs);
  });

  // Notifications endpoint
  app.get('/api/notifications', requireAuth, async (req, res) => {
    const notifications = getCollection('notifications');
    const userNotifications = await notifications.find({
      $or: [{ user_id: req.authUser.username }, { user_id: 'all' }]
    }).sort({ created_at: -1 }).toArray();
    
    res.json(userNotifications.map(n => ({
      ...n,
      createdAt: n.createdAt || n.timestamp || n.created_at
    })));
  });

  // Dashboard summary
  app.get('/api/dashboard/summary', requireAuth, async (req, res) => {
    const jobs = getCollection('jobs');
    const customers = getCollection('customers');
    const invoices = getCollection('invoices');
    const activityLogs = getCollection('activityLogs');
    
    const allJobs = await jobs.find().toArray();
    const allCustomers = await customers.countDocuments();
    const allInvoices = await invoices.find().toArray();
    const recentActivity = await activityLogs.find().sort({ timestamp: -1 }).limit(10).toArray();
    
    const total = allJobs.length;
    const newCount = allJobs.filter(job => job.status === 'new').length;
    const assignedCount = allJobs.filter(job => job.status === 'assigned').length;
    const inProgressCount = allJobs.filter(job => job.status === 'in-progress').length;
    const completedCount = allJobs.filter(job => job.status === 'completed').length;
    
    const totalRevenue = allInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.amount || 0), 0);
    const pendingRevenue = allInvoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + (i.amount || 0), 0);
    
    res.json({
      totalJobs: total,
      newJobs: newCount,
      assignedJobs: assignedCount,
      inProgressJobs: inProgressCount,
      completedJobs: completedCount,
      totalCustomers: allCustomers,
      totalInvoices: allInvoices.length,
      paidInvoices: allInvoices.filter(i => i.status === 'paid').length,
      pendingInvoices: allInvoices.filter(i => i.status === 'pending').length,
      totalRevenue,
      pendingRevenue,
      role: req.authUser.role,
      recentActivity
    });
  });

  // Client portal endpoints
  app.get('/api/client/jobs', requireAuth, async (req, res) => {
    if (req.authUser.role !== 'client') return res.status(403).json({ error: 'Forbidden' });
    const jobs = getCollection('jobs');
    const clientJobs = await jobs.find({ customerId: req.authUser.id }).toArray();
    res.json(clientJobs);
  });

  app.get('/api/client/invoices', requireAuth, async (req, res) => {
    if (req.authUser.role !== 'client') return res.status(403).json({ error: 'Forbidden' });
    const invoices = getCollection('invoices');
    const clientInvoices = await invoices.find({ customerId: req.authUser.id }).toArray();
    res.json(clientInvoices);
  });

  app.post('/api/client/login', async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    
    const customers = getCollection('customers');
    const customer = await customers.findOne({ email: email.toLowerCase() });
    if (!customer) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = crypto.randomBytes(24).toString('hex');
    sessions.set(token, { 
      user: { 
        id: customer.id, 
        username: customer.name, 
        role: 'client', 
        email: customer.email 
      }, 
      createdAt: Date.now() 
    });
    
    return res.json({ 
      token, 
      user: { id: customer.id, username: customer.name, role: 'client', email: customer.email }
    });
  });

  // Projects endpoints
  app.get('/api/projects', requireAuth, async (req, res) => {
    const projects = getCollection('projects');
    res.json(await projects.find().sort({ created_at: -1 }).toArray());
  });

  app.get('/api/projects/:id', requireAuth, async (req, res) => {
    const projects = getCollection('projects');
    const project = await projects.findOne({ id: req.params.id });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  });

  app.post('/api/projects', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
    const { title, description, start_date, end_date } = req.body;
    if (!title) return res.status(400).json({ error: 'Project title is required' });
    
    const projects = getCollection('projects');
    const newProject = {
      id: `proj-${Date.now()}`,
      title,
      description: description || '',
      start_date: start_date || null,
      end_date: end_date || null,
      status: 'planning',
      overall_progress: 0,
      created_by: req.authUser.username,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await projects.insertOne(newProject);
    await logActivity('project', newProject.id, req.authUser.username, 'created', `Created project: ${title}`);
    res.status(201).json(newProject);
  });

  app.put('/api/projects/:id', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
    const projects = getCollection('projects');
    const project = await projects.findOne({ id: req.params.id });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    const { title, description, start_date, end_date, status } = req.body;
    const update = {};
    if (title) update.title = title;
    if (description !== undefined) update.description = description;
    if (start_date !== undefined) update.start_date = start_date;
    if (end_date !== undefined) update.end_date = end_date;
    if (status && req.authUser.role === 'admin') update.status = status;
    update.updated_at = new Date().toISOString();
    
    await projects.updateOne({ id: req.params.id }, { $set: update });
    const updated = await projects.findOne({ id: req.params.id });
    await logActivity('project', updated.id, req.authUser.username, 'updated', `Project ${updated.title} updated`);
    res.json(updated);
  });

  app.delete('/api/projects/:id', requireAuth, requireRoles(['admin']), async (req, res) => {
    const projects = getCollection('projects');
    const tasks = getCollection('tasks');
    
    const project = await projects.findOne({ id: req.params.id });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    await tasks.deleteMany({ project_id: req.params.id });
    await projects.deleteOne({ id: req.params.id });
    await logActivity('project', project.id, req.authUser.username, 'deleted', `Project ${project.title} deleted`);
    res.json({ ok: true });
  });

  // Tasks endpoints
  app.get('/api/projects/:id/tasks', requireAuth, async (req, res) => {
    const tasks = getCollection('tasks');
    const projectTasks = await tasks.find({ project_id: req.params.id }).sort({ sort_order: 1, name: 1 }).toArray();
    res.json(projectTasks);
  });

  app.post('/api/tasks', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
    const { project_id, parent_task_id, name, start_date, end_date, progress_percent, weight, notes, sort_order } = req.body;
    
    if (!project_id || !name) {
      return res.status(400).json({ error: 'Project ID and task name are required' });
    }
    
    const projects = getCollection('projects');
    const project = await projects.findOne({ id: project_id });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    const tasks = getCollection('tasks');
    const duration_days = calculateDuration(start_date, end_date);
    const status = calculateTaskStatus(progress_percent || 0, end_date);
    const taskWeight = weight || 1;
    
    const newTask = {
      id: `task-${Date.now()}`,
      project_id,
      parent_task_id: parent_task_id || null,
      name,
      start_date: start_date || null,
      end_date: end_date || null,
      duration_days,
      progress_percent: progress_percent || 0,
      weight: taskWeight,
      status,
      sort_order: sort_order || 0,
      notes: notes || '',
      updated_by: req.authUser.username,
      updated_at: new Date().toISOString()
    };
    
    await tasks.insertOne(newTask);
    
    const overallProgress = await calculateProjectProgress(project_id);
    const projectStatus = await calculateProjectStatus(project_id);
    await projects.updateOne({ id: project_id }, { $set: { overall_progress: overallProgress, status: projectStatus, updated_at: new Date().toISOString() } });
    
    await logActivity('task', newTask.id, req.authUser.username, 'created', `Created task: ${name}`);
    res.status(201).json(newTask);
  });

  app.put('/api/tasks/:id', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
    const tasks = getCollection('tasks');
    const task = await tasks.findOne({ id: req.params.id });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    
    const { name, parent_task_id, start_date, end_date, progress_percent, weight, notes, sort_order } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (parent_task_id !== undefined) update.parent_task_id = parent_task_id;
    if (start_date !== undefined) update.start_date = start_date;
    if (end_date !== undefined) update.end_date = end_date;
    if (progress_percent !== undefined) update.progress_percent = progress_percent;
    if (weight !== undefined) update.weight = weight;
    if (notes !== undefined) update.notes = notes;
    if (sort_order !== undefined) update.sort_order = sort_order;
    
    update.duration_days = calculateDuration(update.start_date || task.start_date, update.end_date || task.end_date);
    update.status = calculateTaskStatus(update.progress_percent ?? task.progress_percent, update.end_date || task.end_date);
    update.updated_by = req.authUser.username;
    update.updated_at = new Date().toISOString();
    
    await tasks.updateOne({ id: req.params.id }, { $set: update });
    
    const projects = getCollection('projects');
    const overallProgress = await calculateProjectProgress(task.project_id);
    const projectStatus = await calculateProjectStatus(task.project_id);
    await projects.updateOne({ id: task.project_id }, { $set: { overall_progress: overallProgress, status: projectStatus, updated_at: new Date().toISOString() } });
    
    const updated = await tasks.findOne({ id: req.params.id });
    await logActivity('task', updated.id, req.authUser.username, 'updated', `Task ${updated.name} updated`);
    res.json(updated);
  });

  app.patch('/api/tasks/:id/progress', requireAuth, async (req, res) => {
    const tasks = getCollection('tasks');
    const task = await tasks.findOne({ id: req.params.id });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    
    const oldValue = task.progress_percent;
    const newProgress = Math.min(100, Math.max(0, req.body.progress_percent || 0));
    
    await tasks.updateOne({ id: req.params.id }, { 
      $set: { 
        progress_percent: newProgress,
        status: calculateTaskStatus(newProgress, task.end_date),
        updated_by: req.authUser.username,
        updated_at: new Date().toISOString()
      } 
    });
    
    const projects = getCollection('projects');
    const overallProgress = await calculateProjectProgress(task.project_id);
    const projectStatus = await calculateProjectStatus(task.project_id);
    await projects.updateOne({ id: task.project_id }, { $set: { overall_progress: overallProgress, status: projectStatus, updated_at: new Date().toISOString() } });
    
    const updated = await tasks.findOne({ id: req.params.id });
    await logActivity('task', updated.id, req.authUser.username, 'progress_updated', `Task ${updated.name} progress: ${oldValue}% → ${newProgress}%`);
    res.json(updated);
  });

  app.patch('/api/tasks/:id/dates', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
    const tasks = getCollection('tasks');
    const task = await tasks.findOne({ id: req.params.id });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    
    const oldStart = task.start_date;
    const oldEnd = task.end_date;
    
    const update = {};
    if (req.body.start_date !== undefined) update.start_date = req.body.start_date;
    if (req.body.end_date !== undefined) update.end_date = req.body.end_date;
    
    update.duration_days = calculateDuration(update.start_date || task.start_date, update.end_date || task.end_date);
    update.status = calculateTaskStatus(task.progress_percent, update.end_date || task.end_date);
    update.updated_by = req.authUser.username;
    update.updated_at = new Date().toISOString();
    
    await tasks.updateOne({ id: req.params.id }, { $set: update });
    
    const updated = await tasks.findOne({ id: req.params.id });
    await logActivity('task', updated.id, req.authUser.username, 'dates_updated', 
      `Task ${updated.name} dates updated: ${oldStart || 'N/A'} - ${oldEnd || 'N/A'} → ${updated.start_date || 'N/A'} - ${updated.end_date || 'N/A'}`);
    res.json(updated);
  });

  app.delete('/api/tasks/:id', requireAuth, requireRoles(['admin']), async (req, res) => {
    const tasks = getCollection('tasks');
    const task = await tasks.findOne({ id: req.params.id });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    
    const projectId = task.project_id;
    
    const deleteChildren = async (parentId) => {
      const children = await tasks.find({ parent_task_id: parentId }).toArray();
      for (const child of children) {
        await deleteChildren(child.id);
      }
      await tasks.deleteOne({ id: parentId });
    };
    
    await deleteChildren(req.params.id);
    
    const projects = getCollection('projects');
    const overallProgress = await calculateProjectProgress(projectId);
    const projectStatus = await calculateProjectStatus(projectId);
    await projects.updateOne({ id: projectId }, { $set: { overall_progress: overallProgress, status: projectStatus, updated_at: new Date().toISOString() } });
    
    await logActivity('task', task.id, req.authUser.username, 'deleted', `Task ${task.name} deleted`);
    res.json({ ok: true });
  });

  // Task attendance endpoints
  app.post('/api/tasks/:id/start', requireAuth, async (req, res) => {
    const tasks = getCollection('tasks');
    const task = await tasks.findOne({ id: req.params.id });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    
    const isAdminOrDispatcher = ['admin', 'dispatcher'].includes(req.authUser.role);
    const isAssignedTech = task.assignee === req.authUser.username;
    if (!isAdminOrDispatcher && !isAssignedTech) return res.status(403).json({ error: 'Forbidden' });
    
    if (task.status === 'completed') return res.status(400).json({ error: 'Cannot start a completed task' });
    
    await tasks.updateOne({ id: req.params.id }, { $set: { 
      actualStart: new Date().toISOString(),
      status: 'in_progress',
      updated_by: req.authUser.username,
      updated_at: new Date().toISOString()
    }});
    
    const updated = await tasks.findOne({ id: req.params.id });
    await logActivity('task', updated.id, req.authUser.username, 'started', `Task "${updated.name}" started`);
    res.json(updated);
  });

  app.post('/api/tasks/:id/pause', requireAuth, async (req, res) => {
    const tasks = getCollection('tasks');
    const task = await tasks.findOne({ id: req.params.id });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    
    const isAdminOrDispatcher = ['admin', 'dispatcher'].includes(req.authUser.role);
    const isAssignedTech = task.assignee === req.authUser.username;
    if (!isAdminOrDispatcher && !isAssignedTech) return res.status(403).json({ error: 'Forbidden' });
    
    if (task.status !== 'in_progress') return res.status(400).json({ error: 'Can only pause tasks that are in progress' });
    
    await tasks.updateOne({ id: req.params.id }, { $set: { 
      status: 'paused',
      updated_by: req.authUser.username,
      updated_at: new Date().toISOString()
    }});
    
    const updated = await tasks.findOne({ id: req.params.id });
    await logActivity('task', updated.id, req.authUser.username, 'paused', `Task "${updated.name}" paused`);
    res.json(updated);
  });

  app.post('/api/tasks/:id/resume', requireAuth, async (req, res) => {
    const tasks = getCollection('tasks');
    const task = await tasks.findOne({ id: req.params.id });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    
    const isAdminOrDispatcher = ['admin', 'dispatcher'].includes(req.authUser.role);
    const isAssignedTech = task.assignee === req.authUser.username;
    if (!isAdminOrDispatcher && !isAssignedTech) return res.status(403).json({ error: 'Forbidden' });
    
    if (task.status !== 'paused') return res.status(400).json({ error: 'Can only resume paused tasks' });
    
    await tasks.updateOne({ id: req.params.id }, { $set: { 
      status: 'in_progress',
      updated_by: req.authUser.username,
      updated_at: new Date().toISOString()
    }});
    
    const updated = await tasks.findOne({ id: req.params.id });
    await logActivity('task', updated.id, req.authUser.username, 'resumed', `Task "${updated.name}" resumed`);
    res.json(updated);
  });

  app.post('/api/tasks/:id/finish', requireAuth, async (req, res) => {
    const tasks = getCollection('tasks');
    const task = await tasks.findOne({ id: req.params.id });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    
    const isAdminOrDispatcher = ['admin', 'dispatcher'].includes(req.authUser.role);
    const isAssignedTech = task.assignee === req.authUser.username;
    if (!isAdminOrDispatcher && !isAssignedTech) return res.status(403).json({ error: 'Forbidden' });
    
    if (task.status === 'completed') return res.status(400).json({ error: 'Task already completed' });
    
    await tasks.updateOne({ id: req.params.id }, { $set: { 
      actualEnd: new Date().toISOString(),
      progress_percent: 100,
      status: 'completed',
      updated_by: req.authUser.username,
      updated_at: new Date().toISOString()
    }});
    
    const updated = await tasks.findOne({ id: req.params.id });
    
    const projects = getCollection('projects');
    const overallProgress = await calculateProjectProgress(updated.project_id);
    const projectStatus = await calculateProjectStatus(updated.project_id);
    await projects.updateOne({ id: updated.project_id }, { $set: { 
      overall_progress: overallProgress, 
      status: projectStatus, 
      updated_at: new Date().toISOString() 
    }});
    
    await logActivity('task', updated.id, req.authUser.username, 'finished', `Task "${updated.name}" completed`);
    res.json(updated);
  });

  // Planner endpoint
  app.get('/api/projects/:id/planner', requireAuth, async (req, res) => {
    const projects = getCollection('projects');
    const project = await projects.findOne({ id: req.params.id });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    const tasks = getCollection('tasks');
    const projectTasks = await tasks.find({ project_id: req.params.id }).toArray();
    
    const summary = {
      total: projectTasks.length,
      completed: projectTasks.filter(t => t.status === 'completed').length,
      inProgress: projectTasks.filter(t => t.status === 'in_progress').length,
      delayed: projectTasks.filter(t => t.status === 'delayed').length,
      notStarted: projectTasks.filter(t => t.status === 'not_started').length,
      overallProgress: project.overall_progress,
      startDate: project.start_date,
      endDate: project.end_date,
      status: project.status,
      totalWeight: projectTasks.reduce((sum, t) => sum + (t.weight || 1), 0)
    };
    
    const timelineData = projectTasks.map(task => ({
      ...task,
      timelineStart: task.start_date ? new Date(task.start_date).getTime() : null,
      timelineEnd: task.end_date ? new Date(task.end_date).getTime() : null,
      duration: task.duration_days,
      progressContribution: ((task.progress_percent || 0) * (task.weight || 1)) / 100
    }));
    
    res.json({ project, tasks: timelineData, summary });
  });

  // Inventory endpoints
  app.get('/api/inventory', requireAuth, async (req, res) => {
    const inventory = getCollection('inventory');
    res.json(await inventory.find().toArray());
  });

  app.get('/api/inventory/:id', requireAuth, async (req, res) => {
    const inventory = getCollection('inventory');
    const item = await inventory.findOne({ id: req.params.id });
    if (!item) return res.status(404).json({ error: 'Inventory item not found' });
    res.json(item);
  });

  app.post('/api/inventory', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
    const { name, sku, category, quantity, unit_price, reorder_level, location, supplier } = req.body;
    if (!name) return res.status(400).json({ error: 'Item name is required' });
    
    const inventory = getCollection('inventory');
    const count = await inventory.countDocuments();
    
    const newItem = {
      id: `INV-${String(count + 1).padStart(3, '0')}`,
      name,
      sku: sku || '',
      category: category || 'General',
      quantity: parseInt(quantity) || 0,
      unit_price: parseFloat(unit_price) || 0,
      reorder_level: parseInt(reorder_level) || 5,
      location: location || '',
      supplier: supplier || '',
      created_at: new Date().toISOString()
    };
    
    await inventory.insertOne(newItem);
    await logActivity('inventory', newItem.id, req.authUser.username, 'created', `Added inventory item: ${name}`);
    res.status(201).json(newItem);
  });

  app.put('/api/inventory/:id', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
    const inventory = getCollection('inventory');
    const item = await inventory.findOne({ id: req.params.id });
    if (!item) return res.status(404).json({ error: 'Inventory item not found' });
    
    const { name, sku, category, quantity, unit_price, reorder_level, location, supplier } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (sku !== undefined) update.sku = sku;
    if (category !== undefined) update.category = category;
    if (quantity !== undefined) update.quantity = parseInt(quantity);
    if (unit_price !== undefined) update.unit_price = parseFloat(unit_price);
    if (reorder_level !== undefined) update.reorder_level = parseInt(reorder_level);
    if (location !== undefined) update.location = location;
    if (supplier !== undefined) update.supplier = supplier;
    
    await inventory.updateOne({ id: req.params.id }, { $set: update });
    const updated = await inventory.findOne({ id: req.params.id });
    await logActivity('inventory', updated.id, req.authUser.username, 'updated', `Updated inventory item: ${updated.name}`);
    res.json(updated);
  });

  app.delete('/api/inventory/:id', requireAuth, requireRoles(['admin']), async (req, res) => {
    const inventory = getCollection('inventory');
    const item = await inventory.findOne({ id: req.params.id });
    if (!item) return res.status(404).json({ error: 'Inventory item not found' });
    
    await inventory.deleteOne({ id: req.params.id });
    await logActivity('inventory', item.id, req.authUser.username, 'deleted', `Deleted inventory item: ${item.name}`);
    res.json({ ok: true });
  });

  app.get('/api/inventory/low-stock', requireAuth, async (req, res) => {
    const inventory = getCollection('inventory');
    const lowStock = await inventory.find({ $expr: { $lte: ['$quantity', '$reorder_level'] } }).toArray();
    res.json(lowStock);
  });

  // Equipment endpoints
  app.get('/api/equipment', requireAuth, async (req, res) => {
    const equipment = getCollection('equipment');
    res.json(await equipment.find().toArray());
  });

  app.get('/api/equipment/customer/:customerId', requireAuth, async (req, res) => {
    const equipment = getCollection('equipment');
    const customerEquipment = await equipment.find({ customerId: req.params.customerId }).toArray();
    res.json(customerEquipment);
  });

  app.get('/api/equipment/:id', requireAuth, async (req, res) => {
    const equipment = getCollection('equipment');
    const item = await equipment.findOne({ id: req.params.id });
    if (!item) return res.status(404).json({ error: 'Equipment not found' });
    res.json(item);
  });

  app.post('/api/equipment', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
    const { name, type, customerId, location, serial_number, install_date, status, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Equipment name is required' });
    
    const equipment = getCollection('equipment');
    const count = await equipment.countDocuments();
    
    const newEquipment = {
      id: `EQP-${String(count + 1).padStart(3, '0')}`,
      name,
      type: type || 'General',
      customerId: customerId || '',
      location: location || '',
      serial_number: serial_number || '',
      install_date: install_date || null,
      status: status || 'operational',
      notes: notes || '',
      created_at: new Date().toISOString()
    };
    
    await equipment.insertOne(newEquipment);
    await logActivity('equipment', newEquipment.id, req.authUser.username, 'created', `Added equipment: ${name}`);
    res.status(201).json(newEquipment);
  });

  app.put('/api/equipment/:id', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
    const equipment = getCollection('equipment');
    const item = await equipment.findOne({ id: req.params.id });
    if (!item) return res.status(404).json({ error: 'Equipment not found' });
    
    const { name, type, customerId, location, serial_number, install_date, status, notes } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (type !== undefined) update.type = type;
    if (customerId !== undefined) update.customerId = customerId;
    if (location !== undefined) update.location = location;
    if (serial_number !== undefined) update.serial_number = serial_number;
    if (install_date !== undefined) update.install_date = install_date;
    if (status !== undefined) update.status = status;
    if (notes !== undefined) update.notes = notes;
    
    await equipment.updateOne({ id: req.params.id }, { $set: update });
    const updated = await equipment.findOne({ id: req.params.id });
    await logActivity('equipment', updated.id, req.authUser.username, 'updated', `Updated equipment: ${updated.name}`);
    res.json(updated);
  });

  app.delete('/api/equipment/:id', requireAuth, requireRoles(['admin']), async (req, res) => {
    const equipment = getCollection('equipment');
    const item = await equipment.findOne({ id: req.params.id });
    if (!item) return res.status(404).json({ error: 'Equipment not found' });
    
    await equipment.deleteOne({ id: req.params.id });
    await logActivity('equipment', item.id, req.authUser.username, 'deleted', `Deleted equipment: ${item.name}`);
    res.json({ ok: true });
  });

  app.get('/api/equipment/maintenance', requireAuth, async (req, res) => {
    const equipment = getCollection('equipment');
    const needsMaintenance = await equipment.find({ 
      status: { $in: ['needs_maintenance', 'out_of_service'] }
    }).toArray();
    res.json(needsMaintenance);
  });

  // Quotes endpoints
  app.get('/api/quotes', requireAuth, async (req, res) => {
    const quotes = getCollection('quotes');
    res.json(await quotes.find().toArray());
  });

  app.get('/api/quotes/customer/:customerId', requireAuth, async (req, res) => {
    const quotes = getCollection('quotes');
    const customerQuotes = await quotes.find({ customerId: req.params.customerId }).toArray();
    res.json(customerQuotes);
  });

  app.get('/api/quotes/:id', requireAuth, async (req, res) => {
    const quotes = getCollection('quotes');
    const quote = await quotes.findOne({ id: req.params.id });
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    res.json(quote);
  });

  app.post('/api/quotes', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
    const { customerId, title, description, total_amount, valid_until, items } = req.body;
    if (!customerId || !title) return res.status(400).json({ error: 'Customer ID and title are required' });
    
    const quotes = getCollection('quotes');
    const year = new Date().getFullYear();
    const count = await quotes.countDocuments({ id: { $regex: `^QUO-${year}-` } });
    
    const newQuote = {
      id: `QUO-${year}-${String(count + 1).padStart(3, '0')}`,
      customerId,
      title,
      description: description || '',
      status: 'pending',
      total_amount: parseFloat(total_amount) || 0,
      valid_until: valid_until || null,
      created_by: req.authUser.username,
      created_at: new Date().toISOString(),
      items: items || []
    };
    
    await quotes.insertOne(newQuote);
    await logActivity('quote', newQuote.id, req.authUser.username, 'created', `Created quote: ${title}`);
    res.status(201).json(newQuote);
  });

  app.put('/api/quotes/:id', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
    const quotes = getCollection('quotes');
    const quote = await quotes.findOne({ id: req.params.id });
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    
    const { title, description, total_amount, valid_until, items } = req.body;
    const update = {};
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (total_amount !== undefined) update.total_amount = parseFloat(total_amount);
    if (valid_until !== undefined) update.valid_until = valid_until;
    if (items !== undefined) update.items = items;
    
    await quotes.updateOne({ id: req.params.id }, { $set: update });
    const updated = await quotes.findOne({ id: req.params.id });
    await logActivity('quote', updated.id, req.authUser.username, 'updated', `Updated quote: ${updated.title}`);
    res.json(updated);
  });

  app.post('/api/quotes/:id/accept', requireAuth, async (req, res) => {
    const quotes = getCollection('quotes');
    const quote = await quotes.findOne({ id: req.params.id });
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    
    await quotes.updateOne({ id: req.params.id }, { $set: { 
      status: 'accepted',
      accepted_at: new Date().toISOString()
    }});
    const updated = await quotes.findOne({ id: req.params.id });
    await logActivity('quote', updated.id, req.authUser.username, 'accepted', `Quote accepted: ${updated.title}`);
    res.json(updated);
  });

  app.post('/api/quotes/:id/reject', requireAuth, async (req, res) => {
    const quotes = getCollection('quotes');
    const quote = await quotes.findOne({ id: req.params.id });
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    
    await quotes.updateOne({ id: req.params.id }, { 
      $set: { 
        status: 'rejected',
        rejected_at: new Date().toISOString()
      }
    });
    const updated = await quotes.findOne({ id: req.params.id });
    await logActivity('quote', updated.id, req.authUser.username, 'rejected', `Quote rejected: ${updated.title}`);
    res.json(updated);
  });

  app.delete('/api/quotes/:id', requireAuth, requireRoles(['admin']), async (req, res) => {
    const quotes = getCollection('quotes');
    const quote = await quotes.findOne({ id: req.params.id });
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    
    await quotes.deleteOne({ id: req.params.id });
    await logActivity('quote', quote.id, req.authUser.username, 'deleted', `Deleted quote: ${quote.title}`);
    res.json({ ok: true });
  });

  // Recurring jobs endpoints
  app.get('/api/recurring', requireAuth, async (req, res) => {
    const recurring = getCollection('recurring');
    res.json(await recurring.find().toArray());
  });

  app.get('/api/recurring/customer/:customerId', requireAuth, async (req, res) => {
    const recurring = getCollection('recurring');
    const customerRecurring = await recurring.find({ customerId: req.params.customerId }).toArray();
    res.json(customerRecurring);
  });

  app.get('/api/recurring/:id', requireAuth, async (req, res) => {
    const recurring = getCollection('recurring');
    const item = await recurring.findOne({ id: req.params.id });
    if (!item) return res.status(404).json({ error: 'Recurring job not found' });
    res.json(item);
  });

  app.post('/api/recurring', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
    const { customerId, title, description, frequency, interval_value, interval_unit, start_date, end_date, assignedTo, category, priority, estimated_duration_hours } = req.body;
    if (!customerId || !title || !frequency) return res.status(400).json({ error: 'Customer ID, title, and frequency are required' });
    
    const recurring = getCollection('recurring');
    const count = await recurring.countDocuments({ id: { $regex: '^REC-' } });
    
    const newRecurring = {
      id: `REC-${String(count + 1).padStart(3, '0')}`,
      customerId,
      title,
      description: description || '',
      frequency,
      interval_value: interval_value || 1,
      interval_unit: interval_unit || 'months',
      start_date: start_date || null,
      end_date: end_date || null,
      status: 'active',
      assignedTo: assignedTo || '',
      category: category || 'maintenance',
      priority: priority || 'medium',
      estimated_duration_hours: estimated_duration_hours || 1,
      created_by: req.authUser.username,
      created_at: new Date().toISOString()
    };
    
    await recurring.insertOne(newRecurring);
    await logActivity('recurring', newRecurring.id, req.authUser.username, 'created', `Created recurring job: ${title}`);
    res.status(201).json(newRecurring);
  });

  app.put('/api/recurring/:id', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
    const recurring = getCollection('recurring');
    const item = await recurring.findOne({ id: req.params.id });
    if (!item) return res.status(404).json({ error: 'Recurring job not found' });
    
    const { title, description, frequency, interval_value, interval_unit, start_date, end_date, status, assignedTo, category, priority, estimated_duration_hours } = req.body;
    const update = {};
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (frequency !== undefined) update.frequency = frequency;
    if (interval_value !== undefined) update.interval_value = interval_value;
    if (interval_unit !== undefined) update.interval_unit = interval_unit;
    if (start_date !== undefined) update.start_date = start_date;
    if (end_date !== undefined) update.end_date = end_date;
    if (status !== undefined) update.status = status;
    if (assignedTo !== undefined) update.assignedTo = assignedTo;
    if (category !== undefined) update.category = category;
    if (priority !== undefined) update.priority = priority;
    if (estimated_duration_hours !== undefined) update.estimated_duration_hours = estimated_duration_hours;
    
    await recurring.updateOne({ id: req.params.id }, { $set: update });
    const updated = await recurring.findOne({ id: req.params.id });
    await logActivity('recurring', updated.id, req.authUser.username, 'updated', `Updated recurring job: ${updated.title}`);
    res.json(updated);
  });

  app.delete('/api/recurring/:id', requireAuth, requireRoles(['admin']), async (req, res) => {
    const recurring = getCollection('recurring');
    const item = await recurring.findOne({ id: req.params.id });
    if (!item) return res.status(404).json({ error: 'Recurring job not found' });
    
    await recurring.deleteOne({ id: req.params.id });
    await logActivity('recurring', item.id, req.authUser.username, 'deleted', `Deleted recurring job: ${item.title}`);
    res.json({ ok: true });
  });

  // Start listening
  app.listen(PORT, () => {
    console.log(`App 2 backend running on http://localhost:${PORT} (MongoDB)`);
  });
};

// Initialize
connectDB().then(startServer).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
