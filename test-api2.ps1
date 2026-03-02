# Test additional API endpoints
$ErrorActionPreference = "Stop"

# Login first
$loginBody = @{username="admin"; password="1111"} | ConvertTo-Json
$loginResp = Invoke-RestMethod -Uri "http://localhost:3002/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $loginResp.token

# Test: Create new task
Write-Host "Test: Creating new task..."
$newTaskBody = @{
    project_id = "proj-2"
    name = "Test Task - API"
    start_date = "2026-03-01"
    end_date = "2026-03-15"
    weight = 5
    progress_percent = 0
    notes = "Created via API test"
} | ConvertTo-Json

$newTask = Invoke-RestMethod -Uri "http://localhost:3002/api/tasks" -Method POST -Body $newTaskBody -ContentType "application/json" -Headers @{Authorization="Bearer $token"}
Write-Host "Created task: $($newTask.id) - $($newTask.name)"
Write-Host "Duration: $($newTask.duration_days) days"

# Test: Update task
Write-Host "`nTest: Updating task..."
$updateBody = @{
    notes = "Updated via API test"
    weight = 10
} | ConvertTo-Json

$updatedTask = Invoke-RestMethod -Uri "http://localhost:3002/api/tasks/$($newTask.id)" -Method PUT -Body $updateBody -ContentType "application/json" -Headers @{Authorization="Bearer $token"}
Write-Host "Updated task weight: $($updatedTask.weight)"

# Test: Get project tasks after update
Write-Host "`nTest: Getting project tasks..."
$tasks = Invoke-RestMethod -Uri "http://localhost:3002/api/projects/proj-2/tasks" -Headers @{Authorization="Bearer $token"}
Write-Host "Project 2 tasks count: $($tasks.Count)"

# Check project progress
$planner = Invoke-RestMethod -Uri "http://localhost:3002/api/projects/proj-2/planner" -Headers @{Authorization="Bearer $token"}
Write-Host "Project 2 progress: $($planner.summary.overallProgress)%"

# Test: Delete task
Write-Host "`nTest: Deleting task..."
$deleteResp = Invoke-RestMethod -Uri "http://localhost:3002/api/tasks/$($newTask.id)" -Method DELETE -Headers @{Authorization="Bearer $token"}
Write-Host "Delete response: $($deleteResp | ConvertTo-Json)"

# Verify deleted
$tasksAfter = Invoke-RestMethod -Uri "http://localhost:3002/api/projects/proj-2/tasks" -Headers @{Authorization="Bearer $token"}
Write-Host "Project 2 tasks after delete: $($tasksAfter.Count)"

# Test: Get all projects
Write-Host "`nTest: Getting all projects..."
$projects = Invoke-RestMethod -Uri "http://localhost:3002/api/projects" -Headers @{Authorization="Bearer $token"}
foreach ($p in $projects) {
    Write-Host "  - $($p.id): $($p.title) (Progress: $($p.overall_progress)%)"
}

# Test: Get technicians
Write-Host "`nTest: Getting technicians..."
$techs = Invoke-RestMethod -Uri "http://localhost:3002/api/technicians" -Headers @{Authorization="Bearer $token"}
Write-Host "Technicians count: $($techs.Count)"

# Test: Get customers
Write-Host "`nTest: Getting customers..."
$customers = Invoke-RestMethod -Uri "http://localhost:3002/api/customers" -Headers @{Authorization="Bearer $token"}
Write-Host "Customers count: $($customers.Count)"

# Test: Get jobs
Write-Host "`nTest: Getting jobs..."
$jobs = Invoke-RestMethod -Uri "http://localhost:3002/api/jobs" -Headers @{Authorization="Bearer $token"}
Write-Host "Jobs count: $($jobs.Count)"

# Test: Get activity
Write-Host "`nTest: Getting activity..."
$activity = Invoke-RestMethod -Uri "http://localhost:3002/api/activity" -Headers @{Authorization="Bearer $token"}
Write-Host "Activity count: $($activity.Count)"

Write-Host "`n=== All additional tests passed! ==="
