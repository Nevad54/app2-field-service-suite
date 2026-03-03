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
