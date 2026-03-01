// ============== COMPREHENSIVE AUTOMATED TESTS ==============
// Tests for critical API workflows

const API_BASE = 'http://localhost:3002';

let authToken = '';
let testResults = { passed: 0, failed: 0, tests: [] };

// Helper to log test results
const log = (name, passed, details = '') => {
  if (passed) {
    testResults.passed++;
    testResults.tests.push({ name, status: 'PASS', details });
    console.log(`✓ ${name}${details ? ': ' + details : ''}`);
  } else {
    testResults.failed++;
    testResults.tests.push({ name, status: 'FAIL', details });
    console.log(`✗ ${name} - ${details}`);
  }
};

// Helper to make API requests
const api = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...options.headers
  };
  
  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    return { status: response.status, data, ok: response.ok };
  } catch (error) {
    return { status: 0, data: { error: error.message }, ok: false };
  }
};

// ============== TEST SUITES ==============

// 1. Authentication Tests
const testAuth = async () => {
  console.log('\n--- AUTHENTICATION TESTS ---');
  
  // Test login with valid credentials
  let res = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'admin', password: '1111' })
  });
  log('Login with valid credentials', res.ok && res.data.token, res.data.error || `Token: ${res.data.token?.slice(0, 10)}...`);
  if (res.data.token) authToken = res.data.token;
  
  // Test login with invalid credentials
  res = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'admin', password: 'wrong' })
  });
  log('Login with invalid password', res.status === 401, res.data.error);
  
  // Test login with missing credentials
  res = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({})
  });
  log('Login with missing credentials', res.status === 401, res.data.error);
  
  // Test auth/me endpoint
  res = await api('/api/auth/me');
  log('Get current user', res.ok && res.data.user?.role === 'admin', res.data.error);
  
  // Test protected endpoint without auth
  const savedToken = authToken;
  authToken = '';
  res = await api('/api/projects');
  log('Protected endpoint without auth', res.status === 401, res.data.error);
  authToken = savedToken;
};

// 2. Projects Tests
const testProjects = async () => {
  console.log('\n--- PROJECTS TESTS ---');
  
  // Get all projects
  let res = await api('/api/projects');
  log('Get all projects', res.ok && Array.isArray(res.data), `Count: ${res.data?.length || 0}`);
  const initialCount = res.data?.length || 0;
  
  // Create new project
  res = await api('/api/projects', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Test Project',
      description: 'Test description',
      start_date: '2026-01-01',
      end_date: '2026-12-31'
    })
  });
  const newProjectId = res.data?.id;
  log('Create new project', res.ok && newProjectId, res.data.error);
  
  // Get single project
  if (newProjectId) {
    res = await api(`/api/projects/${newProjectId}`);
    log('Get single project', res.ok && res.data.id === newProjectId, res.data.error);
    
    // Update project
    res = await api(`/api/projects/${newProjectId}`, {
      method: 'PUT',
      body: JSON.stringify({ title: 'Updated Test Project' })
    });
    log('Update project', res.ok && res.data.title === 'Updated Test Project', res.data.error);
    
    // Delete project
    res = await api(`/api/projects/${newProjectId}`, { method: 'DELETE' });
    log('Delete project', res.ok, res.data.error);
  }
  
  // Verify project was deleted
  res = await api('/api/projects');
  log('Project count after delete', res.data.length === initialCount, `Count: ${res.data.length}`);
};

// 3. Tasks Tests
const testTasks = async () => {
  console.log('\n--- TASKS TESTS ---');
  
  // Get tasks for project-1
  let res = await api('/api/projects/proj-1/tasks');
  log('Get tasks for project', res.ok && Array.isArray(res.data), `Count: ${res.data?.length || 0}`);
  const initialCount = res.data?.length || 0;
  
  // Create new task
  res = await api('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({
      project_id: 'proj-1',
      name: 'Test Task',
      start_date: '2026-01-01',
      end_date: '2026-01-31',
      progress_percent: 0,
      weight: 1
    })
  });
  const newTaskId = res.data?.id;
  log('Create new task', res.ok && newTaskId, res.data.error);
  
  if (newTaskId) {
    // Update task progress
    res = await api(`/api/tasks/${newTaskId}/progress`, {
      method: 'PATCH',
      body: JSON.stringify({ progress_percent: 50 })
    });
    log('Update task progress', res.ok && res.data.progress_percent === 50, res.data.error);
    
    // Update task dates
    res = await api(`/api/tasks/${newTaskId}/dates`, {
      method: 'PATCH',
      body: JSON.stringify({ start_date: '2026-02-01', end_date: '2026-02-28' })
    });
    log('Update task dates', res.ok && res.data.duration_days > 0, res.data.error);
    
    // Update full task
    res = await api(`/api/tasks/${newTaskId}`, {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated Test Task', weight: 5 })
    });
    log('Update task', res.ok && res.data.name === 'Updated Test Task', res.data.error);
    
    // Delete task
    res = await api(`/api/tasks/${newTaskId}`, { method: 'DELETE' });
    log('Delete task', res.ok, res.data.error);
  }
  
  // Verify task was deleted
  res = await api('/api/projects/proj-1/tasks');
  log('Task count after delete', res.data.length === initialCount, `Count: ${res.data.length}`);
};

// 4. Planner Tests
const testPlanner = async () => {
  console.log('\n--- PLANNER TESTS ---');
  
  // Get planner data
  let res = await api('/api/projects/proj-1/planner');
  log('Get planner data', res.ok && res.data.project, res.data.error);
  
  if (res.ok && res.data.summary) {
    const { summary } = res.data;
    log('Planner has summary.total', typeof summary.total === 'number', `Total: ${summary.total}`);
    log('Planner has summary.completed', typeof summary.completed === 'number', `Completed: ${summary.completed}`);
    log('Planner has summary.inProgress', typeof summary.inProgress === 'number', `In Progress: ${summary.inProgress}`);
    log('Planner has summary.delayed', typeof summary.delayed === 'number', `Delayed: ${summary.delayed}`);
    log('Planner has summary.overallProgress', typeof summary.overallProgress === 'number', `Progress: ${summary.overallProgress}%`);
    log('Planner has summary.totalWeight', typeof summary.totalWeight === 'number', `Weight: ${summary.totalWeight}`);
  }
  
  if (res.ok && res.data.tasks) {
    const task = res.data.tasks[0];
    log('Tasks have progressContribution', typeof task.progressContribution === 'number', `Contribution: ${task.progressContribution}`);
    log('Tasks have timelineStart', typeof task.timelineStart === 'number', `Start: ${task.timelineStart}`);
    log('Tasks have timelineEnd', typeof task.timelineEnd === 'number', `End: ${task.timelineEnd}`);
  }
};

// 5. Validation Tests
const testValidation = async () => {
  console.log('\n--- VALIDATION TESTS ---');
  
  // Test create project with empty title
  let res = await api('/api/projects', {
    method: 'POST',
    body: JSON.stringify({ title: '' })
  });
  log('Reject empty project title', res.status === 400, res.data.error);
  
  // Test create task without project_id
  res = await api('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({ name: 'Test Task' })
  });
  log('Reject task without project_id', res.status === 400, res.data.error);
  
  // Test create task with invalid progress
  res = await api('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({ project_id: 'proj-1', name: 'Test', progress_percent: 150 })
  });
  log('Reject invalid progress percent', res.status === 400, res.data.error);
  
  // Test update progress with invalid value
  res = await api('/api/tasks/task-1-1/progress', {
    method: 'PATCH',
    body: JSON.stringify({ progress_percent: -10 })
  });
  log('Clamp negative progress to 0', res.ok && res.data.progress_percent === 0, `Progress: ${res.data.progress_percent}`);
  
  // Test update progress over 100
  res = await api('/api/tasks/task-1-1/progress', {
    method: 'PATCH',
    body: JSON.stringify({ progress_percent: 200 })
  });
  log('Clamp progress over 100 to 100', res.ok && res.data.progress_percent === 100, `Progress: ${res.data.progress_percent}`);
};

// 6. Jobs Tests
const testJobs = async () => {
  console.log('\n--- JOBS TESTS ---');
  
  // Get all jobs
  let res = await api('/api/jobs');
  log('Get all jobs', res.ok && Array.isArray(res.data), `Count: ${res.data?.length || 0}`);
  
  // Create job
  res = await api('/api/jobs', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Test Job',
      priority: 'high',
      location: 'Test Location',
      customerId: 'CUST-001'
    })
  });
  const newJobId = res.data?.id;
  log('Create new job', res.ok && newJobId, res.data.error);
  
  if (newJobId) {
    // Update job status
    res = await api(`/api/jobs/${newJobId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'in-progress' })
    });
    log('Update job status', res.ok && res.data.status === 'in-progress', res.data.error);
    
    // Delete job
    res = await api(`/api/jobs/${newJobId}`, { method: 'DELETE' });
    log('Delete job', res.ok, res.data.error);
  }
};

// 7. Customers Tests
const testCustomers = async () => {
  console.log('\n--- CUSTOMERS TESTS ---');
  
  // Get all customers
  let res = await api('/api/customers');
  log('Get all customers', res.ok && Array.isArray(res.data), `Count: ${res.data?.length || 0}`);
  
  // Create customer
  res = await api('/api/customers', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test Customer',
      email: 'test@example.com',
      phone: '555-9999'
    })
  });
  const newCustomerId = res.data?.id;
  log('Create new customer', res.ok && newCustomerId, res.data.error);
  
  if (newCustomerId) {
    // Update customer
    res = await api(`/api/customers/${newCustomerId}`, {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated Customer' })
    });
    log('Update customer', res.ok && res.data.name === 'Updated Customer', res.data.error);
    
    // Delete customer
    res = await api(`/api/customers/${newCustomerId}`, { method: 'DELETE' });
    log('Delete customer', res.ok, res.data.error);
  }
};

// 8. Invoices Tests
const testInvoices = async () => {
  console.log('\n--- INVOICES TESTS ---');
  
  // Get all invoices
  let res = await api('/api/invoices');
  log('Get all invoices', res.ok && Array.isArray(res.data), `Count: ${res.data?.length || 0}`);
  
  // Create invoice
  res = await api('/api/invoices', {
    method: 'POST',
    body: JSON.stringify({
      jobId: 'JOB-1001',
      customerId: 'CUST-001',
      amount: 500.00,
      description: 'Test Invoice'
    })
  });
  const newInvoiceId = res.data?.id;
  log('Create new invoice', res.ok && newInvoiceId, res.data.error);
  
  if (newInvoiceId) {
    // Update invoice status
    res = await api(`/api/invoices/${newInvoiceId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'paid' })
    });
    log('Update invoice status', res.ok && res.data.status === 'paid', res.data.error);
  }
};

// 9. Dashboard Tests
const testDashboard = async () => {
  console.log('\n--- DASHBOARD TESTS ---');
  
  // Get dashboard summary
  let res = await api('/api/dashboard/summary');
  log('Get dashboard summary', res.ok && res.data.totalJobs !== undefined, res.data.error);
  
  if (res.ok && res.data) {
    log('Dashboard has totalJobs', typeof res.data.totalJobs === 'number', `Jobs: ${res.data.totalJobs}`);
    log('Dashboard has totalCustomers', typeof res.data.totalCustomers === 'number', `Customers: ${res.data.totalCustomers}`);
    log('Dashboard has totalRevenue', typeof res.data.totalRevenue === 'number', `Revenue: $${res.data.totalRevenue}`);
  }
};

// 10. Edge Cases Tests
const testEdgeCases = async () => {
  console.log('\n--- EDGE CASES TESTS ---');
  
  // Test get non-existent project
  let res = await api('/api/projects/non-existent-id');
  log('Handle non-existent project', res.status === 404, res.data.error);
  
  // Test get non-existent task
  res = await api('/api/tasks/non-existent-task/progress', {
    method: 'PATCH',
    body: JSON.stringify({ progress_percent: 50 })
  });
  log('Handle non-existent task', res.status === 404, res.data.error);
  
  // Test delete non-existent project
  res = await api('/api/projects/non-existent', { method: 'DELETE' });
  log('Handle delete non-existent project', res.status === 404, res.data.error);
  
  // Test create project with very long title
  res = await api('/api/projects', {
    method: 'POST',
    body: JSON.stringify({ title: 'A'.repeat(500) })
  });
  log('Handle very long project title', res.ok, res.data.error || 'Created');
  
  // Test create task with null dates
  res = await api('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({
      project_id: 'proj-1',
      name: 'Task without dates',
      start_date: null,
      end_date: null
    })
  });
  log('Create task with null dates', res.ok, res.data.error);
};

// ============== RUN ALL TESTS ==============
const runTests = async () => {
  console.log('========================================');
  console.log('FIELD SERVICE SUITE - AUTOMATED TESTS');
  console.log('========================================');
  console.log(`Testing API at: ${API_BASE}`);
  
  await testAuth();
  await testProjects();
  await testTasks();
  await testPlanner();
  await testValidation();
  await testJobs();
  await testCustomers();
  await testInvoices();
  await testDashboard();
  await testEdgeCases();
  
  console.log('\n========================================');
  console.log('TEST RESULTS SUMMARY');
  console.log('========================================');
  console.log(`Total Passed: ${testResults.passed}`);
  console.log(`Total Failed: ${testResults.failed}`);
  console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  console.log('========================================');
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
};

// Run tests
runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
