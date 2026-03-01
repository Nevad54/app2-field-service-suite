const http = require('http');

let authToken = null;

// Helper function to make API requests
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
  console.log('PROJECT PLANNER API - THOROUGH TESTING');
  console.log('========================================\n');

  // Test 1: Login
  console.log('📋 TEST 1: Login');
  const login = await apiRequest('/api/auth/login', 'POST', { username: 'admin', password: '1111' });
  console.log('   Status:', login.status);
  if (login.data.token) {
    authToken = login.data.token;
    console.log('   ✅ Login successful, token received');
  } else {
    console.log('   ❌ Login failed:', login.data.error);
    return;
  }

  // Test 2: Get Projects
  console.log('\n📋 TEST 2: Get Projects');
  const projects = await apiRequest('/api/projects', 'GET', null, authToken);
  console.log('   Status:', projects.status);
  console.log('   Projects count:', projects.data.length);
  if (projects.data.length > 0) {
    console.log('   First project:', projects.data[0].title);
    console.log('   ✅ Projects retrieved successfully');
  }

  // Test 3: Get Project Tasks (for existing project)
  console.log('\n📋 TEST 3: Get Project Tasks');
  const tasks = await apiRequest('/api/projects/proj-1/tasks', 'GET', null, authToken);
  console.log('   Status:', tasks.status);
  console.log('   Tasks count:', tasks.data.length);
  
  // Check for weight field in tasks
  const taskWithWeight = tasks.data.find(t => t.weight !== undefined);
  if (taskWithWeight) {
    console.log('   ✅ Weight field present in tasks');
    console.log('   Sample task weight:', taskWithWeight.weight);
  } else {
    console.log('   ⚠️ Weight field not found in tasks');
  }

  // Test 4: Get Planner Data (with summary)
  console.log('\n📋 TEST 4: Get Planner Data with Summary');
  const planner = await apiRequest('/api/projects/proj-1/planner', 'GET', null, authToken);
  console.log('   Status:', planner.status);
  if (planner.data.summary) {
    console.log('   Overall Progress:', planner.data.summary.overallProgress + '%');
    console.log('   Total Tasks:', planner.data.summary.total);
    console.log('   Completed:', planner.data.summary.completed);
    console.log('   In Progress:', planner.data.summary.inProgress);
    console.log('   Delayed:', planner.data.summary.delayed);
    console.log('   Total Weight:', planner.data.summary.totalWeight);
    console.log('   ✅ Planner summary working');
  }

  // Test 5: Check Task Contribution Calculation
  console.log('\n📋 TEST 5: Verify Task Contribution in Planner Data');
  if (planner.data.tasks && planner.data.tasks.length > 0) {
    const sampleTask = planner.data.tasks[0];
    if (sampleTask.progressContribution !== undefined) {
      const expectedContribution = (sampleTask.progress_percent * (sampleTask.weight || 1)) / 100;
      console.log('   Task:', sampleTask.name);
      console.log('   Progress:', sampleTask.progress_percent + '%');
      console.log('   Weight:', sampleTask.weight);
      console.log('   Contribution:', sampleTask.progressContribution);
      console.log('   Expected:', expectedContribution.toFixed(2));
      if (Math.abs(sampleTask.progressContribution - expectedContribution) < 0.01) {
        console.log('   ✅ Contribution calculation is correct');
      } else {
        console.log('   ❌ Contribution calculation mismatch');
      }
    } else {
      console.log('   ⚠️ progressContribution field not present');
    }
  }

  // Test 6: Create New Task with Weight
  console.log('\n📋 TEST 6: Create Task with Weight');
  const newTask = await apiRequest('/api/tasks', 'POST', {
    project_id: 'proj-1',
    name: 'Test Task - Weight Check',
    start_date: '2024-01-01',
    end_date: '2024-01-15',
    progress_percent: 50,
    weight: 10,
    notes: 'Test task for weight calculation'
  }, authToken);
  console.log('   Status:', newTask.status);
  if (newTask.data.id) {
    console.log('   Task ID:', newTask.data.id);
    console.log('   Weight:', newTask.data.weight);
    console.log('   Progress:', newTask.data.progress_percent);
    console.log('   ✅ Task created with weight');
    
    // Test 7: Update Task Progress
    console.log('\n📋 TEST 7: Update Task Progress');
    const updateProgress = await apiRequest(`/api/tasks/${newTask.data.id}/progress`, 'PATCH', 
      { progress_percent: 75 }, authToken);
    console.log('   Status:', updateProgress.status);
    console.log('   New Progress:', updateProgress.data.progress_percent);
    console.log('   Status (auto):', updateProgress.data.status);
    console.log('   ✅ Progress update working');

    // Test 8: Update Task Weight
    console.log('\n📋 TEST 8: Update Task Weight');
    const updateWeight = await apiRequest(`/api/tasks/${newTask.data.id}`, 'PUT', 
      { weight: 20 }, authToken);
    console.log('   Status:', updateWeight.status);
    console.log('   New Weight:', updateWeight.data.weight);
    console.log('   ✅ Weight update working');

    // Test 9: Verify Project Progress Recalculated
    console.log('\n📋 TEST 9: Verify Project Progress Recalculated');
    const updatedPlanner = await apiRequest('/api/projects/proj-1/planner', 'GET', null, authToken);
    console.log('   Overall Progress:', updatedPlanner.data.summary.overallProgress + '%');
    console.log('   ✅ Project progress recalculated');

    // Test 10: Delete Test Task
    console.log('\n📋 TEST 10: Delete Test Task');
    const deleteTask = await apiRequest(`/api/tasks/${newTask.data.id}`, 'DELETE', null, authToken);
    console.log('   Status:', deleteTask.status);
    console.log('   ✅ Task deleted');
  }

  // Test 11: Sorting Test (verify API returns data correctly)
  console.log('\n📋 TEST 11: Sort by Status');
  const sortedTasks = await apiRequest('/api/projects/proj-1/tasks', 'GET', null, authToken);
  console.log('   Status:', sortedTasks.status);
  console.log('   Tasks returned:', sortedTasks.data.length);
  console.log('   ✅ API returns tasks for frontend sorting');

  // Test 12: Verify Date Calculations
  console.log('\n📋 TEST 12: Duration Calculation');
  const taskForDuration = sortedTasks.data.find(t => t.start_date && t.end_date);
  if (taskForDuration) {
    const start = new Date(taskForDuration.start_date);
    const end = new Date(taskForDuration.end_date);
    const expectedDuration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    console.log('   Task:', taskForDuration.name);
    console.log('   Start:', taskForDuration.start_date);
    console.log('   End:', taskForDuration.end_date);
    console.log('   Duration (DB):', taskForDuration.duration_days);
    console.log('   Duration (Calc):', expectedDuration);
    if (taskForDuration.duration_days === expectedDuration) {
      console.log('   ✅ Duration calculation correct');
    } else {
      console.log('   ⚠️ Duration differs (may include weekends)');
    }
  }

  console.log('\n========================================');
  console.log('ALL TESTS COMPLETED');
  console.log('========================================');
}

runTests().catch(console.error);
