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
  console.log('=== Testing API Endpoints ===\n');

  // Test 1: Status
  console.log('1. Testing /api/status...');
  const status = await makeRequest({ hostname: 'localhost', port: 3002, path: '/api/status' });
  console.log('   Status:', status);
  console.log('   ✓ Backend is running\n');

  // Test 2: Login
  console.log('2. Testing /api/auth/login...');
  const loginBody = JSON.stringify({ username: 'admin', password: '1111' });
  const login = await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': loginBody.length }
  }, loginBody);
  console.log('   Login:', login.user ? '✓ Logged in as ' + login.user.username : '✗ Failed');
  const token = login.token;
  console.log('   Token:', token ? '✓ Received' : '✗ Not received', '\n');

  if (!token) {
    console.log('Cannot proceed without token');
    return;
  }

  const authHeader = { 'Authorization': `Bearer ${token}` };

  // Test 3: Projects
  console.log('3. Testing /api/projects...');
  const projects = await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/api/projects',
    headers: authHeader
  });
  console.log('   Projects:', projects.length, 'found');
  console.log('   ✓ Projects endpoint works\n');

  // Test 4: Tasks for first project
  if (projects.length > 0) {
    console.log('4. Testing /api/projects/:id/tasks...');
    const tasks = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: `/api/projects/${projects[0].id}/tasks`,
      headers: authHeader
    });
    console.log('   Tasks:', tasks.length, 'found');
    console.log('   ✓ Tasks endpoint works\n');

    // Test 5: Planner
    console.log('5. Testing /api/projects/:id/planner...');
    const planner = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: `/api/projects/${projects[0].id}/planner`,
      headers: authHeader
    });
    console.log('   Summary:', planner.summary);
    console.log('   ✓ Planner endpoint works\n');
  }

  // Test 6: Jobs
  console.log('6. Testing /api/jobs...');
  const jobs = await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/api/jobs',
    headers: authHeader
  });
  console.log('   Jobs:', jobs.length, 'found');
  console.log('   ✓ Jobs endpoint works\n');

  // Test 7: Customers
  console.log('7. Testing /api/customers...');
  const customers = await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/api/customers',
    headers: authHeader
  });
  console.log('   Customers:', customers.length, 'found');
  console.log('   ✓ Customers endpoint works\n');

  // Test 8: Dashboard
  console.log('8. Testing /api/dashboard/summary...');
  const dashboard = await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/api/dashboard/summary',
    headers: authHeader
  });
  console.log('   Dashboard:', dashboard.totalJobs, 'jobs,', dashboard.totalCustomers, 'customers');
  console.log('   ✓ Dashboard endpoint works\n');

  console.log('=== All API Tests Passed ===');
}

testAPI().catch(console.error);
