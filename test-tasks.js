// Quick test to check tasks API
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
      // Now get tasks for each project
      ['proj-1', 'proj-2', 'proj-3', 'proj-4', 'proj-5'].forEach(projectId => {
        const req2 = http.request({
          hostname: 'localhost',
          port: 3002,
          path: `/api/projects/${projectId}/tasks`,
          method: 'GET',
          headers: { 'Authorization': `Bearer ${login.token}` }
        }, (res2) => {
          let data2 = '';
          res2.on('data', (chunk) => { data2 += chunk; });
          res2.on('end', () => {
            const tasks = JSON.parse(data2);
            console.log(`${projectId}: ${tasks.length} tasks`);
            tasks.forEach(t => {
              console.log(`  - ${t.name}: ${t.progress_percent}% (weight: ${t.weight})`);
            });
          });
        });
        req2.end();
      });
    }
  });
});

req.write(postData);
req.end();
