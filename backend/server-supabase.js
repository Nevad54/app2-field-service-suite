const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createDb } = require('./db/index-supabase');

const app = express();
const PORT = process.env.PORT || 3002;
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const JOB_UPLOADS_DIR = path.join(UPLOADS_DIR, 'jobs');
const PHOTO_TAGS = new Set(['before', 'after', 'damage', 'parts', 'other']);
const SUPABASE_STORAGE_BUCKET = String(process.env.SUPABASE_STORAGE_BUCKET || 'job-photos').trim();
const SIGNED_URL_TTL_SECONDS = Number(process.env.SUPABASE_SIGNED_URL_TTL || 3600);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

fs.mkdirSync(JOB_UPLOADS_DIR, { recursive: true });

const getStoragePathFromPhoto = (photo) => {
    if (!photo || typeof photo !== 'object') return '';
    if (typeof photo.storagePath === 'string' && photo.storagePath.trim()) return photo.storagePath.trim();
    const data = String(photo.data || '');
    if (!data) return '';
    if (data.startsWith('storage:')) return data.slice('storage:'.length);
    const publicNeedle = `/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/`;
    const signNeedle = `/storage/v1/object/sign/${SUPABASE_STORAGE_BUCKET}/`;
    const needle = data.includes(publicNeedle) ? publicNeedle : (data.includes(signNeedle) ? signNeedle : '');
    if (!needle) return '';
    const rest = data.split(needle)[1] || '';
    const rawPath = rest.split('?')[0] || '';
    try {
        return decodeURIComponent(rawPath);
    } catch (_) {
        return rawPath;
    }
};

const withSignedPhoto = async (photo) => {
    const storagePath = getStoragePathFromPhoto(photo);
    if (!storagePath) return photo;
    const { data, error } = await dbInstance.supabase.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
    if (error || !data?.signedUrl) {
        if (error) console.error('Failed to sign URL:', error.message);
        return photo;
    }
    return { ...photo, storagePath, data: data.signedUrl };
};

const withSignedJobPhotos = async (job) => {
    if (!job || !Array.isArray(job.photos) || job.photos.length === 0) return job;
    const signedPhotos = await Promise.all(job.photos.map((photo) => withSignedPhoto(photo)));
    return { ...job, photos: signedPhotos };
};

const withSignedJobsPhotos = async (jobs) => Promise.all((jobs || []).map((job) => withSignedJobPhotos(job)));

let dbInstance;
let memoryCache = {
    users: [],
    customers: [],
    jobs: [],
    invoices: [],
    projects: [],
    tasks: [],
    activityLogs: [],
    notifications: [],
    inventory: [],
    equipment: [],
    quotes: [],
    technicians: []
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

const logActivity = async (entityType, entityId, userId, action, description) => {
    const newLog = {
        id: `act-${Date.now()}`,
        entity_type: entityType,
        entity_id: entityId,
        user_id: userId,
        action,
        description,
        timestamp: new Date().toISOString()
    };

    memoryCache.activityLogs.unshift(newLog);
    const { supabase } = dbInstance;
    await supabase.from('activity_logs').insert(newLog);
};

const startServer = async () => {
    console.log('Initializing Supabase connection...');
    dbInstance = createDb();

    const defaultUsers = [
        { id: 'u-admin', username: 'admin', password: '1111', role: 'admin' },
        { id: 'u-dispatch', username: 'dispatcher', password: '1111', role: 'dispatcher' },
        { id: 'u-tech', username: 'technician', password: '1111', role: 'technician' },
        { id: 'u-client', username: 'client', password: '1111', role: 'client' },
    ];

    const defaultTechnicians = [
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
            notes: 'Senior technician, 10+ years experience'
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
            notes: 'Specialist in commercial plumbing'
        },
        {
            id: 'tech-3',
            name: 'Robert Johnson',
            email: 'robert.johnson@example.com',
            phone: '555-1003',
            role: 'technician',
            skills: ['HVAC', 'System Diagnostics', 'Thermostat Programming'],
            hourly_rate: 80,
            certifications: ['EPA 608 Universal', 'NATE Certified', 'Carrier Factory Trained'],
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
            notes: 'Expert in smart home integrations'
        }
    ];

    const defaultInventory = [
        { id: 'INV-001', name: 'Air Filter 20x25x1', sku: 'AF-2025-1', category: 'Filters', quantity: 50, unit_price: 12.99, reorder_level: 10, location: 'Warehouse A', supplier: 'HVAC Supplies Co' },
        { id: 'INV-002', name: 'Thermostat Digital', sku: 'TH-DIG-01', category: 'Controls', quantity: 15, unit_price: 89.99, reorder_level: 5, location: 'Warehouse A', supplier: 'Smart Home Parts' },
        { id: 'INV-003', name: 'Copper Pipe 1/2"', sku: 'CP-050', category: 'Piping', quantity: 100, unit_price: 3.50, reorder_level: 20, location: 'Warehouse B', supplier: 'Plumbing Depot' },
        { id: 'INV-004', name: 'Refrigerant R-410A', sku: 'R410A-25', category: 'Refrigerant', quantity: 20, unit_price: 150.00, reorder_level: 5, location: 'Warehouse A', supplier: 'CoolTech' },
        { id: 'INV-005', name: 'Contactor 30A', sku: 'CTR-30A', category: 'Electrical', quantity: 25, unit_price: 24.99, reorder_level: 10, location: 'Warehouse A', supplier: 'Electric Parts Inc' },
    ];

    const defaultEquipment = [
        { id: 'EQP-001', name: 'HVAC Unit - Main Office', type: 'HVAC', customerId: 'CUST-001', location: '123 Main St', serial_number: 'HVAC-2020-001', install_date: '2020-05-15', status: 'operational', notes: 'Annual maintenance completed' },
        { id: 'EQP-002', name: 'Boiler System - Factory', type: 'Boiler', customerId: 'CUST-002', location: '456 Industrial Ave', serial_number: 'BLR-2019-042', install_date: '2019-03-22', status: 'operational', notes: 'Recently serviced' },
    ];

    const defaultQuotes = [
        { id: 'QUO-001', customerId: 'CUST-001', title: 'AC Unit Replacement', description: 'Replace old AC with new energy-efficient unit', status: 'pending', total_amount: 3500.00, valid_until: '2024-12-31', items: [{ description: 'New AC Unit', quantity: 1, unit_price: 2500 }, { description: 'Labor', quantity: 8, unit_price: 125 }] },
        { id: 'QUO-002', customerId: 'CUST-002', title: 'Annual Maintenance Contract', description: '12-month maintenance plan', status: 'accepted', total_amount: 1200.00, valid_until: '2024-06-30', items: [{ description: 'Maintenance Visits', quantity: 12, unit_price: 100 }] },
    ];

    // Try to bootstrap from database, but fall back to defaults if tables don't exist
    const bootstrapped = await dbInstance.bootstrap({ 
        users: defaultUsers,
        technicians: defaultTechnicians,
        inventory: defaultInventory,
        equipment: defaultEquipment,
        quotes: defaultQuotes
    });
    
    // If bootstrapped data is empty (tables don't exist in Supabase), use defaults
    memoryCache.users = bootstrapped.users?.length > 0 ? bootstrapped.users : defaultUsers;
    memoryCache.technicians = bootstrapped.technicians?.length > 0 ? bootstrapped.technicians : defaultTechnicians;
    memoryCache.inventory = bootstrapped.inventory?.length > 0 ? bootstrapped.inventory : defaultInventory;
    memoryCache.equipment = bootstrapped.equipment?.length > 0 ? bootstrapped.equipment : defaultEquipment;
    memoryCache.quotes = bootstrapped.quotes?.length > 0 ? bootstrapped.quotes : defaultQuotes;
    memoryCache.customers = bootstrapped.customers || [];
    memoryCache.jobs = bootstrapped.jobs || [];
    memoryCache.invoices = bootstrapped.invoices || [];
    memoryCache.projects = bootstrapped.projects || [];
    memoryCache.tasks = bootstrapped.tasks || [];
    memoryCache.activityLogs = bootstrapped.activityLogs || [];
    memoryCache.notifications = bootstrapped.notifications || [];

    // Load sessions from DB
    const dbSessions = await dbInstance.loadSessions();
    for (const s of dbSessions) {
        sessions.set(s.token, { user: s.user, createdAt: new Date(s.createdAt).getTime() });
    }

    // ============== STATUS ENDPOINT ==============
    app.get('/api/status', (_req, res) => {
        res.json({ ok: true, service: 'app2-field-service-suite-backend', timestamp: new Date().toISOString(), database: 'supabase' });
    });

    // ============== AUTH ENDPOINTS ==============
    app.post('/api/auth/login', async (req, res) => {
        const username = String(req.body.username || '').trim().toLowerCase();
        const password = String(req.body.password || '');
        const user = memoryCache.users.find((item) => item.username.toLowerCase() === username && item.password === password);

        // Also try checking customers to mimic the client portal logic
        const client = memoryCache.customers.find(c => c.email.toLowerCase() === username);

        let tokenUser;
        if (user) {
            tokenUser = toSafeUser(user);
        } else if (client) {
            tokenUser = { id: client.id, username: client.name, role: 'client', email: client.email };
        } else {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = crypto.randomBytes(24).toString('hex');
        sessions.set(token, { user: tokenUser, createdAt: Date.now() });
        await dbInstance.persistSession(token, tokenUser);

        return res.json({ user: tokenUser, token });
    });

    app.get('/api/auth/me', requireAuth, (req, res) => {
        res.json({ user: req.authUser });
    });

    app.post('/api/auth/logout', requireAuth, async (req, res) => {
        sessions.delete(req.authToken);
        await dbInstance.deleteSession(req.authToken);
        res.json({ ok: true });
    });

    app.post('/api/client/login', async (req, res) => {
        const email = String(req.body.email || '').trim().toLowerCase();
        const customer = memoryCache.customers.find(c => c.email.toLowerCase() === email);
        if (!customer) return res.status(401).json({ error: 'Invalid credentials' });

        const token = crypto.randomBytes(24).toString('hex');
        const tokenUser = { id: customer.id, username: customer.name, role: 'client', email: customer.email };

        sessions.set(token, { user: tokenUser, createdAt: Date.now() });
        await dbInstance.persistSession(token, tokenUser);

        return res.json({ token, user: tokenUser });
    });

    app.get('/api/client/jobs', requireAuth, async (req, res) => {
        if (req.authUser.role !== 'client') return res.status(403).json({ error: 'Forbidden' });
        const clientJobs = memoryCache.jobs.filter((job) => job.customerId === req.authUser.id);
        const signedJobs = await withSignedJobsPhotos(clientJobs);
        res.json(signedJobs);
    });

    app.get('/api/client/invoices', requireAuth, (req, res) => {
        if (req.authUser.role !== 'client') return res.status(403).json({ error: 'Forbidden' });
        const clientInvoices = memoryCache.invoices.filter((invoice) => invoice.customerId === req.authUser.id);
        res.json(clientInvoices);
    });

    // ============== CUSTOMERS ENDPOINTS ==============
    app.get('/api/customers', requireAuth, (req, res) => {
        res.json(memoryCache.customers);
    });

    app.post('/api/customers', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
        const { name, email, phone, address } = req.body;
        if (!name) return res.status(400).json({ error: 'Customer name is required' });

        const newCustomer = {
            id: `CUST-${String(memoryCache.customers.length + 1).padStart(3, '0')}`,
            name,
            email: email || '',
            phone: phone || '',
            address: address || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        memoryCache.customers.push(newCustomer);
        await dbInstance.persistCustomer(newCustomer);
        await logActivity('customer', newCustomer.id, req.authUser.username, 'created', `New customer added: ${name}`);
        res.status(201).json(newCustomer);
    });

    app.put('/api/customers/:id', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
        const index = memoryCache.customers.findIndex(c => c.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Customer not found' });

        const { name, email, phone, address } = req.body;
        const customer = { ...memoryCache.customers[index] };

        if (name) customer.name = name;
        if (email !== undefined) customer.email = email;
        if (phone !== undefined) customer.phone = phone;
        if (address !== undefined) customer.address = address;
        customer.updated_at = new Date().toISOString();

        memoryCache.customers[index] = customer;
        await dbInstance.persistCustomer(customer);
        await logActivity('customer', customer.id, req.authUser.username, 'updated', `Customer ${customer.name} updated`);
        res.json(customer);
    });

    app.delete('/api/customers/:id', requireAuth, requireRoles(['admin']), async (req, res) => {
        const index = memoryCache.customers.findIndex(c => c.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Customer not found' });

        const customer = memoryCache.customers[index];
        memoryCache.customers.splice(index, 1);
        await dbInstance.deleteCustomer(customer.id);
        await logActivity('customer', customer.id, req.authUser.username, 'deleted', `Customer ${customer.name} deleted`);
        res.json({ ok: true });
    });

    // ============== JOBS ENDPOINTS ==============
    app.get('/api/jobs', requireAuth, async (req, res) => {
        if (req.authUser.role === 'technician') {
            const jobs = memoryCache.jobs.filter((job) => job.assignedTo === req.authUser.username);
            const signedJobs = await withSignedJobsPhotos(jobs);
            return res.json(signedJobs);
        }
        if (req.authUser.role === 'client') {
            const jobs = memoryCache.jobs.filter((job) => job.customerId === req.authUser.id);
            const signedJobs = await withSignedJobsPhotos(jobs);
            return res.json(signedJobs);
        }
        const signedJobs = await withSignedJobsPhotos(memoryCache.jobs);
        return res.json(signedJobs);
    });

    const nextJobId = () => {
        const max = memoryCache.jobs.reduce((acc, item) => {
            const n = Number(String(item.id || '').replace('JOB-', '')) || 0;
            return n > acc ? n : acc;
        }, 1000);
        return `JOB-${String(max + 1).padStart(4, '0')}`;
    };

    app.post('/api/jobs', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
        const { title, priority, assignedTo, location, customerId, scheduledDate, category, notes, projectId, taskId } = req.body;
        if (!title) return res.status(400).json({ error: 'Job title is required' });

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
            taskId: taskId || null,
            photos: []
        };

        memoryCache.jobs.unshift(created);
        await dbInstance.persistJob(created);
        await logActivity('job', created.id, req.authUser.username, 'created', `Created job: ${title}`);
        return res.status(201).json(created);
    });

    app.put('/api/jobs/:id', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
        const index = memoryCache.jobs.findIndex(j => j.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Job not found' });

        const existing = { ...memoryCache.jobs[index] };
        const { title, priority, assignedTo, status, location, customerId, scheduledDate, category, notes, projectId, taskId } = req.body;

        if (title) existing.title = title;
        if (priority) existing.priority = priority;
        if (assignedTo !== undefined) existing.assignedTo = assignedTo;
        if (status) existing.status = status;
        if (location !== undefined) existing.location = location;
        if (customerId !== undefined) existing.customerId = customerId;
        if (scheduledDate !== undefined) existing.scheduledDate = scheduledDate;
        if (category !== undefined) existing.category = category;
        if (notes !== undefined) existing.notes = notes;
        if (projectId !== undefined) existing.projectId = projectId || null;
        if (taskId !== undefined) existing.taskId = taskId || null;
        existing.updated_at = new Date().toISOString();

        memoryCache.jobs[index] = existing;
        await dbInstance.persistJob(existing);
        return res.json(existing);
    });

    app.patch('/api/jobs/:id/status', requireAuth, async (req, res) => {
        const index = memoryCache.jobs.findIndex(j => j.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Job not found' });

        const existing = { ...memoryCache.jobs[index] };
        const status = String(req.body.status || '').trim().toLowerCase();

        if (req.authUser.role === 'technician' && existing.assignedTo !== req.authUser.username) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        existing.status = status;
        existing.updated_at = new Date().toISOString();

        memoryCache.jobs[index] = existing;
        await dbInstance.persistJob(existing);
        await logActivity('job', existing.id, req.authUser.username, 'status_changed', `Job ${existing.id} status changed to ${status}`);
        return res.json(existing);
    });

    app.delete('/api/jobs/:id', requireAuth, requireRoles(['admin']), async (req, res) => {
        const index = memoryCache.jobs.findIndex(j => j.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Job not found' });

        const job = memoryCache.jobs[index];
        memoryCache.jobs.splice(index, 1);
        const { supabase } = dbInstance;
        await supabase.from('jobs').delete().eq('id', req.params.id);
        await logActivity('job', job.id, req.authUser.username, 'deleted', `Job ${job.id} deleted`);
        return res.json({ ok: true });
    });

    app.post('/api/jobs/:id/photos', requireAuth, async (req, res) => {
        const index = memoryCache.jobs.findIndex(j => j.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Job not found' });
        const existing = memoryCache.jobs[index];

        if (req.authUser.role === 'technician') {
            if (existing.assignedTo !== req.authUser.username) return res.status(403).json({ error: 'Forbidden' });
        } else if (!['admin', 'dispatcher'].includes(req.authUser.role)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const photo = String(req.body.photo || '');
        const incomingTag = String(req.body.tag || 'other').toLowerCase().trim();
        const tag = PHOTO_TAGS.has(incomingTag) ? incomingTag : 'other';
        const match = photo.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
        if (!match) return res.status(400).json({ error: 'Invalid photo payload' });
        if (photo.length > 8_000_000) return res.status(400).json({ error: 'Photo is too large' });

        const mimeType = match[1];
        const base64Data = match[2];
        const ext = mimeType.includes('jpeg') ? 'jpg'
            : mimeType.includes('png') ? 'png'
            : mimeType.includes('webp') ? 'webp'
            : mimeType.includes('gif') ? 'gif'
            : 'img';

        const fileId = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const objectPath = `jobs/${existing.id}/${fileId}.${ext}`;
        const bytes = Buffer.from(base64Data, 'base64');
        const { error: uploadErr } = await dbInstance.supabase.storage
            .from(SUPABASE_STORAGE_BUCKET)
            .upload(objectPath, bytes, { contentType: mimeType, upsert: false, cacheControl: '3600' });
        if (uploadErr) {
            return res.status(500).json({ error: `Failed to upload to Supabase Storage: ${uploadErr.message}` });
        }
        const { data: signedData } = await dbInstance.supabase.storage
            .from(SUPABASE_STORAGE_BUCKET)
            .createSignedUrl(objectPath, SIGNED_URL_TTL_SECONDS);

        const photoRecord = {
            id: fileId,
            data: `storage:${objectPath}`,
            mimeType,
            uploadedBy: req.authUser.username,
            uploadedAt: new Date().toISOString(),
            tag,
            storagePath: objectPath,
        };
        if (!Array.isArray(existing.photos)) existing.photos = [];
        existing.photos.push(photoRecord);
        existing.updated_at = new Date().toISOString();
        memoryCache.jobs[index] = existing;
        await dbInstance.persistJob(existing);

        await logActivity('job', existing.id, req.authUser.username, 'photo_added', `Photo added to ${existing.id}`);
        return res.status(201).json({
            ...photoRecord,
            data: signedData?.signedUrl || photoRecord.data,
        });
    });

    app.delete('/api/jobs/:id/photos/:photoId', requireAuth, async (req, res) => {
        const index = memoryCache.jobs.findIndex(j => j.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Job not found' });
        const existing = memoryCache.jobs[index];

        if (!['admin', 'dispatcher'].includes(req.authUser.role)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        if (!Array.isArray(existing.photos) || existing.photos.length === 0) {
            return res.status(404).json({ error: 'Photo not found' });
        }

        const photoId = String(req.params.photoId || '');
        const byIdIndex = existing.photos.findIndex((p) => String((p && p.id) || '') === photoId);
        const byIndex = Number.isInteger(Number(photoId)) ? Number(photoId) : -1;
        const photoIndex = byIdIndex >= 0 ? byIdIndex : byIndex;
        if (photoIndex < 0 || photoIndex >= existing.photos.length) {
            return res.status(404).json({ error: 'Photo not found' });
        }

        const [removed] = existing.photos.splice(photoIndex, 1);
        const storagePath = getStoragePathFromPhoto(removed);
        if (storagePath) {
            const { error: removeErr } = await dbInstance.supabase.storage
                .from(SUPABASE_STORAGE_BUCKET)
                .remove([storagePath]);
            if (removeErr) {
                console.error('Failed to remove storage object:', removeErr.message);
            }
        } else if (removed && typeof removed.data === 'string' && removed.data.startsWith('/uploads/jobs/')) {
            const filePath = path.join(UPLOADS_DIR, removed.data.replace(/^\/uploads\//, '').replace(/\//g, path.sep));
            try {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            } catch (_) {}
        }

        existing.updated_at = new Date().toISOString();
        memoryCache.jobs[index] = existing;
        await dbInstance.persistJob(existing);
        await logActivity('job', existing.id, req.authUser.username, 'photo_removed', `Photo removed from ${existing.id}`);
        return res.json({ ok: true });
    });

    // ============== PROJECTS AND PLANNER ==============
    app.get('/api/projects', requireAuth, (req, res) => res.json(memoryCache.projects));

    app.post('/api/projects', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
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

        memoryCache.projects.unshift(newProject);
        await dbInstance.persistProject(newProject);
        await logActivity('project', newProject.id, req.authUser.username, 'created', `Created project: ${title}`);
        res.status(201).json(newProject);
    });

    app.delete('/api/projects/:id', requireAuth, requireRoles(['admin']), async (req, res) => {
        const index = memoryCache.projects.findIndex(p => p.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Project not found' });
        
        const project = memoryCache.projects[index];
        const projectTaskIds = memoryCache.tasks
            .filter(t => t.project_id === req.params.id)
            .map(t => t.id);
        memoryCache.projects.splice(index, 1);
        memoryCache.tasks = memoryCache.tasks.filter(t => t.project_id !== req.params.id);
        
        await dbInstance.deleteProject(req.params.id);
        for (const taskId of projectTaskIds) {
            await dbInstance.deleteTask(taskId);
        }
        await logActivity('project', project.id, req.authUser.username, 'deleted', `Project ${project.title} deleted`);
        res.json({ ok: true });
    });

    app.get('/api/projects/:id/tasks', requireAuth, (req, res) => {
        res.json(memoryCache.tasks.filter(t => t.project_id === req.params.id));
    });

    // Backward-compatible endpoint used by ProjectsPage modal task form
    app.post('/api/projects/:id/tasks', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
        const project = memoryCache.projects.find(p => p.id === req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        const now = new Date().toISOString();
        const toStatus = (value) => {
            const normalized = String(value || '').trim().toLowerCase().replace(/-/g, '_');
            if (normalized === 'pending') return 'not_started';
            if (normalized === 'inprogress') return 'in_progress';
            return normalized || 'not_started';
        };

        const newTask = {
            id: `task-${Date.now()}`,
            project_id: req.params.id,
            parent_task_id: null,
            name: req.body.name,
            start_date: req.body.start_date || req.body.startDate || null,
            end_date: req.body.end_date || req.body.dueDate || null,
            duration_days: 0,
            progress_percent: Number(req.body.progress_percent ?? req.body.progress ?? 0),
            weight: Number(req.body.weight || 1),
            status: toStatus(req.body.status),
            sort_order: memoryCache.tasks.filter(t => t.project_id === req.params.id).length + 1,
            notes: req.body.notes || req.body.description || '',
            updated_by: req.authUser.username,
            updated_at: now
        };

        if (!newTask.name) return res.status(400).json({ error: 'Task name is required' });
        if (newTask.start_date && newTask.end_date) {
            const start = new Date(newTask.start_date);
            const end = new Date(newTask.end_date);
            const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
            newTask.duration_days = diffDays >= 0 ? diffDays + 1 : 0;
        }

        memoryCache.tasks.push(newTask);
        await dbInstance.persistTask(newTask);
        await logActivity('task', newTask.id, req.authUser.username, 'created', `Task ${newTask.name} created`);
        res.status(201).json(newTask);
    });

    // Planner endpoint - returns project with tasks and summary
    app.get('/api/projects/:id/planner', requireAuth, (req, res) => {
        const project = memoryCache.projects.find(p => p.id === req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        
        const tasks = memoryCache.tasks.filter(t => t.project_id === req.params.id);
        
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
        const notStartedTasks = tasks.filter(t => t.status === 'not_started').length;
        
        const overallProgress = totalTasks > 0 
            ? Math.round(tasks.reduce((sum, t) => sum + (t.progress_percent || 0), 0) / totalTasks)
            : 0;
            
        // Calculate delayed tasks (past end date but not completed)
        const delayedTasks = tasks.filter(t => {
            if (t.status === 'completed') return false;
            if (!t.end_date) return false;
            return new Date(t.end_date) < new Date();
        }).length;

        // Calculate total weight
        const totalWeight = tasks.reduce((sum, t) => sum + (t.weight || 0), 0);

        const summary = {
            total: totalTasks,
            completed: completedTasks,
            inProgress: inProgressTasks,
            notStarted: notStartedTasks,
            delayed: delayedTasks,
            totalWeight: totalWeight,
            overallProgress
        };
        
        // Add progressContribution to each task (each task's contribution = (task_progress * task_weight) / total_weight)
        const tasksWithContribution = tasks.map(task => {
            const taskWeight = task.weight || 1;
            const contribution = totalWeight > 0 ? ((task.progress_percent || 0) * taskWeight) / totalWeight : 0;
            return { ...task, progressContribution: contribution };
        });
        
        res.json({ project, tasks: tasksWithContribution, summary });
    });

    // Task endpoints
    app.get('/api/tasks/:id', requireAuth, (req, res) => {
        const task = memoryCache.tasks.find(t => t.id === req.params.id);
        if (!task) return res.status(404).json({ error: 'Task not found' });
        res.json(task);
    });

    app.put('/api/tasks/:id', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
        const index = memoryCache.tasks.findIndex(t => t.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Task not found' });
        
        const task = { ...memoryCache.tasks[index], ...req.body, updated_at: new Date().toISOString() };
        memoryCache.tasks[index] = task;
        await dbInstance.persistTask(task);
        res.json(task);
    });

    app.delete('/api/tasks/:id', requireAuth, requireRoles(['admin']), async (req, res) => {
        const index = memoryCache.tasks.findIndex(t => t.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Task not found' });
        
        memoryCache.tasks.splice(index, 1);
        await dbInstance.deleteTask(req.params.id);
        res.json({ ok: true });
    });

    app.put('/api/tasks/:id/progress', requireAuth, async (req, res) => {
        const index = memoryCache.tasks.findIndex(t => t.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Task not found' });
        
        const { progress_percent, status } = req.body;
        const task = { ...memoryCache.tasks[index] };
        
        if (progress_percent !== undefined) task.progress_percent = progress_percent;
        if (status) task.status = status;
        else if (progress_percent === 100) task.status = 'completed';
        else if (progress_percent > 0) task.status = 'in_progress';
        
        task.updated_at = new Date().toISOString();
        memoryCache.tasks[index] = task;
        await dbInstance.persistTask(task);
        res.json(task);
    });

    // PATCH endpoint for task progress (used by frontend slider)
    app.patch('/api/tasks/:id/progress', requireAuth, async (req, res) => {
        const index = memoryCache.tasks.findIndex(t => t.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Task not found' });
        
        const { progress_percent, status } = req.body;
        const task = { ...memoryCache.tasks[index] };
        
        if (progress_percent !== undefined) task.progress_percent = progress_percent;
        if (status) task.status = status;
        else if (progress_percent === 100) task.status = 'completed';
        else if (progress_percent > 0) task.status = 'in_progress';
        
        task.updated_at = new Date().toISOString();
        memoryCache.tasks[index] = task;
        await dbInstance.persistTask(task);
        
        res.json(task);
    });

    app.put('/api/tasks/:id/dates', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
        const index = memoryCache.tasks.findIndex(t => t.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Task not found' });
        
        const { start_date, end_date } = req.body;
        const task = { ...memoryCache.tasks[index] };
        
        if (start_date !== undefined) task.start_date = start_date;
        if (end_date !== undefined) task.end_date = end_date;
        task.updated_at = new Date().toISOString();
        
        memoryCache.tasks[index] = task;
        await dbInstance.persistTask(task);
        
        res.json(task);
    });

    // PATCH endpoint for task dates (used by frontend table) - any authenticated user
    app.patch('/api/tasks/:id/dates', requireAuth, async (req, res) => {
        const index = memoryCache.tasks.findIndex(t => t.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Task not found' });
        
        const { start_date, end_date } = req.body;
        const task = { ...memoryCache.tasks[index] };
        
        if (start_date !== undefined) task.start_date = start_date;
        if (end_date !== undefined) task.end_date = end_date;
        
        // Calculate duration_days based on start and end dates
        if (task.start_date && task.end_date) {
            const start = new Date(task.start_date);
            const end = new Date(task.end_date);
            const diffTime = end - start;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            task.duration_days = diffDays >= 0 ? diffDays + 1 : 0;
        }
        
        task.updated_at = new Date().toISOString();
        
        memoryCache.tasks[index] = task;
        await dbInstance.persistTask(task);
        
        res.json(task);
    });

    app.post('/api/tasks', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
        const { project_id, parent_task_id, name, start_date, end_date, progress_percent, weight, notes, sort_order } = req.body;
        if (!project_id || !name) return res.status(400).json({ error: 'Project ID and task name are required' });

        const newTask = {
            id: `task-${Date.now()}`,
            project_id,
            parent_task_id: parent_task_id || null,
            name,
            start_date: start_date || null,
            end_date: end_date || null,
            duration_days: 0,
            progress_percent: progress_percent || 0,
            weight: weight || 1,
            status: 'not_started',
            sort_order: sort_order || memoryCache.tasks.filter(t => t.project_id === project_id).length + 1,
            notes: notes || '',
            updated_by: req.authUser.username,
            updated_at: new Date().toISOString()
        };

        memoryCache.tasks.push(newTask);
        await dbInstance.persistTask(newTask);
        res.status(201).json(newTask);
    });

    // ============== OTHER ENDPOINTS ==============
    app.get('/api/activity', requireAuth, (req, res) => {
        const limit = parseInt(req.query.limit) || 50;
        res.json(memoryCache.activityLogs.slice(0, limit));
    });

    app.get('/api/notifications', requireAuth, (req, res) => {
        const userNotifications = memoryCache.notifications
            .filter((n) => n.user_id === req.authUser.username || n.user_id === 'all')
            .map((n) => ({
                ...n,
                createdAt: n.created_at || n.timestamp || new Date().toISOString(),
            }))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        res.json(userNotifications);
    });

    app.post('/api/notifications', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
        const notification = {
            id: `notif-${Date.now()}`,
            user_id: req.body.user_id || 'all',
            type: req.body.type || 'info',
            title: req.body.title || 'Notification',
            message: req.body.message || '',
            read: false,
            created_at: new Date().toISOString()
        };

        memoryCache.notifications.unshift(notification);
        const { error } = await dbInstance.supabase.from('notifications').upsert(notification);
        if (error) return res.status(500).json({ error: error.message });
        res.status(201).json(notification);
    });

    app.patch('/api/notifications/:id/read', requireAuth, async (req, res) => {
        const index = memoryCache.notifications.findIndex(n => n.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Notification not found' });

        const notification = { ...memoryCache.notifications[index], read: true };
        memoryCache.notifications[index] = notification;
        const { error } = await dbInstance.supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', req.params.id);
        if (error) return res.status(500).json({ error: error.message });
        res.json(notification);
    });

    app.get('/api/dashboard/summary', requireAuth, (req, res) => {
        const jobs = memoryCache.jobs;
        const invoices = memoryCache.invoices;

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
            totalCustomers: memoryCache.customers.length,
            totalInvoices: invoices.length,
            paidInvoices: invoices.filter(i => i.status === 'paid').length,
            pendingInvoices: invoices.filter(i => i.status === 'pending').length,
            totalRevenue,
            pendingRevenue,
            role: req.authUser.role,
            recentActivity: memoryCache.activityLogs.slice(0, 10)
        });
    });

    // ============== TECHNICIANS ENDPOINTS ==============
    app.get('/api/technicians', requireAuth, (req, res) => {
        res.json(memoryCache.technicians);
    });

    app.get('/api/technicians/skills', requireAuth, (req, res) => {
        const allSkills = new Set();
        memoryCache.technicians.forEach(t => {
            if (t.skills && Array.isArray(t.skills)) {
                t.skills.forEach(s => allSkills.add(s));
            }
        });
        res.json(Array.from(allSkills));
    });

    // Create technician
    app.post('/api/technicians', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
        const { name, email, phone, skills, hourly_rate, certifications, availability, status, color, hire_date, notes } = req.body;
        if (!name) return res.status(400).json({ error: 'Technician name is required' });

        const newTechnician = {
            id: `tech-${Date.now()}`,
            name,
            email: email || '',
            phone: phone || '',
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
            hire_date: hire_date || null,
            notes: notes || '',
            role: 'technician',
            created_at: new Date().toISOString()
        };

        memoryCache.technicians.push(newTechnician);
        await dbInstance.persistTechnician(newTechnician);
        await logActivity('technician', newTechnician.id, req.authUser.username, 'created', `New technician added: ${name}`);
        res.status(201).json(newTechnician);
    });

    // Update technician
    app.put('/api/technicians/:id', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
        const index = memoryCache.technicians.findIndex(t => t.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Technician not found' });

        const { name, email, phone, skills, hourly_rate, certifications, availability, status, color, hire_date, notes } = req.body;
        const technician = { ...memoryCache.technicians[index] };

        if (name) technician.name = name;
        if (email !== undefined) technician.email = email;
        if (phone !== undefined) technician.phone = phone;
        if (skills) technician.skills = skills;
        if (hourly_rate !== undefined) technician.hourly_rate = hourly_rate;
        if (certifications) technician.certifications = certifications;
        if (availability) technician.availability = availability;
        if (status) technician.status = status;
        if (color) technician.color = color;
        if (hire_date !== undefined) technician.hire_date = hire_date;
        if (notes !== undefined) technician.notes = notes;

        memoryCache.technicians[index] = technician;
        await dbInstance.persistTechnician(technician);
        await logActivity('technician', technician.id, req.authUser.username, 'updated', `Technician ${technician.name} updated`);
        res.json(technician);
    });

    // Delete technician
    app.delete('/api/technicians/:id', requireAuth, requireRoles(['admin']), async (req, res) => {
        const index = memoryCache.technicians.findIndex(t => t.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Technician not found' });

        const technician = memoryCache.technicians[index];
        memoryCache.technicians.splice(index, 1);
        await dbInstance.deleteTechnician(req.params.id);
        await logActivity('technician', technician.id, req.authUser.username, 'deleted', `Technician ${technician.name} deleted`);
        res.json({ ok: true });
    });

    // ============== SCHEDULE ENDPOINT ==============
    app.get('/api/schedule', requireAuth, async (req, res) => {
        const scheduledJobs = memoryCache.jobs.filter(job => job.scheduledDate);
        const signedJobs = await withSignedJobsPhotos(scheduledJobs);
        res.json(signedJobs);
    });

    // ============== INVENTORY ENDPOINTS ==============
    app.get('/api/inventory', requireAuth, (req, res) => {
        res.json(memoryCache.inventory);
    });

    app.post('/api/inventory', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
        const { name, sku, category, quantity, unit_price, reorder_level, location, supplier } = req.body;
        if (!name) return res.status(400).json({ error: 'Item name is required' });

        const newItem = {
            id: `INV-${String(memoryCache.inventory.length + 1).padStart(3, '0')}`,
            name,
            sku: sku || '',
            category: category || 'General',
            quantity: quantity || 0,
            unit_price: unit_price || 0,
            reorder_level: reorder_level || 5,
            location: location || '',
            supplier: supplier || '',
            created_at: new Date().toISOString()
        };

        memoryCache.inventory.push(newItem);
        await dbInstance.persistInventory(newItem);
        res.status(201).json(newItem);
    });

    app.put('/api/inventory/:id', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
        const index = memoryCache.inventory.findIndex(i => i.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Item not found' });

        const item = { ...memoryCache.inventory[index], ...req.body };
        memoryCache.inventory[index] = item;
        await dbInstance.persistInventory(item);
        res.json(item);
    });

    app.delete('/api/inventory/:id', requireAuth, requireRoles(['admin']), async (req, res) => {
        const index = memoryCache.inventory.findIndex(i => i.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Item not found' });

        const item = memoryCache.inventory[index];
        memoryCache.inventory.splice(index, 1);
        await dbInstance.deleteInventory(item.id);
        res.json({ ok: true });
    });

    // ============== EQUIPMENT ENDPOINTS ==============
    app.get('/api/equipment', requireAuth, (req, res) => {
        res.json(memoryCache.equipment);
    });

    app.post('/api/equipment', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
        const { name, type, customerId, location, serial_number, install_date, status, notes } = req.body;
        if (!name) return res.status(400).json({ error: 'Equipment name is required' });

        const newEquipment = {
            id: `EQP-${String(memoryCache.equipment.length + 1).padStart(3, '0')}`,
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

        memoryCache.equipment.push(newEquipment);
        await dbInstance.persistEquipment(newEquipment);
        res.status(201).json(newEquipment);
    });

    app.put('/api/equipment/:id', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
        const index = memoryCache.equipment.findIndex(e => e.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Equipment not found' });

        const item = { ...memoryCache.equipment[index], ...req.body };
        memoryCache.equipment[index] = item;
        await dbInstance.persistEquipment(item);
        res.json(item);
    });

    app.delete('/api/equipment/:id', requireAuth, requireRoles(['admin']), async (req, res) => {
        const index = memoryCache.equipment.findIndex(e => e.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Equipment not found' });

        const item = memoryCache.equipment[index];
        memoryCache.equipment.splice(index, 1);
        await dbInstance.deleteEquipment(item.id);
        res.json({ ok: true });
    });

    // ============== QUOTES ENDPOINTS ==============
    app.get('/api/quotes', requireAuth, (req, res) => {
        res.json(memoryCache.quotes);
    });

    app.post('/api/quotes', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
        const { customerId, title, description, total_amount, valid_until, items } = req.body;
        if (!title) return res.status(400).json({ error: 'Quote title is required' });

        const newQuote = {
            id: `QUO-${Date.now()}`,
            customerId: customerId || '',
            title,
            description: description || '',
            status: 'pending',
            total_amount: total_amount || 0,
            valid_until: valid_until || null,
            items: items || [],
            created_by: req.authUser.username,
            created_at: new Date().toISOString()
        };

        memoryCache.quotes.push(newQuote);
        await dbInstance.persistQuote(newQuote);
        res.status(201).json(newQuote);
    });

    app.put('/api/quotes/:id', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
        const index = memoryCache.quotes.findIndex(q => q.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Quote not found' });

        const quote = { ...memoryCache.quotes[index], ...req.body };
        memoryCache.quotes[index] = quote;
        await dbInstance.persistQuote(quote);
        res.json(quote);
    });

    app.delete('/api/quotes/:id', requireAuth, requireRoles(['admin']), async (req, res) => {
        const index = memoryCache.quotes.findIndex(q => q.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Quote not found' });

        const quote = memoryCache.quotes[index];
        memoryCache.quotes.splice(index, 1);
        await dbInstance.deleteQuote(quote.id);
        res.json({ ok: true });
    });

    // Accept quote
    app.post('/api/quotes/:id/accept', requireAuth, async (req, res) => {
        const index = memoryCache.quotes.findIndex(q => q.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Quote not found' });

        const quote = { ...memoryCache.quotes[index] };
        quote.status = 'accepted';
        quote.accepted_at = new Date().toISOString();
        quote.accepted_by = req.authUser.username;
        memoryCache.quotes[index] = quote;
        await dbInstance.persistQuote(quote);
        
        await logActivity('quote', quote.id, req.authUser.username, 'accepted', `Quote accepted: ${quote.title}`);
        res.json(quote);
    });

    // Reject quote
    app.post('/api/quotes/:id/reject', requireAuth, async (req, res) => {
        const index = memoryCache.quotes.findIndex(q => q.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Quote not found' });

        const quote = { ...memoryCache.quotes[index] };
        quote.status = 'rejected';
        quote.rejected_at = new Date().toISOString();
        quote.rejected_by = req.authUser.username;
        memoryCache.quotes[index] = quote;
        await dbInstance.persistQuote(quote);
        
        await logActivity('quote', quote.id, req.authUser.username, 'rejected', `Quote rejected: ${quote.title}`);
        res.json(quote);
    });

    // Convert quote to job
    app.post('/api/quotes/:id/convert', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
        const index = memoryCache.quotes.findIndex(q => q.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Quote not found' });

        const quote = memoryCache.quotes[index];
        if (quote.status !== 'accepted') {
            return res.status(400).json({ error: 'Only accepted quotes can be converted to jobs' });
        }

        const { scheduledDate } = req.body;
        const customer = memoryCache.customers.find(c => c.id === quote.customerId);
        
        const now = new Date().toISOString();
        const job = {
            id: nextJobId(),
            title: `From Quote: ${quote.title}`,
            status: 'new',
            priority: 'medium',
            assignedTo: '',
            location: customer?.address || '',
            customerId: quote.customerId,
            scheduledDate: scheduledDate || '',
            category: 'quote-converted',
            notes: `Converted from quote ${quote.id}. Description: ${quote.description || 'N/A'}`,
            created_at: now,
            updated_at: now,
            partsUsed: [],
            materialsUsed: [],
            worklog: [],
            technicianNotes: '',
            completionNotes: '',
            projectId: null,
            taskId: null,
            photos: [],
            quoteId: quote.id
        };

        memoryCache.jobs.unshift(job);
        await dbInstance.persistJob(job);
        
        // Update quote with job reference
        quote.jobId = job.id;
        memoryCache.quotes[index] = quote;
        await dbInstance.persistQuote(quote);
        
        await logActivity('job', job.id, req.authUser.username, 'created', `Created job from quote: ${quote.title}`);
        res.status(201).json(job);
    });

    // ============== INVOICES ENDPOINTS ==============
    app.get('/api/invoices', requireAuth, (req, res) => {
        res.json(memoryCache.invoices);
    });

    app.post('/api/invoices', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
        const { jobId, customerId, amount, description } = req.body;
        if (!amount) return res.status(400).json({ error: 'Amount is required' });

        const newInvoice = {
            id: `INV-${Date.now()}`,
            jobId: jobId || '',
            customerId: customerId || '',
            amount,
            description: description || '',
            status: 'pending',
            created_at: new Date().toISOString()
        };

        memoryCache.invoices.push(newInvoice);
        await dbInstance.persistInvoice(newInvoice);
        res.status(201).json(newInvoice);
    });

    app.patch('/api/invoices/:id/status', requireAuth, requireRoles(['admin', 'dispatcher']), async (req, res) => {
        const index = memoryCache.invoices.findIndex(i => i.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Invoice not found' });

        const invoice = { ...memoryCache.invoices[index], ...req.body };
        memoryCache.invoices[index] = invoice;
        await dbInstance.persistInvoice(invoice);
        res.json(invoice);
    });

    // Download invoice as text file (simple PDF alternative)
    app.get('/api/invoices/:id/pdf', requireAuth, (req, res) => {
        const invoice = memoryCache.invoices.find(i => i.id === req.params.id);
        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
        
        // Check permissions - clients can only download their own invoices
        if (req.authUser.role === 'client' && invoice.customerId !== req.authUser.id) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        
        const job = memoryCache.jobs.find(j => j.id === invoice.jobId);
        const customer = memoryCache.customers.find(c => c.id === invoice.customerId);
        
        // Generate invoice content as text
        const invoiceContent = `
========================================
           INVOICE
========================================

Invoice Number: ${invoice.id}
Date Issued: ${invoice.created_at ? invoice.created_at.split('T')[0] : 'N/A'}
Status: ${invoice.status ? invoice.status.toUpperCase() : 'PENDING'}

----------------------------------------
BILL TO:
----------------------------------------
${customer ? customer.name : 'N/A'}
${customer ? customer.address || '' : ''}
${customer ? customer.phone || '' : ''}

----------------------------------------
JOB DETAILS:
----------------------------------------
Job ID: ${invoice.jobId || 'N/A'}
${job ? `Job Title: ${job.title}` : ''}
${job ? `Location: ${job.location || ''}` : ''}

Description: ${invoice.description || 'N/A'}

----------------------------------------
AMOUNT:
----------------------------------------
Subtotal: $${(invoice.amount || 0).toFixed(2)}
Tax (0%): $0.00
----------------------------------------
TOTAL: $${(invoice.amount || 0).toFixed(2)}
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

    // ============== EXPORT ENDPOINTS ==============
    app.get('/api/export/jobs', requireAuth, requireRoles(['admin', 'dispatcher']), (req, res) => {
        const rows = memoryCache.jobs.map((job) => {
            const customer = memoryCache.customers.find(c => c.id === job.customerId);
            return {
                id: job.id,
                title: job.title,
                status: job.status,
                priority: job.priority,
                category: job.category || '',
                location: job.location || '',
                customer: customer ? customer.name : '',
                assignedTo: job.assignedTo || '',
                scheduledDate: job.scheduledDate || '',
                created_at: job.created_at || '',
                updated_at: job.updated_at || '',
                notes: job.notes || '',
            };
        });

        if (rows.length === 0) {
            return res.status(200).send('No jobs to export');
        }

        const headers = Object.keys(rows[0]);
        const csvContent = [
            headers.join(','),
            ...rows.map(row => headers.map(h => {
                const val = String(row[h] || '').replace(/"/g, '""');
                return `"${val}"`;
            }).join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="jobs-export.csv"');
        res.send(csvContent);
    });

    app.get('/api/export/customers', requireAuth, requireRoles(['admin', 'dispatcher']), (req, res) => {
        const rows = memoryCache.customers.map((customer) => ({
            id: customer.id,
            name: customer.name,
            email: customer.email || '',
            phone: customer.phone || '',
            address: customer.address || '',
            created_at: customer.created_at || '',
            updated_at: customer.updated_at || '',
        }));

        if (rows.length === 0) {
            return res.status(200).send('No customers to export');
        }

        const headers = Object.keys(rows[0]);
        const csvContent = [
            headers.join(','),
            ...rows.map(row => headers.map(h => {
                const val = String(row[h] || '').replace(/"/g, '""');
                return `"${val}"`;
            }).join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="customers-export.csv"');
        res.send(csvContent);
    });

    // Listen
    app.listen(PORT, () => {
        console.log(`App 2 backend running on http://localhost:${PORT} using Supabase PostgreSQL`);
    });
};

startServer().catch(err => {
    console.error("Failed to start server", err);
    process.exit(1);
});
