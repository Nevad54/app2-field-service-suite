const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const JOB_UPLOADS_DIR = path.join(UPLOADS_DIR, 'jobs');
const DATA_DIR = path.join(__dirname, 'data');

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

fs.mkdirSync(JOB_UPLOADS_DIR, { recursive: true });
fs.mkdirSync(DATA_DIR, { recursive: true });

// ============== DATABASE INITIALIZATION ==============
const { createDb } = require('./db');
const db = createDb(__dirname);

// Seed data for initial bootstrap
const seedData = require('./seed-data');
let dbData = null;

// Initialize database and load data
async function initDatabase() {
  try {
    dbData = await db.bootstrap(seedData);
    console.log('Database initialized and seeded');
    
    // Load data into memory arrays
    users = dbData.users || [];
    customers = dbData.customers || [];
    jobs = dbData.jobs || [];
    invoices = dbData.invoices || [];
    projects = dbData.projects || [];
    tasks = dbData.tasks || [];
    activityLogs = dbData.activityLogs || [];
    notifications = dbData.notifications || [];
    technicians = seedData.technicians || [];
    inventory = seedData.inventory || [];
    equipment = seedData.equipment || [];
    quotes = seedData.quotes || [];
    recurringJobs = seedData.recurringJobs || [];
  } catch (err) {
    console.error('Database initialization error:', err.message);
    // Fall back to seed data
    users = seedData.users;
    customers = seedData.customers;
    jobs = seedData.jobs.map(normalizeJob);
    invoices = seedData.invoices;
    projects = seedData.projects;
    tasks = seedData.tasks;
    activityLogs = seedData.activityLogs;
    notifications = seedData.notifications;
    technicians = seedData.technicians;
    inventory = seedData.inventory;
    equipment = seedData.equipment;
    quotes = seedData.quotes;
    recurringJobs = seedData.recurringJobs;
  }
}

// ============== USERS ==============
let users = [
 { id: 'u-admin', username: 'admin', password: '1111', role: 'admin' },
 { id: 'u-dispatch', username: 'dispatcher', password: '1111', role: 'dispatcher' },
 { id: 'u-tech', username: 'technician', password: '1111', role: 'technician' },
 { id: 'u-client', username: 'client', password: '1111', role: 'client' },
];

// ============== TECHNICIANS DATA ==============
let technicians = [
 {
   id: 'tech-1',
   name: 'John Smith',
   email: 'john.smith@example.com',
   phone: '555-1001',
   role: 'technician',
   skills: ['HVAC', 'Electrical', 'Refrigeration'],
   hourly_rate: 75,
   certifications: ['EPA 608 Universal', 'OSHA 10', 'NATE Certified'],
   availability: {
     monday: { start: '08:00', end: '17:00' },
     tuesday: { start: '08:00', end: '17:00' },
     wednesday: { start: '08:00', end: '17:00' },
     thursday: { start: '08:00', end: '17:00' },
     friday: { start: '08:00', end: '17:00' },
     saturday: null,
     sunday: null
   },
   status: 'active',
   color: '#0ea5e9',
   hire_date: '2023-01-15',
   notes: 'Senior technician, 10+ years experience',
   avatar: null
 },
 {
   id: 'tech-2',
   name: 'Maria Garcia',
   email: 'maria.garcia@example.com',
   phone: '555-1002',
   role: 'technician',
   skills: ['Plumbing', 'Gas Fitting', 'Backflow Prevention'],
   hourly_rate: 70,
   certifications: ['Master Plumber', 'OSHA 10', 'Certified Gas Fitter'],
   availability: {
     monday: { start: '07:00', end: '16:00' },
     tuesday: { start: '07:00', end: '16:00' },
     wednesday: { start: '07:00', end: '16:00' },
     thursday: { start: '07:00', end: '16:00' },
     friday: { start: '07:00', end: '16:00' },
     saturday: { start: '08:00', end: '12:00' },
     sunday: null
   },
   status: 'active',
   color: '#10b981',
   hire_date: '2023-03-20',
   notes: 'Specialist in commercial plumbing',
   avatar: null
 },
 {
   id: 'tech-3',
   name: 'Robert Johnson',
   email: 'robert.johnson@example.com',
   phone: '555-1003',
   role: 'technician',
   skills: ['Electrical', 'Security Systems', 'Networking'],
   hourly_rate: 80,
   certifications: ['Master Electrician', 'OSHA 10', 'Security License'],
   availability: {
     monday: { start: '08:00', end: '17:00' },
     tuesday: { start: '08:00', end: '17:00' },
     wednesday: { start: '08:00', end: '17:00' },
     thursday: { start: '08:00', end: '17:00' },
     friday: { start: '08:00', end: '17:00' },
     saturday: null,
     sunday: null
   },
   status: 'active',
   color: '#f59e0b',
   hire_date: '2022-08-10',
   notes: 'Expert in commercial electrical and security',
   avatar: null
 },
 {
   id: 'tech-4',
   name: 'Sarah Williams',
   email: 'sarah.williams@example.com',
   phone: '555-1004',
   role: 'technician',
   skills: ['HVAC', 'Building Automation', 'Controls'],
   hourly_rate: 72,
   certifications: ['EPA 608 Type II', 'OSHA 10', 'BACnet Certified'],
   availability: {
     monday: { start: '09:00', end: '18:00' },
     tuesday: { start: '09:00', end: '18:00' },
     wednesday: { start: '09:00', end: '18:00' },
     thursday: { start: '09:00', end: '18:00' },
     friday: { start: '09:00', end: '18:00' },
     saturday: null,
     sunday: null
   },
   status: 'active',
   color: '#8b5cf6',
   hire_date: '2024-01-05',
   notes: 'Specializes in smart building systems',
   avatar: null
 },
 {
   id: 'tech-5',
   name: 'David Brown',
   email: 'david.brown@example.com',
   phone: '555-1005',
   role: 'technician',
   skills: ['General Maintenance', 'Carpentry', 'Painting'],
   hourly_rate: 55,
   certifications: ['OSHA 10', 'General Contractor License'],
   availability: {
     monday: { start: '08:00', end: '17:00' },
     tuesday: { start: '08:00', end: '17:00' },
     wednesday: { start: '08:00', end: '17:00' },
     thursday: { start: '08:00', end: '17:00' },
     friday: null,
     saturday: { start: '09:00', end: '15:00' },
     sunday: null
   },
   status: 'on_leave',
   color: '#ec4899',
   hire_date: '2023-06-15',
   notes: 'Currently on paternity leave until April',
   avatar: null
 }
];

// Helper to calculate technician workload
const calculateTechnicianWorkload = (techId, date) => {
 const targetDate = date || new Date().toISOString().split('T')[0];
 
 // Get jobs assigned to this technician
 const assignedJobs = jobs.filter(j => 
   j.assignedTo === techId && 
   j.scheduledDate === targetDate &&
   j.status !== 'completed'
 );
 
 // Get tasks assigned to this technician
 const assignedTasks = tasks.filter(t => 
   t.assignee === techId &&
   t.status !== 'completed' &&
   t.start_date <= targetDate &&
   t.end_date >= targetDate
 );
 
 // Calculate estimated hours (assuming 8 hour days per job/task)
 const jobHours = assignedJobs.length * 8;
 const taskHours = assignedTasks.reduce((sum, t) => {
   const duration = t.duration_days || 1;
   return sum + (duration * 8);
 }, 0);
 
 const totalHours = jobHours + taskHours;
 const workloadPercent = Math.min(100, (totalHours / 40) * 100); // 40 hours = 100%
 
 return {
   date: targetDate,
   jobCount: assignedJobs.length,
   taskCount: assignedTasks.length,
   totalHours,
   workloadPercent: Math.round(workloadPercent)
 };
};

// ============== CUSTOMERS DATA (2026) ==============
let customers = [
 { id: 'CUST-001', name: 'Acme Corporation', email: 'contact@acme.com', phone: '555-0101', address: '123 Business Ave, Downtown', created_at: '2026-01-05T10:00:00Z' },
 { id: 'CUST-002', name: 'TechStart Inc', email: 'info@techstart.io', phone: '555-0102', address: '456 Innovation Blvd, Tech Park', created_at: '2026-01-10T14:30:00Z' },
 { id: 'CUST-003', name: 'Global Logistics', email: 'ops@globallog.com', phone: '555-0103', address: '789 Harbor Road, Port District', created_at: '2026-01-15T09:00:00Z' },
 { id: 'CUST-004', name: 'Metro Healthcare', email: 'facilities@metrohealth.org', phone: '555-0104', address: '321 Medical Center Dr, Health District', created_at: '2026-01-20T11:00:00Z' },
 { id: 'CUST-005', name: 'Riverside School District', email: 'maintenance@riverside.edu', phone: '555-0105', address: '654 Education Way, Riverside', created_at: '2026-02-01T08:00:00Z' },
 { id: 'CUST-006', name: 'Sunset Hotels', email: 'ops@sunsethotels.com', phone: '555-0106', address: '987 Resort Lane, Beachfront', created_at: '2026-02-10T13:00:00Z' },
 { id: 'CUST-007', name: 'Midwest Manufacturing', email: 'plant@midwestmfg.com', phone: '555-0107', address: '147 Industrial Pkwy, Commerce City', created_at: '2026-02-15T10:30:00Z' },
 { id: 'CUST-008', name: 'Evergreen Properties', email: 'maintenance@evergreen.com', phone: '555-0108', address: '258 Green Valley Rd, Suburbs', created_at: '2026-02-20T15:00:00Z' },
];

// ============== JOBS DATA (2026) ==============
let jobs = [
 { id: 'JOB-1001', title: 'HVAC preventive maintenance', status: 'completed', priority: 'medium', assignedTo: 'technician', location: 'Building A - Acme Corp', scheduledDate: '2026-01-20', customerId: 'CUST-001', category: 'maintenance', notes: 'Quarterly maintenance completed', created_at: '2026-01-15T08:00:00Z' },
 { id: 'JOB-1002', title: 'Generator inspection', status: 'completed', priority: 'high', assignedTo: 'technician', location: 'Warehouse North - Global Logistics', scheduledDate: '2026-01-25', customerId: 'CUST-003', category: 'inspection', notes: 'All systems operational', created_at: '2026-01-18T09:00:00Z' },
 { id: 'JOB-1003', title: 'Electrical panel audit', status: 'in-progress', priority: 'high', assignedTo: 'technician', location: 'Main Plant - Midwest Mfg', scheduledDate: '2026-02-15', customerId: 'CUST-007', category: 'audit', notes: 'In progress - 60% complete', created_at: '2026-02-10T10:00:00Z' },
 { id: 'JOB-1004', title: 'Plumbing system check', status: 'assigned', priority: 'medium', assignedTo: 'technician', location: 'TechStart Office', scheduledDate: '2026-02-20', customerId: 'CUST-002', category: 'maintenance', notes: 'Scheduled for next week', created_at: '2026-02-12T11:00:00Z' },
 { id: 'JOB-1005', title: 'Fire safety inspection', status: 'new', priority: 'high', assignedTo: '', location: 'Metro Healthcare', scheduledDate: '2026-02-25', customerId: 'CUST-004', category: 'safety', notes: 'Annual inspection required', created_at: '2026-02-14T08:00:00Z' },
 { id: 'JOB-1006', title: 'Elevator maintenance', status: 'assigned', priority: 'medium', assignedTo: 'technician', location: 'Sunset Hotels - Main Building', scheduledDate: '2026-02-18', customerId: 'CUST-006', category: 'maintenance', notes: 'Quarterly maintenance', created_at: '2026-02-08T14:00:00Z' },
 { id: 'JOB-1007', title: 'Security system upgrade', status: 'in-progress', priority: 'high', assignedTo: 'technician', location: 'Riverside School District', scheduledDate: '2026-02-10', customerId: 'CUST-005', category: 'installation', notes: 'Installing new access control', created_at: '2026-02-05T09:00:00Z' },
 { id: 'JOB-1008', title: 'HVAC repair - cooling issue', status: 'new', priority: 'urgent', assignedTo: '', location: 'Evergreen Properties', scheduledDate: '2026-02-22', customerId: 'CUST-008', category: 'repair', notes: 'AC not cooling properly', created_at: '2026-02-15T16:00:00Z' },
];

const normalizeJob = (job) => {
 if (!job) return job;
 if (!Array.isArray(job.photos)) job.photos = [];
 job.photos = job.photos.map((photo, idx) => {
  if (typeof photo === 'string') {
   return {
    id: `legacy-${idx}`,
    data: photo,
    mimeType: '',
    uploadedBy: '',
    uploadedAt: '',
    tag: 'other',
   };
  }
  return {
   ...photo,
   tag: String(photo.tag || 'other').toLowerCase(),
   tagNote: String(photo.tagNote || ''),
  };
 });
 if (!Array.isArray(job.partsUsed)) job.partsUsed = [];
 if (!Array.isArray(job.materialsUsed)) job.materialsUsed = [];
 if (!Array.isArray(job.worklog)) job.worklog = [];
 if (typeof job.technicianNotes !== 'string') job.technicianNotes = '';
 if (typeof job.completionNotes !== 'string') job.completionNotes = job.completionNotes || '';
 if (job.projectId === undefined) job.projectId = null;
 if (job.taskId === undefined) job.taskId = null;
 if (!job.updated_at) job.updated_at = job.created_at || new Date().toISOString();
 return job;
};

// Persist photos metadata to JSON file
const persistPhotosForJob = (jobId, photos) => {
 try {
   const filePath = path.join(DATA_DIR, 'job-photos.json');
   let jobPhotos = {};
   if (fs.existsSync(filePath)) {
     jobPhotos = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
   }
   jobPhotos[jobId] = photos;
   fs.writeFileSync(filePath, JSON.stringify(jobPhotos, null, 2));
 } catch (err) {
   console.error('Error persisting photos:', err);
 }
};

jobs.forEach((job) => normalizeJob(job));

// ============== INVOICES DATA (2026) ==============
let invoices = [
 { id: 'INV-2026-001', jobId: 'JOB-1001', customerId: 'CUST-001', amount: 450.00, status: 'paid', issuedDate: '2026-01-20', paidDate: '2026-01-25', description: 'HVAC preventive maintenance - Q1 2026' },
 { id: 'INV-2026-002', jobId: 'JOB-1002', customerId: 'CUST-003', amount: 275.00, status: 'paid', issuedDate: '2026-01-25', paidDate: '2026-01-28', description: 'Generator inspection services' },
 { id: 'INV-2026-003', jobId: 'JOB-1003', customerId: 'CUST-007', amount: 850.00, status: 'pending', issuedDate: '2026-02-15', paidDate: null, description: 'Electrical panel audit - progress billing' },
 { id: 'INV-2026-004', jobId: 'JOB-1006', customerId: 'CUST-006', amount: 600.00, status: 'pending', issuedDate: '2026-02-18', paidDate: null, description: 'Elevator maintenance - Q1 2026' },
 { id: 'INV-2026-005', jobId: 'JOB-1007', customerId: 'CUST-005', amount: 1200.00, status: 'paid', issuedDate: '2026-02-10', paidDate: '2026-02-12', description: 'Security system installation - deposit' },
 { id: 'INV-2026-006', jobId: 'JOB-1004', customerId: 'CUST-002', amount: 350.00, status: 'pending', issuedDate: '2026-02-20', paidDate: null, description: 'Plumbing system check' },
];

// ============== ACTIVITY LOGS (2026) ==============
const activityLogs = [
 { id: 'act-001', entity_type: 'job', entity_id: 'JOB-1001', user_id: 'admin', action: 'created', description: 'Created job: HVAC preventive maintenance', timestamp: '2026-01-15T08:00:00Z' },
 { id: 'act-002', entity_type: 'job', entity_id: 'JOB-1001', user_id: 'admin', action: 'status_changed', description: 'Job JOB-1001 status changed to completed', timestamp: '2026-01-20T10:30:00Z' },
 { id: 'act-003', entity_type: 'invoice', entity_id: 'INV-2026-001', user_id: 'admin', action: 'created', description: 'Invoice INV-2026-001 created for $450.00', timestamp: '2026-01-20T11:00:00Z' },
 { id: 'act-004', entity_type: 'invoice', entity_id: 'INV-2026-001', user_id: 'admin', action: 'paid', description: 'Invoice INV-2026-001 paid in full', timestamp: '2026-01-25T14:00:00Z' },
 { id: 'act-005', entity_type: 'job', entity_id: 'JOB-1002', user_id: 'admin', action: 'created', description: 'Created job: Generator inspection', timestamp: '2026-01-18T09:00:00Z' },
 { id: 'act-006', entity_type: 'job', entity_id: 'JOB-1003', user_id: 'admin', action: 'created', description: 'Created job: Electrical panel audit', timestamp: '2026-02-10T10:00:00Z' },
 { id: 'act-007', entity_type: 'job', entity_id: 'JOB-1003', user_id: 'technician', action: 'status_changed', description: 'Job JOB-1003 status changed to in-progress', timestamp: '2026-02-12T09:00:00Z' },
 { id: 'act-008', entity_type: 'invoice', entity_id: 'INV-2026-002', user_id: 'admin', action: 'created', description: 'Invoice INV-2026-002 created for $275.00', timestamp: '2026-01-25T10:00:00Z' },
 { id: 'act-009', entity_type: 'invoice', entity_id: 'INV-2026-002', user_id: 'admin', action: 'paid', description: 'Invoice INV-2026-002 paid in full', timestamp: '2026-01-28T11:00:00Z' },
 { id: 'act-010', entity_type: 'customer', entity_id: 'CUST-008', user_id: 'admin', action: 'created', description: 'New customer added: Evergreen Properties', timestamp: '2026-02-15T16:00:00Z' },
];

// ============== PROJECTS DATA (2026) ==============
const projects = [
 {
   id: 'proj-1',
   title: 'Office Building Renovation',
   description: 'Complete renovation of the main office building including HVAC, electrical, and plumbing',
   start_date: '2026-01-15',
   end_date: '2026-06-30',
   status: 'in_progress',
   overall_progress: 35,
   created_by: 'admin',
   created_at: '2026-01-10T08:00:00Z',
   updated_at: '2026-02-15T10:30:00Z'
 },
 {
   id: 'proj-2',
   title: 'Warehouse Expansion',
   description: 'Expand warehouse capacity by 5000 sq ft',
   start_date: '2026-03-01',
   end_date: '2026-08-31',
   status: 'planning',
   overall_progress: 0,
   created_by: 'admin',
   created_at: '2026-02-01T09:00:00Z',
   updated_at: '2026-02-01T09:00:00Z'
 },
 {
   id: 'proj-3',
   title: 'Hospital Wing Construction',
   description: 'New 3-story medical wing with specialized HVAC and emergency power systems',
   start_date: '2026-02-01',
   end_date: '2026-12-15',
   status: 'active',
   overall_progress: 25,
   created_by: 'admin',
   created_at: '2026-01-20T10:00:00Z',
   updated_at: '2026-03-01T14:00:00Z'
 },
 {
   id: 'proj-4',
   title: 'School District HVAC Upgrade',
   description: 'Replace aging HVAC systems across 5 school buildings',
   start_date: '2026-01-05',
   end_date: '2026-04-30',
   status: 'delayed',
   overall_progress: 60,
   created_by: 'admin',
   created_at: '2026-01-02T09:00:00Z',
   updated_at: '2026-03-15T11:00:00Z'
 },
 {
   id: 'proj-5',
   title: 'Shopping Mall Renovation',
   description: 'Complete interior renovation of 200,000 sq ft shopping center',
   start_date: '2026-04-01',
   end_date: '2026-09-30',
   status: 'not_started',
   overall_progress: 0,
   created_by: 'admin',
   created_at: '2026-02-20T08:00:00Z',
   updated_at: '2026-02-20T08:00:00Z'
 }
];

// ============== TASKS DATA (2026) ==============
const tasks = [
 {
   id: 'task-1-1',
   project_id: 'proj-1',
   parent_task_id: null,
   name: 'Phase 1: Planning & Design',
   start_date: '2026-01-15',
   end_date: '2026-02-15',
   duration_days: 32,
   progress_percent: 100,
   weight: 10,
   status: 'completed',
   sort_order: 1,
   notes: 'Completed architectural drawings',
   assignee: 'admin',
   estimated_cost: 5000,
   actual_cost: 4500,
   dependency_ids: [],
   is_milestone: false,
   updated_by: 'admin',
   updated_at: '2026-02-15T16:00:00Z'
 },
 {
   id: 'task-1-2',
   project_id: 'proj-1',
   parent_task_id: null,
   name: 'Phase 2: HVAC Installation',
   start_date: '2026-02-16',
   end_date: '2026-04-30',
   duration_days: 74,
   progress_percent: 45,
   weight: 10,
   status: 'in_progress',
   sort_order: 2,
   notes: 'In progress - 60% of units installed',
   updated_by: 'admin',
   updated_at: '2026-03-15T11:00:00Z'
 },
 {
   id: 'task-1-2-1',
   project_id: 'proj-1',
   parent_task_id: 'task-1-2',
   name: 'HVAC Unit 1 - Floor 1',
   start_date: '2026-02-16',
   end_date: '2026-03-15',
   duration_days: 28,
   progress_percent: 100,
   weight: 10,
   status: 'completed',
   sort_order: 1,
   notes: '',
   updated_by: 'admin',
   updated_at: '2026-03-15T10:00:00Z'
 },
 {
   id: 'task-1-2-2',
   project_id: 'proj-1',
   parent_task_id: 'task-1-2',
   name: 'HVAC Unit 2 - Floor 2',
   start_date: '2026-03-01',
   end_date: '2026-04-15',
   duration_days: 46,
   progress_percent: 30,
   weight: 10,
   status: 'in_progress',
   sort_order: 2,
   notes: 'In progress',
   updated_by: 'admin',
   updated_at: '2026-03-15T11:00:00Z'
 },
 {
   id: 'task-1-2-3',
   project_id: 'proj-1',
   parent_task_id: 'task-1-2',
   name: 'HVAC Unit 3 - Floor 3',
   start_date: '2026-04-01',
   end_date: '2026-04-30',
   duration_days: 30,
   progress_percent: 0,
   weight: 10,
   status: 'not_started',
   sort_order: 3,
   notes: 'Scheduled to start',
   updated_by: 'admin',
   updated_at: '2026-02-15T10:00:00Z'
 },
 {
   id: 'task-1-3',
   project_id: 'proj-1',
   parent_task_id: null,
   name: 'Phase 3: Electrical Work',
   start_date: '2026-03-01',
   end_date: '2026-05-31',
   duration_days: 92,
   progress_percent: 20,
   weight: 20,
   status: 'in_progress',
   sort_order: 3,
   notes: 'Started wiring',
   updated_by: 'admin',
   updated_at: '2026-03-15T09:00:00Z'
 },
 {
   id: 'task-1-4',
   project_id: 'proj-1',
   parent_task_id: null,
   name: 'Phase 4: Plumbing',
   start_date: '2026-04-01',
   end_date: '2026-06-15',
   duration_days: 76,
   progress_percent: 0,
   weight: 20,
   status: 'not_started',
   sort_order: 4,
   notes: 'Pending',
   updated_by: 'admin',
   updated_at: '2026-02-15T10:00:00Z'
 },
 {
   id: 'task-1-5',
   project_id: 'proj-1',
   parent_task_id: null,
   name: 'Phase 5: Final Inspections',
   start_date: '2026-06-01',
   end_date: '2026-06-30',
   duration_days: 30,
   progress_percent: 0,
   weight: 10,
   status: 'not_started',
   sort_order: 5,
   notes: '',
   updated_by: 'admin',
   updated_at: '2026-02-15T10:00:00Z'
 },
 // Project 3: Hospital Wing Construction
 {
   id: 'task-3-1',
   project_id: 'proj-3',
   parent_task_id: null,
   name: 'Foundation & Structural',
   start_date: '2026-02-01',
   end_date: '2026-04-30',
   duration_days: 89,
   progress_percent: 80,
   weight: 25,
   status: 'in_progress',
   sort_order: 1,
   notes: 'Foundation complete, steel framing 60% done',
   updated_by: 'admin',
   updated_at: '2026-03-15T10:00:00Z'
 },
 {
   id: 'task-3-2',
   project_id: 'proj-3',
   parent_task_id: null,
   name: 'Medical Gas Systems',
   start_date: '2026-05-01',
   end_date: '2026-07-31',
   duration_days: 92,
   progress_percent: 10,
   weight: 20,
   status: 'in_progress',
   sort_order: 2,
   notes: 'Design phase complete, procurement started',
   updated_by: 'admin',
   updated_at: '2026-03-10T14:00:00Z'
 },
 {
   id: 'task-3-3',
   project_id: 'proj-3',
   parent_task_id: null,
   name: 'Emergency Power Installation',
   start_date: '2026-06-01',
   end_date: '2026-08-31',
   duration_days: 92,
   progress_percent: 0,
   weight: 20,
   status: 'not_started',
   sort_order: 3,
   notes: 'Generators on order',
   updated_by: 'admin',
   updated_at: '2026-02-25T09:00:00Z'
 },
 {
   id: 'task-3-4',
   project_id: 'proj-3',
   parent_task_id: null,
   name: 'Specialized HVAC',
   start_date: '2026-08-01',
   end_date: '2026-10-31',
   duration_days: 92,
   progress_percent: 0,
   weight: 20,
   status: 'not_started',
   sort_order: 4,
   notes: 'Clean room systems pending',
   updated_by: 'admin',
   updated_at: '2026-02-20T11:00:00Z'
 },
 {
   id: 'task-3-5',
   project_id: 'proj-3',
   parent_task_id: null,
   name: 'Final Certification',
   start_date: '2026-11-01',
   end_date: '2026-12-15',
   duration_days: 45,
   progress_percent: 0,
   weight: 15,
   status: 'not_started',
   sort_order: 5,
   notes: 'Medical certification required',
   updated_by: 'admin',
   updated_at: '2026-02-20T11:00:00Z'
 },
 // Project 4: School District HVAC Upgrade (DELAYED)
 {
   id: 'task-4-1',
   project_id: 'proj-4',
   parent_task_id: null,
   name: 'Site 1: Riverside Elementary',
   start_date: '2026-01-05',
   end_date: '2026-02-15',
   duration_days: 42,
   progress_percent: 100,
   weight: 20,
   status: 'completed',
   sort_order: 1,
   notes: 'Completed on schedule',
   updated_by: 'admin',
   updated_at: '2026-02-15T16:00:00Z'
 },
 {
   id: 'task-4-2',
   project_id: 'proj-4',
   parent_task_id: null,
   name: 'Site 2: Central Middle School',
   start_date: '2026-02-01',
   end_date: '2026-03-15',
   duration_days: 43,
   progress_percent: 70,
   weight: 20,
   status: 'delayed',
   sort_order: 2,
   notes: 'Equipment delivery delayed 2 weeks',
   updated_by: 'admin',
   updated_at: '2026-03-20T10:00:00Z'
 },
 {
   id: 'task-4-3',
   project_id: 'proj-4',
   parent_task_id: null,
   name: 'Site 3: Westside High',
   start_date: '2026-02-15',
   end_date: '2026-03-30',
   duration_days: 44,
   progress_percent: 40,
   weight: 20,
   status: 'delayed',
   sort_order: 3,
   notes: 'Waiting for permits',
   updated_by: 'admin',
   updated_at: '2026-03-18T14:00:00Z'
 },
 {
   id: 'task-4-4',
   project_id: 'proj-4',
   parent_task_id: null,
   name: 'Site 4: North Academy',
   start_date: '2026-03-01',
   end_date: '2026-04-15',
   duration_days: 46,
   progress_percent: 20,
   weight: 20,
   status: 'in_progress',
   sort_order: 4,
   notes: 'Started late due to weather',
   updated_by: 'admin',
   updated_at: '2026-03-15T09:00:00Z'
 },
 {
   id: 'task-4-5',
   project_id: 'proj-4',
   parent_task_id: null,
   name: 'Site 5: South Elementary',
   start_date: '2026-03-15',
   end_date: '2026-04-30',
   duration_days: 47,
   progress_percent: 0,
   weight: 20,
   status: 'not_started',
   sort_order: 5,   notes: 'Pending completion of Site 4',
   updated_by: 'admin',
   updated_at: '2026-03-01T10:00:00Z'
 },
 // Project 5: Shopping Mall Renovation (NOT STARTED)
 {
   id: 'task-5-1',
   project_id: 'proj-5',
   parent_task_id: null,
   name: 'Demolition & Site Prep',
   start_date: '2026-04-01',
   end_date: '2026-05-15',
   duration_days: 45,
   progress_percent: 0,
   weight: 15,
   status: 'not_started',
   sort_order: 1,
   notes: 'Permits pending approval',
   updated_by: 'admin',
   updated_at: '2026-02-20T08:00:00Z'
 },
 {
   id: 'task-5-2',
   project_id: 'proj-5',
   parent_task_id: null,
   name: 'Electrical Infrastructure',
   start_date: '2026-05-01',
   end_date: '2026-06-30',
   duration_days: 61,
   progress_percent: 0,
   weight: 20,
   status: 'not_started',
   sort_order: 2,
   notes: 'Design review scheduled',
   updated_by: 'admin',
   updated_at: '2026-02-20T08:00:00Z'
 },
 {
   id: 'task-5-3',
   project_id: 'proj-5',
   parent_task_id: null,
   name: 'HVAC Modernization',
   start_date: '2026-06-15',
   end_date: '2026-08-15',
   duration_days: 62,
   progress_percent: 0,
   weight: 20,
   status: 'not_started',
   sort_order: 3,
   notes: 'Energy efficient systems selected',
   updated_by: 'admin',
   updated_at: '2026-02-20T08:00:00Z'
 },
 {
   id: 'task-5-4',
   project_id: 'proj-5',
   parent_task_id: null,
   name: 'Interior Build-out',
   start_date: '2026-07-01',
   end_date: '2026-09-15',
   duration_days: 77,
   progress_percent: 0,
   weight: 25,
   status: 'not_started',
   sort_order: 4,
   notes: 'Tenant coordination required',
   updated_by: 'admin',
   updated_at: '2026-02-20T08:00:00Z'
 },
 {
   id: 'task-5-5',
   project_id: 'proj-5',
   parent_task_id: null,
   name: 'Final Inspections & Opening',
   start_date: '2026-09-01',
   end_date: '2026-09-30',
   duration_days: 30,
   progress_percent: 0,
   weight: 20,
   status: 'not_started',
   sort_order: 5,
   notes: 'Grand opening scheduled Oct 1',
   updated_by: 'admin',
   updated_at: '2026-02-20T08:00:00Z'
 }
];

// ============== NOTIFICATIONS DATA (2026) ==============
const notifications = [
 { id: 'notif-001', user_id: 'admin', title: 'Job Completed', message: 'HVAC preventive maintenance completed successfully', read: false, timestamp: '2026-01-20T10:30:00Z' },
 { id: 'notif-002', user_id: 'admin', title: 'Payment Received', message: 'Invoice INV-2026-001 has been paid', read: true, timestamp: '2026-01-25T14:00:00Z' },
 { id: 'notif-003', user_id: 'admin', title: 'New Job Assigned', message: 'New job: Electrical panel audit assigned to technician', read: false, timestamp: '2026-02-10T10:00:00Z' },
];

// ============== INVENTORY/PARTS DATA (2026) ==============
let inventory = [
 { id: 'INV-001', name: 'HVAC Filter 20x25x1', sku: 'FLT-2025-01', category: 'Filters', quantity: 50, unit_price: 15.99, reorder_level: 10, location: 'Warehouse A', supplier: 'AirPure Supplies', created_at: '2026-01-05T08:00:00Z' },
 { id: 'INV-002', name: 'Capacitor 45/5 MFD', sku: 'CAP-455-01', category: 'Electrical', quantity: 25, unit_price: 35.50, reorder_level: 5, location: 'Warehouse B', supplier: 'CoolTech Parts', created_at: '2026-01-10T09:00:00Z' },
 { id: 'INV-003', name: 'Refrigerant R-410A (25lb)', sku: 'REF-410A-25', category: 'Refrigerant', quantity: 12, unit_price: 185.00, reorder_level: 3, location: 'Warehouse A', supplier: 'ChemCool Inc', created_at: '2026-01-15T10:00:00Z' },
 { id: 'INV-004', name: 'Contactor 30A 24V', sku: 'CON-30-24', category: 'Electrical', quantity: 30, unit_price: 22.75, reorder_level: 8, location: 'Warehouse B', supplier: 'ElectricPro', created_at: '2026-01-20T11:00:00Z' },
 { id: 'INV-005', name: 'Thermostat Digital', sku: 'THER-DIG-01', category: 'Controls', quantity: 15, unit_price: 89.99, reorder_level: 5, location: 'Warehouse A', supplier: 'SmartHome Tech', created_at: '2026-02-01T08:00:00Z' },
 { id: 'INV-006', name: 'Copper Pipe 1/2" (100ft)', sku: 'PIPE-CU-12', category: 'Plumbing', quantity: 8, unit_price: 125.00, reorder_level: 3, location: 'Warehouse C', supplier: 'PipeMaster', created_at: '2026-02-05T14:00:00Z' },
 { id: 'INV-007', name: 'Ball Valve 3/4"', sku: 'VALVE-BV-34', category: 'Plumbing', quantity: 40, unit_price: 18.50, reorder_level: 10, location: 'Warehouse C', supplier: 'PipeMaster', created_at: '2026-02-10T09:00:00Z' },
 { id: 'INV-008', name: 'Circuit Breaker 20A', sku: 'CB-20-01', category: 'Electrical', quantity: 60, unit_price: 12.99, reorder_level: 15, location: 'Warehouse B', supplier: 'ElectricPro', created_at: '2026-02-12T10:00:00Z' },
];

// ============== EQUIPMENT/ASSETS DATA (2026) ==============
let equipment = [
 { id: 'EQP-001', name: 'Carrier Rooftop Unit RTU-1', type: 'HVAC', customerId: 'CUST-001', location: 'Building A - Roof', serial_number: 'CR-2024-001', install_date: '2024-06-15', status: 'operational', notes: 'Primary building HVAC unit', created_at: '2026-01-05T08:00:00Z' },
 { id: 'EQP-002', name: 'Generator GEN-500', type: 'Electrical', customerId: 'CUST-003', location: 'Warehouse North', serial_number: 'GN-2023-042', install_date: '2023-11-20', status: 'operational', notes: '500kW backup generator', created_at: '2026-01-10T09:00:00Z' },
 { id: 'EQP-003', name: 'Boiler BLR-200', type: 'Plumbing', customerId: 'CUST-004', location: 'Mechanical Room', serial_number: 'BL-2022-015', install_date: '2022-08-10', status: 'operational', notes: 'Main hospital boiler', created_at: '2026-01-15T10:00:00Z' },
 { id: 'EQP-004', name: 'Chiller CH-1000', type: 'HVAC', customerId: 'CUST-006', location: 'Hotel Basement', serial_number: 'CH-2021-008', install_date: '2021-03-25', status: 'needs_maintenance', notes: 'Main cooling system - annual service due', created_at: '2026-01-20T11:00:00Z' },
 { id: 'EQP-005', name: 'Elevator ELV-3', type: 'General', customerId: 'CUST-006', location: 'Main Building', serial_number: 'ELV-2020-003', install_date: '2020-01-15', status: 'operational', notes: 'Passenger elevator', created_at: '2026-02-01T08:00:00Z' },
 { id: 'EQP-006', name: 'Security System SEC-HQ', type: 'Security', customerId: 'CUST-005', location: 'District Office', serial_number: 'SEC-2023-101', install_date: '2023-09-01', status: 'operational', notes: 'Headquarters access control', created_at: '2026-02-05T14:00:00Z' },
];

// ============== QUOTES/ESTIMATES DATA (2026) ==============
let quotes = [
 { id: 'QUO-2026-001', customerId: 'CUST-001', title: 'HVAC Upgrade Proposal', description: 'Complete HVAC system upgrade for Building A', status: 'pending', total_amount: 45000.00, valid_until: '2026-03-15', created_by: 'admin', created_at: '2026-02-01T10:00:00Z', items: [
   { description: 'New RTU installation', quantity: 1, unit_price: 35000 },
   { description: 'Ductwork modifications', quantity: 1, unit_price: 7500 },
   { description: 'Electrical upgrades', quantity: 1, unit_price: 2500 }
 ]},
 { id: 'QUO-2026-002', customerId: 'CUST-002', title: 'Preventive Maintenance Contract', description: 'Annual PM contract for all systems', status: 'accepted', total_amount: 12000.00, valid_until: '2026-02-28', created_by: 'admin', created_at: '2026-02-10T09:00:00Z', accepted_at: '2026-02-12T14:00:00Z', jobId: null, items: [
   { description: 'Quarterly HVAC maintenance', quantity: 4, unit_price: 2000 },
   { description: 'Emergency service call', quantity: 2, unit_price: 150 },
   { description: 'Filter replacement', quantity: 12, unit_price: 150 }
 ]},
 { id: 'QUO-2026-003', customerId: 'CUST-004', title: 'Boiler Replacement Estimate', description: 'Replace aging boiler system', status: 'pending', total_amount: 85000.00, valid_until: '2026-04-01', created_by: 'admin', created_at: '2026-02-15T11:00:00Z', items: [
   { description: 'New boiler unit', quantity: 1, unit_price: 65000 },
   { description: 'Piping and installation', quantity: 1, unit_price: 15000 },
   { description: 'Permits and inspections', quantity: 1, unit_price: 5000 }
 ]},
];

// ============== RECURRING JOBS DATA (2026) ==============
let recurringJobs = [
 { id: 'REC-001', customerId: 'CUST-001', title: 'Quarterly HVAC Maintenance', description: 'Preventive maintenance for all HVAC units', frequency: 'quarterly', interval_value: 3, interval_unit: 'months', start_date: '2026-01-15', end_date: '2026-12-31', status: 'active', assignedTo: 'technician', category: 'maintenance', priority: 'medium', estimated_duration_hours: 4, created_by: 'admin', created_at: '2026-01-05T08:00:00Z' },
 { id: 'REC-002', customerId: 'CUST-003', title: 'Monthly Generator Test', description: 'Monthly generator load test and inspection', frequency: 'monthly', interval_value: 1, interval_unit: 'months', start_date: '2026-01-01', end_date: '2026-12-31', status: 'active', assignedTo: 'technician', category: 'inspection', priority: 'high', estimated_duration_hours: 2, created_by: 'admin', created_at: '2026-01-10T09:00:00Z' },
 { id: 'REC-003', customerId: 'CUST-006', title: 'Weekly Elevator Inspection', description: 'Weekly safety inspection and test', frequency: 'weekly', interval_value: 1, interval_unit: 'weeks', start_date: '2026-01-01', end_date: null, status: 'active', assignedTo: 'technician', category: 'inspection', priority: 'high', estimated_duration_hours: 1, created_by: 'admin', created_at: '2026-01-15T10:00:00Z' },
 { id: 'REC-004', customerId: 'CUST-005', title: 'Annual Fire Safety Inspection', description: 'Yearly fire system inspection', frequency: 'yearly', interval_value: 1, interval_unit: 'years', start_date: '2026-06-01', end_date: '2026-06-30', status: 'scheduled', assignedTo: 'technician', category: 'safety', priority: 'high', estimated_duration_hours: 8, created_by: 'admin', created_at: '2026-02-01T08:00:00Z' },
];

// ============== CALCULATION ENGINE ==============
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

const calculateProjectProgress = (projectTasks) => {
 if (!projectTasks || projectTasks.length === 0) return 0;
 
 let totalWeightedProgress = 0;
 let totalWeight = 0;
 
 const rootTasks = projectTasks.filter(t => !t.parent_task_id);
 
 rootTasks.forEach(task => {
   const weight = task.weight || 1;
   totalWeightedProgress += (task.progress_percent || 0) * weight;
   totalWeight += weight;
 });
 
 if (totalWeight === 0) return 0;
 return Math.round(totalWeightedProgress / totalWeight);
};

const calculateTaskContribution = (task) => {
 if (!task || !task.weight) return 0;
 return ((task.progress_percent || 0) * (task.weight || 1)) / 100;
};

const calculateProjectStatus = (projectTasks) => {
 if (!projectTasks || projectTasks.length === 0) return 'planning';
 
 const completed = projectTasks.every(t => t.progress_percent === 100);
 if (completed) return 'completed';
 
 const anyInProgress = projectTasks.some(t => t.progress_percent > 0 && t.progress_percent < 100);
 if (anyInProgress) return 'in_progress';
 
 const anyDelayed = projectTasks.some(t => calculateTaskStatus(t.progress_percent, t.end_date) === 'delayed');
 if (anyDelayed) return 'delayed';
 
 return 'planning';
};

const getProjectDateRange = (projectTasks) => {
 if (!projectTasks || projectTasks.length === 0) return { start_date: null, end_date: null };
 
 const startDates = projectTasks.map(t => t.start_date).filter(d => d);
 const endDates = projectTasks.map(t => t.end_date).filter(d => d);
 
 return {
   start_date: startDates.length ? startDates.sort()[0] : null,
   end_date: endDates.length ? endDates.sort().reverse()[0] : null
 };
};

const recalculateProject = (projectId) => {
 const projectTasks = tasks.filter(t => t.project_id === projectId);
 const project = projects.find(p => p.id === projectId);
 
 if (project) {
   project.overall_progress = calculateProjectProgress(projectTasks);
   project.status = calculateProjectStatus(projectTasks);
   const dateRange = getProjectDateRange(projectTasks);
   if (dateRange.start_date) project.start_date = dateRange.start_date;
   if (dateRange.end_date) project.end_date = dateRange.end_date;
   project.updated_at = new Date().toISOString();
 }
};

const logActivity = (entityType, entityId, userId, action, description) => {
 activityLogs.unshift({
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

const nextInvoiceId = () => {
 const year = new Date().getFullYear();
 const max = invoices.reduce((acc, item) => {
   const n = Number(String(item.id || '').replace(`INV-${year}-`, '')) || 0;
   return n > acc ? n : acc;
 }, 0);
 return `INV-${year}-${String(max + 1).padStart(3, '0')}`;
};

const findJobById = (id) => normalizeJob(jobs.find((item) => String(item.id) === String(id)));
const technicianUsernames = users.filter((u) => u.role === 'technician').map((u) => u.username);

// ============== STATUS ENDPOINT ==============
app.get('/api/status', (_req, res) => {
 res.json({ ok: true, service: 'app2-field-service-suite-backend', timestamp: new Date().toISOString() });
});

// ============== AUTH ENDPOINTS ==============
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

// ============== CUSTOMERS ENDPOINTS ==============
app.get('/api/customers', requireAuth, (req, res) => {
 res.json(customers);
});

app.post('/api/customers', requireAuth, requireRoles(['admin', 'dispatcher']), (req, res) => {
 const { name, email, phone, address } = req.body;
 
 if (!name) return res.status(400).json({ error: 'Customer name is required' });
 
 const newCustomer = {
   id: `CUST-${String(customers.length + 1).padStart(3, '0')}`,
   name,
   email: email || '',
   phone: phone || '',
   address: address || '',
   created_at: new Date().toISOString()
 };
 
 customers.push(newCustomer);
 logActivity('customer', newCustomer.id, req.authUser.username, 'created', `New customer added: ${name}`);
 res.status(201).json(newCustomer);
});

app.put('/api/customers/:id', requireAuth, requireRoles(['admin', 'dispatcher']), (req, res) => {
 const customer = customers.find(c => c.id === req.params.id);
 if (!customer) return res.status(404).json({ error: 'Customer not found' });
 
 const { name, email, phone, address } = req.body;
 
 if (name) customer.name = name;
 if (email !== undefined) customer.email = email;
 if (phone !== undefined) customer.phone = phone;
 if (address !== undefined) customer.address = address;
 
 logActivity('customer', customer.id, req.authUser.username, 'updated', `Customer ${customer.name} updated`);
 res.json(customer);
});

app.delete('/api/customers/:id', requireAuth, requireRoles(['admin']), (req, res) => {
 const index = customers.findIndex(c => c.id === req.params.id);
 if (index === -1) return res.status(404).json({ error: 'Customer not found' });
 
 const customer = customers[index];
 customers.splice(index, 1);
 logActivity('customer', customer.id, req.authUser.username, 'deleted', `Customer ${customer.name} deleted`);
 res.json({ ok: true });
});

// ============== TECHNICIANS ENDPOINTS ==============

// Get all technicians
app.get('/api/technicians', requireAuth, (req, res) => {
 const techniciansWithWorkload = technicians.map(tech => ({
   ...tech,
   workload: calculateTechnicianWorkload(tech.id)
 }));
 res.json(techniciansWithWorkload);
});

// Get single technician
app.get('/api/technicians/:id', requireAuth, (req, res) => {
 const technician = technicians.find(t => t.id === req.params.id);
 if (!technician) return res.status(404).json({ error: 'Technician not found' });
 
 const workload = calculateTechnicianWorkload(technician.id);
 const assignedJobs = jobs.filter(j => j.assignedTo === technician.id && j.status !== 'completed');
 const assignedTasks = tasks.filter(t => t.assignee === technician.id && t.status !== 'completed');
 
 res.json({
   ...technician,
   workload,
   assignedJobs: assignedJobs.length,
   assignedTasks: assignedTasks.length
 });
});

// Create technician
app.post('/api/technicians', requireAuth, requireRoles(['admin']), (req, res) => {
 const { name, email, phone, skills, hourly_rate, certifications, availability, status, color, hire_date, notes } = req.body;
 
 if (!name) return res.status(400).json({ error: 'Technician name is required' });
 
 const newTechnician = {
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
   notes: notes || '',
   avatar: null
 };
 
 technicians.push(newTechnician);
 logActivity('technician', newTechnician.id, req.authUser.username, 'created', `New technician added: ${name}`);
 res.status(201).json(newTechnician);
});

// Update technician
app.put('/api/technicians/:id', requireAuth, requireRoles(['admin']), (req, res) => {
 const technician = technicians.find(t => t.id === req.params.id);
 if (!technician) return res.status(404).json({ error: 'Technician not found' });
 
 const { name, email, phone, skills, hourly_rate, certifications, availability, status, color, notes } = req.body;
 
 if (name !== undefined) technician.name = name;
 if (email !== undefined) technician.email = email;
 if (phone !== undefined) technician.phone = phone;
 if (skills !== undefined) technician.skills = skills;
 if (hourly_rate !== undefined) technician.hourly_rate = hourly_rate;
 if (certifications !== undefined) technician.certifications = certifications;
 if (availability !== undefined) technician.availability = availability;
 if (status !== undefined) technician.status = status;
 if (color !== undefined) technician.color = color;
 if (notes !== undefined) technician.notes = notes;
 
 logActivity('technician', technician.id, req.authUser.username, 'updated', `Technician ${technician.name} updated`);
 res.json(technician);
});

// Delete technician
app.delete('/api/technicians/:id', requireAuth, requireRoles(['admin']), (req, res) => {
 const index = technicians.findIndex(t => t.id === req.params.id);
 if (index === -1) return res.status(404).json({ error: 'Technician not found' });
 
 const technician = technicians[index];
 technicians.splice(index, 1);
 logActivity('technician', technician.id, req.authUser.username, 'deleted', `Technician ${technician.name} deleted`);
 res.json({ ok: true });
});

// Get technician workload for specific date
app.get('/api/technicians/:id/workload', requireAuth, (req, res) => {
 const technician = technicians.find(t => t.id === req.params.id);
 if (!technician) return res.status(404).json({ error: 'Technician not found' });
 
 const date = req.query.date || new Date().toISOString().split('T')[0];
 const workload = calculateTechnicianWorkload(technician.id, date);
 
 const assignedJobs = jobs.filter(j => j.assignedTo === technician.id && j.scheduledDate === date);
 const assignedTasks = tasks.filter(t => t.assignee === technician.id && t.start_date <= date && t.end_date >= date);
 
 res.json({
   technician: { id: technician.id, name: technician.name },
   workload,
   jobs: assignedJobs,
   tasks: assignedTasks
 });
});

// Get available technicians for date and skill
app.get('/api/technicians/available', requireAuth, (req, res) => {
 const { date, skill } = req.query;
 
 if (!date) return res.status(400).json({ error: 'Date parameter is required' });
 
 const targetDate = new Date(date);
 const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'lowercase' });
 
 let availableTechs = technicians.filter(tech => {
   if (tech.status !== 'active') return false;
   
   const dayAvailability = tech.availability && tech.availability[dayOfWeek];
   if (!dayAvailability || !dayAvailability.start) return false;
   
   if (skill && skill.length > 0) {
     return tech.skills && tech.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()));
   }
   
   return true;
 });
 
 availableTechs = availableTechs.map(tech => ({
   ...tech,
   workload: calculateTechnicianWorkload(tech.id, date)
 }));
 
 availableTechs.sort((a, b) => a.workload.workloadPercent - b.workload.workloadPercent);
 
 res.json(availableTechs);
});

// Get all skills
app.get('/api/technicians/skills', requireAuth, (req, res) => {
 const allSkills = new Set();
 technicians.forEach(tech => {
   if (tech.skills) {
     tech.skills.forEach(skill => allSkills.add(skill));
   }
 });
 res.json(Array.from(allSkills).sort());
});

// ============== JOBS ENDPOINTS ==============
app.get('/api/jobs', requireAuth, (req, res) => {
 if (req.authUser.role === 'technician') {
   return res.json(jobs.filter((job) => job.assignedTo === req.authUser.username).map(normalizeJob));
 }
 if (req.authUser.role === 'client') {
   return res.json(jobs.filter((job) => job.customerId === req.authUser.id).map(normalizeJob));
 }
 return res.json(jobs.map(normalizeJob));
});

app.post('/api/jobs', requireAuth, requireRoles(['admin', 'dispatcher']), (req, res) => {
 const { title, priority, assignedTo, location, customerId, scheduledDate, category, notes, projectId, taskId } = req.body;
 
 if (!title) return res.status(400).json({ error: 'Job title is required' });
 if (priority && !['low', 'medium', 'high', 'urgent'].includes(priority)) return res.status(400).json({ error: 'Invalid priority' });
 if (assignedTo && !technicianUsernames.includes(assignedTo)) {
   return res.status(400).json({ error: 'Assigned technician not found' });
 }

 const now = new Date().toISOString();
 const created = {
   id: nextJobId(),
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
 
 jobs.unshift(normalizeJob(created));
 logActivity('job', created.id, req.authUser.username, 'created', `Created job: ${title}`);
 return res.status(201).json(created);
});

app.put('/api/jobs/:id', requireAuth, requireRoles(['admin', 'dispatcher']), (req, res) => {
 const existing = findJobById(req.params.id);
 if (!existing) return res.status(404).json({ error: 'Job not found' });

 const { title, priority, assignedTo, status, location, customerId, scheduledDate, category, notes, projectId, taskId } = req.body;

 if (title) existing.title = title;
 if (priority) {
   if (!['low', 'medium', 'high', 'urgent'].includes(priority)) return res.status(400).json({ error: 'Invalid priority' });
   existing.priority = priority;
 }
 if (assignedTo !== undefined) {
   if (assignedTo && !technicianUsernames.includes(assignedTo)) return res.status(400).json({ error: 'Assigned technician not found' });
   existing.assignedTo = assignedTo;
 }
 if (status) {
   if (!['new', 'assigned', 'in-progress', 'completed'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
   existing.status = status;
 }
 if (location !== undefined) existing.location = location;
 if (customerId !== undefined) existing.customerId = customerId;
 if (scheduledDate !== undefined) existing.scheduledDate = scheduledDate;
 if (category !== undefined) existing.category = category;
 if (notes !== undefined) existing.notes = notes;
 if (projectId !== undefined) existing.projectId = projectId || null;
 if (taskId !== undefined) existing.taskId = taskId || null;
 existing.updated_at = new Date().toISOString();

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
 existing.updated_at = new Date().toISOString();
 logActivity('job', existing.id, req.authUser.username, 'status_changed', `Job ${existing.id} status changed to ${status}`);
 return res.json(existing);
});

// DELETE /api/jobs/:id - Delete a job
app.delete('/api/jobs/:id', requireAuth, requireRoles(['admin']), (req, res) => {
 const existing = findJobById(req.params.id);
 if (!existing) return res.status(404).json({ error: 'Job not found' });
 
 const index = jobs.findIndex(j => j.id === req.params.id);
 if (index === -1) return res.status(404).json({ error: 'Job not found' });
 
 const job = jobs[index];
 jobs.splice(index, 1);
 logActivity('job', job.id, req.authUser.username, 'deleted', `Job ${job.id} deleted`);
 return res.json({ ok: true });
});

app.post('/api/jobs/:id/checkin', requireAuth, (req, res) => {
 const existing = findJobById(req.params.id);
 if (!existing) return res.status(404).json({ error: 'Job not found' });

 if (req.authUser.role === 'technician') {
   if (existing.assignedTo !== req.authUser.username) return res.status(403).json({ error: 'Forbidden' });
 } else if (!['admin', 'dispatcher'].includes(req.authUser.role)) {
   return res.status(403).json({ error: 'Forbidden' });
 }

 if (existing.checkoutTime) {
   return res.status(400).json({ error: 'Job already checked out' });
 }
 if (existing.checkinTime) {
   return res.status(400).json({ error: 'Job already checked in' });
 }

 existing.checkinTime = new Date().toISOString();
 if (existing.status === 'new' || existing.status === 'assigned') {
   existing.status = 'in-progress';
 }
 existing.updated_at = new Date().toISOString();

 logActivity('job', existing.id, req.authUser.username, 'checkin', `Checked in to ${existing.id}`);
 return res.json(existing);
});

app.post('/api/jobs/:id/checkout', requireAuth, (req, res) => {
 const existing = findJobById(req.params.id);
 if (!existing) return res.status(404).json({ error: 'Job not found' });

 if (req.authUser.role === 'technician') {
   if (existing.assignedTo !== req.authUser.username) return res.status(403).json({ error: 'Forbidden' });
 } else if (!['admin', 'dispatcher'].includes(req.authUser.role)) {
   return res.status(403).json({ error: 'Forbidden' });
 }

 if (!existing.checkinTime) {
   return res.status(400).json({ error: 'Check in first before checkout' });
 }
 if (existing.checkoutTime) {
   return res.status(400).json({ error: 'Job already checked out' });
 }

 existing.checkoutTime = new Date().toISOString();
 existing.status = 'completed';
 if (typeof req.body.notes === 'string') {
   existing.completionNotes = req.body.notes;
 }
 existing.updated_at = new Date().toISOString();

 logActivity('job', existing.id, req.authUser.username, 'checkout', `Checked out from ${existing.id}`);
 return res.json(existing);
});

app.patch('/api/jobs/:id/worklog', requireAuth, (req, res) => {
 const existing = findJobById(req.params.id);
 if (!existing) return res.status(404).json({ error: 'Job not found' });

 const isTechAssigned = req.authUser.role === 'technician' && existing.assignedTo === req.authUser.username;
 const isManager = ['admin', 'dispatcher'].includes(req.authUser.role);
 if (!isTechAssigned && !isManager) {
   return res.status(403).json({ error: 'Forbidden' });
 }

 const { technicianNotes, partsUsed, materialsUsed } = req.body || {};
 if (technicianNotes !== undefined) {
   existing.technicianNotes = String(technicianNotes || '');
 }
 if (partsUsed !== undefined) {
   if (!Array.isArray(partsUsed)) return res.status(400).json({ error: 'partsUsed must be an array' });
   existing.partsUsed = partsUsed;
 }
 if (materialsUsed !== undefined) {
   if (!Array.isArray(materialsUsed)) return res.status(400).json({ error: 'materialsUsed must be an array' });
   existing.materialsUsed = materialsUsed;
 }

 existing.worklog.unshift({
   at: new Date().toISOString(),
   by: req.authUser.username,
   technicianNotes: existing.technicianNotes,
   partsUsed: existing.partsUsed,
   materialsUsed: existing.materialsUsed,
 });
 existing.updated_at = new Date().toISOString();
 logActivity('job', existing.id, req.authUser.username, 'worklog_updated', `Updated worklog for ${existing.id}`);
 return res.json(existing);
});

app.post('/api/jobs/:id/photos', requireAuth, (req, res) => {
 const existing = findJobById(req.params.id);
 if (!existing) return res.status(404).json({ error: 'Job not found' });

 if (req.authUser.role === 'technician') {
   if (existing.assignedTo !== req.authUser.username) return res.status(403).json({ error: 'Forbidden' });
 } else if (!['admin', 'dispatcher'].includes(req.authUser.role)) {
   return res.status(403).json({ error: 'Forbidden' });
 }

 const photo = String(req.body.photo || '');
 const incomingTag = String(req.body.tag || 'other').toLowerCase().trim();
 const allowedTags = new Set(['before', 'after', 'damage', 'parts', 'other']);
 const tag = allowedTags.has(incomingTag) ? incomingTag : 'other';
 const tagNote = tag === 'other' ? String(req.body.tagNote || '').trim().slice(0, 80) : '';
 const match = photo.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
 if (!match) {
   return res.status(400).json({ error: 'Invalid photo payload' });
 }
 if (photo.length > 8_000_000) {
   return res.status(400).json({ error: 'Photo is too large' });
 }
 const mimeType = match[1];
 const base64Data = match[2];
 const ext = mimeType.includes('jpeg') ? 'jpg'
   : mimeType.includes('png') ? 'png'
   : mimeType.includes('webp') ? 'webp'
   : mimeType.includes('gif') ? 'gif'
   : 'img';

 const fileId = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
 const fileName = `${existing.id}-${fileId}.${ext}`;
 const filePath = path.join(JOB_UPLOADS_DIR, fileName);
 fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

 if (!Array.isArray(existing.photos)) existing.photos = [];
 const photoRecord = {
   id: fileId,
   data: `/uploads/jobs/${fileName}`,
   mimeType,
   uploadedBy: req.authUser.username,
   uploadedAt: new Date().toISOString(),
   tag,
   tagNote,
  };
 existing.photos.push(photoRecord);
 persistPhotosForJob(existing.id, existing.photos);
 existing.updated_at = new Date().toISOString();

 logActivity('job', existing.id, req.authUser.username, 'photo_added', `Photo added to ${existing.id}`);
 return res.status(201).json(photoRecord);
});

app.delete('/api/jobs/:id/photos/:photoId', requireAuth, (req, res) => {
 const existing = findJobById(req.params.id);
 if (!existing) return res.status(404).json({ error: 'Job not found' });

 if (!['admin', 'dispatcher'].includes(req.authUser.role)) {
   return res.status(403).json({ error: 'Forbidden' });
 }

 if (!Array.isArray(existing.photos) || existing.photos.length === 0) {
   return res.status(404).json({ error: 'Photo not found' });
 }

 const photoId = String(req.params.photoId || '');
 const byIdIndex = existing.photos.findIndex((p) => String(p.id || '') === photoId);
 const byIndex = Number.isInteger(Number(photoId)) ? Number(photoId) : -1;
 const index = byIdIndex >= 0 ? byIdIndex : byIndex;

 if (index < 0 || index >= existing.photos.length) {
   return res.status(404).json({ error: 'Photo not found' });
 }

 const [removed] = existing.photos.splice(index, 1);
 if (removed && typeof removed.data === 'string' && removed.data.startsWith('/uploads/jobs/')) {
   const filePath = path.join(UPLOADS_DIR, removed.data.replace(/^\/uploads\//, '').replace(/\//g, path.sep));
   try {
     if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
   } catch (_) {}
 }
 persistPhotosForJob(existing.id, existing.photos);
 existing.updated_at = new Date().toISOString();
 logActivity('job', existing.id, req.authUser.username, 'photo_removed', `Photo removed from ${existing.id}`);
 return res.json({ ok: true });
});

// ============== SCHEDULE ENDPOINT ==============
app.get('/api/schedule', requireAuth, (req, res) => {
 const scheduledJobs = jobs.filter(job => job.scheduledDate).filter((job) => {
   if (req.authUser.role === 'technician') return job.assignedTo === req.authUser.username;
   if (req.authUser.role === 'client') return job.customerId === req.authUser.id;
   return true;
 });
 res.json(scheduledJobs);
});

// ============== INVOICES ENDPOINTS ==============
app.get('/api/invoices', requireAuth, (req, res) => {
 if (req.authUser.role === 'client') {
   return res.json(invoices.filter((invoice) => invoice.customerId === req.authUser.id));
 }
 return res.json(invoices);
});

// GET /api/invoices/:id - Get single invoice
app.get('/api/invoices/:id', requireAuth, (req, res) => {
 const invoice = invoices.find(i => i.id === req.params.id);
 if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
 
 // Clients can only see their own invoices
 if (req.authUser.role === 'client' && invoice.customerId !== req.authUser.id) {
   return res.status(403).json({ error: 'Forbidden' });
 }
 
 // Include job details if available
 const job = jobs.find(j => j.id === invoice.jobId);
 res.json({ ...invoice, job: job || null });
});

app.post('/api/invoices', requireAuth, requireRoles(['admin', 'dispatcher']), (req, res) => {
 const { jobId, customerId, amount, description } = req.body;
 
 if (!jobId || !customerId || !amount) {
   return res.status(400).json({ error: 'Job ID, Customer ID, and Amount are required' });
 }
 
 const newInvoice = {
   id: nextInvoiceId(),
   jobId,
   customerId,
   amount: parseFloat(amount),
   status: 'pending',
   issuedDate: new Date().toISOString().split('T')[0],
   paidDate: null,
   description: description || ''
 };
 
 invoices.push(newInvoice);
 logActivity('invoice', newInvoice.id, req.authUser.username, 'created', `Invoice ${newInvoice.id} created for $${amount}`);
 res.status(201).json(newInvoice);
});

app.patch('/api/invoices/:id/status', requireAuth, requireRoles(['admin', 'dispatcher']), (req, res) => {
 const invoice = invoices.find(i => i.id === req.params.id);
 if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
 
 const { status } = req.body;
 if (!['pending', 'paid'].includes(status)) {
   return res.status(400).json({ error: 'Invalid status' });
 }
 
 invoice.status = status;
 if (status === 'paid') {
   invoice.paidDate = new Date().toISOString().split('T')[0];
 }
 
 logActivity('invoice', invoice.id, req.authUser.username, status === 'paid' ? 'paid' : 'status_changed', 
   `Invoice ${invoice.id} ${status === 'paid' ? 'paid in full' : 'status changed to ' + status}`);
 res.json(invoice);
});

// Download invoice as text file (simple PDF alternative)
app.get('/api/invoices/:id/pdf', requireAuth, (req, res) => {
 const invoice = invoices.find(i => i.id === req.params.id);
 if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
 
 // Check permissions - clients can only download their own invoices
 if (req.authUser.role === 'client' && invoice.customerId !== req.authUser.id) {
   return res.status(403).json({ error: 'Forbidden' });
 }
 
 const job = jobs.find(j => j.id === invoice.jobId);
 const customer = customers.find(c => c.id === invoice.customerId);
 
 // Generate invoice content as text
 const invoiceContent = `
========================================
           INVOICE
========================================

Invoice Number: ${invoice.id}
Date Issued: ${invoice.issuedDate || 'N/A'}
Status: ${invoice.status.toUpperCase()}

----------------------------------------
BILL TO:
----------------------------------------
${customer ? customer.name : 'N/A'}
${customer ? customer.address : ''}
${customer ? customer.phone : ''}

----------------------------------------
JOB DETAILS:
----------------------------------------
Job ID: ${invoice.jobId}
${job ? `Job Title: ${job.title}` : ''}
${job ? `Location: ${job.location}` : ''}

Description: ${invoice.description || 'N/A'}

----------------------------------------
AMOUNT:
----------------------------------------
Subtotal: $${invoice.amount.toFixed(2)}
Tax (0%): $0.00
----------------------------------------
TOTAL: $${invoice.amount.toFixed(2)}
========================================

Payment Status: ${invoice.status === 'paid' ? 'PAID' : 'PENDING'}
${invoice.paidDate ? `Paid Date: ${invoice.paidDate}` : ''}

========================================
Thank you for your business!
========================================
 `.trim();
 
 // Send as downloadable text file
 res.setHeader('Content-Type', 'text/plain; charset=utf-8');
 res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.id}.txt"`);
 res.send(invoiceContent);
});

// ============== ACTIVITY ENDPOINT ==============
app.get('/api/activity', requireAuth, (req, res) => {
 const limit = parseInt(req.query.limit) || 50;
 res.json(activityLogs.slice(0, limit));
});

// ============== NOTIFICATIONS ENDPOINT ==============
app.get('/api/notifications', requireAuth, (req, res) => {
 const userNotifications = notifications
   .filter((n) => n.user_id === req.authUser.username || n.user_id === 'all')
   .map((n) => ({
     ...n,
     createdAt: n.createdAt || n.timestamp || new Date().toISOString(),
   }))
   .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
 res.json(userNotifications);
});

app.post('/api/notifications', requireAuth, requireRoles(['admin', 'dispatcher']), (req, res) => {
 const notification = {
   id: `notif-${Date.now()}`,
   user_id: req.body.user_id || 'all',
   type: req.body.type || 'info',
   title: req.body.title || 'Notification',
   message: req.body.message || '',
   read: false,
   created_at: new Date().toISOString(),
 };
 notifications.unshift(notification);
 return res.status(201).json(notification);
});

app.patch('/api/notifications/:id/read', requireAuth, (req, res) => {
 const index = notifications.findIndex((n) => n.id === req.params.id);
 if (index === -1) return res.status(404).json({ error: 'Notification not found' });
 notifications[index] = { ...notifications[index], read: true };
 return res.json(notifications[index]);
});

// ============== DASHBOARD SUMMARY ==============
app.get('/api/dashboard/summary', requireAuth, (req, res) => {
 const total = jobs.length;
 const newCount = jobs.filter((job) => job.status === 'new').length;
 const assignedCount = jobs.filter((job) => job.status === 'assigned').length;
 const inProgressCount = jobs.filter((job) => job.status === 'in-progress').length;
 const completedCount = jobs.filter((job) => job.status === 'completed').length;
 
 const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.amount || 0), 0);
 const pendingRevenue = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + (i.amount || 0), 0);

 res.json({
   totalJobs: total,
   newJobs: newCount,
   assignedJobs: assignedCount,
   inProgressJobs: inProgressCount,
   completedJobs: completedCount,
   totalCustomers: customers.length,
   totalInvoices: invoices.length,
   paidInvoices: invoices.filter(i => i.status === 'paid').length,
   pendingInvoices: invoices.filter(i => i.status === 'pending').length,
   totalRevenue,
   pendingRevenue,
   role: req.authUser.role,
   recentActivity: activityLogs.slice(0, 10)
 });
});

// ============== CLIENT PORTAL ENDPOINTS ==============
app.get('/api/client/jobs', requireAuth, (req, res) => {
 if (req.authUser.role !== 'client') return res.status(403).json({ error: 'Forbidden' });
 const clientJobs = jobs.filter((job) => job.customerId === req.authUser.id).map(normalizeJob);
 res.json(clientJobs);
});

app.get('/api/client/invoices', requireAuth, (req, res) => {
 if (req.authUser.role !== 'client') return res.status(403).json({ error: 'Forbidden' });
 const clientInvoices = invoices.filter((invoice) => invoice.customerId === req.authUser.id);
 res.json(clientInvoices);
});

app.post('/api/client/login', (req, res) => {
 const email = String(req.body.email || '').trim().toLowerCase();
 const password = String(req.body.password || '');
 
 // Simple client login - find customer by email
 const customer = customers.find(c => c.email.toLowerCase() === email);
 if (!customer) return res.status(401).json({ error: 'Invalid credentials' });
 
 // For demo, accept any password
 const token = crypto.randomBytes(24).toString('hex');
 sessions.set(token, { user: { id: customer.id, username: customer.name, role: 'client', email: customer.email }, createdAt: Date.now() });
 return res.json({ 
   token, 
   user: { id: customer.id, username: customer.name, role: 'client', email: customer.email }
 });
});

// ============== PLANNER API ENDPOINTS =============

// Get all projects
app.get('/api/projects', requireAuth, (req, res) => {
 res.json(projects);
});

// Create new project
app.post('/api/projects', requireAuth, requireRoles(['admin', 'dispatcher']), (req, res) => {
 const { title, description, start_date, end_date } = req.body;
 
 if (!title) return res.status(400).json({ error: 'Project title is required' });
 
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
 
 projects.push(newProject);
 logActivity('project', newProject.id, req.authUser.username, 'created', `Created project: ${title}`);
 res.status(201).json(newProject);
});

// Get single project
app.get('/api/projects/:id', requireAuth, (req, res) => {
 const project = projects.find(p => p.id === req.params.id);
 if (!project) return res.status(404).json({ error: 'Project not found' });
 res.json(project);
});

// Update project
app.put('/api/projects/:id', requireAuth, requireRoles(['admin', 'dispatcher']), (req, res) => {
 const project = projects.find(p => p.id === req.params.id);
 if (!project) return res.status(404).json({ error: 'Project not found' });
 
 const { title, description, start_date, end_date, status } = req.body;
 
 if (title) project.title = title;
 if (description !== undefined) project.description = description;
 if (start_date !== undefined) project.start_date = start_date;
 if (end_date !== undefined) project.end_date = end_date;
 if (status && req.authUser.role === 'admin') project.status = status;
 project.updated_at = new Date().toISOString();
 
 logActivity('project', project.id, req.authUser.username, 'updated', `Project ${project.title} updated`);
 res.json(project);
});

// Delete project
app.delete('/api/projects/:id', requireAuth, requireRoles(['admin']), (req, res) => {
 const index = projects.findIndex(p => p.id === req.params.id);
 if (index === -1) return res.status(404).json({ error: 'Project not found' });
 
 const project = projects[index];
 const taskIndices = tasks.map((t, i) => t.project_id === req.params.id ? i : -1).filter(i => i >= 0).reverse();
 taskIndices.forEach(i => tasks.splice(i, 1));
 
 projects.splice(index, 1);
 logActivity('project', project.id, req.authUser.username, 'deleted', `Project ${project.title} deleted`);
 res.json({ ok: true });
});

// Get tasks for a project
app.get('/api/projects/:id/tasks', requireAuth, (req, res) => {
 const projectTasks = tasks.filter(t => t.project_id === req.params.id);
 res.json(projectTasks);
});

// Compatibility endpoint for project-scoped task creation
app.post('/api/projects/:id/tasks', requireAuth, requireRoles(['admin', 'dispatcher']), (req, res) => {
 const project = projects.find((p) => p.id === req.params.id);
 if (!project) return res.status(404).json({ error: 'Project not found' });

 const name = String(req.body.name || '').trim();
 if (!name) return res.status(400).json({ error: 'Task name is required' });

 const progress = Number(req.body.progress_percent ?? req.body.progress ?? 0);
 const rawStatus = String(req.body.status || '').trim().toLowerCase().replace(/-/g, '_');
 const normalizedStatus = rawStatus === 'pending' ? 'not_started' : rawStatus;
 const startDate = req.body.start_date || req.body.startDate || null;
 const endDate = req.body.end_date || req.body.dueDate || null;

 const newTask = {
   id: `task-${Date.now()}`,
   project_id: req.params.id,
   parent_task_id: null,
   name,
   start_date: startDate,
   end_date: endDate,
   duration_days: calculateDuration(startDate, endDate),
   progress_percent: Math.min(100, Math.max(0, progress)),
   weight: Number(req.body.weight || 1),
   status: normalizedStatus || calculateTaskStatus(progress, endDate),
   sort_order: tasks.filter((t) => t.project_id === req.params.id).length + 1,
   notes: req.body.notes || req.body.description || '',
   assignee: req.body.assignee || req.body.assignedTo || '',
   estimated_cost: Number(req.body.estimated_cost || 0),
   actual_cost: Number(req.body.actual_cost || 0),
   dependency_ids: Array.isArray(req.body.dependency_ids) ? req.body.dependency_ids : [],
   is_milestone: Boolean(req.body.is_milestone),
   updated_by: req.authUser.username,
   updated_at: new Date().toISOString(),
 };

 tasks.push(newTask);
 recalculateProject(req.params.id);
 logActivity('task', newTask.id, req.authUser.username, 'created', `Created task: ${newTask.name}`);
 return res.status(201).json(newTask);
});

// Create task
app.post('/api/tasks', requireAuth, requireRoles(['admin', 'dispatcher']), (req, res) => {
 const { project_id, parent_task_id, name, start_date, end_date, progress_percent, weight, notes, sort_order, assignee, estimated_cost, actual_cost, dependency_ids, is_milestone } = req.body;
 
 if (!project_id || !name) {
   return res.status(400).json({ error: 'Project ID and task name are required' });
 }
 
 const project = projects.find(p => p.id === project_id);
 if (!project) return res.status(404).json({ error: 'Project not found' });
 
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
   sort_order: sort_order || tasks.length + 1,
   notes: notes || '',
   assignee: assignee || '',
   estimated_cost: estimated_cost || 0,
   actual_cost: actual_cost || 0,
   dependency_ids: dependency_ids || [],
   is_milestone: is_milestone || false,
   updated_by: req.authUser.username,
   updated_at: new Date().toISOString()
 };
 
 tasks.push(newTask);
 recalculateProject(project_id);
 logActivity('task', newTask.id, req.authUser.username, 'created', `Created task: ${name}`);
 res.status(201).json(newTask);
});

// Update task
app.put('/api/tasks/:id', requireAuth, requireRoles(['admin', 'dispatcher']), (req, res) => {
 const task = tasks.find(t => t.id === req.params.id);
 if (!task) return res.status(404).json({ error: 'Task not found' });
 
 const { name, parent_task_id, start_date, end_date, progress_percent, weight, notes, sort_order, assignee, estimated_cost, actual_cost, dependency_ids, is_milestone } = req.body;
 
 if (name !== undefined) task.name = name;
 if (parent_task_id !== undefined) task.parent_task_id = parent_task_id;
 if (start_date !== undefined) task.start_date = start_date;
 if (end_date !== undefined) task.end_date = end_date;
 if (progress_percent !== undefined) task.progress_percent = progress_percent;
 if (weight !== undefined) task.weight = weight;
 if (notes !== undefined) task.notes = notes;
 if (sort_order !== undefined) task.sort_order = sort_order;
 if (assignee !== undefined) task.assignee = assignee;
 if (estimated_cost !== undefined) task.estimated_cost = estimated_cost;
 if (actual_cost !== undefined) task.actual_cost = actual_cost;
 if (dependency_ids !== undefined) task.dependency_ids = dependency_ids;
 if (is_milestone !== undefined) task.is_milestone = is_milestone;
 
 task.duration_days = calculateDuration(task.start_date, task.end_date);
 task.status = calculateTaskStatus(task.progress_percent, task.end_date);
 task.updated_by = req.authUser.username;
 task.updated_at = new Date().toISOString();
 
 recalculateProject(task.project_id);
 logActivity('task', task.id, req.authUser.username, 'updated', `Task ${task.name} updated`);
 res.json(task);
});

// Delete task
app.delete('/api/tasks/:id', requireAuth, requireRoles(['admin']), (req, res) => {
 const task = tasks.find(t => t.id === req.params.id);
 if (!task) return res.status(404).json({ error: 'Task not found' });
 
 const projectId = task.project_id;
 
 const deleteChildren = (parentId) => {
   const children = tasks.filter(t => t.parent_task_id === parentId);
   children.forEach(child => deleteChildren(child.id));
   const index = tasks.findIndex(t => t.id === parentId);
   if (index >= 0) tasks.splice(index, 1);
 };
 
 deleteChildren(req.params.id);
 recalculateProject(projectId);
 logActivity('task', task.id, req.authUser.username, 'deleted', `Task ${task.name} deleted`);
 res.json({ ok: true });
});

// Update task progress
app.patch('/api/tasks/:id/progress', requireAuth, (req, res) => {
 const task = tasks.find(t => t.id === req.params.id);
 if (!task) return res.status(404).json({ error: 'Task not found' });
 
 const oldValue = task.progress_percent;
 task.progress_percent = Math.min(100, Math.max(0, req.body.progress_percent || 0));
 task.status = calculateTaskStatus(task.progress_percent, task.end_date);
 task.updated_by = req.authUser.username;
 task.updated_at = new Date().toISOString();
 
 recalculateProject(task.project_id);
 logActivity('task', task.id, req.authUser.username, 'progress_updated', `Task ${task.name} progress: ${oldValue}% → ${task.progress_percent}%`);
 res.json(task);
});

// Update task dates
app.patch('/api/tasks/:id/dates', requireAuth, requireRoles(['admin', 'dispatcher']), (req, res) => {
 const task = tasks.find(t => t.id === req.params.id);
 if (!task) return res.status(404).json({ error: 'Task not found' });
 
 const oldStart = task.start_date;
 const oldEnd = task.end_date;
 
 if (req.body.start_date !== undefined) task.start_date = req.body.start_date;
 if (req.body.end_date !== undefined) task.end_date = req.body.end_date;
 
 task.duration_days = calculateDuration(task.start_date, task.end_date);
 task.status = calculateTaskStatus(task.progress_percent, task.end_date);
 task.updated_by = req.authUser.username;
 task.updated_at = new Date().toISOString();
 
 recalculateProject(task.project_id);
 logActivity('task', task.id, req.authUser.username, 'dates_updated', 
   `Task ${task.name} dates updated: ${oldStart || 'N/A'} - ${oldEnd || 'N/A'} → ${task.start_date || 'N/A'} - ${task.end_date || 'N/A'}`);
 res.json(task);
});

// ============== TASK ATTENDANCE ENDPOINTS ==============

// POST /api/tasks/:id/start - Start task (set actualStart)
app.post('/api/tasks/:id/start', requireAuth, (req, res) => {
 const task = tasks.find(t => t.id === req.params.id);
 if (!task) return res.status(404).json({ error: 'Task not found' });
 
 // Check permission: admin/dispatcher or assigned technician
 const isAdminOrDispatcher = ['admin', 'dispatcher'].includes(req.authUser.role);
 const isAssignedTech = task.assignee === req.authUser.username;
 if (!isAdminOrDispatcher && !isAssignedTech) {
   return res.status(403).json({ error: 'Forbidden' });
 }
 
 // Cannot start if already completed
 if (task.status === 'completed') {
   return res.status(400).json({ error: 'Cannot start a completed task' });
 }
 
 // Set actual start time
 task.actualStart = new Date().toISOString();
 task.status = 'in_progress';
 task.updated_by = req.authUser.username;
 task.updated_at = new Date().toISOString();
 
 recalculateProject(task.project_id);
 logActivity('task', task.id, req.authUser.username, 'started', `Task "${task.name}" started`);
 res.json(task);
});

// POST /api/tasks/:id/pause - Pause task
app.post('/api/tasks/:id/pause', requireAuth, (req, res) => {
 const task = tasks.find(t => t.id === req.params.id);
 if (!task) return res.status(404).json({ error: 'Task not found' });
 
 // Check permission: admin/dispatcher or assigned technician
 const isAdminOrDispatcher = ['admin', 'dispatcher'].includes(req.authUser.role);
 const isAssignedTech = task.assignee === req.authUser.username;
 if (!isAdminOrDispatcher && !isAssignedTech) {
   return res.status(403).json({ error: 'Forbidden' });
 }
 
 // Can only pause if in progress
 if (task.status !== 'in_progress') {
   return res.status(400).json({ error: 'Can only pause tasks that are in progress' });
 }
 
 task.status = 'paused';
 task.updated_by = req.authUser.username;
 task.updated_at = new Date().toISOString();
 
 recalculateProject(task.project_id);
 logActivity('task', task.id, req.authUser.username, 'paused', `Task "${task.name}" paused`);
 res.json(task);
});

// POST /api/tasks/:id/resume - Resume task
app.post('/api/tasks/:id/resume', requireAuth, (req, res) => {
 const task = tasks.find(t => t.id === req.params.id);
 if (!task) return res.status(404).json({ error: 'Task not found' });
 
 // Check permission: admin/dispatcher or assigned technician
 const isAdminOrDispatcher = ['admin', 'dispatcher'].includes(req.authUser.role);
 const isAssignedTech = task.assignee === req.authUser.username;
 if (!isAdminOrDispatcher && !isAssignedTech) {
   return res.status(403).json({ error: 'Forbidden' });
 }
 
 // Can only resume if paused
 if (task.status !== 'paused') {
   return res.status(400).json({ error: 'Can only resume paused tasks' });
 }
 
 task.status = 'in_progress';
 task.updated_by = req.authUser.username;
 task.updated_at = new Date().toISOString();
 
 recalculateProject(task.project_id);
 logActivity('task', task.id, req.authUser.username, 'resumed', `Task "${task.name}" resumed`);
 res.json(task);
});

// POST /api/tasks/:id/finish - Finish task (set actualEnd, mark completed)
app.post('/api/tasks/:id/finish', requireAuth, (req, res) => {
 const task = tasks.find(t => t.id === req.params.id);
 if (!task) return res.status(404).json({ error: 'Task not found' });
 
 // Check permission: admin/dispatcher or assigned technician
 const isAdminOrDispatcher = ['admin', 'dispatcher'].includes(req.authUser.role);
 const isAssignedTech = task.assignee === req.authUser.username;
 if (!isAdminOrDispatcher && !isAssignedTech) {
   return res.status(403).json({ error: 'Forbidden' });
 }
 
 // Cannot finish if already completed
 if (task.status === 'completed') {
   return res.status(400).json({ error: 'Task already completed' });
 }
 
 // Set actual end time and mark as completed
 task.actualEnd = new Date().toISOString();
 task.progress_percent = 100;
 task.status = 'completed';
 task.updated_by = req.authUser.username;
 task.updated_at = new Date().toISOString();
 
 recalculateProject(task.project_id);
 logActivity('task', task.id, req.authUser.username, 'finished', `Task "${task.name}" completed`);
 res.json(task);
});

// Get planner timeline data
app.get('/api/projects/:id/planner', requireAuth, (req, res) => {
 const project = projects.find(p => p.id === req.params.id);
 if (!project) return res.status(404).json({ error: 'Project not found' });
 
 const projectTasks = tasks.filter(t => t.project_id === req.params.id);
 
 // Normalize task statuses for consistent filtering
 const normalizeStatus = (status) => {
   if (!status) return 'not_started';
   const s = String(status).trim().toLowerCase();
   if (s === 'completed') return 'completed';
   if (s === 'in_progress' || s === 'in-progress') return 'in_progress';
   if (s === 'delayed') return 'delayed';
   return 'not_started';
 };
 
 const summary = {
   total: projectTasks.length,
   completed: projectTasks.filter(t => normalizeStatus(t.status) === 'completed').length,
   inProgress: projectTasks.filter(t => normalizeStatus(t.status) === 'in_progress').length,
   delayed: projectTasks.filter(t => normalizeStatus(t.status) === 'delayed').length,
   notStarted: projectTasks.filter(t => normalizeStatus(t.status) === 'not_started').length,
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
   progressContribution: calculateTaskContribution(task)
 }));
 
 res.json({ project, tasks: timelineData, summary });
});

const csvValue = (value) => {
 if (value === null || value === undefined) return '';
 const raw = String(value);
 if (/[",\n]/.test(raw)) {
   return `"${raw.replace(/"/g, '""')}"`;
 }
 return raw;
};

const toCsv = (rows, columns) => {
 const header = columns.map((c) => csvValue(c.label)).join(',');
 const lines = rows.map((row) => columns.map((c) => csvValue(row[c.key])).join(','));
 return [header, ...lines].join('\n');
};

app.get('/api/export/jobs', requireAuth, requireRoles(['admin', 'dispatcher']), (req, res) => {
 const rows = jobs.map((job) => {
   const customer = customers.find((c) => c.id === job.customerId);
   return {
     id: job.id,
     title: job.title,
     status: job.status,
     priority: job.priority,
     assignedTo: job.assignedTo || '',
     customer: customer ? customer.name : '',
     location: job.location || '',
     scheduledDate: job.scheduledDate || '',
     category: job.category || '',
     notes: job.notes || '',
     createdAt: job.created_at || '',
     checkinTime: job.checkinTime || '',
     checkoutTime: job.checkoutTime || '',
   };
 });

 const csv = toCsv(rows, [
   { key: 'id', label: 'Job ID' },
   { key: 'title', label: 'Title' },
   { key: 'status', label: 'Status' },
   { key: 'priority', label: 'Priority' },
   { key: 'assignedTo', label: 'Assigned To' },
   { key: 'customer', label: 'Customer' },
   { key: 'location', label: 'Location' },
   { key: 'scheduledDate', label: 'Scheduled Date' },
   { key: 'category', label: 'Category' },
   { key: 'notes', label: 'Notes' },
   { key: 'createdAt', label: 'Created At' },
   { key: 'checkinTime', label: 'Check-in Time' },
   { key: 'checkoutTime', label: 'Checkout Time' },
 ]);

 res.setHeader('Content-Type', 'text/csv; charset=utf-8');
 res.setHeader('Content-Disposition', `attachment; filename="jobs-export-${new Date().toISOString().slice(0, 10)}.csv"`);
 return res.send(csv);
});

app.get('/api/export/customers', requireAuth, requireRoles(['admin', 'dispatcher']), (req, res) => {
 const rows = customers.map((customer) => ({
   id: customer.id,
   name: customer.name,
   email: customer.email || '',
   phone: customer.phone || '',
   address: customer.address || '',
   createdAt: customer.created_at || '',
 }));

 const csv = toCsv(rows, [
   { key: 'id', label: 'Customer ID' },
   { key: 'name', label: 'Name' },
   { key: 'email', label: 'Email' },
   { key: 'phone', label: 'Phone' },
   { key: 'address', label: 'Address' },
   { key: 'createdAt', label: 'Created At' },
 ]);

 res.setHeader('Content-Type', 'text/csv; charset=utf-8');
 res.setHeader('Content-Disposition', `attachment; filename="customers-export-${new Date().toISOString().slice(0, 10)}.csv"`);
 return res.send(csv);
});

// ============== INVENTORY API ENDPOINTS =============

// Get all inventory items
app.get('/api/inventory', requireAuth, (req, res) => {
 res.json(inventory);
});

// Get single inventory item
app.get('/api/inventory/:id', requireAuth, (req, res) => {
 const item = inventory.find(i => i.id === req.params.id);
 if (!item) return res.status(404).json({ error: 'Inventory item not found' });
 res.json(item);
});

// Create inventory item
app.post('/api/inventory', requireAuth, requireRoles(['admin', 'dispatcher']), (req, res) => {
 const { name, sku, category, quantity, unit_price, reorder_level, location, supplier } = req.body;
 
 if (!name) return res.status(400).json({ error: 'Item name is required' });
 
 const newItem = {
   id: `INV-${String(inventory.length + 1).padStart(3, '0')}`,
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
 
 inventory.push(newItem);
 logActivity('inventory', newItem.id, req.authUser.username, 'created', `Added inventory item: ${name}`);
 res.status(201).json(newItem);
});

// Update inventory item
app.put('/api/inventory/:id', requireAuth, requireRoles(['admin', 'dispatcher']), (req, res) => {
 const item = inventory.find(i => i.id === req.params.id);
 if (!item) return res.status(404).json({ error: 'Inventory item not found' });
 
 const { name, sku, category, quantity, unit_price, reorder_level, location, supplier } = req.body;
 
 if (name !== undefined) item.name = name;
 if (sku !== undefined) item.sku = sku;
 if (category !== undefined) item.category = category;
 if (quantity !== undefined) item.quantity = parseInt(quantity);
 if (unit_price !== undefined) item.unit_price = parseFloat(unit_price);
 if (reorder_level !== undefined) item.reorder_level = parseInt(reorder_level);
 if (location !== undefined) item.location = location;
 if (supplier !== undefined) item.supplier = supplier;
 
 logActivity('inventory', item.id, req.authUser.username, 'updated', `Updated inventory item: ${item.name}`);
 res.json(item);
});

// Delete inventory item
app.delete('/api/inventory/:id', requireAuth, requireRoles(['admin']), (req, res) => {
 const index = inventory.findIndex(i => i.id === req.params.id);
 if (index === -1) return res.status(404).json({ error: 'Inventory item not found' });
 
 const item = inventory[index];
 inventory.splice(index, 1);
 logActivity('inventory', item.id, req.authUser.username, 'deleted', `Deleted inventory item: ${item.name}`);
 res.json({ ok: true });
});

// Get low stock items
app.get('/api/inventory/low-stock', requireAuth, (req, res) => {
 const lowStock = inventory.filter(item => item.quantity <= item.reorder_level);
 res.json(lowStock);
});

// ============== EQUIPMENT API ENDPOINTS =============

// Get all equipment
app.get('/api/equipment', requireAuth, (req, res) => {
 res.json(equipment);
});

// Get equipment by customer
app.get('/api/equipment/customer/:customerId', requireAuth, (req, res) => {
 const customerEquipment = equipment.filter(e => e.customerId === req.params.customerId);
 res.json(customerEquipment);
});

// Get single equipment
app.get('/api/equipment/:id', requireAuth, (req, res) => {
 const item = equipment.find(e => e.id === req.params.id);
 if (!item) return res.status(404).json({ error: 'Equipment not found' });
 res.json(item);
});

// Create equipment
app.post('/api/equipment', requireAuth, requireRoles(['admin', 'dispatcher']), (req, res) => {
 const { name, type, customerId, location, serial_number, install_date, status, notes } = req.body;
 
 if (!name) return res.status(400).json({ error: 'Equipment name is required' });
 
 const newEquipment = {
   id: `EQP-${String(equipment.length + 1).padStart(3, '0')}`,
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
 
 equipment.push(newEquipment);
 logActivity('equipment', newEquipment.id, req.authUser.username, 'created', `Added equipment: ${name}`);
 res.status(201).json(newEquipment);
});

// Update equipment
app.put('/api/equipment/:id', requireAuth, requireRoles(['admin', 'dispatcher']), (req, res) => {
 const item = equipment.find(e => e.id === req.params.id);
 if (!item) return res.status(404).json({ error: 'Equipment not found' });
 
 const { name, type, customerId, location, serial_number, install_date, status, notes } = req.body;
 
 if (name !== undefined) item.name = name;
 if (type !== undefined) item.type = type;
 if (customerId !== undefined) item.customerId = customerId;
 if (location !== undefined) item.location = location;
 if (serial_number !== undefined) item.serial_number = serial_number;
 if (install_date !== undefined) item.install_date = install_date;
 if (status !== undefined) item.status = status;
 if (notes !== undefined) item.notes = notes;
 
 logActivity('equipment', item.id, req.authUser.username, 'updated', `Updated equipment: ${item.name}`);
 res.json(item);
});

// Delete equipment
app.delete('/api/equipment/:id', requireAuth, requireRoles(['admin']), (req, res) => {
 const index = equipment.findIndex(e => e.id === req.params.id);
 if (index === -1) return res.status(404).json({ error: 'Equipment not found' });
 
 const item = equipment[index];
 equipment.splice(index, 1);
 logActivity('equipment', item.id, req.authUser.username, 'deleted', `Deleted equipment: ${item.name}`);
 res.json({ ok: true });
});

// Get equipment needing maintenance
app.get('/api/equipment/maintenance', requireAuth, (req, res) => {
 const needsMaintenance = equipment.filter(e => e.status === 'needs_maintenance' || e.status === 'out_of_service');
 res.json(needsMaintenance);
});

// ============== QUOTES API ENDPOINTS =============

// Get all quotes
app.get('/api/quotes', requireAuth, (req, res) => {
 res.json(quotes);
});

// Get quote by customer
app.get('/api/quotes/customer/:customerId', requireAuth, (req, res) => {
 const customerQuotes = quotes.filter(q => q.customerId === req.params.customerId);
 res.json(customerQuotes);
});

// Get single quote
app.get('/api/quotes/:id', requireAuth, (req, res) => {
 const quote = quotes.find(q => q.id === req.params.id);
 if (!quote) return res.status(404).json({ error: 'Quote not found' });
 res.json(quote);
});

// Create quote
app.post('/api/quotes', requireAuth, requireRoles(['admin', 'dispatcher']), (req, res) => {
 const { customerId, title, description, total_amount, valid_until, items } = req.body;
 
 if (!customerId || !title) return res.status(400).json({ error: 'Customer ID and title are required' });
 
 const year = new Date().getFullYear();
 const nextNum = quotes.length + 1;
 
 const newQuote = {
   id: `QUO-${year}-${String(nextNum).padStart(3, '0')}`,
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
 
 quotes.push(newQuote);
 logActivity('quote', newQuote.id, req.authUser.username, 'created', `Created quote: ${title}`);
 res.status(201).json(newQuote);
});

// Update quote
app.put('/api/quotes/:id', requireAuth, requireRoles(['admin', 'dispatcher']), (req, res) => {
 const quote = quotes.find(q => q.id === req.params.id);
 if (!quote) return res.status(404).json({ error: 'Quote not found' });
 
 const { title, description, total_amount, valid_until, items } = req.body;
 
 if (title !== undefined) quote.title = title;
 if (description !== undefined) quote.description = description;
 if (total_amount !== undefined) quote.total_amount = parseFloat(total_amount);
 if (valid_until !== undefined) quote.valid_until = valid_until;
 if (items !== undefined) quote.items = items;
 
 logActivity('quote', quote.id, req.authUser.username, 'updated', `Updated quote: ${quote.title}`);
 res.json(quote);
});

// Accept quote
app.post('/api/quotes/:id/accept', requireAuth, (req, res) => {
 const quote = quotes.find(q => q.id === req.params.id);
 if (!quote) return res.status(404).json({ error: 'Quote not found' });
 
 quote.status = 'accepted';
 quote.accepted_at = new Date().toISOString();
 
 logActivity('quote', quote.id, req.authUser.username, 'accepted', `Quote accepted: ${quote.title}`);
 res.json(quote);
});

// Reject quote
app.post('/api/quotes/:id/reject', requireAuth, (req, res) => {
 const quote = quotes.find(q => q.id === req.params.id);
 if (!quote) return res.status(404).json({ error: 'Quote not found' });
 
 quote.status = 'rejected';
 quote.rejected_at = new Date().toISOString();
 
 logActivity('quote', quote.id, req.authUser.username, 'rejected', `Quote rejected: ${quote.title}`);
 res.json(quote);
});

// Delete quote
app.delete('/api/quotes/:id', requireAuth, requireRoles(['admin']), (req, res) => {
 const index = quotes.findIndex(q => q.id === req.params.id);
 if (index === -1) return res.status(404).json({ error: 'Quote not found' });
 
 const quote = quotes[index];
 quotes.splice(index, 1);
 logActivity('quote', quote.id, req.authUser.username, 'deleted', `Deleted quote: ${quote.title}`);
 res.json({ ok: true });
});

// Convert quote to job
app.post('/api/quotes/:id/convert', requireAuth, requireRoles(['admin', 'dispatcher']), (req, res) => {
 const quote = quotes.find(q => q.id === req.params.id);
 if (!quote) return res.status(404).json({ error: 'Quote not found' });
 if (quote.status !== 'accepted') return res.status(400).json({ error: 'Only accepted quotes can be converted to jobs' });
 
 // Create a job from the quote
 const job = {
   id: nextJobId(),
   title: quote.title,
   description: quote.description,
   status: 'assigned',
   priority: 'medium',
   assignedTo: req.body.assignedTo || '',
   location: req.body.location || '',
   customerId: quote.customerId,
   scheduledDate: req.body.scheduledDate || '',
   category: 'installation',
   notes: `Created from quote: ${quote.id}`,
   created_at: new Date().toISOString(),
   updated_at: new Date().toISOString(),
   partsUsed: [],
   materialsUsed: [],
   worklog: [],
   technicianNotes: '',
   completionNotes: '',
   projectId: null,
   taskId: null
 };
 
 jobs.unshift(normalizeJob(job));
 quote.jobId = job.id;
 
 logActivity('job', job.id, req.authUser.username, 'created', `Created job from quote ${quote.id}: ${job.title}`);
 res.status(201).json({ job, quote });
});

// ============== RECURRING JOBS API ENDPOINTS =============

// Get all recurring jobs
app.get('/api/recurring', requireAuth, (req, res) => {
 res.json(recurringJobs);
});

// Get recurring job by customer
app.get('/api/recurring/customer/:customerId', requireAuth, (req, res) => {
 const customerRecurring = recurringJobs.filter(r => r.customerId === req.params.customerId);
 res.json(customerRecurring);
});

// Get single recurring job
app.get('/api/recurring/:id', requireAuth, (req, res) => {
 const recurring = recurringJobs.find(r => r.id === req.params.id);
 if (!recurring) return res.status(404).json({ error: 'Recurring job not found' });
 res.json(recurring);
});

// Create recurring job
app.post('/api/recurring', requireAuth, requireRoles(['admin', 'dispatcher']), (req, res) => {
 const { customerId, title, description, frequency, interval_value, interval_unit, start_date, end_date, assignedTo, category, priority, estimated_duration_hours } = req.body;
 
 if (!customerId || !title || !frequency) return res.status(400).json({ error: 'Customer ID, title, and frequency are required' });
 
 const newRecurring = {
   id: `REC-${String(recurringJobs.length + 1).padStart(3, '0')}`,
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
 
 recurringJobs.push(newRecurring);
 logActivity('recurring', newRecurring.id, req.authUser.username, 'created', `Created recurring job: ${title}`);
 res.status(201).json(newRecurring);
});

// Update recurring job
app.put('/api/recurring/:id', requireAuth, requireRoles(['admin', 'dispatcher']), (req, res) => {
 const recurring = recurringJobs.find(r => r.id === req.params.id);
 if (!recurring) return res.status(404).json({ error: 'Recurring job not found' });
 
 const { title, description, frequency, interval_value, interval_unit, start_date, end_date, status, assignedTo, category, priority, estimated_duration_hours } = req.body;
 
 if (title !== undefined) recurring.title = title;
 if (description !== undefined) recurring.description = description;
 if (frequency !== undefined) recurring.frequency = frequency;
 if (interval_value !== undefined) recurring.interval_value = interval_value;
 if (interval_unit !== undefined) recurring.interval_unit = interval_unit;
 if (start_date !== undefined) recurring.start_date = start_date;
 if (end_date !== undefined) recurring.end_date = end_date;
 if (status !== undefined) recurring.status = status;
 if (assignedTo !== undefined) recurring.assignedTo = assignedTo;
 if (category !== undefined) recurring.category = category;
 if (priority !== undefined) recurring.priority = priority;
 if (estimated_duration_hours !== undefined) recurring.estimated_duration_hours = estimated_duration_hours;
 
 logActivity('recurring', recurring.id, req.authUser.username, 'updated', `Updated recurring job: ${recurring.title}`);
 res.json(recurring);
});

// Delete recurring job
app.delete('/api/recurring/:id', requireAuth, requireRoles(['admin']), (req, res) => {
 const index = recurringJobs.findIndex(r => r.id === req.params.id);
 if (index === -1) return res.status(404).json({ error: 'Recurring job not found' });
 
 const recurring = recurringJobs[index];
 recurringJobs.splice(index, 1);
 logActivity('recurring', recurring.id, req.authUser.username, 'deleted', `Deleted recurring job: ${recurring.title}`);
 res.json({ ok: true });
});

// Pause recurring job
app.post('/api/recurring/:id/pause', requireAuth, requireRoles(['admin', 'dispatcher']), (req, res) => {
 const recurring = recurringJobs.find(r => r.id === req.params.id);
 if (!recurring) return res.status(404).json({ error: 'Recurring job not found' });
 
 recurring.status = 'paused';
 logActivity('recurring', recurring.id, req.authUser.username, 'paused', `Paused recurring job: ${recurring.title}`);
 res.json(recurring);
});

// Resume recurring job
app.post('/api/recurring/:id/resume', requireAuth, requireRoles(['admin', 'dispatcher']), (req, res) => {
 const recurring = recurringJobs.find(r => r.id === req.params.id);
 if (!recurring) return res.status(404).json({ error: 'Recurring job not found' });
 
 recurring.status = 'active';
 logActivity('recurring', recurring.id, req.authUser.username, 'resumed', `Resumed recurring job: ${recurring.title}`);
 res.json(recurring);
});

// Generate next job from recurring
app.post('/api/recurring/:id/generate', requireAuth, requireRoles(['admin', 'dispatcher']), (req, res) => {
 const recurring = recurringJobs.find(r => r.id === req.params.id);
 if (!recurring) return res.status(404).json({ error: 'Recurring job not found' });
 if (recurring.status !== 'active') return res.status(400).json({ error: 'Recurring job is not active' });
 
 const now = new Date();
 let nextDate = new Date(recurring.start_date);
 
 // Calculate next occurrence based on frequency
 if (recurring.interval_unit === 'days') {
   nextDate.setDate(nextDate.getDate() + recurring.interval_value);
 } else if (recurring.interval_unit === 'weeks') {
   nextDate.setDate(nextDate.getDate() + (recurring.interval_value * 7));
 } else if (recurring.interval_unit === 'months') {
   nextDate.setMonth(nextDate.getMonth() + recurring.interval_value);
 } else if (recurring.interval_unit === 'years') {
   nextDate.setFullYear(nextDate.getFullYear() + recurring.interval_value);
 }
 
 const job = {
   id: nextJobId(),
   title: recurring.title,
   description: recurring.description,
   status: recurring.assignedTo ? 'assigned' : 'new',
   priority: recurring.priority,
   assignedTo: recurring.assignedTo,
   location: req.body.location || '',
   customerId: recurring.customerId,
   scheduledDate: req.body.scheduledDate || nextDate.toISOString().split('T')[0],
   category: recurring.category,
   notes: `Generated from recurring job: ${recurring.id}`,
   created_at: new Date().toISOString(),
   updated_at: new Date().toISOString(),
   partsUsed: [],
   materialsUsed: [],
   worklog: [],
   technicianNotes: '',
   completionNotes: '',
   projectId: null,
   taskId: null
 };
 
 jobs.unshift(normalizeJob(job));
 logActivity('job', job.id, req.authUser.username, 'created', `Generated job from recurring: ${job.title}`);
 res.status(201).json(job);
});

// Initialize database and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`App 2 backend running on http://localhost:${PORT}`);
  });
});
