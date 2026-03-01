const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const tryRequire = (name) => {
  try {
    return require(name);
  } catch (_) {
    return null;
  }
};

const dotenv = tryRequire('dotenv');
if (dotenv) dotenv.config();

const mongoose = tryRequire('mongoose');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

const emitEvent = (event, data) => {
  // Socket.io placeholder
};

const defaultUsers = [
  { id: 'u-admin', username: process.env.ADMIN_USER || 'admin', password: process.env.ADMIN_PASS || '1111', role: 'admin' },
  { id: 'u-dispatch', username: process.env.DISPATCH_USER || 'dispatcher', password: process.env.DISPATCH_PASS || '1111', role: 'dispatcher' },
  { id: 'u-tech', username: process.env.TECH_USER || 'technician', password: process.env.TECH_PASS || '1111', role: 'technician' },
  { id: 'u-client', username: process.env.CLIENT_USER || 'client', password: process.env.CLIENT_PASS || '1111', role: 'client' },
];

const fallbackUsers = [...defaultUsers];
const fallbackJobs = [
  { id: 'JOB-1001', title: 'HVAC preventive maintenance', status: 'new', priority: 'medium', assignedTo: 'technician', location: 'Building A - Floor 1', customerId: 'CUST-001', scheduledDate: '2025-01-20', scheduledTime: '09:00', notes: 'Annual maintenance check', checkinTime: null, checkoutTime: null, category: 'hvac', photos: [], invoiceId: null },
  { id: 'JOB-1002', title: 'Generator inspection', status: 'assigned', priority: 'high', assignedTo: 'technician', location: 'Warehouse North', customerId: 'CUST-002', scheduledDate: '2025-01-21', scheduledTime: '10:00', notes: 'Quarterly inspection', checkinTime: null, checkoutTime: null, category: 'electrical', photos: [], invoiceId: null },
  { id: 'JOB-1003', title: 'Electrical panel audit', status: 'in-progress', priority: 'high', assignedTo: 'technician', location: 'Main Plant', customerId: 'CUST-001', scheduledDate: '2025-01-18', scheduledTime: '08:00', notes: 'Started inspection', checkinTime: '2025-01-18T09:00:00Z', checkoutTime: null, category: 'electrical', photos: [], invoiceId: null },
  { id: 'JOB-1004', title: 'Plumbing repair - leak fix', status: 'new', priority: 'high', assignedTo: 'technician', location: 'Office Building B', customerId: 'CUST-003', scheduledDate: '2025-01-22', scheduledTime: '14:00', notes: 'Kitchen sink leak', checkinTime: null, checkoutTime: null, category: 'plumbing', photos: [], invoiceId: null },
  { id: 'JOB-1005', title: 'HVAC filter replacement', status: 'assigned', priority: 'low', assignedTo: 'technician', location: 'Shopping Mall', customerId: 'CUST-004', scheduledDate: '2025-01-23', scheduledTime: '11:00', notes: 'Filter change routine', checkinTime: null, checkoutTime: null, category: 'hvac', photos: [], invoiceId: null },
  { id: 'JOB-1006', title: 'Electrical wiring installation', status: 'new', priority: 'medium', assignedTo: 'technician', location: 'Factory Zone C', customerId: 'CUST-005', scheduledDate: '2025-01-24', scheduledTime: '09:00', notes: 'New equipment wiring', checkinTime: null, checkoutTime: null, category: 'electrical', photos: [], invoiceId: null },
  { id: 'JOB-1007', title: 'Air conditioning repair', status: 'completed', priority: 'high', assignedTo: 'technician', location: 'Hotel Main', customerId: 'CUST-006', scheduledDate: '2025-01-17', scheduledTime: '10:00', notes: 'Emergency repair completed', checkinTime: '2025-01-17T10:00:00Z', checkoutTime: '2025-01-17T14:00:00Z', category: 'hvac', photos: [], invoiceId: null },
  { id: 'JOB-1008', title: 'Boiler maintenance', status: 'assigned', priority: 'medium', assignedTo: 'technician', location: 'Hospital Wing A', customerId: 'CUST-007', scheduledDate: '2025-01-25', scheduledTime: '08:00', notes: 'Annual boiler service', checkinTime: null, checkoutTime: null, category: 'hvac', photos: [], invoiceId: null },
  { id: 'JOB-1009', title: 'Security system installation', status: 'new', priority: 'high', assignedTo: 'technician', location: 'Corporate HQ', customerId: 'CUST-008', scheduledDate: '2025-01-27', scheduledTime: '13:00', notes: 'New CCTV cameras', checkinTime: null, checkoutTime: null, category: 'installation', photos: [], invoiceId: null },
  { id: 'JOB-1010', title: 'Fire alarm inspection', status: 'in-progress', priority: 'high', assignedTo: 'technician', location: 'School Building', customerId: 'CUST-009', scheduledDate: '2025-01-19', scheduledTime: '09:00', notes: 'Annual fire safety check', checkinTime: '2025-01-19T09:00:00Z', checkoutTime: null, category: 'inspection', photos: [], invoiceId: null },
];

const fallbackCustomers = [
  { id: 'CUST-001', name: 'Acme Corporation', email: 'contact@acme.com', phone: '555-0100', address: '123 Main St, City', notes: 'Primary client - large building' },
  { id: 'CUST-002', name: 'Tech Industries', email: 'info@techind.com', phone: '555-0200', address: '456 Industrial Blvd', notes: 'Warehouse location - 24/7 operations' },
  { id: 'CUST-003', name: 'Global Services Ltd', email: 'support@globalservices.com', phone: '555-0300', address: '789 Commerce Ave', notes: 'Office complex' },
  { id: 'CUST-004', name: 'Mega Mall Inc', email: 'facilities@megamall.com', phone: '555-0400', address: '100 Shopping Center Dr', notes: 'Large shopping center' },
  { id: 'CUST-005', name: 'Industrial Factory Co', email: 'maintenance@factory.com', phone: '555-0500', address: '200 Manufacturing Way', notes: 'Manufacturing facility' },
  { id: 'CUST-006', name: 'Grand Hotel', email: 'engineering@grandhotel.com', phone: '555-0600', address: '500 Luxury Lane', notes: '5-star hotel - VIP client' },
  { id: 'CUST-007', name: 'City Hospital', email: 'facilities@cityhospital.org', phone: '555-0700', address: '300 Medical Center Blvd', notes: 'Healthcare facility - critical' },
  { id: 'CUST-008', name: 'Corporate Enterprises', email: 'it@corporate.com', phone: '555-0800', address: '400 Business Tower', notes: 'Corporate headquarters' },
  { id: 'CUST-009', name: 'Public School District', email: 'maintenance@school district.org', phone: '555-0900', address: '50 Education Way', notes: 'Multiple school locations' },
  { id: 'CUST-010', name: 'Sports Arena Complex', email: 'ops@sportsarena.com', phone: '555-1000', address: '750 Stadium Drive', notes: 'Entertainment venue' },
];

const fallbackInvoices = [
  { id: 'INV-001', jobId: 'JOB-1001', customerId: 'CUST-001', amount: 150.00, status: 'paid', items: [{ description: 'HVAC Maintenance', quantity: 1, rate: 150 }], createdAt: '2025-01-10T10:00:00Z', paidAt: '2025-01-11T14:00:00Z' },
];

const fallbackActivityLogs = [
  { id: 'LOG-001', action: 'job_created', description: 'Job JOB-1001 created', userId: 'admin', timestamp: '2025-01-10T10:00:00Z' },
  { id: 'LOG-002', action: 'job_assigned', description: 'Job JOB-1001 assigned to technician', userId: 'dispatcher', timestamp: '2025-01-10T11:00:00Z' },
];

// ============ PROJECTS & TASKS DATA ============
const fallbackProjects = [
  { 
    id: 'PROJ-001', 
    title: 'Office Building Renovation', 
    description: 'Complete renovation of 3-story office building including HVAC, electrical, and plumbing', 
    startDate: '2025-01-15', 
    targetDeadline: '2025-03-15', 
    priority: 'high', 
    status: 'active', 
    progress: 35,
    createdBy: 'admin',
    createdAt: '2025-01-10T10:00:00Z',
    updatedAt: '2025-01-18T14:00:00Z'
  },
  { 
    id: 'PROJ-002', 
    title: 'Shopping Mall HVAC Upgrade', 
    description: 'Upgrade HVAC systems in shopping mall common areas', 
    startDate: '2025-01-20', 
    targetDeadline: '2025-02-28', 
    priority: 'medium', 
    status: 'active', 
    progress: 15,
    createdBy: 'admin',
    createdAt: '2025-01-12T09:00:00Z',
    updatedAt: '2025-01-17T11:00:00Z'
  },
  { 
    id: 'PROJ-003', 
    title: 'Warehouse Electrical Audit', 
    description: 'Complete electrical system audit and compliance check for warehouse', 
    startDate: '2025-01-01', 
    targetDeadline: '2025-01-31', 
    priority: 'high', 
    status: 'completed', 
    progress: 100,
    createdBy: 'dispatcher',
    createdAt: '2025-01-05T08:00:00Z',
    updatedAt: '2025-01-25T16:00:00Z'
  },
];

const fallbackTasks = [
  // Tasks for PROJ-001 - with datetime support
  { id: 'TASK-001', projectId: 'PROJ-001', name: 'Site assessment', description: 'Initial site assessment and planning', assignedTo: 'technician', startDate: '2025-01-15', dueDate: '2025-01-17', plannedStart: '2025-01-15T09:00:00', plannedEnd: '2025-01-17T17:00:00', actualStart: '2025-01-15T09:30:00', actualEnd: '2025-01-17T16:00:00', status: 'completed', progress: 100, dependencies: [], notes: '' },
  { id: 'TASK-002', projectId: 'PROJ-001', name: 'HVAC installation', description: 'Install new HVAC units', assignedTo: 'technician', startDate: '2025-01-20', dueDate: '2025-02-10', plannedStart: '2025-01-20T08:00:00', plannedEnd: '2025-02-10T18:00:00', actualStart: '2025-01-20T08:15:00', actualEnd: null, status: 'in-progress', progress: 40, dependencies: ['TASK-001'], notes: 'In progress' },
  { id: 'TASK-003', projectId: 'PROJ-001', name: 'Electrical wiring', description: 'Complete electrical wiring for new units', assignedTo: 'technician', startDate: '2025-02-01', dueDate: '2025-02-20', plannedStart: '2025-02-01T09:00:00', plannedEnd: '2025-02-20T17:00:00', actualStart: null, actualEnd: null, status: 'pending', progress: 0, dependencies: ['TASK-001'], notes: '' },
  { id: 'TASK-004', projectId: 'PROJ-001', name: 'Plumbing connections', description: 'Connect plumbing to new HVAC', assignedTo: 'technician', startDate: '2025-02-15', dueDate: '2025-03-01', plannedStart: '2025-02-15T08:00:00', plannedEnd: '2025-03-01T17:00:00', actualStart: null, actualEnd: null, status: 'pending', progress: 0, dependencies: ['TASK-002'], notes: '' },
  { id: 'TASK-005', projectId: 'PROJ-001', name: 'Final inspection', description: 'Final inspection and testing', assignedTo: 'technician', startDate: '2025-03-05', dueDate: '2025-03-15', plannedStart: '2025-03-05T09:00:00', plannedEnd: '2025-03-15T16:00:00', actualStart: null, actualEnd: null, status: 'pending', progress: 0, dependencies: ['TASK-003', 'TASK-004'], notes: '' },
  // Tasks for PROJ-002
  { id: 'TASK-006', projectId: 'PROJ-002', name: 'Equipment procurement', description: 'Order HVAC equipment', assignedTo: 'admin', startDate: '2025-01-20', dueDate: '2025-01-25', plannedStart: '2025-01-20T10:00:00', plannedEnd: '2025-01-25T15:00:00', actualStart: '2025-01-20T10:30:00', actualEnd: '2025-01-25T14:00:00', status: 'completed', progress: 100, dependencies: [], notes: '' },
  { id: 'TASK-007', projectId: 'PROJ-002', name: 'Installation planning', description: 'Plan installation schedule', assignedTo: 'dispatcher', startDate: '2025-01-25', dueDate: '2025-01-28', plannedStart: '2025-01-25T09:00:00', plannedEnd: '2025-01-28T17:00:00', actualStart: '2025-01-25T09:00:00', actualEnd: null, status: 'in-progress', progress: 50, dependencies: ['TASK-006'], notes: '' },
  { id: 'TASK-008', projectId: 'PROJ-002', name: 'Unit installation', description: 'Install HVAC units', assignedTo: 'technician', startDate: '2025-02-01', dueDate: '2025-02-20', plannedStart: '2025-02-01T08:00:00', plannedEnd: '2025-02-20T18:00:00', actualStart: null, actualEnd: null, status: 'pending', progress: 0, dependencies: ['TASK-007'], notes: '' },
  // Tasks for PROJ-003
  { id: 'TASK-009', projectId: 'PROJ-003', name: 'Document existing systems', description: 'Document all existing electrical systems', assignedTo: 'technician', startDate: '2025-01-01', dueDate: '2025-01-10', plannedStart: '2025-01-01T09:00:00', plannedEnd: '2025-01-10T17:00:00', actualStart: '2025-01-01T09:00:00', actualEnd: '2025-01-10T16:30:00', status: 'completed', progress: 100, dependencies: [], notes: '' },
  { id: 'TASK-010', projectId: 'PROJ-003', name: 'Compliance check', description: 'Check compliance with regulations', assignedTo: 'technician', startDate: '2025-01-11', dueDate: '2025-01-25', plannedStart: '2025-01-11T09:00:00', plannedEnd: '2025-01-25T17:00:00', actualStart: '2025-01-11T09:30:00', actualEnd: '2025-01-25T18:00:00', status: 'completed', progress: 100, dependencies: ['TASK-009'], notes: '' },
  { id: 'TASK-011', projectId: 'PROJ-003', name: 'Final report', description: 'Generate final audit report', assignedTo: 'admin', startDate: '2025-01-26', dueDate: '2025-01-31', plannedStart: '2025-01-26T09:00:00', plannedEnd: '2025-01-31T15:00:00', actualStart: '2025-01-26T09:00:00', actualEnd: '2025-01-31T14:00:00', status: 'completed', progress: 100, dependencies: ['TASK-010'], notes: '' },
];

const nextProjectIdFromList = (list = []) => {
  const max = list.reduce((acc, item) => {
    const n = Number(String(item.id || '').replace('PROJ-', '')) || 0;
    return n > acc ? n : acc;
  }, 0);
  return `PROJ-${String(max + 1).padStart(3, '0')}`;
};

const nextTaskIdFromList = (list = []) => {
  const max = list.reduce((acc, item) => {
    const n = Number(String(item.id || '').replace('TASK-', '')) || 0;
    return n > acc ? n : acc;
  }, 0);
  return `TASK-${String(max + 1).padStart(3, '0')}`;
};

const calculateProjectProgress = (projectId) => {
  const projectTasks = fallbackTasks.filter(t => t.projectId === projectId);
  if (projectTasks.length === 0) return 0;
  const totalProgress = projectTasks.reduce((sum, task) => sum + task.progress, 0);
  return Math.round(totalProgress / projectTasks.length);
};

const autoUpdateProjectStatus = (projectId) => {
  const project = fallbackProjects.find(p => p.id === projectId);
  if (!project) return;
  
  const progress = calculateProjectProgress(projectId);
  project.progress = progress;
  
  if (progress === 100 && project.status !== 'completed') {
    project.status = 'completed';
  } else if (progress > 0 && project.status === 'not_started') {
    project.status = 'active';
  }
  
  // Check for overdue
  const today = new Date().toISOString().split('T')[0];
  if (project.targetDeadline < today && project.status !== 'completed') {
    project.status = 'overdue';
  }
};

const emailQueue = [];

const sendEmail = async (to, subject, body) => {
  const email = {
    id: `EMAIL-${Date.now()}`,
    to,
    subject,
    body,
    sentAt: new Date().toISOString(),
    status: 'sent'
  };
  emailQueue.push(email);
  console.log(`📧 Email sent to ${to}: ${subject}`);
  return email;
};

let UserModel = null;
let JobModel = null;
let CustomerModel = null;
let InvoiceModel = null;
let ActivityLogModel = null;

const dbState = {
  configured: Boolean(process.env.MONGO_URI || process.env.MONGODB_URI),
  enabled: Boolean(mongoose),
  connected: false,
  error: '',
};

const sessions = new Map();
const notifications = [];

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

const normalizePriority = (value, fallback = 'medium') => {
  const next = String(value || fallback).trim().toLowerCase();
  return ['low', 'medium', 'high'].includes(next) ? next : null;
};

const normalizeStatus = (value, fallback = 'new') => {
  const next = String(value || fallback).trim().toLowerCase();
  return ['new', 'assigned', 'in-progress', 'completed'].includes(next) ? next : null;
};

const normalizeCategory = (value, fallback = 'general') => {
  const next = String(value || fallback).trim().toLowerCase();
  return ['general', 'hvac', 'electrical', 'plumbing', 'repair', 'installation', 'inspection'].includes(next) ? next : 'general';
};

const nextJobIdFromList = (list = []) => {
  const max = list.reduce((acc, item) => {
    const n = Number(String(item.id || '').replace('JOB-', '')) || 0;
    return n > acc ? n : acc;
  }, 1000);
  return `JOB-${String(max + 1).padStart(4, '0')}`;
};

const nextCustomerIdFromList = (list = []) => {
  const max = list.reduce((acc, item) => {
    const n = Number(String(item.id || '').replace('CUST-', '')) || 0;
    return n > acc ? n : acc;
  }, 0);
  return `CUST-${String(max + 1).padStart(3, '0')}`;
};

const nextInvoiceIdFromList = (list = []) => {
  const max = list.reduce((acc, item) => {
    const n = Number(String(item.id || '').replace('INV-', '')) || 0;
    return n > acc ? n : acc;
  }, 0);
  return `INV-${String(max + 1).padStart(3, '0')}`;
};

const nextActivityLogId = (list = []) => {
  const max = list.reduce((acc, item) => {
    const n = Number(String(item.id || '').replace('LOG-', '')) || 0;
    return n > acc ? n : acc;
  }, 0);
  return `LOG-${String(max + 1).padStart(3, '0')}`;
};

const useDb = () => Boolean(dbState.connected && JobModel && UserModel);

const logActivity = (action, description, userId) => {
  const log = {
    id: nextActivityLogId(fallbackActivityLogs),
    action,
    description,
    userId,
    timestamp: new Date().toISOString(),
  };
  fallbackActivityLogs.unshift(log);
  if (fallbackActivityLogs.length > 100) fallbackActivityLogs.pop();
  emitEvent('activity:new', log);
  return log;
};

const addNotification = (type, title, message, userId = null) => {
  const notification = {
    id: `NOTIF-${Date.now()}`,
    type,
    title,
    message,
    userId,
    read: false,
    createdAt: new Date().toISOString(),
  };
  notifications.unshift(notification);
  emitEvent('notification:new', notification);
  return notification;
};

const listUsers = async () => {
  if (useDb()) {
    const docs = await UserModel.find().lean();
    return docs.map((u) => ({
      id: u.id,
      username: u.username,
      password: u.password,
      role: u.role,
    }));
  }
  return [...fallbackUsers];
};

const listCustomers = async () => {
  if (useDb() && CustomerModel) {
    const docs = await CustomerModel.find().sort({ createdAt: -1 }).lean();
    return docs.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      address: c.address,
      notes: c.notes,
    }));
  }
  return [...fallbackCustomers];
};

const findCustomerById = async (id) => {
  if (useDb() && CustomerModel) {
    const doc = await CustomerModel.findOne({ id: String(id) }).lean();
    if (!doc) return null;
    return {
      id: doc.id,
      name: doc.name,
      email: doc.email,
      phone: doc.phone,
      address: doc.address,
      notes: doc.notes,
    };
  }
  return fallbackCustomers.find((item) => String(item.id) === String(id)) || null;
};

const listJobs = async () => {
  if (useDb()) {
    const docs = await JobModel.find().sort({ createdAt: -1 }).lean();
    return docs.map((j) => ({
      id: j.id,
      title: j.title,
      status: j.status,
      priority: j.priority,
      assignedTo: j.assignedTo || '',
      location: j.location || 'Unspecified',
      customerId: j.customerId || '',
      scheduledDate: j.scheduledDate || '',
      notes: j.notes || '',
      checkinTime: j.checkinTime || null,
      checkoutTime: j.checkoutTime || null,
      category: j.category || 'general',
      photos: j.photos || [],
      invoiceId: j.invoiceId || null,
    }));
  }
  return [...fallbackJobs];
};

const findJobById = async (id) => {
  if (useDb()) {
    const doc = await JobModel.findOne({ id: String(id) }).lean();
    if (!doc) return null;
    return {
      id: doc.id,
      title: doc.title,
      status: doc.status,
      priority: doc.priority,
      assignedTo: doc.assignedTo || '',
      location: doc.location || 'Unspecified',
      customerId: doc.customerId || '',
      scheduledDate: doc.scheduledDate || '',
      notes: doc.notes || '',
      checkinTime: doc.checkinTime || null,
      checkoutTime: doc.checkoutTime || null,
      category: doc.category || 'general',
      photos: doc.photos || [],
      invoiceId: doc.invoiceId || null,
    };
  }
  return fallbackJobs.find((item) => String(item.id) === String(id)) || null;
};

const getTechnicianUsernames = async () => {
  const users = await listUsers();
  return users.filter((u) => u.role === 'technician').map((u) => u.username);
};

const createJob = async (payload) => {
  const jobs = await listJobs();
  const created = {
    id: nextJobIdFromList(jobs),
    title: payload.title,
    status: payload.assignedTo ? 'assigned' : 'new',
    priority: payload.priority,
    assignedTo: payload.assignedTo || '',
    location: payload.location || 'Unspecified',
    customerId: payload.customerId || '',
    scheduledDate: payload.scheduledDate || '',
    notes: payload.notes || '',
    checkinTime: null,
    checkoutTime: null,
    category: payload.category || 'general',
    photos: [],
    invoiceId: null,
  };

  if (useDb()) {
    await JobModel.create(created);
  } else {
    fallbackJobs.unshift(created);
  }
  
  logActivity('job_created', `Job ${created.id} created: ${created.title}`, payload.createdBy || 'system');
  addNotification('job', 'New Job Created', `${created.id}: ${created.title}`, null);
  emitEvent('job:created', created);
  
  return created;
};

const updateJob = async (id, updates) => {
  if (useDb()) {
    const updated = await JobModel.findOneAndUpdate({ id: String(id) }, { $set: updates }, { new: true }).lean();
    if (!updated) return null;
    return {
      id: updated.id,
      title: updated.title,
      status: updated.status,
      priority: updated.priority,
      assignedTo: updated.assignedTo || '',
      location: updated.location || 'Unspecified',
      customerId: updated.customerId || '',
      scheduledDate: updated.scheduledDate || '',
      notes: updated.notes || '',
      checkinTime: updated.checkinTime || null,
      checkoutTime: updated.checkoutTime || null,
      category: updated.category || 'general',
      photos: updated.photos || [],
      invoiceId: updated.invoiceId || null,
    };
  }

  const idx = fallbackJobs.findIndex((item) => String(item.id) === String(id));
  if (idx === -1) return null;
  fallbackJobs[idx] = { ...fallbackJobs[idx], ...updates };
  emitEvent('job:updated', fallbackJobs[idx]);
  return fallbackJobs[idx];
};

const createCustomer = async (payload) => {
  const customers = await listCustomers();
  const created = {
    id: nextCustomerIdFromList(customers),
    name: payload.name,
    email: payload.email || '',
    phone: payload.phone || '',
    address: payload.address || '',
    notes: payload.notes || '',
  };

  if (useDb() && CustomerModel) {
    await CustomerModel.create(created);
  } else {
    fallbackCustomers.unshift(created);
  }
  
  logActivity('customer_created', `Customer ${created.id} created: ${created.name}`, payload.createdBy || 'system');
  emitEvent('customer:created', created);
  
  return created;
};

const updateCustomer = async (id, updates) => {
  if (useDb() && CustomerModel) {
    const updated = await CustomerModel.findOneAndUpdate({ id: String(id) }, { $set: updates }, { new: true }).lean();
    if (!updated) return null;
    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      address: updated.address,
      notes: updated.notes,
    };
  }

  const idx = fallbackCustomers.findIndex((item) => String(item.id) === String(id));
  if (idx === -1) return null;
  fallbackCustomers[idx] = { ...fallbackCustomers[idx], ...updates };
  return fallbackCustomers[idx];
};

const deleteCustomer = async (id) => {
  if (useDb() && CustomerModel) {
    const result = await CustomerModel.findOneAndDelete({ id: String(id) });
    return result !== null;
  }

  const idx = fallbackCustomers.findIndex((item) => String(item.id) === String(id));
  if (idx === -1) return false;
  fallbackCustomers.splice(idx, 1);
  return true;
};

const createInvoice = async (payload) => {
  const invoices = [...fallbackInvoices];
  const created = {
    id: nextInvoiceIdFromList(invoices),
    jobId: payload.jobId,
    customerId: payload.customerId,
    amount: payload.amount || 0,
    status: 'pending',
    items: payload.items || [],
    createdAt: new Date().toISOString(),
    paidAt: null,
  };

  fallbackInvoices.unshift(created);
  await updateJob(payload.jobId, { invoiceId: created.id });
  
  logActivity('invoice_created', `Invoice ${created.id} created for job ${payload.jobId}`, payload.createdBy || 'system');
  addNotification('invoice', 'Invoice Created', `Invoice ${created.id} for $${created.amount.toFixed(2)}`, null);
  
  const customer = await findCustomerById(payload.customerId);
  if (customer && customer.email) {
    await sendEmail(
      customer.email,
      `Invoice ${created.id} Created`,
      `Dear ${customer.name},\n\nYour invoice for job ${payload.jobId} has been created.\n\nAmount: $${created.amount.toFixed(2)}\n\nPlease review and make payment.\n\nBest regards,\nField Service Suite`
    );
  }
  
  emitEvent('invoice:created', created);
  return created;
};

const updateInvoice = async (id, updates) => {
  const idx = fallbackInvoices.findIndex((item) => String(item.id) === String(id));
  if (idx === -1) return null;
  
  fallbackInvoices[idx] = { ...fallbackInvoices[idx], ...updates };
  
  if (updates.status === 'paid') {
    fallbackInvoices[idx].paidAt = new Date().toISOString();
    logActivity('invoice_paid', `Invoice ${id} marked as paid`, updates.paidBy || 'system');
    addNotification('invoice', 'Invoice Paid', `Invoice ${id} has been paid`, null);
    
    const invoice = fallbackInvoices[idx];
    const customer = await findCustomerById(invoice.customerId);
    if (customer && customer.email) {
      await sendEmail(
        customer.email,
        `Payment Received - Invoice ${id}`,
        `Dear ${customer.name},\n\nThank you! We have received your payment of $${invoice.amount.toFixed(2)} for invoice ${id}.\n\nYour payment has been processed successfully.\n\nBest regards,\nField Service Suite`
      );
    }
  }
  
  emitEvent('invoice:updated', fallbackInvoices[idx]);
  return fallbackInvoices[idx];
};

const generatePDFInvoice = (invoice, job, customer) => {
  const pdfContent = `
===========================================
         FIELD SERVICE SUITE - INVOICE
===========================================

Invoice Number: ${invoice.id}
Date: ${new Date(invoice.createdAt).toLocaleDateString()}

-------------------------------------------
BILL TO:
-------------------------------------------
${customer.name}
${customer.address}
${customer.email}
${customer.phone}

-------------------------------------------
JOB DETAILS:
-------------------------------------------
Job ID: ${job.id}
Job Title: ${job.title}
Category: ${job.category}

-------------------------------------------
ITEMS:
-------------------------------------------
${invoice.items.map(item => `${item.description} x${item.quantity} = $${(item.rate * item.quantity).toFixed(2)}`).join('\n')}

-------------------------------------------
SUBTOTAL:   $${invoice.amount.toFixed(2)}
TAX (0%):   $0.00
-------------------------------------------
TOTAL:      $${invoice.amount.toFixed(2)}
===========================================

Payment Status: ${invoice.status.toUpperCase()}
${invoice.paidAt ? `Paid On: ${new Date(invoice.paidAt).toLocaleDateString()}` : ''}

Thank you for your business!

===========================================
  Generated by Field Service Suite
===========================================
  `;
  
  return pdfContent;
};

const initDb = async () => {
  let mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || '';
  console.log('🔍 Checking MongoDB connection...');
  console.log('   MONGO_URI defined:', Boolean(mongoUri));
  
  if (!mongoUri || !mongoose) {
    dbState.connected = false;
    dbState.error = mongoUri ? 'mongoose package not installed' : 'MONGO_URI is not configured';
    console.log('❌ MongoDB not configured:', dbState.error);
    return;
  }

  // Use SRV format directly - mongoose handles it automatically
  if (mongoUri.includes('mongodb+srv://')) {
    console.log('   Using SRV connection format (mongoose will handle it)');
  }

  try {
    console.log('   Attempting to connect to MongoDB...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    });
    console.log('✅ MongoDB connected successfully!');

    const userSchema = new mongoose.Schema({
      id: { type: String, required: true, unique: true, index: true },
      username: { type: String, required: true, unique: true, index: true },
      password: { type: String, required: true },
      role: { type: String, required: true, enum: ['admin', 'dispatcher', 'technician', 'client'] },
    }, { timestamps: true });

    const jobSchema = new mongoose.Schema({
      id: { type: String, required: true, unique: true, index: true },
      title: { type: String, required: true },
      status: { type: String, required: true, enum: ['new', 'assigned', 'in-progress', 'completed'] },
      priority: { type: String, required: true, enum: ['low', 'medium', 'high'] },
      assignedTo: { type: String, default: '' },
      location: { type: String, default: 'Unspecified' },
      customerId: { type: String, default: '' },
      scheduledDate: { type: String, default: '' },
      notes: { type: String, default: '' },
      checkinTime: { type: String, default: null },
      checkoutTime: { type: String, default: null },
      category: { type: String, default: 'general' },
      photos: { type: [String], default: [] },
      invoiceId: { type: String, default: null },
    }, { timestamps: true });

    const customerSchema = new mongoose.Schema({
      id: { type: String, required: true, unique: true, index: true },
      name: { type: String, required: true },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      address: { type: String, default: '' },
      notes: { type: String, default: '' },
    }, { timestamps: true });

    UserModel = mongoose.models.App2User || mongoose.model('App2User', userSchema);
    JobModel = mongoose.models.App2Job || mongoose.model('App2Job', jobSchema);
    CustomerModel = mongoose.models.App2Customer || mongoose.model('App2Customer', customerSchema);

    const userCount = await UserModel.countDocuments();
    if (userCount === 0) await UserModel.insertMany(defaultUsers);

    const jobCount = await JobModel.countDocuments();
    if (jobCount === 0) await JobModel.insertMany(fallbackJobs);

    const customerCount = await CustomerModel.countDocuments();
    if (customerCount === 0) await CustomerModel.insertMany(fallbackCustomers);

    dbState.connected = true;
    dbState.error = '';
  } catch (error) {
    dbState.connected = false;
    dbState.error = error?.message || 'MongoDB connection failed';
    console.log('❌ MongoDB connection failed!');
    console.log('   Error:', error?.message || 'Unknown error');
  }
};

app.get('/api/status', (_req, res) => {
  res.json({
    ok: true,
    service: 'app2-field-service-suite-backend',
    timestamp: new Date().toISOString(),
    usingFallback: !useDb(),
    dbConfigured: dbState.configured,
    dbConnected: dbState.connected,
    dbError: dbState.connected ? '' : dbState.error,
  });
});

// ============ AUTH ============

app.post('/api/auth/login', async (req, res) => {
  try {
    const username = String(req.body.username || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const users = await listUsers();
    const user = users.find((item) => item.username.toLowerCase() === username && item.password === password);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const token = crypto.randomBytes(24).toString('hex');
    const safeUser = toSafeUser(user);
    sessions.set(token, { user: safeUser, createdAt: Date.now() });
    
    logActivity('user_login', `User ${user.username} logged in`, user.id);
    
    return res.json({ user: safeUser, token });
  } catch (error) {
    return res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.authUser });
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  sessions.delete(req.authToken);
  logActivity('user_logout', `User ${req.authUser.username} logged out`, req.authUser.id);
  res.json({ ok: true });
});

// ============ CLIENT PORTAL ============

app.post('/api/client/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    
    const customers = await listCustomers();
    const customer = customers.find((c) => c.email.toLowerCase() === email);
    
    if (!customer || password !== 'client') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = crypto.randomBytes(24).toString('hex');
    const clientUser = { id: customer.id, username: customer.name, role: 'client', customerId: customer.id };
    sessions.set(token, { user: clientUser, createdAt: Date.now() });
    
    return res.json({ user: clientUser, token });
  } catch (error) {
    return res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/client/jobs', requireAuth, async (req, res) => {
  if (req.authUser.role !== 'client') {
    return res.status(403).json({ error: 'Client access only' });
  }
  
  try {
    const jobs = await listJobs();
    const clientJobs = jobs.filter(job => job.customerId === req.authUser.customerId);
    return res.json(clientJobs);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load jobs' });
  }
});

app.get('/api/client/invoices', requireAuth, async (req, res) => {
  if (req.authUser.role !== 'client') {
    return res.status(403).json({ error: 'Client access only' });
  }
  
  try {
    const invoices = fallbackInvoices.filter(inv => inv.customerId === req.authUser.customerId);
    const jobs = await listJobs();
    
    const invoicesWithDetails = invoices.map(inv => {
      const job = jobs.find(j => j.id === inv.jobId);
      return { ...inv, job: job || null };
    });
    
    return res.json(invoicesWithDetails);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load invoices' });
  }
});

// ============ JOBS ============

app.get('/api/jobs', requireAuth, async (req, res) => {
  try {
    const jobs = await listJobs();
    if (req.authUser.role === 'technician') {
      return res.json(jobs.filter((job) => job.assignedTo === req.authUser.username));
    }
    return res.json(jobs);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load jobs' });
  }
});

app.post('/api/jobs', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
  try {
    const title = String(req.body.title || '').trim();
    const priority = normalizePriority(req.body.priority, 'medium');
    const assignedTo = String(req.body.assignedTo || '').trim();
    const location = String(req.body.location || '').trim();
    const customerId = String(req.body.customerId || '').trim();
    const scheduledDate = String(req.body.scheduledDate || '').trim();
    const notes = String(req.body.notes || '').trim();
    const category = normalizeCategory(req.body.category, 'general');

    if (!title) return res.status(400).json({ error: 'Job title is required' });

    const technicianUsernames = await getTechnicianUsernames();
    if (assignedTo && !technicianUsernames.includes(assignedTo)) {
      return res.status(400).json({ error: 'Assigned technician not found' });
    }

    const created = await createJob({ title, priority, assignedTo, location, customerId, scheduledDate, notes, category, createdBy: req.authUser.id });
    
    if (customerId) {
      const customer = await findCustomerById(customerId);
      if (customer && customer.email) {
        await sendEmail(
          customer.email,
          `New Job Scheduled: ${created.id}`,
          `Dear ${customer.name},\n\nA new service job has been scheduled for you.\n\nJob: ${title}\nDate: ${scheduledDate || 'TBD'}\nLocation: ${location}\n\nBest regards,\nField Service Suite`
        );
      }
    }
    
    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create job' });
  }
});

app.put('/api/jobs/:id', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
  try {
    const existing = await findJobById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Job not found' });

    const title = req.body.title !== undefined ? String(req.body.title || '').trim() : existing.title;
    const priority = req.body.priority !== undefined ? normalizePriority(req.body.priority, existing.priority) : existing.priority;
    const status = req.body.status !== undefined ? normalizeStatus(req.body.status, existing.status) : existing.status;
    const assignedTo = req.body.assignedTo !== undefined ? String(req.body.assignedTo || '').trim() : existing.assignedTo;
    const location = req.body.location !== undefined ? String(req.body.location || '').trim() : existing.location;
    const customerId = req.body.customerId !== undefined ? String(req.body.customerId || '').trim() : existing.customerId;
    const scheduledDate = req.body.scheduledDate !== undefined ? String(req.body.scheduledDate || '').trim() : existing.scheduledDate;
    const notes = req.body.notes !== undefined ? String(req.body.notes || '').trim() : existing.notes;
    const category = req.body.category !== undefined ? normalizeCategory(req.body.category, existing.category) : existing.category;

    if (!title) return res.status(400).json({ error: 'Job title is required' });

    const technicianUsernames = await getTechnicianUsernames();
    if (assignedTo && !technicianUsernames.includes(assignedTo)) {
      return res.status(400).json({ error: 'Assigned technician not found' });
    }

    const wasAssigned = !existing.assignedTo && assignedTo;
    const updated = await updateJob(req.params.id, {
      title, priority, status: assignedTo ? status : 'new',
      assignedTo, location: location || 'Unspecified', customerId, scheduledDate, notes, category,
    });
    
    logActivity('job_updated', `Job ${req.params.id} updated`, req.authUser.id);
    
    if (wasAssigned && customerId) {
      const customer = await findCustomerById(customerId);
      if (customer && customer.email) {
        await sendEmail(
          customer.email,
          `Job Assigned: ${updated.id}`,
          `Dear ${customer.name},\n\nYour service job has been assigned to a technician.\n\nJob: ${title}\nTechnician: ${assignedTo}\nScheduled: ${scheduledDate || 'TBD'}\n\nBest regards,\nField Service Suite`
        );
      }
    }
    
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update job' });
  }
});

app.patch('/api/jobs/:id/status', requireAuth, async (req, res) => {
  try {
    const existing = await findJobById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Job not found' });

    const status = normalizeStatus(req.body.status, '');
    if (!status || status === 'new') return res.status(400).json({ error: 'Invalid status' });

    if (req.authUser.role === 'technician') {
      if (existing.assignedTo !== req.authUser.username) return res.status(403).json({ error: 'Forbidden' });
      if (status === 'assigned') return res.status(400).json({ error: 'Technicians cannot set assigned status' });
    } else if (!['admin', 'dispatcher'].includes(req.authUser.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updated = await updateJob(req.params.id, { status });
    logActivity('status_changed', `Job ${req.params.id} status changed to ${status}`, req.authUser.id);
    addNotification('job', 'Job Status Updated', `Job ${req.params.id} is now ${status}`, null);
    
    if (existing.customerId) {
      const customer = await findCustomerById(existing.customerId);
      if (customer && customer.email) {
        await sendEmail(
          customer.email,
          `Job Status Update: ${updated.id}`,
          `Dear ${customer.name},\n\nYour service job status has been updated.\n\nJob: ${existing.title}\nNew Status: ${status}\n\nBest regards,\nField Service Suite`
        );
      }
    }
    
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update status' });
  }
});

// ============ TECHNICIAN FEATURES ============

app.post('/api/jobs/:id/checkin', requireAuth, requireRoles(['technician']), async (req, res) => {
  try {
    const existing = await findJobById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Job not found' });
    
    if (existing.assignedTo !== req.authUser.username) {
      return res.status(403).json({ error: 'Not assigned to this job' });
    }

    const checkinTime = new Date().toISOString();
    const updated = await updateJob(req.params.id, { status: 'in-progress', checkinTime });

    logActivity('job_checkin', `Technician checked in to job ${req.params.id}`, req.authUser.id);
    addNotification('job', 'Technician Checked In', `${req.authUser.username} started working on ${req.params.id}`, null);

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to check in' });
  }
});

app.post('/api/jobs/:id/checkout', requireAuth, requireRoles(['technician']), async (req, res) => {
  try {
    const existing = await findJobById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Job not found' });
    
    if (existing.assignedTo !== req.authUser.username) {
      return res.status(403).json({ error: 'Not assigned to this job' });
    }

    const checkoutTime = new Date().toISOString();
    const notes = req.body.notes || existing.notes;
    
    const updated = await updateJob(req.params.id, { status: 'completed', checkoutTime, notes });

    logActivity('job_checkout', `Technician completed job ${req.params.id}`, req.authUser.id);
    addNotification('job', 'Job Completed', `Job ${req.params.id} has been completed`, null);
    
    if (existing.customerId) {
      const customer = await findCustomerById(existing.customerId);
      if (customer && customer.email) {
        await sendEmail(
          customer.email,
          `Job Completed: ${updated.id}`,
          `Dear ${customer.name},\n\nGreat news! Your service job has been completed.\n\nJob: ${existing.title}\nCompleted: ${new Date().toLocaleString()}\n\nThank you for choosing Field Service Suite!\n\nBest regards,\nField Service Suite`
        );
      }
    }

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to check out' });
  }
});

app.patch('/api/jobs/:id/notes', requireAuth, async (req, res) => {
  try {
    const existing = await findJobById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Job not found' });

    if (req.authUser.role === 'technician' && existing.assignedTo !== req.authUser.username) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const notes = String(req.body.notes || '').trim();
    const updated = await updateJob(req.params.id, { notes });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update notes' });
  }
});

// ============ PHOTOS ============

app.post('/api/jobs/:id/photos', requireAuth, requireRoles(['technician', 'admin', 'dispatcher']), async (req, res) => {
  try {
    const existing = await findJobById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Job not found' });

    const photoData = String(req.body.photo || '').trim();
    if (!photoData) return res.status(400).json({ error: 'Photo data is required' });

    const photos = existing.photos || [];
    const photoId = `PHOTO-${Date.now()}`;
    photos.push({ id: photoId, data: photoData, uploadedAt: new Date().toISOString() });
    
    const updated = await updateJob(req.params.id, { photos });
    logActivity('photo_added', `Photo added to job ${req.params.id}`, req.authUser.id);
    
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to add photo' });
  }
});

app.delete('/api/jobs/:id/photos/:photoId', requireAuth, requireRoles(['technician', 'admin', 'dispatcher']), async (req, res) => {
  try {
    const existing = await findJobById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Job not found' });

    const photos = (existing.photos || []).filter(p => p.id !== req.params.photoId);
    const updated = await updateJob(req.params.id, { photos });
    
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to remove photo' });
  }
});

// ============ CUSTOMERS ============

app.get('/api/customers', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
  try {
    const customers = await listCustomers();
    return res.json(customers);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load customers' });
  }
});

app.post('/api/customers', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim();
    const phone = String(req.body.phone || '').trim();
    const address = String(req.body.address || '').trim();
    const notes = String(req.body.notes || '').trim();

    if (!name) return res.status(400).json({ error: 'Customer name is required' });

    const created = await createCustomer({ name, email, phone, address, notes, createdBy: req.authUser.id });
    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create customer' });
  }
});

app.put('/api/customers/:id', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
  try {
    const existing = await findCustomerById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Customer not found' });

    const name = req.body.name !== undefined ? String(req.body.name || '').trim() : existing.name;
    const email = req.body.email !== undefined ? String(req.body.email || '').trim() : existing.email;
    const phone = req.body.phone !== undefined ? String(req.body.phone || '').trim() : existing.phone;
    const address = req.body.address !== undefined ? String(req.body.address || '').trim() : existing.address;
    const notes = req.body.notes !== undefined ? String(req.body.notes || '').trim() : existing.notes;

    if (!name) return res.status(400).json({ error: 'Customer name is required' });

    const updated = await updateCustomer(req.params.id, { name, email, phone, address, notes });
    logActivity('customer_updated', `Customer ${req.params.id} updated`, req.authUser.id);
    
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update customer' });
  }
});

app.delete('/api/customers/:id', requireAuth, requireRoles(['admin']), async (req, res) => {
  try {
    const deleted = await deleteCustomer(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Customer not found' });
    logActivity('customer_deleted', `Customer ${req.params.id} deleted`, req.authUser.id);
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// ============ INVOICES ============

app.get('/api/invoices', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
  try {
    const jobs = await listJobs();
    const customers = await listCustomers();
    
    const invoicesWithDetails = fallbackInvoices.map(inv => {
      const job = jobs.find(j => j.id === inv.jobId);
      const customer = customers.find(c => c.id === inv.customerId);
      return { ...inv, job: job || null, customer: customer || null };
    });
    
    return res.json(invoicesWithDetails);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load invoices' });
  }
});

app.post('/api/invoices', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
  try {
    const jobId = String(req.body.jobId || '').trim();
    const customerId = String(req.body.customerId || '').trim();
    const amount = parseFloat(req.body.amount) || 0;
    const items = req.body.items || [];

    if (!jobId) return res.status(400).json({ error: 'Job ID is required' });
    
    const job = await findJobById(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    
    if (job.invoiceId) return res.status(400).json({ error: 'Job already has an invoice' });

    const created = await createInvoice({ 
      jobId, 
      customerId: customerId || job.customerId, 
      amount, 
      items,
      createdBy: req.authUser.id
    });
    
    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create invoice' });
  }
});

app.patch('/api/invoices/:id/status', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
  try {
    const status = String(req.body.status || '').trim();
    if (!['pending', 'paid', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updated = await updateInvoice(req.params.id, { status, paidBy: req.authUser.id });
    if (!updated) return res.status(404).json({ error: 'Invoice not found' });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update invoice' });
  }
});

app.get('/api/invoices/:id/pdf', requireAuth, async (req, res) => {
  try {
    const invoice = fallbackInvoices.find(inv => inv.id === req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    
    const job = await findJobById(invoice.jobId);
    const customer = await findCustomerById(invoice.customerId);
    
    const pdfContent = generatePDFInvoice(invoice, job, customer);
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.id}.txt`);
    return res.send(pdfContent);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

// ============ SCHEDULE ============

app.get('/api/schedule', requireAuth, async (req, res) => {
  try {
    const jobs = await listJobs();
    const customers = await listCustomers();
    
    const scheduledJobs = jobs.filter(job => job.scheduledDate);
    
    const schedule = scheduledJobs.map(job => {
      const customer = customers.find(c => c.id === job.customerId);
      return { ...job, customerName: customer ? customer.name : 'Unknown' };
    });

    schedule.sort((a, b) => {
      if (!a.scheduledDate) return 1;
      if (!b.scheduledDate) return -1;
      return new Date(a.scheduledDate) - new Date(b.scheduledDate);
    });

    return res.json(schedule);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load schedule' });
  }
});

// ============ NOTIFICATIONS ============

app.get('/api/notifications', requireAuth, async (req, res) => {
  try {
    const userNotifications = notifications.slice(0, 20);
    return res.json(userNotifications);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load notifications' });
  }
});

app.patch('/api/notifications/:id/read', requireAuth, async (req, res) => {
  try {
    const notif = notifications.find(n => n.id === req.params.id);
    if (!notif) return res.status(404).json({ error: 'Notification not found' });
    
    notif.read = true;
    return res.json(notif);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// ============ EMAIL LOG ============

app.get('/api/emails', requireAuth, requireRoles(['admin']), async (req, res) => {
  try {
    return res.json(emailQueue.slice(0, 50));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load email log' });
  }
});

// ============ ACTIVITY LOG ============

app.get('/api/activity', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = fallbackActivityLogs.slice(0, limit);
    return res.json(logs);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load activity log' });
  }
});

// ============ EXPORT ============

app.get('/api/export/jobs', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
  try {
    const jobs = await listJobs();
    const customers = await listCustomers();
    
    const headers = ['ID', 'Title', 'Status', 'Priority', 'Assigned To', 'Location', 'Customer', 'Scheduled Date', 'Category', 'Check-in', 'Check-out', 'Notes'];
    const rows = jobs.map(job => {
      const customer = customers.find(c => c.id === job.customerId);
      return [
        job.id,
        `"${job.title}"`,
        job.status,
        job.priority,
        job.assignedTo || 'Unassigned',
        `"${job.location}"`,
        customer ? customer.name : 'Unknown',
        job.scheduledDate || '',
        job.category || 'general',
        job.checkinTime || '',
        job.checkoutTime || '',
        `"${(job.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    });
    
    const csv = [headers.join(','), ...rows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=jobs-export-${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csv);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to export jobs' });
  }
});

app.get('/api/export/customers', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
  try {
    const customers = await listCustomers();
    
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Address', 'Notes'];
    const rows = customers.map(customer => [
      customer.id,
      `"${customer.name}"`,
      customer.email,
      customer.phone,
      `"${customer.address}"`,
      `"${(customer.notes || '').replace(/"/g, '""')}"`
    ].join(','));
    
    const csv = [headers.join(','), ...rows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=customers-export-${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csv);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to export customers' });
  }
});

// ============ DASHBOARD ============

app.get('/api/dashboard/summary', requireAuth, async (req, res) => {
  try {
    const jobs = await listJobs();
    const customers = await listCustomers();
    const invoices = [...fallbackInvoices];
    
    const total = jobs.length;
    const newCount = jobs.filter((job) => job.status === 'new').length;
    const assignedCount = jobs.filter((job) => job.status === 'assigned').length;
    const inProgressCount = jobs.filter((job) => job.status === 'in-progress').length;
    const completedCount = jobs.filter((job) => job.status === 'completed').length;
    
    const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.amount || 0), 0);
    const pendingInvoices = invoices.filter(i => i.status === 'pending').length;
    
    const technicians = await getTechnicianUsernames();
    const techStats = technicians.map(tech => {
      const techJobs = jobs.filter(j => j.assignedTo === tech);
      return {
        username: tech,
        totalJobs: techJobs.length,
        completed: techJobs.filter(j => j.status === 'completed').length,
        inProgress: techJobs.filter(j => j.status === 'in-progress').length,
      };
    });

    const categoryStats = {};
    jobs.forEach(job => {
      const cat = job.category || 'general';
      categoryStats[cat] = (categoryStats[cat] || 0) + 1;
    });

    res.json({
      totalJobs: total,
      newJobs: newCount,
      assignedJobs: assignedCount,
      inProgressJobs: inProgressCount,
      completedJobs: completedCount,
      totalCustomers: customers.length,
      totalRevenue,
      pendingInvoices,
      role: req.authUser.role,
      usingFallback: !useDb(),
      technicianStats: techStats,
      categoryStats,
      recentActivity: fallbackActivityLogs.slice(0, 5),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load dashboard summary' });
  }
});

// ============ PROJECTS ============

app.get('/api/projects', requireAuth, async (req, res) => {
  try {
    const projectsWithProgress = fallbackProjects.map(project => ({
      ...project,
      progress: calculateProjectProgress(project.id),
      taskCount: fallbackTasks.filter(t => t.projectId === project.id).length,
      completedTaskCount: fallbackTasks.filter(t => t.projectId === project.id && t.status === 'completed').length,
    }));
    
    // Auto-update overdue status
    const today = new Date().toISOString().split('T')[0];
    projectsWithProgress.forEach(project => {
      if (project.targetDeadline < today && project.status !== 'completed') {
        project.status = 'overdue';
      }
    });
    
    return res.json(projectsWithProgress);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load projects' });
  }
});

app.post('/api/projects', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
  try {
    const title = String(req.body.title || '').trim();
    const description = String(req.body.description || '').trim();
    const startDate = String(req.body.startDate || '').trim();
    const targetDeadline = String(req.body.targetDeadline || '').trim();
    const priority = normalizePriority(req.body.priority, 'medium');

    if (!title) return res.status(400).json({ error: 'Project title is required' });

    const created = {
      id: nextProjectIdFromList(fallbackProjects),
      title,
      description,
      startDate,
      targetDeadline,
      priority,
      status: 'not_started',
      progress: 0,
      createdBy: req.authUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    fallbackProjects.unshift(created);
    logActivity('project_created', `Project ${created.id} created: ${created.title}`, req.authUser.id);
    addNotification('project', 'Project Created', `${created.id}: ${created.title}`, null);
    
    return res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.put('/api/projects/:id', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
  try {
    const idx = fallbackProjects.findIndex(p => String(p.id) === String(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Project not found' });

    const existing = fallbackProjects[idx];
    const title = req.body.title !== undefined ? String(req.body.title || '').trim() : existing.title;
    const description = req.body.description !== undefined ? String(req.body.description || '').trim() : existing.description;
    const startDate = req.body.startDate !== undefined ? String(req.body.startDate || '').trim() : existing.startDate;
    const targetDeadline = req.body.targetDeadline !== undefined ? String(req.body.targetDeadline || '').trim() : existing.targetDeadline;
    const priority = req.body.priority !== undefined ? normalizePriority(req.body.priority, existing.priority) : existing.priority;
    const status = req.body.status !== undefined ? String(req.body.status || '').trim().toLowerCase() : existing.status;

    if (!title) return res.status(400).json({ error: 'Project title is required' });
    if (!['not_started', 'active', 'on_hold', 'completed', 'overdue'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    fallbackProjects[idx] = {
      ...existing,
      title,
      description,
      startDate,
      targetDeadline,
      priority,
      status,
      updatedAt: new Date().toISOString(),
    };

    logActivity('project_updated', `Project ${req.params.id} updated`, req.authUser.id);
    return res.json(fallbackProjects[idx]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

app.delete('/api/projects/:id', requireAuth, requireRoles(['admin']), async (req, res) => {
  try {
    const idx = fallbackProjects.findIndex(p => String(p.id) === String(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Project not found' });

    // Delete all tasks associated with the project
    const taskIndices = [];
    fallbackTasks.forEach((t, i) => {
      if (String(t.projectId) === String(req.params.id)) {
        taskIndices.push(i);
      }
    });
    
    // Remove tasks in reverse order to maintain indices
    for (let i = taskIndices.length - 1; i >= 0; i--) {
      fallbackTasks.splice(taskIndices[i], 1);
    }

    fallbackProjects.splice(idx, 1);
    logActivity('project_deleted', `Project ${req.params.id} deleted`, req.authUser.id);
    
    return res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// ============ TIMELINE PLANNER - CALCULATION ENGINE ============

const HOUR_MS = 60 * 60 * 1000;
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

const roundToHourIso = (date = new Date()) => {
  const d = new Date(date);
  d.setMinutes(0, 0, 0);
  return d.toISOString();
};

const statusMap = {
  pending: 'scheduled',
  'not_started': 'scheduled',
  'in-progress': 'in_progress',
  in_progress: 'in_progress',
  paused: 'paused',
  completed: 'completed',
  scheduled: 'scheduled',
};

const normalizeTaskStatus = (value, fallback = 'scheduled') => {
  const key = String(value || '').trim().toLowerCase();
  return statusMap[key] || fallback;
};

const normalizeIsoInput = (value) => {
  if (!value) return '';
  if (ISO_RE.test(String(value))) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString();
};

const toDateOnly = (isoValue) => {
  const d = new Date(isoValue);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};

const hoursBetween = (startIso, endIso) => {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return (end.getTime() - start.getTime()) / HOUR_MS;
};

const computePlannedDuration = (task) => Math.max(0, hoursBetween(task.plannedStart, task.plannedEnd));
const computeActualDuration = (task) => {
  if (!task.actualStart) return 0;
  const endRef = task.actualEnd || new Date().toISOString();
  return Math.max(0, hoursBetween(task.actualStart, endRef));
};

const computeProgressFromDurations = (task) => {
  if (task.status === 'completed') return 100;
  const planned = computePlannedDuration(task);
  if (planned <= 0) return task.status === 'in_progress' ? 35 : 0;
  const actual = computeActualDuration(task);
  return Math.max(0, Math.min(99, Math.round((actual / planned) * 100)));
};

const ensureTaskModel = (task) => {
  const assignedUserId = String(task.assignedUserId || task.assignedTo || '').trim();
  const plannedStart = normalizeIsoInput(task.plannedStart || (task.startDate ? `${task.startDate}T08:00:00` : roundToHourIso()));
  const plannedEnd = normalizeIsoInput(task.plannedEnd || (task.dueDate ? `${task.dueDate}T17:00:00` : new Date(new Date(plannedStart || Date.now()).getTime() + 8 * HOUR_MS).toISOString()));
  let status = normalizeTaskStatus(task.status, 'scheduled');

  const actualStart = normalizeIsoInput(task.actualStart || '');
  const actualEnd = normalizeIsoInput(task.actualEnd || '');

  if (!actualStart && status === 'in_progress') status = 'scheduled';
  if (actualEnd) status = 'completed';

  const next = {
    ...task,
    assignedUserId,
    assignedTo: assignedUserId,
    plannedStart,
    plannedEnd,
    actualStart: actualStart || null,
    actualEnd: actualEnd || null,
    status,
    startDate: toDateOnly(plannedStart),
    dueDate: toDateOnly(plannedEnd),
  };

  next.progress = task.progress != null ? Number(task.progress) : computeProgressFromDurations(next);
  if (Number.isNaN(next.progress)) next.progress = computeProgressFromDurations(next);
  return next;
};

for (let i = 0; i < fallbackTasks.length; i += 1) {
  fallbackTasks[i] = ensureTaskModel(fallbackTasks[i]);
}

const calculateProjectProgressByDuration = (projectId) => {
  const projectTasks = fallbackTasks.filter((t) => String(t.projectId) === String(projectId));
  if (!projectTasks.length) return 0;

  let weighted = 0;
  let totalPlanned = 0;

  projectTasks.forEach((task) => {
    const enhanced = ensureTaskModel(task);
    const planned = Math.max(1, computePlannedDuration(enhanced));
    weighted += planned * computeProgressFromDurations(enhanced);
    totalPlanned += planned;
  });

  if (!totalPlanned) return 0;
  return Math.round(weighted / totalPlanned);
};

const getEnhancedTask = (task) => {
  const normalized = ensureTaskModel(task);
  const plannedDuration = computePlannedDuration(normalized);
  const actualDuration = normalized.actualStart ? computeActualDuration(normalized) : 0;
  const variance = normalized.actualEnd ? actualDuration - plannedDuration : null;

  return {
    ...normalized,
    plannedDurationHours: Number(plannedDuration.toFixed(2)),
    actualDurationHours: Number(actualDuration.toFixed(2)),
    varianceHours: variance == null ? null : Number(variance.toFixed(2)),
    computedStatus: normalized.status,
    duration: Number((plannedDuration / 24).toFixed(2)),
    parentTaskId: normalized.parentTaskId || null,
    sortOrder: normalized.sortOrder || 0,
  };
};

const canControlAttendance = (user, task) => {
  if (!user) return false;
  if (['admin', 'dispatcher'].includes(user.role)) return true;
  return user.role === 'technician' && String(task.assignedUserId || task.assignedTo) === String(user.username);
};

const recalculateParentFromChildren = (parentTask) => {
  const children = fallbackTasks.filter((t) => String(t.parentTaskId) === String(parentTask.id));
  if (!children.length) return;

  const normalizedChildren = children.map((c) => ensureTaskModel(c));
  const starts = normalizedChildren.map((c) => new Date(c.plannedStart).getTime()).filter((v) => !Number.isNaN(v));
  const ends = normalizedChildren.map((c) => new Date(c.plannedEnd).getTime()).filter((v) => !Number.isNaN(v));

  if (starts.length && ends.length) {
    parentTask.plannedStart = new Date(Math.min(...starts)).toISOString();
    parentTask.plannedEnd = new Date(Math.max(...ends)).toISOString();
    parentTask.startDate = toDateOnly(parentTask.plannedStart);
    parentTask.dueDate = toDateOnly(parentTask.plannedEnd);
  }

  const avgProgress = normalizedChildren.reduce((sum, c) => sum + computeProgressFromDurations(c), 0) / normalizedChildren.length;
  parentTask.progress = Math.round(avgProgress);
  if (avgProgress >= 100) parentTask.status = 'completed';
  else if (avgProgress > 0) parentTask.status = 'in_progress';
  else parentTask.status = 'scheduled';
};

// ============ TIMELINE PLANNER API ENDPOINTS ============

app.get('/api/projects/:projectId/tasks', requireAuth, async (req, res) => {
  try {
    const projectId = String(req.params.projectId);
    let tasks = fallbackTasks.filter((t) => String(t.projectId) === projectId).map((t) => getEnhancedTask(t));

    if (req.authUser.role === 'technician') {
      tasks = tasks.filter((t) => String(t.assignedUserId || t.assignedTo) === String(req.authUser.username));
    }

    return res.json(tasks);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load tasks' });
  }
});

app.get('/api/projects/:projectId/timeline', requireAuth, async (req, res) => {
  try {
    const projectId = String(req.params.projectId);
    let tasks = fallbackTasks.filter((t) => String(t.projectId) === projectId).map((t) => getEnhancedTask(t));

    if (req.authUser.role === 'technician') {
      tasks = tasks.filter((t) => String(t.assignedUserId || t.assignedTo) === String(req.authUser.username));
    }

    const allTimes = tasks.flatMap((t) => [t.plannedStart, t.plannedEnd]).map((v) => new Date(v).getTime()).filter((v) => !Number.isNaN(v));
    const min = allTimes.length ? new Date(Math.min(...allTimes)) : new Date();
    const max = allTimes.length ? new Date(Math.max(...allTimes)) : new Date(Date.now() + 24 * HOUR_MS);
    min.setHours(min.getHours() - 24, 0, 0, 0);
    max.setHours(max.getHours() + 24, 0, 0, 0);

    const timelineData = {
      projectId,
      timelineStart: min.toISOString(),
      timelineEnd: max.toISOString(),
      totalTasks: tasks.length,
      scheduledTasks: tasks.filter((t) => t.status === 'scheduled').length,
      inProgressTasks: tasks.filter((t) => t.status === 'in_progress').length,
      pausedTasks: tasks.filter((t) => t.status === 'paused').length,
      completedTasks: tasks.filter((t) => t.status === 'completed').length,
      projectProgress: calculateProjectProgressByDuration(projectId),
      tasks,
    };

    return res.json(timelineData);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load timeline data' });
  }
});

app.post('/api/projects/:projectId/tasks', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
  try {
    const projectId = String(req.params.projectId || '').trim();
    const name = String(req.body.name || '').trim();
    const description = String(req.body.description || '').trim();
    const assignedUserId = String(req.body.assignedUserId || req.body.assignedTo || '').trim();
    const plannedStart = normalizeIsoInput(req.body.plannedStart || '');
    const plannedEnd = normalizeIsoInput(req.body.plannedEnd || '');
    const dependencies = Array.isArray(req.body.dependencies) ? req.body.dependencies : [];
    const parentTaskId = req.body.parentTaskId || null;
    const sortOrder = Number(req.body.sortOrder) || 0;

    if (!name) return res.status(400).json({ error: 'Task name is required' });
    if (!plannedStart || !plannedEnd) return res.status(400).json({ error: 'plannedStart and plannedEnd are required' });
    if (new Date(plannedStart).getTime() >= new Date(plannedEnd).getTime()) {
      return res.status(400).json({ error: 'plannedStart must be before plannedEnd' });
    }

    const project = fallbackProjects.find((p) => String(p.id) === projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const created = ensureTaskModel({
      id: nextTaskIdFromList(fallbackTasks),
      projectId,
      parentTaskId,
      name,
      description,
      assignedUserId,
      assignedTo: assignedUserId,
      plannedStart,
      plannedEnd,
      actualStart: null,
      actualEnd: null,
      status: 'scheduled',
      progress: 0,
      dependencies,
      sortOrder,
      notes: String(req.body.notes || '').trim(),
      createdBy: req.authUser.id,
      updatedAt: new Date().toISOString(),
    });

    fallbackTasks.push(created);

    if (project.status === 'not_started') {
      project.status = 'active';
      project.updatedAt = new Date().toISOString();
    }

    if (parentTaskId) {
      const parent = fallbackTasks.find((t) => String(t.id) === String(parentTaskId));
      if (parent) recalculateParentFromChildren(parent);
    }

    project.progress = calculateProjectProgressByDuration(projectId);
    logActivity('task_created', `Task ${created.id} created: ${created.name}`, req.authUser.id);
    addNotification('task', 'Task Created', `${created.id}: ${created.name}`, null);

    return res.status(201).json(getEnhancedTask(created));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create task' });
  }
});

app.put('/api/tasks/:id', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
  try {
    const idx = fallbackTasks.findIndex((t) => String(t.id) === String(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Task not found' });

    const existing = ensureTaskModel(fallbackTasks[idx]);
    const name = req.body.name !== undefined ? String(req.body.name || '').trim() : existing.name;
    const description = req.body.description !== undefined ? String(req.body.description || '').trim() : existing.description;
    const assignedUserId = req.body.assignedUserId !== undefined
      ? String(req.body.assignedUserId || '').trim()
      : String(req.body.assignedTo !== undefined ? req.body.assignedTo : existing.assignedUserId || existing.assignedTo);

    const plannedStart = req.body.plannedStart !== undefined
      ? normalizeIsoInput(req.body.plannedStart || '')
      : existing.plannedStart;
    const plannedEnd = req.body.plannedEnd !== undefined
      ? normalizeIsoInput(req.body.plannedEnd || '')
      : existing.plannedEnd;

    if (!name) return res.status(400).json({ error: 'Task name is required' });
    if (!plannedStart || !plannedEnd) return res.status(400).json({ error: 'plannedStart and plannedEnd are required' });
    if (new Date(plannedStart).getTime() >= new Date(plannedEnd).getTime()) {
      return res.status(400).json({ error: 'plannedStart must be before plannedEnd' });
    }

    const nextStatus = req.body.status !== undefined
      ? normalizeTaskStatus(req.body.status, existing.status)
      : existing.status;

    fallbackTasks[idx] = ensureTaskModel({
      ...existing,
      name,
      description,
      assignedUserId,
      assignedTo: assignedUserId,
      plannedStart,
      plannedEnd,
      status: nextStatus,
      dependencies: req.body.dependencies !== undefined ? req.body.dependencies : existing.dependencies,
      notes: req.body.notes !== undefined ? String(req.body.notes || '').trim() : existing.notes,
      parentTaskId: req.body.parentTaskId !== undefined ? req.body.parentTaskId : existing.parentTaskId,
      sortOrder: req.body.sortOrder !== undefined ? req.body.sortOrder : existing.sortOrder,
      updatedAt: new Date().toISOString(),
    });

    if (existing.parentTaskId) {
      const parent = fallbackTasks.find((t) => String(t.id) === String(existing.parentTaskId));
      if (parent) recalculateParentFromChildren(parent);
    }

    const project = fallbackProjects.find((p) => String(p.id) === String(existing.projectId));
    if (project) project.progress = calculateProjectProgressByDuration(existing.projectId);

    logActivity('task_updated', `Task ${req.params.id} updated`, req.authUser.id);
    return res.json(getEnhancedTask(fallbackTasks[idx]));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update task' });
  }
});

app.patch('/api/tasks/:id/dates', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
  try {
    const idx = fallbackTasks.findIndex((t) => String(t.id) === String(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Task not found' });

    const existing = ensureTaskModel(fallbackTasks[idx]);
    let plannedStart = existing.plannedStart;
    let plannedEnd = existing.plannedEnd;

    if (req.body.plannedStart !== undefined || req.body.startDate !== undefined) {
      plannedStart = normalizeIsoInput(req.body.plannedStart || (req.body.startDate ? `${req.body.startDate}T08:00:00` : ''));
    }
    if (req.body.plannedEnd !== undefined || req.body.dueDate !== undefined) {
      plannedEnd = normalizeIsoInput(req.body.plannedEnd || (req.body.dueDate ? `${req.body.dueDate}T17:00:00` : ''));
    }

    if (!plannedStart || !plannedEnd) return res.status(400).json({ error: 'plannedStart and plannedEnd are required' });
    if (new Date(plannedStart).getTime() >= new Date(plannedEnd).getTime()) {
      return res.status(400).json({ error: 'plannedStart must be before plannedEnd' });
    }

    fallbackTasks[idx] = ensureTaskModel({
      ...existing,
      plannedStart,
      plannedEnd,
      updatedAt: new Date().toISOString(),
    });

    logActivity('task_dates_updated', `Task ${req.params.id} dates updated`, req.authUser.id);
    return res.json(getEnhancedTask(fallbackTasks[idx]));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update dates' });
  }
});

app.patch('/api/tasks/:id/progress', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
  try {
    const idx = fallbackTasks.findIndex((t) => String(t.id) === String(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Task not found' });

    const existing = ensureTaskModel(fallbackTasks[idx]);
    const progress = req.body.progress !== undefined ? Number(req.body.progress) : existing.progress;
    if (Number.isNaN(progress) || progress < 0 || progress > 100) {
      return res.status(400).json({ error: 'Progress must be between 0 and 100' });
    }

    let status = 'scheduled';
    if (progress >= 100) status = 'completed';
    else if (progress > 0) status = 'in_progress';

    fallbackTasks[idx] = ensureTaskModel({
      ...existing,
      status,
      actualStart: progress > 0 && !existing.actualStart ? new Date().toISOString() : existing.actualStart,
      actualEnd: progress >= 100 ? (existing.actualEnd || new Date().toISOString()) : null,
      progress,
      updatedAt: new Date().toISOString(),
    });

    logActivity('task_progress_updated', `Task ${req.params.id} progress set to ${progress}%`, req.authUser.id);
    return res.json(getEnhancedTask(fallbackTasks[idx]));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update progress' });
  }
});

const updateAttendanceState = (task, nextAction) => {
  const nowIso = new Date().toISOString();
  const next = { ...ensureTaskModel(task) };

  if (nextAction === 'start') {
    if (!next.actualStart) next.actualStart = nowIso;
    next.actualEnd = null;
    next.status = 'in_progress';
  }

  if (nextAction === 'pause') {
    next.status = 'paused';
  }

  if (nextAction === 'resume') {
    if (!next.actualStart) next.actualStart = nowIso;
    next.status = 'in_progress';
  }

  if (nextAction === 'finish') {
    if (!next.actualStart) next.actualStart = nowIso;
    next.actualEnd = nowIso;
    next.status = 'completed';
  }

  if (next.actualStart && new Date(next.actualStart).getTime() < new Date(next.plannedStart).getTime()) {
    next.attendanceWarning = 'actualStart is earlier than plannedStart';
  }

  next.updatedAt = nowIso;
  return ensureTaskModel(next);
};

const attendanceEndpoint = (action) => async (req, res) => {
  try {
    const idx = fallbackTasks.findIndex((t) => String(t.id) === String(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Task not found' });

    const existing = ensureTaskModel(fallbackTasks[idx]);
    if (!canControlAttendance(req.authUser, existing)) {
      return res.status(403).json({ error: 'Only assigned technician or admin/dispatcher can update attendance' });
    }

    if (action === 'start' && existing.status !== 'scheduled') {
      return res.status(400).json({ error: 'Only scheduled tasks can be started' });
    }
    if (action === 'pause' && existing.status !== 'in_progress') {
      return res.status(400).json({ error: 'Only in-progress tasks can be paused' });
    }
    if (action === 'resume' && existing.status !== 'paused') {
      return res.status(400).json({ error: 'Only paused tasks can be resumed' });
    }
    if (action === 'finish' && !['in_progress', 'paused'].includes(existing.status)) {
      return res.status(400).json({ error: 'Only in-progress or paused tasks can be finished' });
    }

    fallbackTasks[idx] = updateAttendanceState(existing, action);
    const updated = getEnhancedTask(fallbackTasks[idx]);

    const project = fallbackProjects.find((p) => String(p.id) === String(updated.projectId));
    if (project) project.progress = calculateProjectProgressByDuration(updated.projectId);

    logActivity(`task_${action}`, `Task ${updated.id} ${action}ed`, req.authUser.id);
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update attendance' });
  }
};

app.post('/api/tasks/:id/start', requireAuth, attendanceEndpoint('start'));
app.post('/api/tasks/:id/pause', requireAuth, attendanceEndpoint('pause'));
app.post('/api/tasks/:id/resume', requireAuth, attendanceEndpoint('resume'));
app.post('/api/tasks/:id/finish', requireAuth, attendanceEndpoint('finish'));

app.delete('/api/tasks/:id', requireAuth, async (req, res) => {
  if (req.authUser.role === 'client') {
    return res.status(403).json({ error: 'Clients cannot delete tasks' });
  }

  try {
    const idx = fallbackTasks.findIndex((t) => String(t.id) === String(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Task not found' });

    const task = fallbackTasks[idx];
    const projectId = task.projectId;

    fallbackTasks.forEach((t, i) => {
      if (String(t.parentTaskId) === String(task.id)) {
        fallbackTasks[i].parentTaskId = null;
      }
    });

    fallbackTasks.splice(idx, 1);

    const project = fallbackProjects.find((p) => p.id === projectId);
    if (project) project.progress = calculateProjectProgressByDuration(projectId);

    logActivity('task_deleted', `Task ${req.params.id} deleted`, req.authUser.id);
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete task' });
  }
});

app.get('/api/tasks/:id/activity', requireAuth, async (req, res) => {
  try {
    const taskLogs = fallbackActivityLogs.filter((log) =>
      log.description && log.description.includes(req.params.id)
    );
    return res.json(taskLogs);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load task activity' });
  }
});
// ============ PLANNING / Gantt ============

app.get('/api/planning/gantt', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
  try {
    const projects = fallbackProjects.map(project => ({
      ...project,
      progress: calculateProjectProgress(project.id),
      tasks: fallbackTasks.filter(t => String(t.projectId) === project.id),
    }));
    return res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load planning data' });
  }
});

// ============ PROJECT EXPORT ============

app.get('/api/export/projects', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
  try {
    const headers = ['ID', 'Title', 'Description', 'Status', 'Priority', 'Progress', 'Start Date', 'Deadline', 'Created By'];
    const rows = fallbackProjects.map(project => [
      project.id,
      `"${project.title}"`,
      `"${(project.description || '').replace(/"/g, '""')}"`,
      project.status,
      project.priority,
      calculateProjectProgress(project.id) + '%',
      project.startDate || '',
      project.targetDeadline || '',
      project.createdBy || '',
    ].join(','));
    
    const csv = [headers.join(','), ...rows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=projects-export-${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export projects' });
  }
});

app.get('/api/export/tasks', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
  try {
    const projectId = req.query.projectId;
    let tasks = fallbackTasks;
    if (projectId) {
      tasks = tasks.filter(t => String(t.projectId) === String(projectId));
    }
    
    const headers = ['ID', 'Project ID', 'Name', 'Description', 'Status', 'Progress', 'Assigned To', 'Start Date', 'Due Date', 'Dependencies', 'Notes'];
    const rows = tasks.map(task => [
      task.id,
      task.projectId,
      `"${task.name}"`,
      `"${(task.description || '').replace(/"/g, '""')}"`,
      task.status,
      task.progress + '%',
      task.assignedTo || '',
      task.startDate || '',
      task.dueDate || '',
      (task.dependencies || []).join(';'),
      `"${(task.notes || '').replace(/"/g, '""')}"`,
    ].join(','));
    
    const csv = [headers.join(','), ...rows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=tasks-export-${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export tasks' });
  }
});

// ============ START SERVER ============

const start = async () => {
  await initDb();
  
  app.listen(PORT, () => {
    const mode = useDb() ? 'MongoDB' : 'fallback in-memory';
    console.log(`App 2 backend running on http://localhost:${PORT} (${mode})`);
    console.log(`\n🔌 Real-time: Socket.io enabled for live updates`);
    console.log(`\n📋 API Endpoints:`);
    console.log(`  Jobs: GET/POST /api/jobs, PUT /api/jobs/:id, PATCH /api/jobs/:id/status`);
    console.log(`  Jobs: POST /api/jobs/:id/checkin, /checkout`);
    console.log(`  Jobs: POST /api/jobs/:id/photos`);
    console.log(`  Customers: GET/POST /api/customers, PUT/DELETE /api/customers/:id`);
    console.log(`  Invoices: GET/POST /api/invoices, PATCH /api/invoices/:id/status`);
    console.log(`  Invoices: GET /api/invoices/:id/pdf (download invoice)`);
    console.log(`  Schedule: GET /api/schedule`);
    console.log(`  Export: GET /api/export/jobs, GET /api/export/customers, GET /api/export/projects`);
    console.log(`  Notifications: GET /api/notifications`);
    console.log(`  Projects: GET/POST /api/projects, PUT/DELETE /api/projects/:id`);
    console.log(`  Tasks: GET/POST /api/projects/:id/tasks, PUT/DELETE /api/tasks/:id`);
    console.log(`  Activity: GET /api/activity`);
    console.log(`  Client Portal: POST /api/client/login, GET /api/client/jobs, GET /api/client/invoices`);
    console.log(`\n✨ Advanced Features:`);
    console.log(`  - Email notifications (simulated)`);
    console.log(`  - PDF invoice generation`);
    console.log(`  - Client portal`);
    console.log(`  - Real-time Socket.io updates`);
  });
};

start();

