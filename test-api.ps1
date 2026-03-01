# First login to get token
$loginBody = @{
    username = "admin"
    password = "1111"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:3002/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResponse.token

Write-Host "Got token: $token"

# Now call the projects API
$headers = @{
    Authorization = "Bearer $token"
}

$projects = Invoke-RestMethod -Uri "http://localhost:3002/api/projects" -Method Get -Headers $headers
Write-Host "Projects:"
$projects | ConvertTo-Json -Depth 10
