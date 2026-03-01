// Quick test to check projects API
const http = require('http');

const postData = JSON.stringify({ username: 'admin', password: '1111' });

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const login = JSON.parse(data);
    if (login.token) {
      console.log('Login successful, token:', login.token.substring(0, 20) + '...');
      
      // Now get projects
      const req2 = http.request({
        hostname: 'localhost',
        port: 3002,
        path: '/api/projects',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${login.token}` }
      }, (res2) => {
        let data2 = '';
        res2.on('data', (chunk) => { data2 += chunk; });
        res2.on('end', () => {
          const projects = JSON.parse(data2);
          console.log('Number of projects:', projects.length);
          console.log('Projects:', projects.map(p => `${p.id}: ${p.title} (${p.status}) - ${p.overall_progress}%`).join('\n'));
        });
      });
      req2.end();
    } else {
      console.log('Login failed:', data);
    }
  });
});

req.write(postData);
req.end();
