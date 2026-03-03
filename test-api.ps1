$body = @{username='admin';password='1111'} | ConvertTo-Json
$login = Invoke-RestMethod -Uri 'http://localhost:3002/api/auth/login' -Method POST -Body $body -ContentType 'application/json'
$token = $login.token

Write-Host "Token: $token"
Write-Host ""
Write-Host "=== TECHNICIANS ==="
Invoke-RestMethod -Uri 'http://localhost:3002/api/technicians' -Method GET -Headers @{"Authorization"="Bearer $token"}
Write-Host ""
Write-Host "=== INVENTORY ==="
Invoke-RestMethod -Uri 'http://localhost:3002/api/inventory' -Method GET -Headers @{"Authorization"="Bearer $token"}
Write-Host ""
Write-Host "=== EQUIPMENT ==="
Invoke-RestMethod -Uri 'http://localhost:3002/api/equipment' -Method GET -Headers @{"Authorization"="Bearer $token"}
Write-Host ""
Write-Host "=== QUOTES ==="
Invoke-RestMethod -Uri 'http://localhost:3002/api/quotes' -Method GET -Headers @{"Authorization"="Bearer $token"}
Write-Host ""
Write-Host "=== PROJECTS ==="
Invoke-RestMethod -Uri 'http://localhost:3002/api/projects' -Method GET -Headers @{"Authorization"="Bearer $token"}
