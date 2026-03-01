# Start Field Service Suite
Write-Host "Starting Backend server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'd:/Web App/app2-field-service-suite/backend'; node server.js"

Start-Sleep -Seconds 2

Write-Host "Starting Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'd:/Web App/app2-field-service-suite/frontend'; npm start"

Write-Host "Application starting..." -ForegroundColor Green
Write-Host "Backend: http://localhost:3002" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:3001" -ForegroundColor Yellow
