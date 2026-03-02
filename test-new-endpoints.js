const http = require('http');

// Helper function to make HTTP requests
function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
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

async function testNewEndpoints() {
  console.log('=== Testing 4 New Endpoints ===\n');

  // Step 1: Login to get token
  console.log('1. Login...');
  const loginBody = JSON.stringify({ username: 'admin', password: '1111' });
  const loginRes = await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': loginBody.length }
  }, loginBody);

  if (loginRes.status !== 200 || !loginRes.data.token) {
    console.log('❌ Login failed');
    return;
  }

  const token = loginRes.data.token;
  const authHeader = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  console.log('✅ Logged in\n');

  // Test 1: DELETE /api/jobs/:id
  console.log('2. Testing DELETE /api/jobs/:id');
  try {
    // First create a job to delete
    const jobBody = JSON.stringify({ title: 'Test Job for Delete', priority: 'low' });
    const createRes = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/jobs',
      method: 'POST',
      headers: { ...authHeader, 'Content-Length': jobBody.length }
    }, jobBody);

    if (createRes.status === 201 && createRes.data.id) {
      const jobId = createRes.data.id;
      console.log(`   Created job: ${jobId}`);

      // Now delete it
      const deleteRes = await makeRequest({
        hostname: 'localhost',
        port: 3002,
        path: `/api/jobs/${jobId}`,
        method: 'DELETE',
        headers: authHeader
      });

      if (deleteRes.status === 200) {
        console.log('   ✅ DELETE /api/jobs/:id - PASSED');
      } else {
        console.log(`   ❌ DELETE /api/jobs/:id - FAILED (status: ${deleteRes.status})`);
      }
    } else {
      console.log('   ❌ Could not create test job');
    }
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
  }
  console.log('');

  // Test 2: GET /api/invoices/:id
  console.log('3. Testing GET /api/invoices/:id');
  try {
    const invoiceRes = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/invoices/INV-2026-001',
      headers: authHeader
    });

    if (invoiceRes.status === 200 && invoiceRes.data.id) {
      console.log('   ✅ GET /api/invoices/:id - PASSED');
      console.log(`   Invoice: ${invoiceRes.data.id}${invoiceRes.data - $.amount}`);
    } else {
      console.log(`   ❌ GET /api/invoices/:id - FAILED (status: ${invoiceRes.status})`);
    }
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
  }
  console.log('');

  // Test 3: Task Attendance Endpoints
  console.log('4. Testing Task Attendance Endpoints');

  // Get a task first
  try {
    const tasksRes = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/projects/proj-1/tasks',
      headers: authHeader
    });

    if (tasksRes.status === 200 && tasksRes.data.length > 0) {
      const task = tasksRes.data.find(t => t.status !== 'completed') || tasksRes.data[0];
      const taskId = task.id;
      console.log(`   Using task: ${taskId} (status: ${task.status})`);

      // Test START
      const startRes = await makeRequest({
        hostname: 'localhost',
        port: 3002,
        path: `/api/tasks/${taskId}/start`,
        method: 'POST',
        headers: authHeader
      });

      if (startRes.status === 200 && startRes.data.actualStart) {
        console.log('   ✅ POST /api/tasks/:id/start - PASSED');
      } else {
        console.log(`   ❌ POST /api/tasks/:id/start - FAILED (status: ${startRes.status})`);
      }

      // Test PAUSE (if in progress)
      if (startRes.data.status === 'in_progress') {
        const pauseRes = await makeRequest({
          hostname: 'localhost',
          port: 3002,
          path: `/api/tasks/${taskId}/pause`,
          method: 'POST',
          headers: authHeader
        });

        if (pauseRes.status === 200 && pauseRes.data.status === 'paused') {
          console.log('   ✅ POST /api/tasks/:id/pause - PASSED');

          // Test RESUME
          const resumeRes = await makeRequest({
            hostname: 'localhost',
            port: 3002,
            path: `/api/tasks/${taskId}/resume`,
            method: 'POST',
            headers: authHeader
          });

          if (resumeRes.status === 200 && resumeRes.data.status === 'in_progress') {
            console.log('   ✅ POST /api/tasks/:id/resume - PASSED');
          } else {
            console.log(`   ❌ POST /api/tasks/:id/resume - FAILED (status: ${resumeRes.status})`);
          }
        } else {
          console.log(`   ❌ POST /api/tasks/:id/pause - FAILED (status: ${pauseRes.status})`);
        }
      }

      // Test FINISH
      const finishRes = await makeRequest({
        hostname: 'localhost',
        port: 3002,
        path: `/api/tasks/${taskId}/finish`,
        method: 'POST',
        headers: authHeader
      });

      if (finishRes.status === 200 && finishRes.data.status === 'completed') {
        console.log('   ✅ POST /api/tasks/:id/finish - PASSED');
      } else {
        console.log(`   ❌ POST /api/tasks/:id/finish - FAILED (status: ${finishRes.status})`);
      }
    } else {
      console.log('   ❌ No tasks found');
    }
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
  }
  console.log('');

  // Logout
  console.log('5. Logout...');
  await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/api/auth/logout',
    method: 'POST',
    headers: authHeader
  });
  console.log('✅ Done\n');

  console.log('=== All 4 Endpoints Tested ===');
}

testNewEndpoints().catch(console.error);
