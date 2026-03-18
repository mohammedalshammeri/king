# Test admin users API endpoint
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "🧪 اختبار API المستخدمين في الأدمن" -ForegroundColor Yellow
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

$BASE_URL = "https://api.kotm.app/api/v1"

# Step 1: Login as admin
Write-Host "🔐 الخطوة 1: تسجيل الدخول كأدمن..." -ForegroundColor Green
Write-Host ""

$loginBody = @{
    phoneNumber = "+97333123456"  # استبدل برقم الأدمن الحقيقي
    password = "admin123"          # استبدل بكلمة المرور الحقيقية
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.data.access_token
    Write-Host "✅ تسجيل الدخول نجح" -ForegroundColor Green
    Write-Host "🔑 Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ فشل تسجيل الدخول:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host $responseBody -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "⚠️  يرجى تحديث رقم الهاتف وكلمة المرور في السكريبت" -ForegroundColor Yellow
    exit 1
}

# Step 2: Get users
Write-Host "-" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "👥 الخطوة 2: جلب قائمة المستخدمين..." -ForegroundColor Green
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $usersResponse = Invoke-RestMethod -Uri "$BASE_URL/admin/users" -Method Get -Headers $headers
    
    $users = $usersResponse.data
    $total = $usersResponse.meta.total
    
    Write-Host "✅ تم جلب المستخدمين بنجاح" -ForegroundColor Green
    Write-Host "📊 إجمالي المستخدمين: $total" -ForegroundColor Yellow
    Write-Host "📋 المستخدمين المُرجعين في هذه الصفحة: $($users.Count)" -ForegroundColor Yellow
    Write-Host ""
    
    if ($users.Count -gt 0) {
        Write-Host "📝 عينة من المستخدمين:" -ForegroundColor Cyan
        Write-Host ""
        
        for ($i = 0; $i -lt [Math]::Min(5, $users.Count); $i++) {
            $user = $users[$i]
            $name = if ($user.individualProfile) { $user.individualProfile.fullName } 
                    elseif ($user.showroomProfile) { $user.showroomProfile.showroomName }
                    else { "لا يوجد اسم" }
            
            Write-Host "$($i + 1). $name" -ForegroundColor White
            Write-Host "   📧 البريد: $($user.email)" -ForegroundColor Gray
            Write-Host "   📱 الهاتف: $($user.phone)" -ForegroundColor Gray
            Write-Host "   👤 النوع: $($user.role)" -ForegroundColor Gray
            
            if ($user.individualProfile) {
                $location = "$($user.individualProfile.governorate) / $($user.individualProfile.city)"
                Write-Host "   📍 الموقع: $location" -ForegroundColor Gray
            } elseif ($user.showroomProfile) {
                $location = "$($user.showroomProfile.governorate) / $($user.showroomProfile.city)"
                $merchant = $user.showroomProfile.merchantType
                Write-Host "   📍 الموقع: $location" -ForegroundColor Gray
                Write-Host "   🏪 نوع التاجر: $merchant" -ForegroundColor Gray
            }
            
            Write-Host ""
        }
        
        if ($users.Count -gt 5) {
            Write-Host "   ... و $($users.Count - 5) مستخدمين إضافيين" -ForegroundColor Gray
            Write-Host ""
        }
    } else {
        Write-Host "⚠️  لا يوجد مستخدمين في الاستجابة!" -ForegroundColor Yellow
        Write-Host ""
    }
    
    # Show raw response structure
    Write-Host "-" * 60 -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🔍 هيكل الاستجابة الخام:" -ForegroundColor Cyan
    Write-Host ($usersResponse | ConvertTo-Json -Depth 1) -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host "❌ فشل جلب المستخدمين:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host $responseBody -ForegroundColor Red
    }
    Write-Host ""
    exit 1
}

Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ اختبار API المستخدمين اكتمل بنجاح!" -ForegroundColor Green
Write-Host "📊 النتيجة: الباكند يعيد $total مستخدم" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 إذا كان الباكند يعيد بيانات صحيحة، فالمشكلة في الأدمن (Frontend)" -ForegroundColor Cyan
Write-Host ""
