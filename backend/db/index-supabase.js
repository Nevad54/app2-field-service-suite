const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.supabase') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.supabase");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const asJson = (value, fallback) => {
    if (value === null || value === undefined || value === '') return fallback;
    if (typeof value === 'object') return value;
    try {
        return JSON.parse(value);
    } catch (_) {
        return fallback;
    }
};

const mapJobFromRow = (row) => {
    if (!row) return row;
    return {
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
        photos: row.job_photos ? row.job_photos.map(p => ({
            id: p.id,
            data: p.data,
            mimeType: p.mime_type || '',
            uploadedBy: p.uploaded_by || '',
            uploadedAt: p.uploaded_at || ''
        })) : [],
        worklog: row.job_worklogs ? row.job_worklogs.map(w => ({
            at: w.at,
            by: w.by_user,
            technicianNotes: w.technician_notes || '',
            partsUsed: asJson(w.parts_used_json, []),
            materialsUsed: asJson(w.materials_used_json, [])
        })) : []
    }
};

// Helper to create tables via POST to rest/v1 with upsert
// This workaround creates tables by inserting dummy data that will fail gracefully if table exists
const ensureTable = async (tableName, sampleData) => {
    const { error } = await supabase.from(tableName).upsert(sampleData).select();
    if (error) {
        // Check if it's "table not found" error
        if (error.code === 'PGRST205' || error.message?.includes('table')) {
            console.log(`Table '${tableName}' does not exist - please create it in Supabase dashboard or via migration`);
            return false;
        }
        // Other errors might just be data conflicts which is fine
    }
    return true;
};

const createDb = () => {

    const bootstrap = async (defaultData) => {
        console.log("Supabase db connected. Seeding default data...");

        // Try to create tables if they don't exist using the schema
        // Note: In production, these tables should be created via Supabase migrations
        console.log("Checking for required tables...");

        // Always seed users
        if (Array.isArray(defaultData.users)) {
            const { error } = await supabase.from('users').upsert(defaultData.users.map(u => ({
                id: u.id,
                username: u.username,
                password: u.password,
                role: u.role
            })));
            if (error) console.error("Error seeding users:", error.message);
            else console.log(`Seeded ${defaultData.users.length} users`);
        }

        // Always seed technicians
        if (Array.isArray(defaultData.technicians)) {
            const { error } = await supabase.from('technicians').upsert(defaultData.technicians.map(t => ({
                id: t.id,
                name: t.name,
                email: t.email || null,
                phone: t.phone || null,
                role: t.role || 'technician',
                skills: t.skills || [],
                hourly_rate: t.hourly_rate || 0,
                certifications: t.certifications || [],
                availability: t.availability || null,
                status: t.status || 'active',
                color: t.color || '#0ea5e9',
                hire_date: t.hire_date || null,
                notes: t.notes || null
            })));
            if (error) console.error("Error seeding technicians:", error.message);
            else console.log(`Seeded ${defaultData.technicians.length} technicians`);
        }

        // Always seed inventory
        if (Array.isArray(defaultData.inventory)) {
            const { error } = await supabase.from('inventory').upsert(defaultData.inventory.map(i => ({
                id: i.id,
                name: i.name,
                sku: i.sku || null,
                category: i.category || 'General',
                quantity: i.quantity || 0,
                unit_price: i.unit_price || 0,
                reorder_level: i.reorder_level || 5,
                location: i.location || null,
                supplier: i.supplier || null
            })));
            if (error) console.error("Error seeding inventory:", error.message);
            else console.log(`Seeded ${defaultData.inventory.length} inventory items`);
        }

        // Always seed equipment
        if (Array.isArray(defaultData.equipment)) {
            const { error } = await supabase.from('equipment').upsert(defaultData.equipment.map(e => ({
                id: e.id,
                name: e.name,
                type: e.type || 'General',
                customer_id: e.customerId || null,
                location: e.location || null,
                serial_number: e.serial_number || null,
                install_date: e.install_date || null,
                status: e.status || 'operational',
                notes: e.notes || null
            })));
            if (error) console.error("Error seeding equipment:", error.message);
            else console.log(`Seeded ${defaultData.equipment.length} equipment items`);
        }

        // Always seed quotes
        if (Array.isArray(defaultData.quotes)) {
            const { error } = await supabase.from('quotes').upsert(defaultData.quotes.map(q => ({
                id: q.id,
                customer_id: q.customerId || null,
                title: q.title,
                description: q.description || null,
                status: q.status || 'pending',
                total_amount: q.total_amount || 0,
                valid_until: q.valid_until || null,
                items_json: q.items || [],
                created_by: q.created_by || null,
                job_id: q.jobId || null
            })));
            if (error) console.error("Error seeding quotes:", error.message);
            else console.log(`Seeded ${defaultData.quotes.length} quotes`);
        }

        // Load everything into memory
        return {
            users: await loadUsers(),
            customers: await loadCustomers(),
            jobs: await loadJobs(),
            invoices: await loadInvoices(),
            projects: await loadProjects(),
            tasks: await loadTasks(),
            activityLogs: await loadActivityLogs(),
            notifications: await loadNotifications(),
            inventory: await loadInventory(),
            equipment: await loadEquipment(),
            quotes: await loadQuotes(),
            technicians: await loadTechnicians()
        };
    };

    const loadUsers = async () => {
        const { data } = await supabase.from('users').select('*').order('username');
        return data || [];
    };

    const loadCustomers = async () => {
        const { data } = await supabase.from('customers').select('*').order('name');
        if (!data) return [];
        return data.map(row => ({
            id: row.id,
            name: row.name,
            email: row.email || '',
            phone: row.phone || '',
            address: row.address || '',
            created_at: row.created_at,
            updated_at: row.updated_at,
        }));
    };

    const loadJobs = async () => {
        const { data } = await supabase.from('jobs').select(`
      *,
      job_photos(*),
      job_worklogs(*)
    `).order('created_at', { ascending: false });
        return (data || []).map(mapJobFromRow);
    };

    const loadInvoices = async () => {
        const { data } = await supabase.from('invoices').select('*').order('issued_date', { ascending: false });
        if (!data) return [];
        return data.map(row => ({
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
    };

    const loadProjects = async () => {
        const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
        if (!data) return [];
        return data.map(row => ({
            ...row,
            start_date: row.start_date,
            end_date: row.end_date,
            overall_progress: Number(row.overall_progress)
        }));
    };

    const loadTasks = async () => {
        const { data } = await supabase.from('tasks').select('*').order('sort_order').order('name');
        if (!data) return [];
        return data.map(row => ({
            ...row,
            duration_days: Number(row.duration_days),
            progress_percent: Number(row.progress_percent),
            weight: Number(row.weight),
            sort_order: Number(row.sort_order)
        }));
    };

    const loadActivityLogs = async () => {
        const { data } = await supabase.from('activity_logs').select('*').order('timestamp', { ascending: false }).limit(100);
        return data || [];
    };

    const loadNotifications = async () => {
        const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
        return data || [];
    };

    const loadInventory = async () => {
        const { data } = await supabase.from('inventory').select('*').order('name');
        if (!data) return [];
        return data.map(row => ({
            id: row.id,
            name: row.name,
            sku: row.sku || '',
            category: row.category || 'General',
            quantity: Number(row.quantity || 0),
            unit_price: Number(row.unit_price || 0),
            reorder_level: Number(row.reorder_level || 5),
            location: row.location || '',
            supplier: row.supplier || '',
            created_at: row.created_at
        }));
    };

    const loadEquipment = async () => {
        const { data } = await supabase.from('equipment').select('*').order('name');
        if (!data) return [];
        return data.map(row => ({
            id: row.id,
            name: row.name,
            type: row.type || 'General',
            customerId: row.customer_id || '',
            location: row.location || '',
            serial_number: row.serial_number || '',
            install_date: row.install_date,
            status: row.status || 'operational',
            notes: row.notes || '',
            created_at: row.created_at
        }));
    };

    const loadQuotes = async () => {
        const { data } = await supabase.from('quotes').select('*').order('created_at', { ascending: false });
        if (!data) return [];
        return data.map(row => ({
            id: row.id,
            customerId: row.customer_id || '',
            title: row.title,
            description: row.description || '',
            status: row.status || 'pending',
            total_amount: Number(row.total_amount || 0),
            valid_until: row.valid_until,
            items: asJson(row.items_json, []),
            created_by: row.created_by,
            jobId: row.job_id || null,
            created_at: row.created_at
        }));
    };

    const loadTechnicians = async () => {
        const { data } = await supabase.from('technicians').select('*').order('name');
        if (!data) return [];
        return data.map(row => ({
            id: row.id,
            name: row.name,
            email: row.email || '',
            phone: row.phone || '',
            role: row.role || 'technician',
            skills: asJson(row.skills, []),
            hourly_rate: Number(row.hourly_rate || 0),
            certifications: asJson(row.certifications, []),
            availability: asJson(row.availability, null),
            status: row.status || 'active',
            color: row.color || '#0ea5e9',
            hire_date: row.hire_date,
            notes: row.notes || ''
        }));
    };

    const persistCustomer = async (customer) => {
        const row = {
            id: customer.id,
            name: customer.name,
            email: customer.email || null,
            phone: customer.phone || null,
            address: customer.address || null,
            created_at: customer.created_at || new Date().toISOString(),
            updated_at: customer.updated_at || new Date().toISOString()
        };
        await supabase.from('customers').upsert(row);
    };

    const deleteCustomer = async (id) => {
        await supabase.from('customers').delete().eq('id', id);
    };

    const persistJob = async (job) => {
        const dbJob = {
            id: job.id,
            title: job.title,
            status: job.status || 'new',
            priority: job.priority || 'medium',
            assigned_to: job.assignedTo || null,
            location: job.location || null,
            customer_id: job.customerId || null,
            scheduled_date: job.scheduledDate || null,
            category: job.category || 'general',
            notes: job.notes || null,
            technician_notes: job.technicianNotes || null,
            completion_notes: job.completionNotes || null,
            checkin_time: job.checkinTime || null,
            checkout_time: job.checkoutTime || null,
            project_id: job.projectId || null,
            task_id: job.taskId || null,
            parts_used_json: job.partsUsed || [],
            materials_used_json: job.materialsUsed || [],
            created_at: job.created_at || new Date().toISOString(),
            updated_at: job.updated_at || new Date().toISOString()
        };
        await supabase.from('jobs').upsert(dbJob);

        await supabase.from('job_photos').delete().eq('job_id', job.id);
        if (job.photos && job.photos.length > 0) {
            await supabase.from('job_photos').insert(job.photos.map(p => ({
                id: p.id,
                job_id: job.id,
                data: p.data,
                mime_type: p.mimeType || null,
                uploaded_by: p.uploadedBy || null,
                uploaded_at: p.uploadedAt || new Date().toISOString()
            })));
        }

        await supabase.from('job_worklogs').delete().eq('job_id', job.id);
        if (job.worklog && job.worklog.length > 0) {
            await supabase.from('job_worklogs').insert(job.worklog.map(w => ({
                job_id: job.id,
                at: w.at || new Date().toISOString(),
                by_user: w.by || null,
                technician_notes: w.technicianNotes || null,
                parts_used_json: w.partsUsed || [],
                materials_used_json: w.materialsUsed || []
            })));
        }
    };

    const persistInvoice = async (invoice) => {
        await supabase.from('invoices').upsert({
            id: invoice.id,
            job_id: invoice.jobId || null,
            customer_id: invoice.customerId || null,
            amount: invoice.amount || 0,
            status: invoice.status || 'pending',
            issued_date: invoice.issuedDate || null,
            paid_date: invoice.paidDate || null,
            description: invoice.description || null,
            created_at: invoice.created_at || new Date().toISOString(),
            updated_at: invoice.updated_at || new Date().toISOString()
        });
    };

    const persistSession = async (token, user, createdAt = new Date().toISOString(), expiresAt = null) => {
        await supabase.from('sessions').upsert({
            token,
            user_id: user.id || null,
            user_json: user,
            created_at: createdAt,
            expires_at: expiresAt
        });
    };

    const deleteSession = async (token) => {
        await supabase.from('sessions').delete().eq('token', token);
    };

    const loadSessions = async () => {
        const { data } = await supabase.from('sessions').select('*');
        if (!data) return [];
        return data.map(row => ({
            token: row.token,
            user: typeof row.user_json === 'string' ? JSON.parse(row.user_json) : row.user_json,
            createdAt: row.created_at
        }));
    };

    const persistProject = async (project) => {
        await supabase.from('projects').upsert({
            id: project.id,
            title: project.title,
            description: project.description || null,
            start_date: project.start_date || null,
            end_date: project.end_date || null,
            status: project.status || 'planning',
            overall_progress: project.overall_progress || 0,
            created_by: project.created_by || null,
            created_at: project.created_at || new Date().toISOString(),
            updated_at: project.updated_at || new Date().toISOString()
        });
    };

    const deleteProject = async (id) => {
        await supabase.from('projects').delete().eq('id', id);
    };

    const persistTask = async (task) => {
        await supabase.from('tasks').upsert({
            id: task.id,
            project_id: task.project_id,
            parent_task_id: task.parent_task_id || null,
            name: task.name,
            start_date: task.start_date || null,
            end_date: task.end_date || null,
            duration_days: task.duration_days || 0,
            progress_percent: task.progress_percent || 0,
            weight: task.weight || 1,
            status: task.status || 'not_started',
            sort_order: task.sort_order || 0,
            notes: task.notes || null,
            updated_by: task.updated_by || null,
            updated_at: task.updated_at || new Date().toISOString()
        });
    };

    const deleteTask = async (id) => {
        await supabase.from('tasks').delete().eq('id', id);
    };

    const persistInventory = async (item) => {
        await supabase.from('inventory').upsert({
            id: item.id,
            name: item.name,
            sku: item.sku || null,
            category: item.category || 'General',
            quantity: item.quantity || 0,
            unit_price: item.unit_price || 0,
            reorder_level: item.reorder_level || 5,
            location: item.location || null,
            supplier: item.supplier || null,
            created_at: item.created_at || new Date().toISOString()
        });
    };

    const deleteInventory = async (id) => {
        await supabase.from('inventory').delete().eq('id', id);
    };

    const persistEquipment = async (equipment) => {
        await supabase.from('equipment').upsert({
            id: equipment.id,
            name: equipment.name,
            type: equipment.type || 'General',
            customer_id: equipment.customerId || null,
            location: equipment.location || null,
            serial_number: equipment.serial_number || null,
            install_date: equipment.install_date || null,
            status: equipment.status || 'operational',
            notes: equipment.notes || null,
            created_at: equipment.created_at || new Date().toISOString()
        });
    };

    const deleteEquipment = async (id) => {
        await supabase.from('equipment').delete().eq('id', id);
    };

    const persistQuote = async (quote) => {
        await supabase.from('quotes').upsert({
            id: quote.id,
            customer_id: quote.customerId || null,
            title: quote.title,
            description: quote.description || null,
            status: quote.status || 'pending',
            total_amount: quote.total_amount || 0,
            valid_until: quote.valid_until || null,
            items_json: quote.items || [],
            created_by: quote.created_by || null,
            job_id: quote.jobId || null,
            created_at: quote.created_at || new Date().toISOString()
        });
    };

    const deleteQuote = async (id) => {
        await supabase.from('quotes').delete().eq('id', id);
    };

    const persistTechnician = async (technician) => {
        await supabase.from('technicians').upsert({
            id: technician.id,
            name: technician.name,
            email: technician.email || null,
            phone: technician.phone || null,
            role: technician.role || 'technician',
            skills: technician.skills || [],
            hourly_rate: technician.hourly_rate || 0,
            certifications: technician.certifications || [],
            availability: technician.availability || null,
            status: technician.status || 'active',
            color: technician.color || '#0ea5e9',
            hire_date: technician.hire_date || null,
            notes: technician.notes || null
        });
    };

    const deleteTechnician = async (id) => {
        await supabase.from('technicians').delete().eq('id', id);
    };

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
        loadInventory,
        loadEquipment,
        loadQuotes,
        loadTechnicians,
        persistCustomer,
        deleteCustomer,
        persistJob,
        persistInvoice,
        persistSession,
        deleteSession,
        loadSessions,
        persistProject,
        deleteProject,
        persistTask,
        deleteTask,
        persistInventory,
        deleteInventory,
        persistEquipment,
        deleteEquipment,
        persistQuote,
        deleteQuote,
        persistTechnician,
        deleteTechnician,
        supabase
    };
};

module.exports = {
    createDb
};
