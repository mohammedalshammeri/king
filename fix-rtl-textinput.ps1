# Script لإصلاح جميع حقول TextInput بإضافة writingDirection="rtl"
# يبحث عن textAlign="right" ويضيف writingDirection="rtl" بعدها إذا لم تكن موجودة

$files = @(
    "kom-mobile-app\app\add-listing\[id].tsx",
    "kom-mobile-app\app\(tabs)\profile\payment-proof.tsx",
    "kom-mobile-app\app\(tabs)\profile\individual-packages.tsx",
    "kom-mobile-app\app\(auth)\forgot-password.tsx",
    "kom-mobile-app\app\(auth)\reset-password.tsx"
)

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file
    
    if (Test-Path $fullPath) {
        Write-Host "Processing: $file" -ForegroundColor Cyan
        
        $content = Get-Content $fullPath -Raw -Encoding UTF8
        
        # Pattern لإيجاد textAlign="right" بدون writingDirection بعدها
        # يبحث عن textAlign="right" ويضيف writingDirection="rtl" في السطر التالي
        $pattern = '(textAlign="right")(\s+)(?!writingDirection)'
        $replacement = '$1$2writingDirection="rtl"$2'
        
        $newContent = $content -replace $pattern, $replacement
        
        if ($content -ne $newContent) {
            Set-Content $fullPath $newContent -Encoding UTF8 -NoNewline
            Write-Host "  ✅ تم التعديل" -ForegroundColor Green
        } else {
            Write-Host "  ⏭️  لا يحتاج تعديل" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ❌ الملف غير موجود: $file" -ForegroundColor Red
    }
}

Write-Host "`n✨ تم الانتهاء من معالجة جميع الملفات!" -ForegroundColor Green
