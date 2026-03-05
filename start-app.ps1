param(
  [switch]$KeepExisting
)

$ErrorActionPreference = 'Stop'
$root = "d:\Web App\app2-field-service-suite"
$backendDir = Join-Path $root "backend"
$frontendDir = Join-Path $root "frontend"

function Get-ListeningPid([int]$port) {
  $conn = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($null -eq $conn) { return $null }
  return [int]$conn.OwningProcess
}

function Stop-PortListener([int]$port, [string]$label) {
  $listenerPid = Get-ListeningPid $port
  if ($null -eq $listenerPid) {
    Write-Host "$label port $port is free." -ForegroundColor DarkGray
    return
  }

  $proc = Get-Process -Id $listenerPid -ErrorAction SilentlyContinue
  if ($null -eq $proc) {
    Write-Host "$label port $port is occupied by PID $listenerPid." -ForegroundColor Yellow
    return
  }

  Write-Host "Stopping existing $label listener on port $port (PID $listenerPid, $($proc.ProcessName))..." -ForegroundColor Yellow
  Stop-Process -Id $listenerPid -Force -ErrorAction SilentlyContinue
  Start-Sleep -Milliseconds 700
}

if (-not $KeepExisting) {
  Stop-PortListener -port 3002 -label "Backend"
  Stop-PortListener -port 3001 -label "Frontend"
}

Write-Host "Starting Backend server with Supabase..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$backendDir'; npm run start"
)

Start-Sleep -Seconds 2

Write-Host "Starting Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$frontendDir'; npm start"
)

Write-Host "Application starting..." -ForegroundColor Green
Write-Host "Backend: http://localhost:3002" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:3001" -ForegroundColor Yellow

Start-Sleep -Seconds 6

try {
  $status = Invoke-RestMethod -UseBasicParsing -Uri "http://localhost:3002/api/status" -TimeoutSec 6
  Write-Host "Backend health check: OK ($($status.service))" -ForegroundColor Green
}
catch {
  Write-Host "Backend health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

try {
  $login = Invoke-RestMethod -Method Post -Uri "http://localhost:3002/api/auth/login" -ContentType "application/json" -Body '{"username":"admin","password":"1111"}' -TimeoutSec 8
  $dispatch = Invoke-RestMethod -Method Get -Uri "http://localhost:3002/api/settings/dispatch" -Headers @{ Authorization = "Bearer $($login.token)" } -TimeoutSec 8
  Write-Host "Dispatch settings route: OK (maxJobs=$($dispatch.maxJobsPerTechnicianPerDay), dueSoonDays=$($dispatch.slaDueSoonDays))" -ForegroundColor Green
}
catch {
  Write-Host "Dispatch settings route check failed: $($_.Exception.Message)" -ForegroundColor Red
}
