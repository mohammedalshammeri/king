# سكريبت PowerShell لبناء واختبار نسخة Production
# الاستخدام: .\test-production.ps1 android
#         أو: .\test-production.ps1 ios

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('android', 'ios', 'both')]
    [string]$Platform,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet('production-test', 'production')]
    [string]$Profile = 'production-test'
)

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  اختبار نسخة الإنتاج - KOM" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# التحقق من وجود eas-cli
Write-Host "🔍 التحقق من EAS CLI..." -ForegroundColor Yellow
$easInstalled = Get-Command eas -ErrorAction SilentlyContinue

if (-not $easInstalled) {
    Write-Host "❌ EAS CLI غير مثبت!" -ForegroundColor Red
    Write-Host "قم بتثبيته بتشغيل: npm install -g eas-cli" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ EAS CLI مثبت" -ForegroundColor Green
Write-Host ""

# التحقق من تسجيل الدخول
Write-Host "🔑 التحقق من تسجيل الدخول..." -ForegroundColor Yellow
$whoami = eas whoami 2>&1

if ($whoami -like "*not logged in*" -or $whoami -like "*Unauthorized*") {
    Write-Host "⚠️  غير مسجل دخول. يرجى تسجيل الدخول:" -ForegroundColor Yellow
    eas login
    Write-Host ""
}

Write-Host "✅ تم تسجيل الدخول بنجاح" -ForegroundColor Green
Write-Host ""

# عرض معلومات البناء
Write-Host "📦 معلومات البناء:" -ForegroundColor Cyan
Write-Host "   المنصة: $Platform" -ForegroundColor White
Write-Host "   الملف الشخصي: $Profile" -ForegroundColor White
Write-Host ""

if ($Profile -eq "production-test") {
    Write-Host "ℹ️  هذا بناء اختباري بإعدادات production" -ForegroundColor Blue
    Write-Host "   - يمكن تثبيته مباشرة على جهازك" -ForegroundColor Blue
    Write-Host "   - لا يحتاج رفع على Store" -ForegroundColor Blue
} else {
    Write-Host "⚠️  هذا بناء production نهائي!" -ForegroundColor Yellow
    Write-Host "   - يستخدم للرفع على App Store/Play Store" -ForegroundColor Yellow
}

Write-Host ""

# تأكيد من المستخدم
$confirmation = Read-Host "هل تريد المتابعة؟ (y/n)"
if ($confirmation -ne 'y') {
    Write-Host "❌ تم الإلغاء" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🚀 بدء عملية البناء..." -ForegroundColor Green
Write-Host ""

# البناء
if ($Platform -eq 'both') {
    Write-Host "📱 بناء Android..." -ForegroundColor Cyan
    eas build --platform android --profile $Profile --non-interactive
    
    Write-Host ""
    Write-Host "🍎 بناء iOS..." -ForegroundColor Cyan
    eas build --platform ios --profile $Profile --non-interactive
} else {
    $emoji = if ($Platform -eq 'android') { '📱' } else { '🍎' }
    Write-Host "$emoji بناء $Platform..." -ForegroundColor Cyan
    eas build --platform $Platform --profile $Profile --non-interactive
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "  ✅ تم إرسال طلب البناء بنجاح" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

Write-Host "📋 الخطوات التالية:" -ForegroundColor Cyan
Write-Host ""

if ($Platform -eq 'android' -or $Platform -eq 'both') {
    Write-Host "📱 Android:" -ForegroundColor Yellow
    Write-Host "   1. انتظر اكتمال البناء (10-20 دقيقة)" -ForegroundColor White
    Write-Host "   2. ستظهر لك رابط التنزيل في Terminal" -ForegroundColor White
    Write-Host "   3. افتح الرابط على جهاز Android" -ForegroundColor White
    Write-Host "   4. ثبت APK (قد تحتاج السماح بالمصادر الغير معروفة)" -ForegroundColor White
    Write-Host "   5. اختبر التطبيق بالكامل" -ForegroundColor White
    Write-Host ""
}

if ($Platform -eq 'ios' -or $Platform -eq 'both') {
    Write-Host "🍎 iOS:" -ForegroundColor Yellow
    if ($Profile -eq 'production') {
        Write-Host "   1. انتظر اكتمال البناء" -ForegroundColor White
        Write-Host "   2. قم برفعه على TestFlight:" -ForegroundColor White
        Write-Host "      eas submit --platform ios" -ForegroundColor Cyan
        Write-Host "   3. افتح App Store Connect → TestFlight" -ForegroundColor White
        Write-Host "   4. أضف نفسك كـ Internal Tester" -ForegroundColor White
        Write-Host "   5. حمل TestFlight من App Store" -ForegroundColor White
        Write-Host "   6. اختبر التطبيق" -ForegroundColor White
    } else {
        Write-Host "   1. انتظر اكتمال البناء" -ForegroundColor White
        Write-Host "   2. حمل ملف .ipa" -ForegroundColor White
        Write-Host "   3. ثبته عبر Xcode أو Apple Configurator" -ForegroundColor White
        Write-Host "   ⚠️  تحتاج تسجيل UDID جهازك في Apple Developer" -ForegroundColor Yellow
    }
    Write-Host ""
}

Write-Host "💡 لمتابعة حالة البناء:" -ForegroundColor Cyan
Write-Host "   https://expo.dev/accounts/[your-account]/projects/kom/builds" -ForegroundColor Blue
Write-Host ""

Write-Host "📖 للمزيد من التفاصيل، راجع:" -ForegroundColor Cyan
Write-Host "   kom-mobile-app/TESTING_PRODUCTION.md" -ForegroundColor Blue
Write-Host ""
