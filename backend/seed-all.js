const { createDb } = require('./db/index-supabase');
const data = require('./temp-data.js');

async function seedAll() {
    console.log("Connecting to Supabase...");
    const db = createDb();

    console.log("Seeding Customers...");
    for (const c of data.customers || []) {
        await db.persistCustomer(c);
    }

    console.log("Seeding Jobs...");
    for (const j of data.jobs || []) {
        await db.persistJob(j);
    }

    console.log("Seeding Invoices...");
    for (const i of data.invoices || []) {
        await db.persistInvoice(i);
    }

    console.log("Seeding Projects...");
    for (const p of data.projects || []) {
        await db.persistProject(p);
    }

    console.log("Seeding Tasks...");
    for (const t of data.tasks || []) {
        await db.persistTask(t);
    }

    console.log("Seeding Technicians -> Users...");
    for (const tech of data.technicians || []) {
        await db.supabase.from('users').upsert({
            id: tech.id,
            username: tech.name.split(' ')[0].toLowerCase() + Math.floor(Math.random() * 100), // simplistic username
            password: 'password', // mock password
            role: 'technician'
        });
    }

    console.log("Seeding Activity Logs...");
    for (const act of data.activityLogs || []) {
        await db.supabase.from('activity_logs').upsert({
            id: act.id,
            entity_type: act.entity_type,
            entity_id: act.entity_id,
            user_id: act.user_id,
            action: act.action,
            description: act.description,
            timestamp: act.timestamp
        });
    }

    console.log("Seed complete!");
}

seedAll().catch(e => console.error("Error during seed:", e));
