const http = require('http');

function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function testAPI() {
  console.log('=== Testing CREATE, UPDATE, DELETE, ATTENDANCE & TIMELINE Endpoints ===\n');

  // Login first
  console.log('Logging in as admin...');
  const loginBody = JSON.stringify({ username: 'admin', password: '1111' });
  const login = await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': loginBody.length }
  }, loginBody);
  
  if (!login.token) {
    console.log('Login failed, cannot proceed');
    return;
  }
  
  const token = login.token;
  const authHeader = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  console.log('Login successful!\n');

  // Test 1: Create Customer
  console.log('1. Testing POST /api/customers (Create Customer)...');
  const newCustomer = JSON.stringify({
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '555-9999',
    address: '123 Test Street'
  });
  const customer = await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/api/customers',
    method: 'POST',
    headers: { ...authHeader, 'Content-Length': newCustomer.length }
  }, newCustomer);
  console.log('   Create Customer:', customer.id ? '✅ PASSED' : '❌ FAILED', '- ID:', customer.id);
  const customerId = customer.id;
  console.log('');

  // Test 2: Update Customer
  if (customerId) {
    console.log('2. Testing PUT /api/customers/:id (Update Customer)...');
    const updateCustomer = JSON.stringify({ name: 'Updated Test Customer' });
    const updated = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: `/api/customers/${customerId}`,
      method: 'PUT',
      headers: { ...authHeader, 'Content-Length': updateCustomer.length }
    }, updateCustomer);
    console.log('   Update Customer:', updated.name === 'Updated Test Customer' ? '✅ PASSED' : '❌ FAILED');
    console.log('');
  }

  // Test 3: Create Job
  console.log('3. Testing POST /api/jobs (Create Job)...');
  const newJob = JSON.stringify({
    title: 'Test Job',
    priority: 'medium',
    location: 'Test Location',
    category: 'maintenance'
  });
  const job = await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/api/jobs',
    method: 'POST',
    headers: { ...authHeader, 'Content-Length': newJob.length }
  }, newJob);
  console.log('   Create Job:', job.id ? '✅ PASSED' : '❌ FAILED', '- ID:', job.id);
  const jobId = job.id;
  console.log('');

  // Test 4: Update Job
  if (jobId) {
    console.log('4. Testing PUT /api/jobs/:id (Update Job)...');
    const updateJob = JSON.stringify({ title: 'Updated Test Job', priority: 'high' });
    const updatedJob = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: `/api/jobs/${jobId}`,
      method: 'PUT',
      headers: { ...authHeader, 'Content-Length': updateJob.length }
    }, updateJob);
    console.log('   Update Job:', updatedJob.title === 'Updated Test Job' ? '✅ PASSED' : '❌ FAILED');
    console.log('');
  }

  // Test 5: Update Job Status
  if (jobId) {
    console.log('5. Testing PATCH /api/jobs/:id/status (Update Job Status)...');
    const statusJob = JSON.stringify({ status: 'in-progress' });
    const statusUpdated = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: `/api/jobs/${jobId}/status`,
      method: 'PATCH',
      headers: { ...authHeader, 'Content-Length': statusJob.length }
    }, statusJob);
    console.log('   Update Job Status:', statusUpdated.status === 'in-progress' ? '✅ PASSED' : '❌ FAILED');
    console.log('');
  }

  // Test 6: Create Project
  console.log('6. Testing POST /api/projects (Create Project)...');
  const newProject = JSON.stringify({
    title: 'Test Project',
    description: 'Test Description',
    start_date: '2026-01-01',
    end_date: '2026-12-31'
  });
  const project = await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/api/projects',
    method: 'POST',
    headers: { ...authHeader, 'Content-Length': newProject.length }
  }, newProject);
  console.log('   Create Project:', project.id ? '✅ PASSED' : '❌ FAILED', '- ID:', project.id);
  const projectId = project.id;
  console.log('');

  // Test 7: Update Project
  if (projectId) {
    console.log('7. Testing PUT /api/projects/:id (Update Project)...');
    const updateProject = JSON.stringify({ title: 'Updated Test Project' });
    const updatedProject = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: `/api/projects/${projectId}`,
      method: 'PUT',
      headers: { ...authHeader, 'Content-Length': updateProject.length }
    }, updateProject);
    console.log('   Update Project:', updatedProject.title === 'Updated Test Project' ? '✅ PASSED' : '❌ FAILED');
    console.log('');
  }

  // Test 8: Create Task
  if (projectId) {
    console.log('8. Testing POST /api/tasks (Create Task)...');
    const taskData = JSON.stringify({
      project_id: projectId,
      name: 'Test Task',
      start_date: '2026-01-01',
      end_date: '2026-01-15',
      progress_percent: 0,
      weight: 1
    });
    const task = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/tasks',
      method: 'POST',
      headers: { ...authHeader, 'Content-Length': taskData.length }
    }, taskData);
    console.log('   Create Task:', task.id ? '✅ PASSED' : '❌ FAILED', '- ID:', task.id);
    var taskId = task.id;
    console.log('');
  }

  // Test 9: Update Task
  if (taskId) {
    console.log('9. Testing PUT /api/tasks/:id (Update Task)...');
    const updateTask = JSON.stringify({ name: 'Updated Test Task', progress_percent: 50 });
    const updatedTask = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: `/api/tasks/${taskId}`,
      method: 'PUT',
      headers: { ...authHeader, 'Content-Length': updateTask.length }
    }, updateTask);
    console.log('   Update Task:', updatedTask.name === 'Updated Test Task' ? '✅ PASSED' : '❌ FAILED');
    console.log('');
  }

  // Test 10: Update Task Progress
  if (taskId) {
    console.log('10. Testing PATCH /api/tasks/:id/progress (Update Task Progress)...');
    const progressTask = JSON.stringify({ progress_percent: 75 });
    const progressUpdated = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: `/api/tasks/${taskId}/progress`,
      method: 'PATCH',
      headers: { ...authHeader, 'Content-Length': progressTask.length }
    }, progressTask);
    console.log('   Update Task Progress:', progressUpdated.progress_percent === 75 ? '✅ PASSED' : '❌ FAILED');
    console.log('');
  }

  // Test 11: Update Task Dates
  if (taskId) {
    console.log('11. Testing PATCH /api/tasks/:id/dates (Update Task Dates)...');
    const datesTask = JSON.stringify({ start_date: '2026-02-01', end_date: '2026-02-20' });
    const datesUpdated = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: `/api/tasks/${taskId}/dates`,
      method: 'PATCH',
      headers: { ...authHeader, 'Content-Length': datesTask.length }
    }, datesTask);
    console.log('   Update Task Dates:', datesUpdated.start_date === '2026-02-01' ? '✅ PASSED' : '❌ FAILED');
    console.log('');
  }

  // Test 12: Delete Task
  if (taskId) {
    console.log('12. Testing DELETE /api/tasks/:id (Delete Task)...');
    const deletedTask = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: `/api/tasks/${taskId}`,
      method: 'DELETE',
      headers: authHeader
    });
    console.log('   Delete Task:', deletedTask.ok ? '✅ PASSED' : '❌ FAILED');
    console.log('');
  }

  // Test 13: Delete Project
  if (projectId) {
    console.log('13. Testing DELETE /api/projects/:id (Delete Project)...');
    const deletedProject = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: `/api/projects/${projectId}`,
      method: 'DELETE',
      headers: authHeader
    });
    console.log('   Delete Project:', deletedProject.ok ? '✅ PASSED' : '❌ FAILED');
    console.log('');
  }

  // Test 14: Delete Job
  if (jobId) {
    console.log('14. Testing DELETE /api/jobs/:id (Delete Job)...');
    const deletedJob = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: `/api/jobs/${jobId}`,
      method: 'DELETE',
      headers: authHeader
    });
    console.log('   Delete Job:', deletedJob.ok ? '✅ PASSED' : '❌ FAILED');
    console.log('');
  }

  // Test 15: Delete Customer
  if (customerId) {
    console.log('15. Testing DELETE /api/customers/:id (Delete Customer)...');
    const deletedCustomer = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: `/api/customers/${customerId}`,
      method: 'DELETE',
      headers: authHeader
    });
    console.log('   Delete Customer:', deletedCustomer.ok ? '✅ PASSED' : '❌ FAILED');
    console.log('');
  }

  // Test 16: Get Project Timeline
  console.log('16. Testing GET /api/projects/:id/timeline (Get Timeline)...');
  const timeline = await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/api/projects/proj-1/timeline',
    headers: authHeader
  });
  console.log('   Get Timeline:', timeline.tasks ? '✅ PASSED' : '❌ FAILED', '- Tasks:', timeline.tasks?.length);
  console.log('');

  // Test 17: Get Single Project
  console.log('17. Testing GET /api/projects/:id (Get Single Project)...');
  const singleProject = await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/api/projects/proj-1',
    headers: authHeader
  });
  console.log('   Get Single Project:', singleProject.id ? '✅ PASSED' : '❌ FAILED');
  console.log('');

  // Test 18: Get Single Technician
  console.log('18. Testing GET /api/technicians/:id (Get Single Technician)...');
  const technician = await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/api/technicians/tech-1',
    headers: authHeader
  });
  console.log('   Get Single Technician:', technician.id ? '✅ PASSED' : '❌ FAILED', '- Name:', technician.name);
  console.log('');

  // Test 19: Get Single Invoice
  console.log('19. Testing GET /api/invoices/:id (Get Single Invoice)...');
  const invoicesList = await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/api/invoices',
    headers: authHeader
  });
  const firstInvoiceId = invoicesList[0]?.id;
  if (firstInvoiceId) {
    const invoice = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: `/api/invoices/${firstInvoiceId}`,
      headers: authHeader
    });
    console.log('   Get Single Invoice:', invoice.id ? '✅ PASSED' : '❌ FAILED');
  } else {
    console.log('   Get Single Invoice: ⬜ No invoices to test');
  }
  console.log('');

  // Test 20: Get Single Job
  console.log('20. Testing GET /api/jobs/:id (Get Single Job)...');
  const jobsList = await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/api/jobs',
    headers: authHeader
  });
  const firstJobId = jobsList[0]?.id;
  if (firstJobId) {
    const singleJob = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: `/api/jobs/${firstJobId}`,
      headers: authHeader
    });
    console.log('   Get Single Job:', singleJob.id ? '✅ PASSED' : '❌ FAILED');
  } else {
    console.log('   Get Single Job: ⬜ No jobs to test');
  }
  console.log('');

  // Test 21: Get Invoice Status Update
  if (firstInvoiceId) {
    console.log('21. Testing PATCH /api/invoices/:id/status (Update Invoice Status)...');
    const invoiceStatus = JSON.stringify({ status: 'paid' });
    const invoiceUpdated = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: `/api/invoices/${firstInvoiceId}/status`,
      method: 'PATCH',
      headers: { ...authHeader, 'Content-Length': invoiceStatus.length }
    }, invoiceStatus);
    console.log('   Update Invoice Status:', invoiceUpdated.status === 'paid' ? '✅ PASSED' : '❌ FAILED');
    console.log('');
  }

  console.log('=== CRUD, Timeline & Additional Endpoints Testing Complete ===');
}

testAPI().catch(console.error);
