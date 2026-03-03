const http = require('http');

let authToken = null;

function apiRequest(path, method, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(data ? { 'Content-Length': data.length } : {})
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('========================================');
  console.log('TESTING PATCH /api/tasks/:id/dates');
  console.log('========================================\n');

  // Login
  console.log('📋 Login');
  const login = await apiRequest('/api/auth/login', 'POST', { username: 'admin', password: '1111' });
  console.log('   Status:', login.status);
  if (login.data.token) {
    authToken = login.data.token;
    console.log('   ✅ Login successful');
  } else {
    console.log('   ❌ Login failed:', login.data.error);
    return;
  }

  // Get tasks
  console.log('\n📋 Get Tasks');
  const tasks = await apiRequest('/api/projects/proj-1/tasks', 'GET', null, authToken);
  console.log('   Status:', tasks.status);
  console.log('   Tasks count:', tasks.data.length);
  
  if (tasks.data.length > 0) {
    const taskId = tasks.data[0].id;
    console.log('\n📋 PATCH Task Dates (task:', taskId + ')');
    const update = await apiRequest(`/api/tasks/${taskId}/dates`, 'PATCH', 
      { start_date: '2026-02-01', end_date: '2026-02-15' }, authToken);
    console.log('   Status:', update.status);
    console.log('   Response:', JSON.stringify(update.data));
    
    if (update.status === 200) {
      console.log('   ✅ Date update successful');
    } else {
      console.log('   ❌ Date update failed');
    }
  }

  console.log('\n========================================');
  console.log('TEST COMPLETED');
  console.log('========================================');
}

runTests().catch(console.error);
