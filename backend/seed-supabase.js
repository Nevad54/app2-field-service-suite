const { createDb } = require('./db/index-supabase');
const fs = require('fs');

// All data from server.js

const users = [
    { id: 'u-admin', username: 'admin', password: '1111', role: 'admin' },
    { id: 'u-dispatch', username: 'dispatcher', password: '1111', role: 'dispatcher' },
    { id: 'u-tech', username: 'technician', password: '1111', role: 'technician' },
    { id: 'u-client', username: 'client', password: '1111', role: 'client' },
];

const technicians = [
 { id: 'tech-1', name: 'John Smith', email: 'john.smith@example.com', phone: '555-1001', role: 'technician', skills: ['HVAC', 'Electrical', 'Refrigeration'], hourly_rate: 75, certifications: ['EPA 608 Universal', 'OSHA 10', 'NATE Certified'], availability: { monday: { start: '08:00', end: '17:00' }, tuesday: { start: '08:00', end: '17:00' }, wednesday: { start: '08:00', end: '17:00' }, thursday: { start: '08:00', end: '17:00' }, friday: { start: '08:00', end: '17:00' }, saturday: null, sunday: null }, status: 'active', color: '#0ea5e9', hire_date: '2023-01-15', notes: 'Senior technician, 10+ years experience' },
 { id: 'tech-2', name: 'Maria Garcia', email: 'maria.garcia@example.com', phone: '555-1002', role: 'technician', skills: ['Plumbing', 'Gas Fitting', 'Backflow Prevention'], hourly_rate: 70, certifications: ['Master Plumber', 'OSHA 10', 'Certified Gas Fitter'], availability: { monday: { start: '07:00', end: '16:00' }, tuesday: { start: '07:00', end: '16:00' }, wednesday: { start: '07:00', end: '16:00' }, thursday: { start: '07:00', end: '16:00' }, friday: { start: '07:00', end: '16:00' }, saturday: { start: '08:00', end: '12:00' }, sunday: null }, status: 'active', color: '#10b981', hire_date: '2023-03-20', notes: 'Specialist in commercial plumbing' },
 { id: 'tech-3', name: 'Robert Johnson', email: 'robert.johnson@example.com', phone: '555-1003', role: 'technician', skills: ['Electrical', 'Security Systems', 'Networking'], hourly_rate: 80, certifications: ['Master Electrician', 'OSHA 10', 'Security License'], availability: { monday: { start: '08:00', end: '17:00' }, tuesday: { start: '08:00', end: '17:00' }, wednesday: { start: '08:00', end: '17:00' }, thursday: { start: '08:00', end: '17:00' }, friday: { start: '08:00', end: '17:00' }, saturday: null, sunday: null }, status: 'active', color: '#f59e0b', hire_date: '2022-08-10', notes: 'Expert in commercial electrical and security' },
 { id: 'tech-4', name: 'Sarah Williams', email: 'sarah.williams@example.com', phone: '555-1004', role: 'technician', skills: ['HVAC', 'Building Automation', 'Controls'], hourly_rate: 72, certifications: ['EPA 608 Type II', 'OSHA 10', 'BACnet Certified'], availability: { monday: { start: '09:00', end: '18:00' }, tuesday: { start: '09:00', end: '18:00' }, wednesday: { start: '09:00', end: '18:00' }, thursday: { start: '09:00', end: '18:00' }, friday: { start: '09:00', end: '18:00' }, saturday: null, sunday: null }, status: 'active', color: '#8b5cf6', hire_date: '2024-01-05', notes: 'Specializes in smart building systems' },
 { id: 'tech-5', name: 'David Brown', email: 'david.brown@example.com', phone: '555-1005', role: 'technician', skills: ['General Maintenance', 'Carpentry', 'Painting'], hourly_rate: 55, certifications: ['OSHA 10', 'General Contractor License'], availability: { monday: { start: '08:00', end: '17:00' }, tuesday: { start: '08:00', end: '17:00' }, wednesday: { start: '08:00', end: '17:00' }, thursday: { start: '08:00', end: '17:00' }, friday: null, saturday: { start: '09:00', end: '15:00' }, sunday: null }, status: 'on_leave', color: '#ec4899', hire_date: '2023-06-15', notes: 'Currently on paternity leave until April' }
];

const customers = [
 { id: 'CUST-001', name: 'Acme Corporation', email: 'contact@acme.com', phone: '555-0101', address: '123 Business Ave, Downtown', created_at: '2026-01-05T10:00:00Z' },
 { id: 'CUST-002', name: 'TechStart Inc', email: 'info@techstart.io', phone: '555-0102', address: '456 Innovation Blvd, Tech Park', created_at: '2026-01-10T14:30:00Z' },
 { id: 'CUST-003', name: 'Global Logistics', email: 'ops@globallog.com', phone: '555-0103', address: '789 Harbor Road, Port District', created_at: '2026-01-15T09:00:00Z' },
 { id: 'CUST-004', name: 'Metro Healthcare', email: 'facilities@metrohealth.org', phone: '555-0104', address: '321 Medical Center Dr, Health District', created_at: '2026-01-20T11:00:00Z' },
 { id: 'CUST-005', name: 'Riverside School District', email: 'maintenance@riverside.edu', phone: '555-0105', address: '654 Education Way, Riverside', created_at: '2026-02-01T08:00:00Z' },
 { id: 'CUST-006', name: 'Sunset Hotels', email: 'ops@sunsethotels.com', phone: '555-0106', address: '987 Resort Lane, Beachfront', created_at: '2026-02-10T13:00:00Z' },
 { id: 'CUST-007', name: 'Midwest Manufacturing', email: 'plant@midwestmfg.com', phone: '555-0107', address: '147 Industrial Pkwy, Commerce City', created_at: '2026-02-15T10:30:00Z' },
 { id: 'CUST-008', name: 'Evergreen Properties', email: 'maintenance@evergreen.com', phone: '555-0108', address: '258 Green Valley Rd, Suburbs', created_at: '2026-02-20T15:00:00Z' },
];

const jobs = [
 { id: 'JOB-1001', title: 'HVAC preventive maintenance', status: 'completed', priority: 'medium', assignedTo: 'technician', location: 'Building A - Acme Corp', scheduledDate: '2026-01-20', customerId: 'CUST-001', category: 'maintenance', notes: 'Quarterly maintenance completed', created_at: '2026-01-15T08:00:00Z' },
 { id: 'JOB-1002', title: 'Generator inspection', status: 'completed', priority: 'high', assignedTo: 'technician', location: 'Warehouse North - Global Logistics', scheduledDate: '2026-01-25', customerId: 'CUST-003', category: 'inspection', notes: 'All systems operational', created_at: '2026-01-18T09:00:00Z' },
 { id: 'JOB-1003', title: 'Electrical panel audit', status: 'in-progress', priority: 'high', assignedTo: 'technician', location: 'Main Plant - Midwest Mfg', scheduledDate: '2026-02-15', customerId: 'CUST-007', category: 'audit', notes: 'In progress - 60% complete', created_at: '2026-02-10T10:00:00Z' },
 { id: 'JOB-1004', title: 'Plumbing system check', status: 'assigned', priority: 'medium', assignedTo: 'technician', location: 'TechStart Office', scheduledDate: '2026-02-20', customerId: 'CUST-002', category: 'maintenance', notes: 'Scheduled for next week', created_at: '2026-02-12T11:00:00Z' },
 { id: 'JOB-1005', title: 'Fire safety inspection', status: 'new', priority: 'high', assignedTo: '', location: 'Metro Healthcare', scheduledDate: '2026-02-25', customerId: 'CUST-004', category: 'safety', notes: 'Annual inspection required', created_at: '2026-02-14T08:00:00Z' },
 { id: 'JOB-1006', title: 'Elevator maintenance', status: 'assigned', priority: 'medium', assignedTo: 'technician', location: 'Sunset Hotels - Main Building', scheduledDate: '2026-02-18', customerId: 'CUST-006', category: 'maintenance', notes: 'Quarterly maintenance', created_at: '2026-02-08T14:00:00Z' },
 { id: 'JOB-1007', title: 'Security system upgrade', status: 'in-progress', priority: 'high', assignedTo: 'technician', location: 'Riverside School District', scheduledDate: '2026-02-10', customerId: 'CUST-005', category: 'installation', notes: 'Installing new access control', created_at: '2026-02-05T09:00:00Z' },
 { id: 'JOB-1008', title: 'HVAC repair - cooling issue', status: 'new', priority: 'urgent', assignedTo: '', location: 'Evergreen Properties', scheduledDate: '2026-02-22', customerId: 'CUST-008', category: 'repair', notes: 'AC not cooling properly', created_at: '2026-02-15T16:00:00Z' },
];

const invoices = [
 { id: 'INV-2026-001', jobId: 'JOB-1001', customerId: 'CUST-001', amount: 450.00, status: 'paid', issuedDate: '2026-01-20', paidDate: '2026-01-25', description: 'HVAC preventive maintenance - Q1 2026' },
 { id: 'INV-2026-002', jobId: 'JOB-1002', customerId: 'CUST-003', amount: 275.00, status: 'paid', issuedDate: '2026-01-25', paidDate: '2026-01-28', description: 'Generator inspection services' },
 { id: 'INV-2026-003', jobId: 'JOB-1003', customerId: 'CUST-007', amount: 850.00, status: 'pending', issuedDate: '2026-02-15', paidDate: null, description: 'Electrical panel audit - progress billing' },
 { id: 'INV-2026-004', jobId: 'JOB-1006', customerId: 'CUST-006', amount: 600.00, status: 'pending', issuedDate: '2026-02-18', paidDate: null, description: 'Elevator maintenance - Q1 2026' },
 { id: 'INV-2026-005', jobId: 'JOB-1007', customerId: 'CUST-005', amount: 1200.00, status: 'paid', issuedDate: '2026-02-10', paidDate: '2026-02-12', description: 'Security system installation - deposit' },
 { id: 'INV-2026-006', jobId: 'JOB-1004', customerId: 'CUST-002', amount: 350.00, status: 'pending', issuedDate: '2026-02-20', paidDate: null, description: 'Plumbing system check' },
];

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

const projects = [
 { id: 'proj-1', title: 'Office Building Renovation', description: 'Complete renovation of the main office building including HVAC, electrical, and plumbing', start_date: '2026-01-15', end_date: '2026-06-30', status: 'in_progress', overall_progress: 35, created_by: 'admin', created_at: '2026-01-10T08:00:00Z', updated_at: '2026-02-15T10:30:00Z' },
 { id: 'proj-2', title: 'Warehouse Expansion', description: 'Expand warehouse capacity by 5000 sq ft', start_date: '2026-03-01', end_date: '2026-08-31', status: 'planning', overall_progress: 0, created_by: 'admin', created_at: '2026-02-01T09:00:00Z', updated_at: '2026-02-01T09:00:00Z' },
 { id: 'proj-3', title: 'Hospital Wing Construction', description: 'New 3-story medical wing with specialized HVAC and emergency power systems', start_date: '2026-02-01', end_date: '2026-12-15', status: 'active', overall_progress: 25, created_by: 'admin', created_at: '2026-01-20T10:00:00Z', updated_at: '2026-03-01T14:00:00Z' },
 { id: 'proj-4', title: 'School District HVAC Upgrade', description: 'Replace aging HVAC systems across 5 school buildings', start_date: '2026-01-05', end_date: '2026-04-30', status: 'delayed', overall_progress: 60, created_by: 'admin', created_at: '2026-01-02T09:00:00Z', updated_at: '2026-03-15T11:00:00Z' },
 { id: 'proj-5', title: 'Shopping Mall Renovation', description: 'Complete interior renovation of 200,000 sq ft shopping center', start_date: '2026-04-01', end_date: '2026-09-30', status: 'not_started', overall_progress: 0, created_by: 'admin', created_at: '2026-02-20T08:00:00Z', updated_at: '2026-02-20T08:00:00Z' }
];

const tasks = [
 { id: 'task-1-1', project_id: 'proj-1', parent_task_id: null, name: 'Phase 1: Planning & Design', start_date: '2026-01-15', end_date: '2026-02-15', duration_days: 32, progress_percent: 100, weight: 10, status: 'completed', sort_order: 1, notes: 'Completed architectural drawings', updated_by: 'admin', updated_at: '2026-02-15T16:00:00Z' },
 { id: 'task-1-2', project_id: 'proj-1', parent_task_id: null, name: 'Phase 2: HVAC Installation', start_date: '2026-02-16', end_date: '2026-04-30', duration_days: 74, progress_percent: 45, weight: 10, status: 'in_progress', sort_order: 2, notes: 'In progress - 60% of units installed', updated_by: 'admin', updated_at: '2026-03-15T11:00:00Z' },
 { id: 'task-1-2-1', project_id: 'proj-1', parent_task_id: 'task-1-2', name: 'HVAC Unit 1 - Floor 1', start_date: '2026-02-16', end_date: '2026-03-15', duration_days: 28, progress_percent: 100, weight: 10, status: 'completed', sort_order: 1, notes: '', updated_by: 'admin', updated_at: '2026-03-15T10:00:00Z' },
 { id: 'task-1-2-2', project_id: 'proj-1', parent_task_id: 'task-1-2', name: 'HVAC Unit 2 - Floor 2', start_date: '2026-03-01', end_date: '2026-04-15', duration_days: 46, progress_percent: 30, weight: 10, status: 'in_progress', sort_order: 2, notes: 'In progress', updated_by: 'admin', updated_at: '2026-03-15T11:00:00Z' },
 { id: 'task-1-2-3', project_id: 'proj-1', parent_task_id: 'task-1-2', name: 'HVAC Unit 3 - Floor 3', start_date: '2026-04-01', end_date: '2026-04-30', duration_days: 30, progress_percent: 0, weight: 10, status: 'not_started', sort_order: 3, notes: 'Scheduled to start', updated_by: 'admin', updated_at: '2026-02-15T10:00:00Z' },
 { id: 'task-1-3', project_id: 'proj-1', parent_task_id: null, name: 'Phase 3: Electrical Work', start_date: '2026-03-01', end_date: '2026-05-31', duration_days: 92, progress_percent: 20, weight: 20, status: 'in_progress', sort_order: 3, notes: 'Started wiring', updated_by: 'admin', updated_at: '2026-03-15T09:00:00Z' },
 { id: 'task-1-4', project_id: 'proj-1', parent_task_id: null, name: 'Phase 4: Plumbing', start_date: '2026-04-01', end_date: '2026-06-15', duration_days: 76, progress_percent: 0, weight: 20, status: 'not_started', sort_order: 4, notes: 'Pending', updated_by: 'admin', updated_at: '2026-02-15T10:00:00Z' },
 { id: 'task-1-5', project_id: 'proj-1', parent_task_id: null, name: 'Phase 5: Final Inspections', start_date: '2026-06-01', end_date: '2026-06-30', duration_days: 30, progress_percent: 0, weight: 10, status: 'not_started', sort_order: 5, notes: '', updated_by: 'admin', updated_at: '2026-02-15T10:00:00Z' },
 { id: 'task-3-1', project_id: 'proj-3', parent_task_id: null, name: 'Foundation & Structural', start_date: '2026-02-01', end_date: '2026-04-30', duration_days: 89, progress_percent: 80, weight: 25, status: 'in_progress', sort_order: 1, notes: 'Foundation complete, steel framing 60% done', updated_by: 'admin', updated_at: '2026-03-15T10:00:00Z' },
 { id: 'task-3-2', project_id: 'proj-3', parent_task_id: null, name: 'Medical Gas Systems', start_date: '2026-05-01', end_date: '2026-07-31', duration_days: 92, progress_percent: 10, weight: 20, status: 'in_progress', sort_order: 2, notes: 'Design phase complete, procurement started', updated_by: 'admin', updated_at: '2026-03-10T14:00:00Z' },
 { id: 'task-3-3', project_id: 'proj-3', parent_task_id: null, name: 'Emergency Power Installation', start_date: '2026-06-01', end_date: '2026-08-31', duration_days: 92, progress_percent: 0, weight: 20, status: 'not_started', sort_order: 3, notes: 'Generators on order', updated_by: 'admin', updated_at: '2026-02-25T09:00:00Z' },
 { id: 'task-3-4', project_id: 'proj-3', parent_task_id: null, name: 'Specialized HVAC', start_date: '2026-08-01', end_date: '2026-10-31', duration_days: 92, progress_percent: 0, weight: 20, status: 'not_started', sort_order: 4, notes: 'Clean room systems pending', updated_by: 'admin', updated_at: '2026-02-20T11:00:00Z' },
 { id: 'task-3-5', project_id: 'proj-3', parent_task_id: null, name: 'Final Certification', start_date: '2026-11-01', end_date: '2026-12-15', duration_days: 45, progress_percent: 0, weight: 15, status: 'not_started', sort_order: 5, notes: 'Medical certification required', updated_by: 'admin', updated_at: '2026-02-20T11:00:00Z' },
 { id: 'task-4-1', project_id: 'proj-4', parent_task_id: null, name: 'Site 1: Riverside Elementary', start_date: '2026-01-05', end_date: '2026-02-15', duration_days: 42, progress_percent: 100, weight: 20, status: 'completed', sort_order: 1, notes: 'Completed on schedule', updated_by: 'admin', updated_at: '2026-02-15T16:00:00Z' },
 { id: 'task-4-2', project_id: 'proj-4', parent_task_id: null, name: 'Site 2: Central Middle School', start_date: '2026-02-01', end_date: '2026-03-15', duration_days: 43, progress_percent: 70, weight: 20, status: 'delayed', sort_order: 2, notes: 'Equipment delivery delayed 2 weeks', updated_by: 'admin', updated_at: '2026-03-20T10:00:00Z' },
 { id: 'task-4-3', project_id: 'proj-4', parent_task_id: null, name: 'Site 3: Westside High', start_date: '2026-02-15', end_date: '2026-03-30', duration_days: 44, progress_percent: 40, weight: 20, status: 'delayed', sort_order: 3, notes: 'Waiting for permits', updated_by: 'admin', updated_at: '2026-03-18T14:00:00Z' },
 { id: 'task-4-4', project_id: 'proj-4', parent_task_id: null, name: 'Site 4: North Academy', start_date: '2026-03-01', end_date: '2026-04-15', duration_days: 46, progress_percent: 20, weight: 20, status: 'in_progress', sort_order: 4, notes: 'Started late due to weather', updated_by: 'admin', updated_at: '2026-03-15T09:00:00Z' },
 { id: 'task-4-5', project_id: 'proj-4', parent_task_id: null, name: 'Site 5: South Elementary', start_date: '2026-03-15', end_date: '2026-04-30', duration_days: 47, progress_percent: 0, weight: 20, status: 'not_started', sort_order: 5, notes: 'Pending completion of Site 4', updated_by: 'admin', updated_at: '2026-03-01T10:00:00Z' },
 { id: 'task-5-1', project_id: 'proj-5', parent_task_id: null, name: 'Demolition & Site Prep', start_date: '2026-04-01', end_date: '2026-05-15', duration_days: 45, progress_percent: 0, weight: 15, status: 'not_started', sort_order: 1, notes: 'Permits pending approval', updated_by: 'admin', updated_at: '2026-02-20T08:00:00Z' },
 { id: 'task-5-2', project_id: 'proj-5', parent_task_id: null, name: 'Electrical Infrastructure', start_date: '2026-05-01', end_date: '2026-06-30', duration_days: 61, progress_percent: 0, weight: 20, status: 'not_started', sort_order: 2, notes: 'Design review scheduled', updated_by: 'admin', updated_at: '2026-02-20T08:00:00Z' },
 { id: 'task-5-3', project_id: 'proj-5', parent_task_id: null, name: 'HVAC Modernization', start_date: '2026-06-15', end_date: '2026-08-15', duration_days: 62, progress_percent: 0, weight: 20, status: 'not_started', sort_order: 3, notes: 'Energy efficient systems selected', updated_by: 'admin', updated_at: '2026-02-20T08:00:00Z' },
 { id: 'task-5-4', project_id: 'proj-5', parent_task_id: null, name: 'Interior Build-out', start_date: '2026-07-01', end_date: '2026-09-15', duration_days: 77, progress_percent: 0, weight: 25, status: 'not_started', sort_order: 4, notes: 'Tenant coordination required', updated_by: 'admin', updated_at: '2026-02-20T08:00:00Z' },
 { id: 'task-5-5', project_id: 'proj-5', parent_task_id: null, name: 'Final Inspections & Opening', start_date: '2026-09-01', end_date: '2026-09-30', duration_days: 30, progress_percent: 0, weight: 20, status: 'not_started', sort_order: 5, notes: 'Grand opening scheduled Oct 1', updated_by: 'admin', updated_at: '2026-02-20T08:00:00Z' }
];

const notifications = [
 { id: 'notif-001', user_id: 'admin', type: 'info', title: 'Job Completed', message: 'HVAC preventive maintenance completed successfully', read: false, created_at: '2026-01-20T10:30:00Z' },
 { id: 'notif-002', user_id: 'admin', type: 'info', title: 'Payment Received', message: 'Invoice INV-2026-001 has been paid', read: true, created_at: '2026-01-25T14:00:00Z' },
 { id: 'notif-003', user_id: 'admin', type: 'info', title: 'New Job Assigned', message: 'New job: Electrical panel audit assigned to technician', read: false, created_at: '2026-02-10T10:00:00Z' },
];

// Additional data - Inventory
const inventory = [
 { id: 'INV-001', name: 'HVAC Filter 20x25x1', sku: 'FLT-2025-01', category: 'Filters', quantity: 50, unit_price: 15.99, reorder_level: 10, location: 'Warehouse A', supplier: 'AirPure Supplies', created_at: '2026-01-05T08:00:00Z' },
 { id: 'INV-002', name: 'Capacitor 45/5 MFD', sku: 'CAP-455-01', category: 'Electrical', quantity: 25, unit_price: 35.50, reorder_level: 5, location: 'Warehouse B', supplier: 'CoolTech Parts', created_at: '2026-01-10T09:00:00Z' },
 { id: 'INV-003', name: 'Refrigerant R-410A (25lb)', sku: 'REF-410A-25', category: 'Refrigerant', quantity: 12, unit_price: 185.00, reorder_level: 3, location: 'Warehouse A', supplier: 'ChemCool Inc', created_at: '2026-01-15T10:00:00Z' },
 { id: 'INV-004', name: 'Contactor 30A 24V', sku: 'CON-30-24', category: 'Electrical', quantity: 30, unit_price: 22.75, reorder_level: 8, location: 'Warehouse B', supplier: 'ElectricPro', created_at: '2026-01-20T11:00:00Z' },
 { id: 'INV-005', name: 'Thermostat Digital', sku: 'THER-DIG-01', category: 'Controls', quantity: 15, unit_price: 89.99, reorder_level: 5, location: 'Warehouse A', supplier: 'SmartHome Tech', created_at: '2026-02-01T08:00:00Z' },
 { id: 'INV-006', name: 'Copper Pipe 1/2" (100ft)', sku: 'PIPE-CU-12', category: 'Plumbing', quantity: 8, unit_price: 125.00, reorder_level: 3, location: 'Warehouse C', supplier: 'PipeMaster', created_at: '2026-02-05T14:00:00Z' },
 { id: 'INV-007', name: 'Ball Valve 3/4"', sku: 'VALVE-BV-34', category: 'Plumbing', quantity: 40, unit_price: 18.50, reorder_level: 10, location: 'Warehouse C', supplier: 'PipeMaster', created_at: '2026-02-10T09:00:00Z' },
 { id: 'INV-008', name: 'Circuit Breaker 20A', sku: 'CB-20-01', category: 'Electrical', quantity: 60, unit_price: 12.99, reorder_level: 15, location: 'Warehouse B', supplier: 'ElectricPro', created_at: '2026-02-12T10:00:00Z' },
];

// Additional data - Equipment
const equipment = [
 { id: 'EQP-001', name: 'Carrier Rooftop Unit RTU-1', type: 'HVAC', customerId: 'CUST-001', location: 'Building A - Roof', serial_number: 'CR-2024-001', install_date: '2024-06-15', status: 'operational', notes: 'Primary building HVAC unit', created_at: '2026-01-05T08:00:00Z' },
 { id: 'EQP-002', name: 'Generator GEN-500', type: 'Electrical', customerId: 'CUST-003', location: 'Warehouse North', serial_number: 'GN-2023-042', install_date: '2023-11-20', status: 'operational', notes: '500kW backup generator', created_at: '2026-01-10T09:00:00Z' },
 { id: 'EQP-003', name: 'Boiler BLR-200', type: 'Plumbing', customerId: 'CUST-004', location: 'Mechanical Room', serial_number: 'BL-2022-015', install_date: '2022-08-10', status: 'operational', notes: 'Main hospital boiler', created_at: '2026-01-15T10:00:00Z' },
 { id: 'EQP-004', name: 'Chiller CH-1000', type: 'HVAC', customerId: 'CUST-006', location: 'Hotel Basement', serial_number: 'CH-2021-008', install_date: '2021-03-25', status: 'needs_maintenance', notes: 'Main cooling system - annual service due', created_at: '2026-01-20T11:00:00Z' },
 { id: 'EQP-005', name: 'Elevator ELV-3', type: 'General', customerId: 'CUST-006', location: 'Main Building', serial_number: 'ELV-2020-003', install_date: '2020-01-15', status: 'operational', notes: 'Passenger elevator', created_at: '2026-02-01T08:00:00Z' },
 { id: 'EQP-006', name: 'Security System SEC-HQ', type: 'Security', customerId: 'CUST-005', location: 'District Office', serial_number: 'SEC-2023-101', install_date: '2023-09-01', status: 'operational', notes: 'Headquarters access control', created_at: '2026-02-05T14:00:00Z' },
];

// Additional data - Quotes
const quotes = [
 { id: 'QUO-2026-001', customerId: 'CUST-001', title: 'HVAC Upgrade Proposal', description: 'Complete HVAC system upgrade for Building A', status: 'pending', total_amount: 45000.00, valid_until: '2026-03-15', created_by: 'admin', created_at: '2026-02-01T10:00:00Z', items_json: JSON.stringify([{ description: 'New RTU installation', quantity: 1, unit_price: 35000 }, { description: 'Ductwork modifications', quantity: 1, unit_price: 7500 }, { description: 'Electrical upgrades', quantity: 1, unit_price: 2500 }]) },
 { id: 'QUO-2026-002', customerId: 'CUST-002', title: 'Preventive Maintenance Contract', description: 'Annual PM contract for all systems', status: 'accepted', total_amount: 12000.00, valid_until: '2026-02-28', created_by: 'admin', created_at: '2026-02-10T09:00:00Z', accepted_at: '2026-02-12T14:00:00Z', jobId: null, items_json: JSON.stringify([{ description: 'Quarterly HVAC maintenance', quantity: 4, unit_price: 2000 }, { description: 'Emergency service call', quantity: 2, unit_price: 150 }, { description: 'Filter replacement', quantity: 12, unit_price: 150 }]) },
 { id: 'QUO-2026-003', customerId: 'CUST-004', title: 'Boiler Replacement Estimate', description: 'Replace aging boiler system', status: 'pending', total_amount: 85000.00, valid_until: '2026-04-01', created_by: 'admin', created_at: '2026-02-15T11:00:00Z', items_json: JSON.stringify([{ description: 'New boiler unit', quantity: 1, unit_price: 65000 }, { description: 'Piping and installation', quantity: 1, unit_price: 15000 }, { description: 'Permits and inspections', quantity: 1, unit_price: 5000 }]) },
];

// Additional data - Recurring Jobs
const recurringJobs = [
 { id: 'REC-001', customerId: 'CUST-001', title: 'Quarterly HVAC Maintenance', description: 'Preventive maintenance for all HVAC units', frequency: 'quarterly', interval_value: 3, interval_unit: 'months', start_date: '2026-01-15', end_date: '2026-12-31', status: 'active', assignedTo: 'technician', category: 'maintenance', priority: 'medium', estimated_duration_hours: 4, created_by: 'admin', created_at: '2026-01-05T08:00:00Z' },
 { id: 'REC-002', customerId: 'CUST-003', title: 'Monthly Generator Test', description: 'Monthly generator load test and inspection', frequency: 'monthly', interval_value: 1, interval_unit: 'months', start_date: '2026-01-01', end_date: '2026-12-31', status: 'active', assignedTo: 'technician', category: 'inspection', priority: 'high', estimated_duration_hours: 2, created_by: 'admin', created_at: '2026-01-10T09:00:00Z' },
 { id: 'REC-003', customerId: 'CUST-006', title: 'Weekly Elevator Inspection', description: 'Weekly safety inspection and test', frequency: 'weekly', interval_value: 1, interval_unit: 'weeks', start_date: '2026-01-01', end_date: null, status: 'active', assignedTo: 'technician', category: 'inspection', priority: 'high', estimated_duration_hours: 1, created_by: 'admin', created_at: '2026-01-15T10:00:00Z' },
 { id: 'REC-004', customerId: 'CUST-005', title: 'Annual Fire Safety Inspection', description: 'Yearly fire system inspection', frequency: 'yearly', interval_value: 1, interval_unit: 'years', start_date: '2026-06-01', end_date: '2026-06-30', status: 'scheduled', assignedTo: 'technician', category: 'safety', priority: 'high', estimated_duration_hours: 8, created_by: 'admin', created_at: '2026-02-01T08:00:00Z' },
];

async function seed() {
    const db = createDb();
    const supabase = db.supabase;

    console.log("Seeding users...");
    await db.bootstrap({ users });

    console.log("Seeding customers...");
    for (const c of customers) {
        await db.persistCustomer(c);
    }

    console.log("Seeding jobs...");
    for (const j of jobs) {
        await db.persistJob(j);
    }

    console.log("Seeding invoices...");
    for (const i of invoices) {
        await db.persistInvoice(i);
    }

    console.log("Seeding projects...");
    for (const p of projects) {
        await db.persistProject(p);
    }

    console.log("Seeding tasks...");
    for (const t of tasks) {
        await db.persistTask(t);
    }

    console.log("Seeding activity logs...");
    for (const act of activityLogs) {
        await supabase.from('activity_logs').upsert({
            id: act.id,
            entity_type: act.entity_type,
            entity_id: act.entity_id,
            user_id: act.user_id,
            action: act.action,
            description: act.description,
            timestamp: act.timestamp
        });
    }

    console.log("Seeding notifications...");
    for (const notif of notifications) {
        await supabase.from('notifications').upsert({
            id: notif.id,
            user_id: notif.user_id,
            type: notif.type,
            title: notif.title,
            message: notif.message,
            read: notif.read,
            created_at: notif.created_at
        });
    }

    console.log("Seeding inventory...");
    for (const inv of inventory) {
        await supabase.from('inventory').upsert({
            id: inv.id,
            name: inv.name,
            sku: inv.sku,
            category: inv.category,
            quantity: inv.quantity,
            unit_price: inv.unit_price,
            reorder_level: inv.reorder_level,
            location: inv.location,
            supplier: inv.supplier,
            created_at: inv.created_at
        });
    }

    console.log("Seeding equipment...");
    for (const eq of equipment) {
        await supabase.from('equipment').upsert({
            id: eq.id,
            name: eq.name,
            type: eq.type,
            customer_id: eq.customerId,
            location: eq.location,
            serial_number: eq.serial_number,
            install_date: eq.install_date,
            status: eq.status,
            notes: eq.notes,
            created_at: eq.created_at
        });
    }

    console.log("Seeding quotes...");
    for (const q of quotes) {
        await supabase.from('quotes').upsert({
            id: q.id,
            customer_id: q.customerId,
            title: q.title,
            description: q.description,
            status: q.status,
            total_amount: q.total_amount,
            valid_until: q.valid_until,
            created_by: q.created_by,
            accepted_at: q.accepted_at || null,
            job_id: q.jobId || null,
            items_json: q.items_json,
            created_at: q.created_at
        });
    }

    console.log("Seeding recurring jobs...");
    for (const rec of recurringJobs) {
        await supabase.from('recurring_jobs').upsert({
            id: rec.id,
            customer_id: rec.customerId,
            title: rec.title,
            description: rec.description,
            frequency: rec.frequency,
            interval_value: rec.interval_value,
            interval_unit: rec.interval_unit,
            start_date: rec.start_date,
            end_date: rec.end_date,
            status: rec.status,
            assigned_to: rec.assignedTo,
            category: rec.category,
            priority: rec.priority,
            estimated_duration_hours: rec.estimated_duration_hours,
            created_by: rec.created_by,
            created_at: rec.created_at
        });
    }

    console.log("Seed complete - ALL DATA POPULATED!");
    console.log("You can now start the server with: npm run dev");
}

seed().catch(err => console.error(err));
