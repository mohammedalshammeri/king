# Quick test for admin API
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Quick test for Admin Users API" -ForegroundColor Yellow
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if backend is accessible
Write-Host "1. Testing backend access..." -ForegroundColor Green

try {
    $health = Invoke-RestMethod -Uri "https://api.kotm.app/health" -Method Get -TimeoutSec 10
    Write-Host "   OK - Backend is working: $($health.data.status)" -ForegroundColor Green
} catch {
    Write-Host "   ERROR - Backend not responding!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "2. Testing login..." -ForegroundColor Green
Write-Host ""
Write-Host "Enter admin credentials:" -ForegroundColor Yellow

$phoneNumber = Read-Host "   Phone number (example: +97333123456)"
$password = Read-Host "   Password" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
)

$loginBody = @{
    phoneNumber = $phoneNumber
    password = $passwordPlain
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "https://api.kotm.app/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -TimeoutSec 10
    $token = $loginResponse.data.access_token
    Write-Host ""
    Write-Host "   OK - Login successful!" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "   ERROR - Login failed" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Response: $responseBody" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Check:" -ForegroundColor Yellow
    Write-Host "   - Is phone number correct? (must start with +973)" -ForegroundColor Gray
    Write-Host "   - Is password correct?" -ForegroundColor Gray
    Write-Host "   - Does user have admin permissions?" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "3. Testing fetch users..." -ForegroundColor Green

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $usersResponse = Invoke-RestMethod -Uri "https://api.kotm.app/api/v1/admin/users" -Method Get -Headers $headers -TimeoutSec 10
    
    Write-Host ""
    Write-Host "   OK - Data fetched successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "RESULTS:" -ForegroundColor Cyan
    Write-Host "   Total users: $($usersResponse.meta.total)" -ForegroundColor White
    Write-Host "   Users in this page: $($usersResponse.data.Count)" -ForegroundColor White
    Write-Host ""
    
    if ($usersResponse.meta.total -eq 0) {
        Write-Host "WARNING - No users in database!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Possible reasons:" -ForegroundColor Yellow
        Write-Host "   1. Database is actually empty" -ForegroundColor Gray
        Write-Host "   2. New migration cleared data" -ForegroundColor Gray
        Write-Host "   3. Backend connected to wrong database" -ForegroundColor Gray
    } else {
        Write-Host "OK - Data exists in backend!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Sample users:" -ForegroundColor Cyan
        
        $count = [Math]::Min(3, $usersResponse.data.Count)
        for ($i = 0; $i -lt $count; $i++) {
            $user = $usersResponse.data[$i]
            Write-Host ""
            Write-Host "   $($i + 1). $($user.email)" -ForegroundColor White
            Write-Host "      Phone: $($user.phone)" -ForegroundColor Gray
            Write-Host "      Role: $($user.role)" -ForegroundColor Gray
        }
        
        Write-Host ""
        Write-Host "=" * 60 -ForegroundColor Cyan
        Write-Host ""
        Write-Host "CONCLUSION:" -ForegroundColor Yellow
        Write-Host "   OK - Backend API works correctly" -ForegroundColor Green
        Write-Host "   OK - Data exists ($($usersResponse.meta.total) users)" -ForegroundColor Green
        Write-Host "   ERROR - Problem is in Admin Dashboard (Frontend)" -ForegroundColor Red
        Write-Host ""
        Write-Host "SOLUTION:" -ForegroundColor Yellow
        Write-Host "   1. Open admin: https://admin.kotm.app/dashboard/users" -ForegroundColor Gray
        Write-Host "   2. Press F12 to open Developer Tools" -ForegroundColor Gray
        Write-Host "   3. Go to Console tab" -ForegroundColor Gray
        Write-Host "   4. Look for errors or messages" -ForegroundColor Gray
        Write-Host "   5. Go to Network tab" -ForegroundColor Gray
        Write-Host "   6. Refresh page and check API call to /admin/users" -ForegroundColor Gray
        Write-Host "   7. Check Response - does it have data?" -ForegroundColor Gray
        Write-Host ""
    }
    
} catch {
    Write-Host ""
    Write-Host "   ERROR - Failed to fetch users" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host ""
        Write-Host "   Token is invalid or expired" -ForegroundColor Yellow
    }
    
    exit 1
}

Write-Host ""
