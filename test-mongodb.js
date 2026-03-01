// Test script to verify the backend API
const http = require('http');

function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function testAPI() {
  // Login
  console.log('1. Testing login...');
  const loginRes = await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ username: 'admin', password: '1111' }));
  
  console.log('Login:', loginRes);
  const token = loginRes.token;
  
  if (!token) {
    console.log('Login failed');
    return;
  }
  
  // Get projects
  console.log('\n2. Testing get projects...');
  const projectsRes = await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/api/projects',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Projects count:', projectsRes.length);
  console.log('Projects:', projectsRes.map(p => `${p.id}: ${p.title} (${p.status}) - ${p.overall_progress}%`).join('\n'));
  
  // Test planner endpoint for first project
  if (projectsRes.length > 0) {
    const projectId = projectsRes[0].id;
    console.log('\n3. Testing planner for project:', projectId);
    const plannerRes = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: `/api/projects/${projectId}/planner`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Summary:', JSON.stringify(plannerRes.summary, null, 2));
  }
}

testAPI().catch(console.error);
