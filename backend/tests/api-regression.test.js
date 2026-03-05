const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');

const PORT = 3016;
const BASE_URL = `http://localhost:${PORT}`;
const SERVER_BOOT_TIMEOUT_MS = 30000;

let serverProcess = null;
let adminToken = '';
let clientToken = '';
let createdProjectId = '';
let createdNotificationId = '';
let createdJobId = '';
let createdRecurringId = '';
let defaultCustomerId = '';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer() {
  const start = Date.now();
  while (Date.now() - start < SERVER_BOOT_TIMEOUT_MS) {
    try {
      const response = await fetch(`${BASE_URL}/api/status`);
      if (response.ok) return;
    } catch (_) {
      // ignore while booting
    }
    await sleep(500);
  }
  throw new Error('Server did not become ready in time');
}

async function api(path, { method = 'GET', token = '', body } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const text = await response.text();
  let payload = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch (_) {
    payload = { raw: text };
  }

  return { status: response.status, ok: response.ok, payload };
}

test.before(async () => {
  serverProcess = spawn('node', ['server-supabase.js'], {
    cwd: __dirname + '/../',
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'ignore',
  });

  await waitForServer();

  const adminLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { username: 'admin', password: '1111' },
  });
  assert.equal(adminLogin.status, 200, 'Admin login should succeed');
  assert.ok(adminLogin.payload.token, 'Admin token should be returned');
  adminToken = adminLogin.payload.token;

  const clientLogin = await api('/api/client/login', {
    method: 'POST',
    body: { email: 'contact@acme.com', password: 'any' },
  });
  assert.equal(clientLogin.status, 200, 'Client login should succeed');
  assert.ok(clientLogin.payload.token, 'Client token should be returned');
  clientToken = clientLogin.payload.token;

  const customers = await api('/api/customers', { token: adminToken });
  assert.equal(customers.status, 200, 'Customers fetch should succeed in setup');
  assert.ok(Array.isArray(customers.payload), 'Customers payload should be array in setup');
  assert.ok(customers.payload.length > 0, 'Need at least one customer in setup');
  defaultCustomerId = customers.payload[0].id;
});

test.after(async () => {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill('SIGTERM');
    await sleep(500);
  }
});

test('POST /api/projects/:id/tasks creates a task', async () => {
  const project = await api('/api/projects', {
    method: 'POST',
    token: adminToken,
    body: { title: `API Regression Project ${Date.now()}` },
  });
  assert.equal(project.status, 201, 'Project creation should succeed');
  assert.ok(project.payload.id, 'Project id should be present');
  createdProjectId = project.payload.id;

  const task = await api(`/api/projects/${encodeURIComponent(createdProjectId)}/tasks`, {
    method: 'POST',
    token: adminToken,
    body: { name: 'API Regression Task', status: 'pending', progress: 25 },
  });
  assert.equal(task.status, 201, 'Task creation via project endpoint should succeed');
  assert.ok(task.payload.id, 'Task id should be present');
  assert.equal(task.payload.project_id, createdProjectId, 'Task should belong to project');
});

test('POST + PATCH notifications works', async () => {
  const created = await api('/api/notifications', {
    method: 'POST',
    token: adminToken,
    body: { title: 'API Regression Notification', message: 'Create and read flow' },
  });
  assert.equal(created.status, 201, 'Notification creation should succeed');
  assert.ok(created.payload.id, 'Notification id should be present');
  createdNotificationId = created.payload.id;

  const markedRead = await api(`/api/notifications/${encodeURIComponent(createdNotificationId)}/read`, {
    method: 'PATCH',
    token: adminToken,
  });
  assert.equal(markedRead.status, 200, 'Mark notification read should succeed');
  assert.equal(markedRead.payload.read, true, 'Notification should be marked as read');
});

test('GET client portal endpoints return arrays for client token', async () => {
  const jobs = await api('/api/client/jobs', { token: clientToken });
  assert.equal(jobs.status, 200, 'Client jobs endpoint should succeed');
  assert.ok(Array.isArray(jobs.payload), 'Client jobs should return an array');

  const invoices = await api('/api/client/invoices', { token: clientToken });
  assert.equal(invoices.status, 200, 'Client invoices endpoint should succeed');
  assert.ok(Array.isArray(invoices.payload), 'Client invoices should return an array');
});

test('Technician lifecycle: worklog + checkin + checkout', async () => {
  const job = await api('/api/jobs', {
    method: 'POST',
    token: adminToken,
    body: {
      title: `Lifecycle Job ${Date.now()}`,
      assignedTo: 'technician',
      status: 'assigned',
      priority: 'medium',
      location: 'Test Site',
      category: 'maintenance',
      customerId: defaultCustomerId,
    },
  });
  assert.equal(job.status, 201, 'Job creation should succeed');
  assert.ok(job.payload.id, 'Created job id should exist');
  createdJobId = job.payload.id;

  const techLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { username: 'technician', password: '1111' },
  });
  assert.equal(techLogin.status, 200, 'Technician login should succeed');
  assert.ok(techLogin.payload.token, 'Technician token should exist');
  const techToken = techLogin.payload.token;

  const worklog = await api(`/api/jobs/${encodeURIComponent(createdJobId)}/worklog`, {
    method: 'PATCH',
    token: techToken,
    body: {
      technicianNotes: 'Initial diagnosis completed',
      partsUsed: ['Thermostat'],
      materialsUsed: ['Sealant'],
    },
  });
  assert.equal(worklog.status, 200, 'Worklog update should succeed');
  assert.equal(worklog.payload.technicianNotes, 'Initial diagnosis completed');

  const checkin = await api(`/api/jobs/${encodeURIComponent(createdJobId)}/checkin`, {
    method: 'POST',
    token: techToken,
  });
  assert.equal(checkin.status, 200, 'Check-in should succeed');
  assert.ok(checkin.payload.checkinTime, 'Check-in timestamp should be set');
  assert.equal(checkin.payload.status, 'in-progress');

  const checkout = await api(`/api/jobs/${encodeURIComponent(createdJobId)}/checkout`, {
    method: 'POST',
    token: techToken,
    body: {
      notes: 'Work completed and tested',
      completionProof: {
        signatureName: 'Alex Client',
        evidenceSummary: 'Replaced thermostat and validated cooling cycle',
        customerAccepted: true,
      },
    },
  });
  assert.equal(checkout.status, 200, 'Checkout should succeed');
  assert.ok(checkout.payload.checkoutTime, 'Checkout timestamp should be set');
  assert.equal(checkout.payload.status, 'completed');
  assert.equal(checkout.payload.completionNotes, 'Work completed and tested');
  assert.ok(checkout.payload.completionProof, 'Completion proof should be attached on checkout response');

  const completionProof = await api(`/api/jobs/${encodeURIComponent(createdJobId)}/completion-proof`, {
    token: adminToken,
  });
  assert.equal(completionProof.status, 200, 'Completion proof fetch should succeed');
  assert.ok(completionProof.payload, 'Completion proof payload should exist');
  assert.equal(completionProof.payload.signatureName, 'Alex Client');
  assert.equal(completionProof.payload.customerAccepted, true);
});

test('Customer communication scaffolding works for jobs', async () => {
  const job = await api('/api/jobs', {
    method: 'POST',
    token: adminToken,
    body: {
      title: `Customer Comms Job ${Date.now()}`,
      assignedTo: 'technician',
      status: 'assigned',
      priority: 'medium',
      location: 'Customer Site',
      category: 'maintenance',
      customerId: defaultCustomerId,
    },
  });
  assert.equal(job.status, 201, 'Job creation should succeed');
  assert.ok(job.payload.id, 'Created job id should exist');

  const sendUpdate = await api(`/api/jobs/${encodeURIComponent(job.payload.id)}/customer-update`, {
    method: 'POST',
    token: adminToken,
    body: {
      templateKey: 'technician_enroute',
      channel: 'sms',
      eta: '2:30 PM',
    },
  });
  assert.equal(sendUpdate.status, 201, 'Customer update send should succeed');
  assert.equal(sendUpdate.payload.channel, 'sms');
  assert.equal(sendUpdate.payload.templateKey, 'technician_enroute');

  const history = await api(`/api/jobs/${encodeURIComponent(job.payload.id)}/customer-updates`, {
    token: adminToken,
  });
  assert.equal(history.status, 200, 'Customer update history should succeed');
  assert.ok(Array.isArray(history.payload), 'History payload should be array');
  assert.ok(history.payload.length > 0, 'History should contain at least one sent update');
});

test('Technician quick-close endpoint completes assigned job', async () => {
  const job = await api('/api/jobs', {
    method: 'POST',
    token: adminToken,
    body: {
      title: `Quick Close Job ${Date.now()}`,
      assignedTo: 'technician',
      status: 'assigned',
      priority: 'medium',
      location: 'Mobile Site',
      category: 'maintenance',
      customerId: defaultCustomerId,
    },
  });
  assert.equal(job.status, 201, 'Job creation should succeed');
  assert.ok(job.payload.id, 'Created job id should exist');

  const techLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { username: 'technician', password: '1111' },
  });
  assert.equal(techLogin.status, 200, 'Technician login should succeed');
  const techToken = techLogin.payload.token;

  const quickClose = await api(`/api/jobs/${encodeURIComponent(job.payload.id)}/quick-close`, {
    method: 'POST',
    token: techToken,
    body: { notes: 'Closed quickly from mobile actions' },
  });
  assert.equal(quickClose.status, 200, 'Quick close should succeed');
  assert.equal(quickClose.payload.status, 'completed');
  assert.ok(quickClose.payload.checkinTime, 'Quick close should backfill checkin time');
  assert.ok(quickClose.payload.checkoutTime, 'Quick close should set checkout time');
  assert.equal(quickClose.payload.completionNotes, 'Closed quickly from mobile actions');
});

test('Quote conversion flow creates job from accepted quote', async () => {
  const quote = await api('/api/quotes', {
    method: 'POST',
    token: adminToken,
    body: {
      customerId: defaultCustomerId,
      title: `Quote Conversion ${Date.now()}`,
      description: 'Conversion workflow regression test',
      valid_until: '2099-12-31',
      items: [{ description: 'Service package', quantity: 1, unit_price: 125 }],
    },
  });
  assert.equal(quote.status, 201, 'Quote creation should succeed');
  assert.ok(quote.payload.id, 'Created quote id should exist');

  const convertBeforeAccept = await api(`/api/quotes/${encodeURIComponent(quote.payload.id)}/convert`, {
    method: 'POST',
    token: adminToken,
    body: { scheduledDate: '2099-04-15' },
  });
  assert.equal(convertBeforeAccept.status, 400, 'Convert should fail while quote is not accepted');

  const accepted = await api(`/api/quotes/${encodeURIComponent(quote.payload.id)}/accept`, {
    method: 'POST',
    token: adminToken,
  });
  assert.equal(accepted.status, 200, 'Quote accept should succeed');
  assert.equal(accepted.payload.status, 'accepted');

  const converted = await api(`/api/quotes/${encodeURIComponent(quote.payload.id)}/convert`, {
    method: 'POST',
    token: adminToken,
    body: { scheduledDate: '2099-04-15' },
  });
  assert.equal(converted.status, 201, 'Accepted quote conversion should succeed');
  assert.ok(converted.payload.id, 'Converted job should have id');
  assert.equal(converted.payload.quoteId, quote.payload.id, 'Converted job should reference original quote');
  assert.equal(converted.payload.scheduledDate, '2099-04-15', 'Converted job should keep requested scheduled date');

  const quotes = await api('/api/quotes', { token: adminToken });
  assert.equal(quotes.status, 200, 'Quote list fetch should succeed');
  const updatedQuote = (quotes.payload || []).find((entry) => entry.id === quote.payload.id);
  assert.ok(updatedQuote, 'Converted quote should still exist');
  assert.equal(updatedQuote.jobId, converted.payload.id, 'Converted quote should reference created job');
});

test('Checkout requires check-in first', async () => {
  const job = await api('/api/jobs', {
    method: 'POST',
    token: adminToken,
    body: {
      title: `Checkout Guardrail Job ${Date.now()}`,
      assignedTo: 'technician',
      status: 'assigned',
      priority: 'medium',
      location: 'Guardrail Site',
      category: 'maintenance',
      customerId: defaultCustomerId,
    },
  });
  assert.equal(job.status, 201, 'Job creation should succeed');

  const techLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { username: 'technician', password: '1111' },
  });
  assert.equal(techLogin.status, 200, 'Technician login should succeed');
  const techToken = techLogin.payload.token;

  const checkoutBeforeCheckin = await api(`/api/jobs/${encodeURIComponent(job.payload.id)}/checkout`, {
    method: 'POST',
    token: techToken,
    body: { notes: 'Attempting checkout before checkin' },
  });
  assert.equal(checkoutBeforeCheckin.status, 400, 'Checkout before check-in should fail');
  assert.match(String(checkoutBeforeCheckin.payload.error || ''), /check in/i, 'Checkout guardrail should explain check-in requirement');
});

test('Inventory reservation is consumed on checkout/quick-close', async () => {
  const inventoryBefore = await api('/api/inventory', { token: adminToken });
  assert.equal(inventoryBefore.status, 200, 'Inventory fetch should succeed');
  assert.ok(Array.isArray(inventoryBefore.payload) && inventoryBefore.payload.length > 0, 'Inventory list should not be empty');
  const item = inventoryBefore.payload[0];
  const initialQty = Number(item.quantity || 0);

  const job = await api('/api/jobs', {
    method: 'POST',
    token: adminToken,
    body: {
      title: `Inventory Reservation Job ${Date.now()}`,
      assignedTo: 'technician',
      status: 'assigned',
      priority: 'medium',
      location: 'Warehouse Test Site',
      category: 'maintenance',
      customerId: defaultCustomerId,
    },
  });
  assert.equal(job.status, 201, 'Job creation should succeed');

  const reserve = await api(`/api/jobs/${encodeURIComponent(job.payload.id)}/inventory/reserve`, {
    method: 'POST',
    token: adminToken,
    body: {
      inventoryId: item.id,
      quantity: 1,
    },
  });
  assert.equal(reserve.status, 201, 'Inventory reserve should succeed');
  assert.equal(reserve.payload.inventoryId, item.id);

  const techLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { username: 'technician', password: '1111' },
  });
  assert.equal(techLogin.status, 200, 'Technician login should succeed');
  const techToken = techLogin.payload.token;

  const quickClose = await api(`/api/jobs/${encodeURIComponent(job.payload.id)}/quick-close`, {
    method: 'POST',
    token: techToken,
    body: { notes: 'Inventory consumption test close' },
  });
  assert.equal(quickClose.status, 200, 'Quick close should succeed');
  assert.ok(Array.isArray(quickClose.payload.consumedReservations), 'Quick close should include consumed reservation summary');
  assert.ok(quickClose.payload.consumedReservations.length >= 1, 'At least one reservation should be consumed');

  const inventoryAfter = await api('/api/inventory', { token: adminToken });
  assert.equal(inventoryAfter.status, 200, 'Inventory fetch after close should succeed');
  const afterItem = inventoryAfter.payload.find((entry) => entry.id === item.id);
  assert.ok(afterItem, 'Reserved inventory item should still exist');
  assert.ok(Number(afterItem.quantity || 0) <= initialQty - 1, 'Inventory quantity should be reduced after consumption');

  const intel = await api(`/api/jobs/${encodeURIComponent(job.payload.id)}/inventory/intelligence`, {
    token: adminToken,
  });
  assert.equal(intel.status, 200, 'Inventory intelligence fetch should succeed');
  assert.ok(Array.isArray(intel.payload.reservations), 'Intelligence should include reservations array');
  assert.ok(intel.payload.reservations.some((entry) => entry.status === 'consumed'), 'Reservation should be marked consumed');
});

test('Dispatch optimization suggests and applies assignment for unassigned jobs', async () => {
  const targetDate = '2099-02-20';

  const created = await api('/api/jobs', {
    method: 'POST',
    token: adminToken,
    body: {
      title: `Optimizer Assign Job ${Date.now()}`,
      assignedTo: '',
      status: 'new',
      priority: 'medium',
      location: 'Optimization Assignment Site',
      category: 'general',
      customerId: defaultCustomerId,
      scheduledDate: targetDate,
    },
  });
  assert.equal(created.status, 201, 'Unassigned optimizer test job creation should succeed');
  assert.ok(created.payload.id, 'Unassigned optimizer test job id should exist');

  const optimize = await api(`/api/dispatch/optimize?date=${encodeURIComponent(targetDate)}`, {
    token: adminToken,
  });
  assert.equal(optimize.status, 200, 'Dispatch optimize should succeed');
  assert.ok(Array.isArray(optimize.payload.suggestions), 'Optimize response should include suggestions array');

  const assignSuggestion = optimize.payload.suggestions.find((item) =>
    item && item.type === 'assign' && item.jobId === created.payload.id
  );
  assert.ok(assignSuggestion, 'Expected assign suggestion for unassigned job');
  assert.ok(assignSuggestion.suggestedAssignee, 'Assign suggestion should include assignee');

  const apply = await api('/api/dispatch/optimize/apply', {
    method: 'POST',
    token: adminToken,
    body: {
      jobId: assignSuggestion.jobId,
      type: assignSuggestion.type,
      suggestedAssignee: assignSuggestion.suggestedAssignee,
      suggestedDate: assignSuggestion.suggestedDate,
    },
  });
  assert.equal(apply.status, 200, 'Applying assign optimization suggestion should succeed');
  assert.equal(apply.payload.id, created.payload.id);
  assert.equal(apply.payload.assignedTo, assignSuggestion.suggestedAssignee);
  assert.equal(apply.payload.status, 'assigned', 'Assigned optimization should transition new job to assigned');
});

test('Dispatch optimization suggests and applies reschedule for overloaded day', async () => {
  const baseDate = '2099-01-15';
  const overloadedAssignee = 'optimizer-tech';

  const setTightCapacity = await api('/api/settings/dispatch', {
    method: 'PUT',
    token: adminToken,
    body: { maxJobsPerTechnicianPerDay: 1, slaDueSoonDays: 1 },
  });
  assert.equal(setTightCapacity.status, 200, 'Should update dispatch settings for optimization test');

  for (let i = 0; i < 3; i += 1) {
    const created = await api('/api/jobs', {
      method: 'POST',
      token: adminToken,
      body: {
        title: `Optimizer Job ${Date.now()}-${i}`,
        assignedTo: overloadedAssignee,
        status: 'assigned',
        priority: i === 0 ? 'low' : 'medium',
        location: 'Optimization Test Site',
        category: 'general',
        customerId: defaultCustomerId,
        scheduledDate: baseDate,
      },
    });
    assert.equal(created.status, 201, 'Optimizer test job creation should succeed');
  }

  const optimize = await api(`/api/dispatch/optimize?date=${encodeURIComponent(baseDate)}`, {
    token: adminToken,
  });
  assert.equal(optimize.status, 200, 'Dispatch optimize should succeed');
  assert.ok(Array.isArray(optimize.payload.suggestions), 'Optimize response should include suggestions array');
  const rescheduleSuggestion = optimize.payload.suggestions.find((item) => item && item.type === 'reschedule');
  assert.ok(rescheduleSuggestion, 'Expected at least one reschedule suggestion');
  assert.ok(rescheduleSuggestion.jobId, 'Reschedule suggestion should target a job');
  assert.ok(rescheduleSuggestion.suggestedDate, 'Reschedule suggestion should include suggested date');

  const apply = await api('/api/dispatch/optimize/apply', {
    method: 'POST',
    token: adminToken,
    body: {
      jobId: rescheduleSuggestion.jobId,
      type: rescheduleSuggestion.type,
      suggestedDate: rescheduleSuggestion.suggestedDate,
      suggestedAssignee: rescheduleSuggestion.suggestedAssignee,
    },
  });
  assert.equal(apply.status, 200, 'Applying optimization suggestion should succeed');
  assert.equal(apply.payload.id, rescheduleSuggestion.jobId);
  assert.equal(apply.payload.assignedTo, overloadedAssignee);
  assert.equal(apply.payload.scheduledDate, rescheduleSuggestion.suggestedDate);
  assert.notEqual(apply.payload.scheduledDate, baseDate, 'Applied reschedule should change date');
});

test('Recurring maintenance CRUD works', async () => {
  const customers = await api('/api/customers', { token: adminToken });
  assert.equal(customers.status, 200, 'Customers fetch should succeed');
  assert.ok(Array.isArray(customers.payload), 'Customers payload should be array');
  assert.ok(customers.payload.length > 0, 'Need at least one customer for recurring tests');
  const customerId = customers.payload[0].id;

  const createRecurring = await api('/api/recurring', {
    method: 'POST',
    token: adminToken,
    body: {
      customerId,
      title: 'Quarterly HVAC PM',
      frequency: 'quarterly',
      interval_value: 3,
      interval_unit: 'months',
      category: 'maintenance',
      priority: 'medium',
    },
  });
  assert.equal(createRecurring.status, 201, 'Recurring creation should succeed');
  assert.ok(createRecurring.payload.id, 'Recurring id should be present');
  createdRecurringId = createRecurring.payload.id;

  const updateRecurring = await api(`/api/recurring/${encodeURIComponent(createdRecurringId)}`, {
    method: 'PUT',
    token: adminToken,
    body: {
      status: 'paused',
      estimated_duration_hours: 2,
    },
  });
  assert.equal(updateRecurring.status, 200, 'Recurring update should succeed');
  assert.equal(updateRecurring.payload.status, 'paused');
  assert.equal(updateRecurring.payload.estimated_duration_hours, 2);

  const listByCustomer = await api(`/api/recurring/customer/${encodeURIComponent(customerId)}`, {
    token: adminToken,
  });
  assert.equal(listByCustomer.status, 200, 'Recurring by customer should succeed');
  assert.ok(Array.isArray(listByCustomer.payload), 'Recurring by customer should return array');

  const deleteRecurring = await api(`/api/recurring/${encodeURIComponent(createdRecurringId)}`, {
    method: 'DELETE',
    token: adminToken,
  });
  assert.equal(deleteRecurring.status, 200, 'Recurring delete should succeed');
  assert.equal(deleteRecurring.payload.ok, true, 'Delete response should confirm success');
});

test('Dispatch settings GET + PUT works', async () => {
  const initial = await api('/api/settings/dispatch', { token: adminToken });
  assert.equal(initial.status, 200, 'Dispatch settings GET should succeed');
  assert.ok(typeof initial.payload.maxJobsPerTechnicianPerDay === 'number');
  assert.ok(typeof initial.payload.slaDueSoonDays === 'number');

  const update = await api('/api/settings/dispatch', {
    method: 'PUT',
    token: adminToken,
    body: {
      maxJobsPerTechnicianPerDay: 3,
      slaDueSoonDays: 2,
    },
  });
  assert.equal(update.status, 200, 'Dispatch settings PUT should succeed');
  assert.equal(update.payload.maxJobsPerTechnicianPerDay, 3);
  assert.equal(update.payload.slaDueSoonDays, 2);
});

test('Dashboard KPI endpoint returns SLA and operational metrics', async () => {
  const kpis = await api('/api/dashboard/kpis', { token: adminToken });
  assert.equal(kpis.status, 200, 'Dashboard KPI endpoint should succeed');
  assert.ok(kpis.payload && typeof kpis.payload === 'object', 'KPI payload should be an object');
  assert.ok(kpis.payload.sla && typeof kpis.payload.sla === 'object', 'KPI payload should include sla section');
  assert.ok(kpis.payload.operations && typeof kpis.payload.operations === 'object', 'KPI payload should include operations section');
  assert.ok(kpis.payload.backlog && typeof kpis.payload.backlog === 'object', 'KPI payload should include backlog section');
  assert.equal(typeof kpis.payload.sla.overdueOpen, 'number');
  assert.equal(typeof kpis.payload.sla.onTimeCompletionRatePct, 'number');
  assert.equal(typeof kpis.payload.operations.avgResolutionHours, 'number');
  assert.equal(typeof kpis.payload.backlog.unassignedOpen, 'number');
});
