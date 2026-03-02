const http = require('http');

// Test configuration
const API_BASE = 'http://localhost:3002/api';
const FRONTEND_URL = 'http://localhost:3001';

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

async function runIntegrationTests() {
  console.log('=== PART 3: INTEGRATION TESTING ===\n');
  console.log('Testing frontend-backend communication...\n');

  let results = { passed: 0, failed: 0 };
  let token = null;
  let authHeader = {};

  // Test 1: API Server Health
  console.log('1. Testing API Server Health...');
  try {
    const statusRes = await makeRequest({ hostname: 'localhost', port: 3002, path: '/api/status' });
    if (statusRes.status === 200 && statusRes.data.ok) {
      console.log('   ✅ API Server is running');
      results.passed++;
    } else {
      console.log('   ❌ API Server not responding correctly');
      results.failed++;
    }
  } catch (e) {
    console.log('   ❌ API Server not accessible:', e.message);
    results.failed++;
  }
  console.log('');

  // Test 2: Login Flow
  console.log('2. Testing Login Flow (Auth → Backend)...');
  try {
    const loginBody = JSON.stringify({ username: 'admin', password: '1111' });
    const loginRes = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': loginBody.length }
    }, loginBody);

    if (loginRes.status === 200 && loginRes.data.token && loginRes.data.user) {
      token = loginRes.data.token;
      authHeader = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
      console.log('   ✅ Login successful, token received');
      console.log('   User:', loginRes.data.user.username, '- Role:', loginRes.data.user.role);
      results.passed++;
    } else {
      console.log('   ❌ Login failed');
      results.failed++;
    }
  } catch (e) {
    console.log('   ❌ Login error:', e.message);
    results.failed++;
  }
  console.log('');

  if (!token) {
    console.log('Cannot proceed with integration tests without authentication');
    console.log('\n=== INTEGRATION TEST SUMMARY ===');
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    return;
  }

  // Test 3: Dashboard Data Flow
  console.log('3. Testing Dashboard Data Flow...');
  try {
    const dashRes = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/dashboard/summary',
      headers: authHeader
    });
    if (dashRes.status === 200 && dashRes.data.totalJobs !== undefined) {
      console.log('   ✅ Dashboard data retrieved');
      console.log('   Jobs:', dashRes.data.totalJobs, '| Customers:', dashRes.data.totalCustomers);
      results.passed++;
    } else {
      console.log('   ❌ Dashboard data invalid');
      results.failed++;
    }
  } catch (e) {
    console.log('   ❌ Dashboard error:', e.message);
    results.failed++;
  }
  console.log('');

  // Test 4: Jobs CRUD Flow
  console.log('4. Testing Jobs CRUD Flow...');
  let testJobId = null;
  try {
    // Create Job
    const createJobBody = JSON.stringify({
      title: 'Integration Test Job',
      priority: 'high',
      location: 'Test Location',
      category: 'test'
    });
    const createRes = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/jobs',
      method: 'POST',
      headers: { ...authHeader, 'Content-Length': createJobBody.length }
    }, createJobBody);

    if (createRes.status === 201 && createRes.data.id) {
      testJobId = createRes.data.id;
      console.log('   ✅ Job created:', testJobId);
      results.passed++;

      // Read Job
      const readRes = await makeRequest({
        hostname: 'localhost',
        port: 3002,
        path: `/api/jobs`,
        headers: authHeader
      });
      if (readRes.status === 200 && Array.isArray(readRes.data)) {
        console.log('   ✅ Jobs list retrieved:', readRes.data.length, 'jobs');
        results.passed++;
      } else {
        console.log('   ❌ Jobs list failed');
        results.failed++;
      }

      // Update Job
      const updateBody = JSON.stringify({ title: 'Updated Test Job', status: 'in-progress' });
      const updateRes = await makeRequest({
        hostname: 'localhost',
        port: 3002,
        path: `/api/jobs/${testJobId}`,
        method: 'PUT',
        headers: { ...authHeader, 'Content-Length': updateBody.length }
      }, updateBody);
      if (updateRes.status === 200) {
        console.log('   ✅ Job updated');
        results.passed++;
      } else {
        console.log('   ❌ Job update failed');
        results.failed++;
      }

      // Update Status
      const statusBody = JSON.stringify({ status: 'completed' });
      const statusRes = await makeRequest({
        hostname: 'localhost',
        port: 3002,
        path: `/api/jobs/${testJobId}/status`,
        method: 'PATCH',
        headers: { ...authHeader, 'Content-Length': statusBody.length }
      }, statusBody);
      if (statusRes.status === 200) {
        console.log('   ✅ Job status updated');
        results.passed++;
      } else {
        console.log('   ❌ Job status update failed');
        results.failed++;
      }
    } else {
      console.log('   ❌ Job creation failed');
      results.failed++;
    }
  } catch (e) {
    console.log('   ❌ Jobs CRUD error:', e.message);
    results.failed++;
  }
  console.log('');

  // Test 5: Projects & Tasks Flow
  console.log('5. Testing Projects & Tasks Flow...');
  try {
    const projectsRes = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/projects',
      headers: authHeader
    });
    if (projectsRes.status === 200 && Array.isArray(projectsRes.data)) {
      console.log('   ✅ Projects retrieved:', projectsRes.data.length);
      results.passed++;

      if (projectsRes.data.length > 0) {
        const projectId = projectsRes.data[0].id;
        const tasksRes = await makeRequest({
          hostname: 'localhost',
          port: 3002,
          path: `/api/projects/${projectId}/tasks`,
          headers: authHeader
        });
        if (tasksRes.status === 200 && Array.isArray(tasksRes.data)) {
          console.log('   ✅ Tasks retrieved for project:', tasksRes.data.length);
          results.passed++;

          // Test task update
          if (tasksRes.data.length > 0) {
            const taskId = tasksRes.data[0].id;
            const progressBody = JSON.stringify({ progress_percent: 50 });
            const progressRes = await makeRequest({
              hostname: 'localhost',
              port: 3002,
              path: `/api/tasks/${taskId}/progress`,
              method: 'PATCH',
              headers: { ...authHeader, 'Content-Length': progressBody.length }
            }, progressBody);
            if (progressRes.status === 200) {
              console.log('   ✅ Task progress updated');
              results.passed++;
            } else {
              console.log('   ❌ Task progress update failed');
              results.failed++;
            }
          }
        } else {
          console.log('   ❌ Tasks retrieval failed');
          results.failed++;
        }

        // Test planner endpoint
        const plannerRes = await makeRequest({
          hostname: 'localhost',
          port: 3002,
          path: `/api/projects/${projectId}/planner`,
          headers: authHeader
        });
        if (plannerRes.status === 200 && plannerRes.data.summary) {
          console.log('   ✅ Planner data retrieved');
          console.log('   Summary:', plannerRes.data.summary.total, 'tasks,', plannerRes.data.summary.overallProgress, '% progress');
          results.passed++;
        } else {
          console.log('   ❌ Planner data failed');
          results.failed++;
        }
      }
    } else {
      console.log('   ❌ Projects retrieval failed');
      results.failed++;
    }
  } catch (e) {
    console.log('   ❌ Projects/Tasks error:', e.message);
    results.failed++;
  }
  console.log('');

  // Test 6: Customers Flow
  console.log('6. Testing Customers Flow...');
  try {
    const custRes = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/customers',
      headers: authHeader
    });
    if (custRes.status === 200 && Array.isArray(custRes.data)) {
      console.log('   ✅ Customers retrieved:', custRes.data.length);
      results.passed++;

      // Create customer
      const newCustBody = JSON.stringify({
        name: 'Integration Test Customer',
        email: 'test@integration.com',
        phone: '555-TEST'
      });
      const createCustRes = await makeRequest({
        hostname: 'localhost',
        port: 3002,
        path: '/api/customers',
        method: 'POST',
        headers: { ...authHeader, 'Content-Length': newCustBody.length }
      }, newCustBody);
      if (createCustRes.status === 201) {
        console.log('   ✅ Customer created:', createCustRes.data.id);
        results.passed++;

        // Delete customer
        const deleteRes = await makeRequest({
          hostname: 'localhost',
          port: 3002,
          path: `/api/customers/${createCustRes.data.id}`,
          method: 'DELETE',
          headers: authHeader
        });
        if (deleteRes.status === 200) {
          console.log('   ✅ Customer deleted');
          results.passed++;
        } else {
          console.log('   ❌ Customer delete failed');
          results.failed++;
        }
      } else {
        console.log('   ❌ Customer creation failed');
        results.failed++;
      }
    } else {
      console.log('   ❌ Customers retrieval failed');
      results.failed++;
    }
  } catch (e) {
    console.log('   ❌ Customers error:', e.message);
    results.failed++;
  }
  console.log('');

  // Test 7: Activity Logging
  console.log('7. Testing Activity Logging...');
  try {
    const activityRes = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/activity',
      headers: authHeader
    });
    if (activityRes.status === 200 && Array.isArray(activityRes.data)) {
      console.log('   ✅ Activity logs retrieved:', activityRes.data.length);
      results.passed++;
    } else {
      console.log('   ❌ Activity logs failed');
      results.failed++;
    }
  } catch (e) {
    console.log('   ❌ Activity error:', e.message);
    results.failed++;
  }
  console.log('');

  // Test 8: Notifications
  console.log('8. Testing Notifications...');
  try {
    const notifRes = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/notifications',
      headers: authHeader
    });
    if (notifRes.status === 200 && Array.isArray(notifRes.data)) {
      console.log('   ✅ Notifications retrieved:', notifRes.data.length);
      results.passed++;
    } else {
      console.log('   ❌ Notifications failed');
      results.failed++;
    }
  } catch (e) {
    console.log('   ❌ Notifications error:', e.message);
    results.failed++;
  }
  console.log('');

  // Test 9: Schedule Data
  console.log('9. Testing Schedule Data...');
  try {
    const scheduleRes = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/schedule',
      headers: authHeader
    });
    if (scheduleRes.status === 200) {
      console.log('   ✅ Schedule retrieved');
      results.passed++;
    } else {
      console.log('   ❌ Schedule failed');
      results.failed++;
    }
  } catch (e) {
    console.log('   ❌ Schedule error:', e.message);
    results.failed++;
  }
  console.log('');

  // Test 10: Technicians
  console.log('10. Testing Technicians Data...');
  try {
    const techRes = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/technicians',
      headers: authHeader
    });
    if (techRes.status === 200 && Array.isArray(techRes.data)) {
      console.log('   ✅ Technicians retrieved:', techRes.data.length);
      results.passed++;
    } else {
      console.log('   ❌ Technicians failed');
      results.failed++;
    }
  } catch (e) {
    console.log('   ❌ Technicians error:', e.message);
    results.failed++;
  }
  console.log('');

  // Test 11: Logout
  console.log('11. Testing Logout Flow...');
  try {
    const logoutRes = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/auth/logout',
      method: 'POST',
      headers: authHeader
    });
    if (logoutRes.status === 200) {
      console.log('   ✅ Logout successful');
      results.passed++;
    } else {
      console.log('   ❌ Logout failed');
      results.failed++;
    }
  } catch (e) {
    console.log('   ❌ Logout error:', e.message);
    results.failed++;
  }
  console.log('');

  // Summary
  console.log('=== INTEGRATION TEST SUMMARY ===');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Total: ${results.passed + results.failed}`);

  if (results.failed === 0) {
    console.log('\n🎉 All integration tests passed!');
  } else {
    console.log('\n⚠️ Some tests failed. Check the results above.');
  }
}

runIntegrationTests().catch(console.error);
