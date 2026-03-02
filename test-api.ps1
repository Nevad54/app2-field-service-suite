# Test API endpoints
$ErrorActionPreference = "Stop"

# Test 1: Status endpoint
Write-Host "Test 1: Testing /api/status..."
$status = Invoke-RestMethod -Uri "http://localhost:3002/api/status"
Write-Host "Status: $($status | ConvertTo-Json)"

# Test 2: Login
Write-Host "`nTest 2: Testing /api/auth/login..."
$loginBody = @{
    username = "admin"
    password = "1111"
} | ConvertTo-Json

$loginResp = Invoke-RestMethod -Uri "http://localhost:3002/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $loginResp.token
Write-Host "Token received: $($token.Substring(0, 20))..."

# Test 3: Get projects
Write-Host "`nTest 3: Testing /api/projects..."
$projects = Invoke-RestMethod -Uri "http://localhost:3002/api/projects" -Headers @{Authorization="Bearer $token"}
Write-Host "Projects count: $($projects.Count)"

# Test 4: Get planner data
Write-Host "`nTest 4: Testing /api/projects/proj-1/planner..."
$planner = Invoke-RestMethod -Uri "http://localhost:3002/api/projects/proj-1/planner" -Headers @{Authorization="Bearer $token"}
Write-Host "Project: $($planner.project.title)"
Write-Host "Summary: Total=$($planner.summary.total), Completed=$($planner.summary.completed), InProgress=$($planner.summary.inProgress), Delayed=$($planner.summary.delayed)"
Write-Host "Total Weight: $($planner.summary.totalWeight)"
Write-Host "Overall Progress: $($planner.summary.overallProgress)%"

# Test 5: Get tasks
Write-Host "`nTest 5: Testing /api/projects/proj-1/tasks..."
$tasks = Invoke-RestMethod -Uri "http://localhost:3002/api/projects/proj-1/tasks" -Headers @{Authorization="Bearer $token"}
Write-Host "Tasks count: $($tasks.Count)"

# Show sample task
if ($tasks.Count -gt 0) {
    $sampleTask = $tasks[0]
    Write-Host "Sample task: $($sampleTask.name) - Progress: $($sampleTask.progress_percent)%, Weight: $($sampleTask.weight)"
}

# Test 6: Test task progress update
Write-Host "`nTest 6: Testing PATCH /api/tasks/:id/progress..."
$taskId = $tasks[0].id
$progressBody = @{progress_percent = 55} | ConvertTo-Json
$updatedTask = Invoke-RestMethod -Uri "http://localhost:3002/api/tasks/$taskId/progress" -Method PATCH -Body $progressBody -ContentType "application/json" -Headers @{Authorization="Bearer $token"}
Write-Host "Updated task progress: $($updatedTask.progress_percent)%"

# Reset progress
$progressBody = @{progress_percent = $tasks[0].progress_percent} | ConvertTo-Json
$resetTask = Invoke-RestMethod -Uri "http://localhost:3002/api/tasks/$taskId/progress" -Method PATCH -Body $progressBody -ContentType "application/json" -Headers @{Authorization="Bearer $token"}
Write-Host "Reset task progress to: $($resetTask.progress_percent)%"

Write-Host "`n=== All tests passed! ==="
