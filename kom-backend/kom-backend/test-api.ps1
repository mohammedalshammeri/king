# KOM Backend API Test Script
# Run with: powershell -ExecutionPolicy Bypass -File test-api.ps1

$base = "http://localhost:3000/api/v1"
$passed = 0
$failed = 0
$skipped = 0

Write-Host ""
Write-Host "=============================================" -ForegroundColor Yellow
Write-Host "   KOM BACKEND API - COMPLETE TEST REPORT" -ForegroundColor Yellow
Write-Host "   $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "=============================================" -ForegroundColor Yellow
Write-Host ""

function Test-Endpoint {
    param($Name, $Method, $Url, $Body, $Headers, $Expected)
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            UseBasicParsing = $true
        }
        if ($Headers) { $params.Headers = $Headers }
        if ($Body) { 
            $params.Body = $Body 
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-RestMethod @params
        
        if ($response.success -eq $true) {
            Write-Host "[PASS] $Name" -ForegroundColor Green
            return @{Success=$true; Data=$response.data}
        } else {
            Write-Host "[FAIL] $Name - $($response.error.message)" -ForegroundColor Red
            return @{Success=$false}
        }
    } catch {
        Write-Host "[FAIL] $Name - $($_.Exception.Message)" -ForegroundColor Red
        return @{Success=$false}
    }
}

# ==================== TESTS ====================

Write-Host "--- HEALTH & AUTH ---" -ForegroundColor Cyan
$r = Test-Endpoint "1. Health Check" "GET" "$base/health"
if ($r.Success) { $passed++ } else { $failed++ }

$superAdminEmail = $env:SUPER_ADMIN_EMAIL
$superAdminPassword = $env:SUPER_ADMIN_PASSWORD

if ([string]::IsNullOrWhiteSpace($superAdminEmail) -or [string]::IsNullOrWhiteSpace($superAdminPassword)) {
    Write-Host "[SKIP] 2. Login Super Admin - set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD env vars" -ForegroundColor Yellow
    $skipped++
} else {
    $superAdminBody = "{`"email`":`"$superAdminEmail`",`"password`":`"$superAdminPassword`"}"
    $r = Test-Endpoint "2. Login Super Admin" "POST" "$base/auth/login" $superAdminBody
    if ($r.Success) {
        $adminToken = $r.Data.accessToken
        $adminRefresh = $r.Data.refreshToken
        $passed++
    } else { $failed++ }
}

$r = Test-Endpoint "3. Login Individual User" "POST" "$base/auth/login" '{"email":"individual@test.com","password":"Test123!"}'
if ($r.Success) { 
    $userToken = $r.Data.accessToken
    $userId = $r.Data.user.id
    $userRefresh = $r.Data.refreshToken
    $passed++ 
} else { $failed++ }

$r = Test-Endpoint "4. Login Showroom User" "POST" "$base/auth/login" '{"email":"showroom@test.com","password":"Test123!"}'
if ($r.Success) { 
    $showroomToken = $r.Data.accessToken
    $passed++ 
} else { $failed++ }

$refreshBody = "{`"refreshToken`":`"$userRefresh`"}"
$r = Test-Endpoint "5. Refresh Token" "POST" "$base/auth/refresh" $refreshBody
if ($r.Success) { $passed++ } else { $failed++ }

$userHeaders = @{Authorization = "Bearer $userToken"}
$adminHeaders = @{Authorization = "Bearer $adminToken"}
$showroomHeaders = @{Authorization = "Bearer $showroomToken"}

$r = Test-Endpoint "6. Get Current User" "GET" "$base/auth/me" $null $userHeaders
if ($r.Success) { $passed++ } else { $failed++ }

Write-Host ""
Write-Host "--- USER PROFILE ---" -ForegroundColor Cyan

$r = Test-Endpoint "7. Get User Profile" "GET" "$base/users/me" $null $userHeaders
if ($r.Success) { $passed++ } else { $failed++ }

$r = Test-Endpoint "8. Get Showroom Profile" "GET" "$base/users/me" $null $showroomHeaders
if ($r.Success) { $passed++ } else { $failed++ }

Write-Host ""
Write-Host "--- LISTINGS (CRUD) ---" -ForegroundColor Cyan

$r = Test-Endpoint "9. Get Public Listings" "GET" "$base/listings"
if ($r.Success) { $passed++ } else { $failed++ }

# Create listing
$listingBody = '{"type":"CAR","title":"BMW X5 2023 Test Listing","description":"Test car listing for API testing","price":15000,"currency":"BHD","locationGovernorate":"Capital","locationArea":"Manama"}'
$r = Test-Endpoint "10. Create Car Listing" "POST" "$base/listings" $listingBody $userHeaders
if ($r.Success) { 
    $listingId = $r.Data.id
    Write-Host "    Listing ID: $listingId" -ForegroundColor Gray
    $passed++ 
} else { $failed++ }

# Car details
$carBody = '{"make":"BMW","model":"X5","year":2023,"mileageKm":15000,"fuel":"PETROL","transmission":"AUTO","bodyType":"SUV","color":"Black"}'
$r = Test-Endpoint "11. Add Car Details" "POST" "$base/listings/$listingId/details/car" $carBody $userHeaders
if ($r.Success) { $passed++ } else { $failed++ }

$r = Test-Endpoint "12. Get My Listings" "GET" "$base/listings/my/all" $null $userHeaders
if ($r.Success) { 
    Write-Host "    Total: $($r.Data.total) listings" -ForegroundColor Gray
    $passed++ 
} else { $failed++ }

$r = Test-Endpoint "13. Get My Single Listing" "GET" "$base/listings/my/$listingId" $null $userHeaders
if ($r.Success) { $passed++ } else { $failed++ }

# Update listing (PATCH)
$updateBody = '{"title":"BMW X5 2023 Updated Title","price":14500}'
$r = Test-Endpoint "14. Update Listing" "PATCH" "$base/listings/$listingId" $updateBody $userHeaders
if ($r.Success) { $passed++ } else { $failed++ }

# Submit and Approval require 3+ images
Write-Host "[SKIP] 15. Submit for Review (requires 3+ images)" -ForegroundColor Yellow
$skipped++

Write-Host ""
Write-Host "--- MODERATION (Admin) ---" -ForegroundColor Cyan

$r = Test-Endpoint "16. Get Pending Listings" "GET" "$base/admin/moderation/listings/pending" $null $adminHeaders
if ($r.Success) { $passed++ } else { $failed++ }

$r = Test-Endpoint "17. Moderation Stats" "GET" "$base/admin/moderation/stats" $null $adminHeaders
if ($r.Success) { $passed++ } else { $failed++ }

$r = Test-Endpoint "18. My Moderation Activity" "GET" "$base/admin/moderation/my-activity" $null $adminHeaders
if ($r.Success) { $passed++ } else { $failed++ }

Write-Host ""
Write-Host "--- NOTIFICATIONS ---" -ForegroundColor Cyan

$r = Test-Endpoint "19. Get Notifications" "GET" "$base/notifications" $null $userHeaders
if ($r.Success) { 
    Write-Host "    Total: $($r.Data.total)" -ForegroundColor Gray
    $passed++ 
} else { $failed++ }

$r = Test-Endpoint "20. Get Unread Count" "GET" "$base/notifications/unread-count" $null $userHeaders
if ($r.Success) { 
    Write-Host "    Unread: $($r.Data.count)" -ForegroundColor Gray
    $passed++ 
} else { $failed++ }

Write-Host ""
Write-Host "--- REPORTS ---" -ForegroundColor Cyan

# Reports require APPROVED listing, so we skip create
Write-Host "[SKIP] 21. Create Report (requires approved listing)" -ForegroundColor Yellow
$skipped++

$r = Test-Endpoint "22. Get My Reports" "GET" "$base/reports/my" $null $showroomHeaders
if ($r.Success) { $passed++ } else { $failed++ }

# Admin reports on /admin/reports
$r = Test-Endpoint "23. Get All Reports (Admin)" "GET" "$base/admin/reports" $null $adminHeaders
if ($r.Success) { $passed++ } else { $failed++ }

$r = Test-Endpoint "24. Report Stats (Admin)" "GET" "$base/admin/reports/stats" $null $adminHeaders
if ($r.Success) { $passed++ } else { $failed++ }

Write-Host ""
Write-Host "--- ADMIN DASHBOARD ---" -ForegroundColor Cyan

$r = Test-Endpoint "25. Dashboard Stats" "GET" "$base/admin/dashboard" $null $adminHeaders
if ($r.Success) { $passed++ } else { $failed++ }

$r = Test-Endpoint "26. Get All Users" "GET" "$base/admin/users" $null $adminHeaders
if ($r.Success) { 
    Write-Host "    Total Users: $($r.Data.total)" -ForegroundColor Gray
    $passed++ 
} else { $failed++ }

$r = Test-Endpoint "27. Get System Settings" "GET" "$base/admin/settings" $null $adminHeaders
if ($r.Success) { $passed++ } else { $failed++ }

# Update setting
$settingBody = '{"key":"site_name","value":"King of the Market Test"}'
$r = Test-Endpoint "28. Update System Setting" "PATCH" "$base/admin/settings" $settingBody $adminHeaders
if ($r.Success) { $passed++ } else { $failed++ }

$r = Test-Endpoint "29. Get Audit Logs" "GET" "$base/admin/audit-logs" $null $adminHeaders
if ($r.Success) { $passed++ } else { $failed++ }

Write-Host ""
Write-Host "--- MEDIA ---" -ForegroundColor Cyan

# Presigned URL requires valid S3/R2 configuration
Write-Host "[SKIP] 30. Get Presigned URL (requires S3/R2 config)" -ForegroundColor Yellow
$skipped++

Write-Host ""
Write-Host "--- CLEANUP ---" -ForegroundColor Cyan

$r = Test-Endpoint "31. Delete Listing" "DELETE" "$base/listings/$listingId" $null $userHeaders
if ($r.Success) { $passed++ } else { $failed++ }

# ==================== SUMMARY ====================

Write-Host ""
Write-Host "=============================================" -ForegroundColor Yellow
Write-Host "   TEST SUMMARY" -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Passed:  $passed" -ForegroundColor Green
Write-Host "   Failed:  $failed" -ForegroundColor Red
Write-Host "   Skipped: $skipped" -ForegroundColor Yellow
Write-Host "   Total:   $($passed + $failed + $skipped)" -ForegroundColor White
Write-Host ""

$total = $passed + $failed
if ($total -gt 0) {
    $percentage = [math]::Round(($passed / $total) * 100, 1)
    if ($percentage -ge 90) {
        Write-Host "   Success Rate: $percentage% - EXCELLENT" -ForegroundColor Green
    } elseif ($percentage -ge 70) {
        Write-Host "   Success Rate: $percentage% - GOOD" -ForegroundColor Yellow
    } else {
        Write-Host "   Success Rate: $percentage% - NEEDS WORK" -ForegroundColor Red
    }
}
Write-Host ""
Write-Host "=============================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "   SKIPPED TESTS:" -ForegroundColor Gray
Write-Host "   - Submit for Review: Requires 3+ images" -ForegroundColor Gray
Write-Host "   - Create Report: Requires approved listing" -ForegroundColor Gray
Write-Host "   - Presigned URL: Requires S3/R2 config" -ForegroundColor Gray
Write-Host ""
