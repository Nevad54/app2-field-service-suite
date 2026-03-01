const http = require('http');

// Test login through frontend proxy
const loginData = JSON.stringify({ username: 'admin', password: '1111' });

const loginOptions = {
  hostname: 'localhost',
  port: 3001,
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
    console.log('=== PROXY TEST (Frontend -> Backend) ===');
    console.log('Status:', res.statusCode);
    try {
      const response = JSON.parse(body);
      console.log('Response:', JSON.stringify(response, null, 2));
      
      if (response.token) {
        console.log('\n✅ Proxy is working correctly!');
      } else if (response.error) {
        console.log('\n❌ Error:', response.error);
      }
    } catch (e) {
      console.log('Response (raw):', body);
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(loginData);
req.end();
