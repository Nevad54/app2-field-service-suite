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
  console.log('=== Comprehensive API Testing ===\n');

  // Test 1: Status
  console.log('1. Testing /api/status...');
  const status = await makeRequest({ hostname: 'localhost', port: 3002, path: '/api/status' });
  console.log('   Status:', status.ok ? '✅ PASSED' : '❌ FAILED');
  console.log('');

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
  console.log('   Login:', login.token ? '✅ PASSED' : '❌ FAILED');
  const token = login.token;

  if (!token) {
    console.log('Cannot proceed without token');
    return;
  }

  const authHeader = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Test 3: /api/auth/me
  console.log('3. Testing /api/auth/me...');
  const me = await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/api/auth/me',
    headers: authHeader
  });
  console.log('   Me:', me.user ? '✅ PASSED' : '❌ FAILED', '- User:', me.user?.username);
  console.log('');

  // Test 4: Dashboard
  console.log('4. Testing /api/dashboard/summary...');
  const dashboard = await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/api/dashboard/summary',
    headers: authHeader
  });
  console.log('   Dashboard:', dashboard.totalJobs !== undefined ? '✅ PASSED' : '❌ FAILED');
  console.log('   - Jobs:', dashboard.totalJobs, '| Customers:', dashboard.totalCustomers);
  console.log('');

  // Test 5: Customers - GET
  console.log('5. Testing GET /api/customers...');
  const customers = await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/api/customers',
    headers: authHeader
  });
  console.log('   Customers:', Array.isArray(customers) ? '✅ PASSED' : '❌ FAILED', '- Count:', customers.length);
  console.log('');

  // Test 6: Jobs - GET
  console.log('6. Testing GET /api/jobs...');
  const jobs = await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/api/jobs',
    headers: authHeader
  });
  console.log('   Jobs:', Array.isArray(jobs) ? '✅ PASSED' : '❌ FAILED', '- Count:', jobs.length);
  console.log('');

  // Test 7: Projects - GET
  console.log('7. Testing GET /api/projects...');
  const projects = await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/api/projects',
    headers: authHeader
  });
  console.log('   Projects:', Array.isArray(projects) ? '✅ PASSED' : '❌ FAILED', '- Count:', projects.length);
  console.log('');

  // Test 8: Tasks - GET
  console.log('8. Testing GET /api/projects/:id/tasks...');
  const tasks = await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/api/projects/proj-1/tasks',
    headers: authHeader
  });
  console.log('   Tasks:', Array.isArray(tasks) ? '✅ PASSED' : '❌ FAILED', '- Count:', tasks.length);
  console.log('');

  // Test 9: Planner - GET
  console.log('9. Testing GET /api/projects/:id/planner...');
  const planner = await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/api/projects/proj-1/planner',
    headers: authHeader
  });
  console.log('   Planner:', planner.summary ? '✅ PASSED' : '❌ FAILED');
  console.log('   - Summary:', planner.summary);
  console.log('');

  // Test 10: Invoices - GET
  console.log('10. Testing GET /api/invoices...');
  const invoices = await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/api/invoices',
    headers: authHeader
  });
  console.log('   Invoices:', Array.isArray(invoices) ? '✅ PASSED' : '❌ FAILED', '- Count:', invoices.length);
  console.log('');

  // Test 11: Activity - GET
  console.log('11. Testing GET /api/activity...');
  const activity = await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/api/activity',
    headers: authHeader
  });
  console.log('   Activity:', Array.isArray(activity) ? '✅ PASSED' : '❌ FAILED', '- Count:', activity.length);
  console.log('');

  // Test 12: Schedule - GET
  console.log('12. Testing GET /api/schedule...');
  const schedule = await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/api/schedule',
    headers: authHeader
  });
  console.log('   Schedule:', Array.isArray(schedule) ? '✅ PASSED' : '❌ FAILED', '- Count:', schedule.length);
  console.log('');

  // Test 13: Technicians - GET
  console.log('13. Testing GET /api/technicians...');
  const technicians = await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/api/technicians',
    headers: authHeader
  });
  console.log('   Technicians:', Array.isArray(technicians) ? '✅ PASSED' : '❌ FAILED', '- Count:', technicians.length);
  console.log('');

  // Test 14: Inventory - GET
  console.log('14. Testing GET /api/inventory...');
  const inventory = await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/api/inventory',
    headers: authHeader
  });
  console.log('   Inventory:', Array.isArray(inventory) ? '✅ PASSED' : '❌ FAILED', '- Count:', inventory.length);
  console.log('');

  // Test 15: Equipment - GET
  console.log('15. Testing GET /api/equipment...');
  const equipment = await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/api/equipment',
    headers: authHeader
  });
  console.log('   Equipment:', Array.isArray(equipment) ? '✅ PASSED' : '❌ FAILED', '- Count:', equipment.length);
  console.log('');

  // Test 16: Quotes - GET
  console.log('16. Testing GET /api/quotes...');
  const quotes = await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/api/quotes',
    headers: authHeader
  });
  console.log('   Quotes:', Array.isArray(quotes) ? '✅ PASSED' : '❌ FAILED', '- Count:', quotes.length);
  console.log('');

  // Test 17: Recurring - GET
  console.log('17. Testing GET /api/recurring...');
  const recurring = await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/api/recurring',
    headers: authHeader
  });
  console.log('   Recurring:', Array.isArray(recurring) ? '✅ PASSED' : '❌ FAILED', '- Count:', recurring.length);
  console.log('');

  // Test 18: Notifications - GET
  console.log('18. Testing GET /api/notifications...');
  const notifications = await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/api/notifications',
    headers: authHeader
  });
  console.log('   Notifications:', Array.isArray(notifications) ? '✅ PASSED' : '❌ FAILED', '- Count:', notifications.length);
  console.log('');

  // Test 19: Logout
  console.log('19. Testing POST /api/auth/logout...');
  const logout = await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/api/auth/logout',
    method: 'POST',
    headers: authHeader
  });
  console.log('   Logout:', logout.ok ? '✅ PASSED' : '❌ FAILED');
  console.log('');

  console.log('=== Comprehensive API Testing Complete ===');
}

testAPI().catch(console.error);
