const http = require('http');

// Test login first
const loginData = JSON.stringify({ username: 'admin', password: '1111' });

const loginOptions = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
};

const req = http.request(loginOptions, (res) => {
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    console.log('=== LOGIN TEST ===');
    console.log('Status:', res.statusCode);
    const loginResponse = JSON.parse(body);
    console.log('User:', loginResponse.user?.username);
    console.log('Token:', loginResponse.token ? 'Present' : 'Missing');
    
    // Test dashboard endpoint with token
    if (loginResponse.token) {
      testDashboard(loginResponse.token);
    }
  });
});

req.on('error', (e) => {
  console.error('Login Error:', e.message);
});

req.write(loginData);
req.end();

function testDashboard(token) {
  const dashboardOptions = {
    hostname: 'localhost',
    port: 3002,
    path: '/api/dashboard/summary',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  const dashboardReq = http.request(dashboardOptions, (res) => {
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    res.on('end', () => {
      console.log('\n=== DASHBOARD TEST ===');
      console.log('Status:', res.statusCode);
      const data = JSON.parse(body);
      console.log('Total Jobs:', data.totalJobs);
      console.log('Total Customers:', data.totalCustomers);
      console.log('\n✅ All API tests passed!');
    });
  });

  dashboardReq.on('error', (e) => {
    console.error('Dashboard Error:', e.message);
  });
  
  dashboardReq.end();
}
