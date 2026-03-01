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

const MONGO_URI = process.env.MONGO_URI || 'mongodb://fieldservice-user:app2field@fieldservice-cluster-shard-00-00.76mgxvb.mongodb.net:27017,fieldservice-cluster-shard-00-01.76mgxvb.mongodb.net:27017,fieldservice-cluster-shard-00-02.76mgxvb.mongodb.net:27017/?ssl=true&replicaSet=atlas-11f6n6-shard-0&authSource=admin&appName=fieldservice-cluster';
const DB_NAME = process.env.DB_NAME || 'fieldservice';

let db = null;
let client = null;

const connectDB = async () => {
  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log(`MongoDB connected to ${DB_NAME}`);
    
    // Create indexes
    await createIndexes();
    
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    throw error;
  }
};

const createIndexes = async () => {
  try {
    // Users indexes
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    
    // Jobs indexes
    await db.collection('jobs').createIndex({ status: 1 });
    await db.collection('jobs').createIndex({ assignedTo: 1 });
    await db.collection('jobs').createIndex({ customerId: 1 });
    await db.collection('jobs').createIndex({ scheduledDate: 1 });
    
    // Customers indexes
    await db.collection('customers').createIndex({ email: 1 }, { unique: true });
    
    // Invoices indexes
    await db.collection('invoices').createIndex({ jobId: 1 });
    await db.collection('invoices').createIndex({ customerId: 1 });
    await db.collection('invoices').createIndex({ status: 1 });
    
    // Projects indexes
    await db.collection('projects').createIndex({ status: 1 });
    
    // Tasks indexes
    await db.collection('tasks').createIndex({ project_id: 1 });
    await db.collection('tasks').createIndex({ parent_task_id: 1 });
    
    // Activity logs indexes
    await db.collection('activityLogs').createIndex({ timestamp: -1 });
    await db.collection('activityLogs').createIndex({ entity_id: 1 });
    
    // Notifications indexes
    await db.collection('notifications').createIndex({ user_id: 1 });
    await db.collection('notifications').createIndex({ read: 1 });
    
    // Sessions indexes
    await db.collection('sessions').createIndex({ token: 1 }, { unique: true });
    
    console.log('Database indexes created');
  } catch (error) {
    console.error('Error creating indexes:', error.message);
  }
};

// Helper functions
const getCollection = (name) => db.collection(name);
const toObjectId = (id) => new ObjectId(id);

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
    if (end < today && progress < 100) {
      return 'delayed';
    }
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

// Auth helpers
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

// Start server
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

  // Projects endpoints
  app.get('/api/projects', requireAuth, async (req, res) => {
    const projects = getCollection('projects');
    const allProjects = await projects.find().sort({ created_at: -1 }).toArray();
    res.json(allProjects);
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
    
    // Update project progress
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
    
    // Update project progress
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
    
    // Update project progress
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
    
    // Delete children recursively
    const deleteChildren = async (parentId) => {
      const children = await tasks.find({ parent_task_id: parentId }).toArray();
      for (const child of children) {
        await deleteChildren(child.id);
      }
      await tasks.deleteOne({ id: parentId });
    };
    
    await deleteChildren(req.params.id);
    
    // Update project progress
    const projects = getCollection('projects');
    const overallProgress = await calculateProjectProgress(projectId);
    const projectStatus = await calculateProjectStatus(projectId);
    await projects.updateOne({ id: projectId }, { $set: { overall_progress: overallProgress, status: projectStatus, updated_at: new Date().toISOString() } });
    
    await logActivity('task', task.id, req.authUser.username, 'deleted', `Task ${task.name} deleted`);
    res.json({ ok: true });
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
