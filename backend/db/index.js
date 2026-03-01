const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const asJson = (value, fallback) => {
  if (value === null || value === undefined || value === '') return fallback;
  try {
    return JSON.parse(value);
  } catch (_) {
    return fallback;
  }
};

const nowIso = () => new Date().toISOString();

const openDatabase = (baseDir) => {
  const dataDir = path.join(baseDir, 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, 'app.db');
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON;');
  return db;
};

const runMigrations = (db, baseDir) => {
  const migrationsDir = path.join(baseDir, 'db', 'migrations');
  fs.mkdirSync(migrationsDir, { recursive: true });

  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const hasMigrationStmt = db.prepare('SELECT 1 FROM schema_migrations WHERE id = ? LIMIT 1');
  const insertMigrationStmt = db.prepare('INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)');

  for (const file of files) {
    const exists = hasMigrationStmt.get(file);
    if (exists) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    db.exec(sql);
    insertMigrationStmt.run(file, nowIso());
  }
};

const countRows = (db, table) => {
  const row = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
  return Number(row.count || 0);
};

const mapJobFromRow = (row, photosByJob, worklogByJob) => ({
  id: row.id,
  title: row.title,
  status: row.status,
  priority: row.priority,
  assignedTo: row.assigned_to || '',
  location: row.location || '',
  customerId: row.customer_id || '',
  scheduledDate: row.scheduled_date || '',
  category: row.category || 'general',
  notes: row.notes || '',
  technicianNotes: row.technician_notes || '',
  completionNotes: row.completion_notes || '',
  checkinTime: row.checkin_time || null,
  checkoutTime: row.checkout_time || null,
  projectId: row.project_id || null,
  taskId: row.task_id || null,
  partsUsed: asJson(row.parts_used_json, []),
  materialsUsed: asJson(row.materials_used_json, []),
  created_at: row.created_at,
  updated_at: row.updated_at,
  photos: photosByJob.get(row.id) || [],
  worklog: worklogByJob.get(row.id) || [],
});

const createDb = (baseDir) => {
  const db = openDatabase(baseDir);
  runMigrations(db, baseDir);

  const stmts = {
    upsertUser: db.prepare(`
      INSERT INTO users (id, username, password, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        username=excluded.username,
        password=excluded.password,
        role=excluded.role,
        updated_at=excluded.updated_at
    `),
    upsertCustomer: db.prepare(`
      INSERT INTO customers (id, name, email, phone, address, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name,
        email=excluded.email,
        phone=excluded.phone,
        address=excluded.address,
        updated_at=excluded.updated_at
    `),
    deleteCustomer: db.prepare('DELETE FROM customers WHERE id = ?'),
    upsertJob: db.prepare(`
      INSERT INTO jobs (
        id, title, status, priority, assigned_to, location, customer_id, scheduled_date,
        category, notes, technician_notes, completion_notes, checkin_time, checkout_time,
        project_id, task_id, parts_used_json, materials_used_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title=excluded.title,
        status=excluded.status,
        priority=excluded.priority,
        assigned_to=excluded.assigned_to,
        location=excluded.location,
        customer_id=excluded.customer_id,
        scheduled_date=excluded.scheduled_date,
        category=excluded.category,
        notes=excluded.notes,
        technician_notes=excluded.technician_notes,
        completion_notes=excluded.completion_notes,
        checkin_time=excluded.checkin_time,
        checkout_time=excluded.checkout_time,
        project_id=excluded.project_id,
        task_id=excluded.task_id,
        parts_used_json=excluded.parts_used_json,
        materials_used_json=excluded.materials_used_json,
        updated_at=excluded.updated_at
    `),
    deleteJobPhotosByJobId: db.prepare('DELETE FROM job_photos WHERE job_id = ?'),
    insertJobPhoto: db.prepare(`
      INSERT INTO job_photos (id, job_id, data, mime_type, uploaded_by, uploaded_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        job_id=excluded.job_id,
        data=excluded.data,
        mime_type=excluded.mime_type,
        uploaded_by=excluded.uploaded_by,
        uploaded_at=excluded.uploaded_at
    `),
    deleteJobWorklogByJobId: db.prepare('DELETE FROM job_worklogs WHERE job_id = ?'),
    insertJobWorklog: db.prepare(`
      INSERT INTO job_worklogs (job_id, at, by_user, technician_notes, parts_used_json, materials_used_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `),
    upsertInvoice: db.prepare(`
      INSERT INTO invoices (id, job_id, customer_id, amount, status, issued_date, paid_date, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        job_id=excluded.job_id,
        customer_id=excluded.customer_id,
        amount=excluded.amount,
        status=excluded.status,
        issued_date=excluded.issued_date,
        paid_date=excluded.paid_date,
        description=excluded.description,
        updated_at=excluded.updated_at
    `),
    upsertSession: db.prepare(`
      INSERT INTO sessions (token, user_id, user_json, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(token) DO UPDATE SET
        user_id=excluded.user_id,
        user_json=excluded.user_json,
        created_at=excluded.created_at,
        expires_at=excluded.expires_at
    `),
    deleteSession: db.prepare('DELETE FROM sessions WHERE token = ?'),
    
    // Projects statements
    upsertProject: db.prepare(`
      INSERT INTO projects (id, title, description, start_date, end_date, status, overall_progress, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title=excluded.title,
        description=excluded.description,
        start_date=excluded.start_date,
        end_date=excluded.end_date,
        status=excluded.status,
        overall_progress=excluded.overall_progress,
        created_by=excluded.created_by,
        updated_at=excluded.updated_at
    `),
    deleteProject: db.prepare('DELETE FROM projects WHERE id = ?'),
    
    // Tasks statements
    upsertTask: db.prepare(`
      INSERT INTO tasks (id, project_id, parent_task_id, name, start_date, end_date, duration_days, progress_percent, weight, status, sort_order, notes, updated_by, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        project_id=excluded.project_id,
        parent_task_id=excluded.parent_task_id,
        name=excluded.name,
        start_date=excluded.start_date,
        end_date=excluded.end_date,
        duration_days=excluded.duration_days,
        progress_percent=excluded.progress_percent,
        weight=excluded.weight,
        status=excluded.status,
        sort_order=excluded.sort_order,
        notes=excluded.notes,
        updated_by=excluded.updated_by,
        updated_at=excluded.updated_at
    `),
    deleteTask: db.prepare('DELETE FROM tasks WHERE id = ?'),
    deleteTasksByProjectId: db.prepare('DELETE FROM tasks WHERE project_id = ?'),
    
    // Activity logs statements
    insertActivityLog: db.prepare(`
      INSERT INTO activity_logs (id, entity_type, entity_id, user_id, action, description, old_value, new_value, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    
    // Notifications statements
    upsertNotification: db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        user_id=excluded.user_id,
        type=excluded.type,
        title=excluded.title,
        message=excluded.message,
        read=excluded.read,
        created_at=excluded.created_at
    `),
    markNotificationRead: db.prepare('UPDATE notifications SET read = 1 WHERE id = ?'),
  };

  const bootstrap = ({ users, customers, jobs, invoices, projects, tasks, activityLogs, notifications }) => {
    if (countRows(db, 'users') === 0 && Array.isArray(users)) {
      const ts = nowIso();
      for (const user of users) {
        stmts.upsertUser.run(user.id, user.username, user.password, user.role, ts, ts);
      }
    }

    if (countRows(db, 'customers') === 0 && Array.isArray(customers)) {
      for (const customer of customers) {
        const createdAt = customer.created_at || nowIso();
        const updatedAt = customer.updated_at || createdAt;
        stmts.upsertCustomer.run(
          customer.id,
          customer.name,
          customer.email || '',
          customer.phone || '',
          customer.address || '',
          createdAt,
          updatedAt,
        );
      }
    }

    if (countRows(db, 'jobs') === 0 && Array.isArray(jobs)) {
      for (const job of jobs) {
        const createdAt = job.created_at || nowIso();
        const updatedAt = job.updated_at || createdAt;
        stmts.upsertJob.run(
          job.id,
          job.title,
          job.status || 'new',
          job.priority || 'medium',
          job.assignedTo || '',
          job.location || '',
          job.customerId || '',
          job.scheduledDate || '',
          job.category || 'general',
          job.notes || '',
          job.technicianNotes || '',
          job.completionNotes || '',
          job.checkinTime || null,
          job.checkoutTime || null,
          job.projectId || null,
          job.taskId || null,
          JSON.stringify(Array.isArray(job.partsUsed) ? job.partsUsed : []),
          JSON.stringify(Array.isArray(job.materialsUsed) ? job.materialsUsed : []),
          createdAt,
          updatedAt,
        );

        if (Array.isArray(job.photos)) {
          for (const photo of job.photos) {
            const photoId = String(photo.id || `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
            stmts.insertJobPhoto.run(
              photoId,
              job.id,
              photo.data || photo,
              photo.mimeType || '',
              photo.uploadedBy || '',
              photo.uploadedAt || createdAt,
            );
          }
        }

        if (Array.isArray(job.worklog)) {
          for (const entry of job.worklog) {
            stmts.insertJobWorklog.run(
              job.id,
              entry.at || createdAt,
              entry.by || 'system',
              entry.technicianNotes || '',
              JSON.stringify(Array.isArray(entry.partsUsed) ? entry.partsUsed : []),
              JSON.stringify(Array.isArray(entry.materialsUsed) ? entry.materialsUsed : []),
            );
          }
        }
      }
    }

    if (countRows(db, 'invoices') === 0 && Array.isArray(invoices)) {
      for (const invoice of invoices) {
        const createdAt = invoice.created_at || nowIso();
        const updatedAt = invoice.updated_at || createdAt;
        stmts.upsertInvoice.run(
          invoice.id,
          invoice.jobId || '',
          invoice.customerId || '',
          Number(invoice.amount || 0),
          invoice.status || 'pending',
          invoice.issuedDate || '',
          invoice.paidDate || null,
          invoice.description || '',
          createdAt,
          updatedAt,
        );
      }
    }

    // Bootstrap Projects
    if (countRows(db, 'projects') === 0 && Array.isArray(projects)) {
      for (const project of projects) {
        const createdAt = project.created_at || nowIso();
        const updatedAt = project.updated_at || createdAt;
        stmts.upsertProject.run(
          project.id,
          project.title || '',
          project.description || '',
          project.start_date || null,
          project.end_date || null,
          project.status || 'planning',
          Number(project.overall_progress || 0),
          project.created_by || '',
          createdAt,
          updatedAt,
        );
      }
    }

    // Bootstrap Tasks
    if (countRows(db, 'tasks') === 0 && Array.isArray(tasks)) {
      for (const task of tasks) {
        const updatedAt = task.updated_at || nowIso();
        stmts.upsertTask.run(
          task.id,
          task.project_id || '',
          task.parent_task_id || null,
          task.name || '',
          task.start_date || null,
          task.end_date || null,
          Number(task.duration_days || 0),
          Number(task.progress_percent || 0),
          Number(task.weight || 1),
          task.status || 'not_started',
          Number(task.sort_order || 0),
          task.notes || '',
          task.updated_by || '',
          updatedAt,
        );
      }
    }

    // Bootstrap Activity Logs
    if (countRows(db, 'activity_logs') === 0 && Array.isArray(activityLogs)) {
      for (const log of activityLogs) {
        stmts.insertActivityLog.run(
          log.id,
          log.entity_type || '',
          log.entity_id || '',
          log.user_id || '',
          log.action || '',
          log.description || '',
          log.old_value || null,
          log.new_value || null,
          log.timestamp || nowIso(),
        );
      }
    }

    // Bootstrap Notifications
    if (countRows(db, 'notifications') === 0 && Array.isArray(notifications)) {
      for (const notif of notifications) {
        stmts.upsertNotification.run(
          notif.id,
          notif.user_id || 'all',
          notif.type || 'info',
          notif.title || '',
          notif.message || '',
          notif.read ? 1 : 0,
          notif.created_at || notif.timestamp || nowIso(),
        );
      }
    }

    return {
      users: loadUsers(),
      customers: loadCustomers(),
      jobs: loadJobs(),
      invoices: loadInvoices(),
    };
  };

  const loadUsers = () => db.prepare('SELECT id, username, password, role FROM users ORDER BY username').all();

  const loadCustomers = () => db.prepare(`
    SELECT id, name, email, phone, address, created_at, updated_at
    FROM customers
    ORDER BY name
  `).all().map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email || '',
    phone: row.phone || '',
    address: row.address || '',
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  const loadJobs = () => {
    const photosRows = db.prepare('SELECT id, job_id, data, mime_type, uploaded_by, uploaded_at FROM job_photos ORDER BY uploaded_at ASC').all();
    const worklogRows = db.prepare('SELECT job_id, at, by_user, technician_notes, parts_used_json, materials_used_json FROM job_worklogs ORDER BY at DESC').all();

    const photosByJob = new Map();
    for (const row of photosRows) {
      const list = photosByJob.get(row.job_id) || [];
      list.push({
        id: row.id,
        data: row.data,
        mimeType: row.mime_type || '',
        uploadedBy: row.uploaded_by || '',
        uploadedAt: row.uploaded_at || '',
      });
      photosByJob.set(row.job_id, list);
    }

    const worklogByJob = new Map();
    for (const row of worklogRows) {
      const list = worklogByJob.get(row.job_id) || [];
      list.push({
        at: row.at,
        by: row.by_user,
        technicianNotes: row.technician_notes || '',
        partsUsed: asJson(row.parts_used_json, []),
        materialsUsed: asJson(row.materials_used_json, []),
      });
      worklogByJob.set(row.job_id, list);
    }

    const jobRows = db.prepare(`
      SELECT id, title, status, priority, assigned_to, location, customer_id, scheduled_date,
             category, notes, technician_notes, completion_notes, checkin_time, checkout_time,
             project_id, task_id, parts_used_json, materials_used_json, created_at, updated_at
      FROM jobs
      ORDER BY created_at DESC
    `).all();

    return jobRows.map((row) => mapJobFromRow(row, photosByJob, worklogByJob));
  };

  const loadInvoices = () => db.prepare(`
    SELECT id, job_id, customer_id, amount, status, issued_date, paid_date, description, created_at, updated_at
    FROM invoices
    ORDER BY issued_date DESC, id DESC
  `).all().map((row) => ({
    id: row.id,
    jobId: row.job_id || '',
    customerId: row.customer_id || '',
    amount: Number(row.amount || 0),
    status: row.status,
    issuedDate: row.issued_date,
    paidDate: row.paid_date,
    description: row.description || '',
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  const loadProjects = () => db.prepare(`
    SELECT id, title, description, start_date, end_date, status, overall_progress, created_by, created_at, updated_at
    FROM projects
    ORDER BY created_at DESC
  `).all().map((row) => ({
    id: row.id,
    title: row.title || '',
    description: row.description || '',
    start_date: row.start_date || null,
    end_date: row.end_date || null,
    status: row.status || 'planning',
    overall_progress: Number(row.overall_progress || 0),
    created_by: row.created_by || '',
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  const loadTasks = () => db.prepare(`
    SELECT id, project_id, parent_task_id, name, start_date, end_date, duration_days, progress_percent, weight, status, sort_order, notes, updated_by, updated_at
    FROM tasks
    ORDER BY sort_order ASC, name ASC
  `).all().map((row) => ({
    id: row.id,
    project_id: row.project_id || '',
    parent_task_id: row.parent_task_id || null,
    name: row.name || '',
    start_date: row.start_date || null,
    end_date: row.end_date || null,
    duration_days: Number(row.duration_days || 0),
    progress_percent: Number(row.progress_percent || 0),
    weight: Number(row.weight || 1),
    status: row.status || 'not_started',
    sort_order: Number(row.sort_order || 0),
    notes: row.notes || '',
    updated_by: row.updated_by || '',
    updated_at: row.updated_at,
  }));

  const loadActivityLogs = () => db.prepare(`
    SELECT id, entity_type, entity_id, user_id, action, description, old_value, new_value, timestamp
    FROM activity_logs
    ORDER BY timestamp DESC
    LIMIT 100
  `).all().map((row) => ({
    id: row.id,
    entity_type: row.entity_type || '',
    entity_id: row.entity_id || '',
    user_id: row.user_id || '',
    action: row.action || '',
    description: row.description || '',
    old_value: row.old_value || null,
    new_value: row.new_value || null,
    timestamp: row.timestamp,
  }));

  const loadNotifications = () => db.prepare(`
    SELECT id, user_id, type, title, message, read, created_at
    FROM notifications
    ORDER BY created_at DESC
  `).all().map((row) => ({
    id: row.id,
    user_id: row.user_id || 'all',
    type: row.type || 'info',
    title: row.title || '',
    message: row.message || '',
    read: Boolean(row.read),
    created_at: row.created_at,
  }));

  const persistCustomer = (customer) => {
    const createdAt = customer.created_at || nowIso();
    const updatedAt = customer.updated_at || nowIso();
    stmts.upsertCustomer.run(customer.id, customer.name, customer.email || '', customer.phone || '', customer.address || '', createdAt, updatedAt);
  };

  const persistJob = (job) => {
    const createdAt = job.created_at || nowIso();
    const updatedAt = job.updated_at || nowIso();
    stmts.upsertJob.run(
      job.id,
      job.title,
      job.status || 'new',
      job.priority || 'medium',
      job.assignedTo || '',
      job.location || '',
      job.customerId || '',
      job.scheduledDate || '',
      job.category || 'general',
      job.notes || '',
      job.technicianNotes || '',
      job.completionNotes || '',
      job.checkinTime || null,
      job.checkoutTime || null,
      job.projectId || null,
      job.taskId || null,
      JSON.stringify(Array.isArray(job.partsUsed) ? job.partsUsed : []),
      JSON.stringify(Array.isArray(job.materialsUsed) ? job.materialsUsed : []),
      createdAt,
      updatedAt,
    );

    stmts.deleteJobPhotosByJobId.run(job.id);
    const photos = Array.isArray(job.photos) ? job.photos : [];
    for (const photo of photos) {
      stmts.insertJobPhoto.run(
        String(photo.id),
        job.id,
        photo.data || '',
        photo.mimeType || '',
        photo.uploadedBy || '',
        photo.uploadedAt || updatedAt,
      );
    }

    stmts.deleteJobWorklogByJobId.run(job.id);
    const worklog = Array.isArray(job.worklog) ? job.worklog : [];
    for (const entry of worklog) {
      stmts.insertJobWorklog.run(
        job.id,
        entry.at || updatedAt,
        entry.by || 'system',
        entry.technicianNotes || '',
        JSON.stringify(Array.isArray(entry.partsUsed) ? entry.partsUsed : []),
        JSON.stringify(Array.isArray(entry.materialsUsed) ? entry.materialsUsed : []),
      );
    }
  };

  const persistInvoice = (invoice) => {
    const createdAt = invoice.created_at || nowIso();
    const updatedAt = invoice.updated_at || nowIso();
    stmts.upsertInvoice.run(
      invoice.id,
      invoice.jobId || '',
      invoice.customerId || '',
      Number(invoice.amount || 0),
      invoice.status || 'pending',
      invoice.issuedDate || '',
      invoice.paidDate || null,
      invoice.description || '',
      createdAt,
      updatedAt,
    );
  };

  const persistSession = (token, user, createdAt = nowIso(), expiresAt = null) => {
    stmts.upsertSession.run(token, user.id, JSON.stringify(user), createdAt, expiresAt);
  };

  const persistProject = (project) => {
    const createdAt = project.created_at || nowIso();
    const updatedAt = project.updated_at || nowIso();
    stmts.upsertProject.run(
      project.id,
      project.title || '',
      project.description || '',
      project.start_date || null,
      project.end_date || null,
      project.status || 'planning',
      Number(project.overall_progress || 0),
      project.created_by || '',
      createdAt,
      updatedAt,
    );
  };

  const persistTask = (task) => {
    const updatedAt = task.updated_at || nowIso();
    stmts.upsertTask.run(
      task.id,
      task.project_id || '',
      task.parent_task_id || null,
      task.name || '',
      task.start_date || null,
      task.end_date || null,
      Number(task.duration_days || 0),
      Number(task.progress_percent || 0),
      Number(task.weight || 1),
      task.status || 'not_started',
      Number(task.sort_order || 0),
      task.notes || '',
      task.updated_by || '',
      updatedAt,
    );
  };

  const deleteProject = (id) => {
    stmts.deleteTasksByProjectId.run(id);
    stmts.deleteProject.run(id);
  };

  const deleteTask = (id) => stmts.deleteTask.run(id);

  const loadSessions = () => db.prepare('SELECT token, user_json, created_at FROM sessions').all().map((row) => ({
    token: row.token,
    user: asJson(row.user_json, null),
    createdAt: row.created_at,
  })).filter((row) => row.user);

  return {
    bootstrap,
    loadUsers,
    loadCustomers,
    loadJobs,
    loadInvoices,
    loadProjects,
    loadTasks,
    loadActivityLogs,
    loadNotifications,
    persistCustomer,
    deleteCustomer: (id) => stmts.deleteCustomer.run(id),
    persistJob,
    persistInvoice,
    persistSession,
    persistProject,
    persistTask,
    deleteProject,
    deleteTask,
    deleteSession: (token) => stmts.deleteSession.run(token),
    loadSessions,
  };
};

module.exports = {
  createDb,
};
