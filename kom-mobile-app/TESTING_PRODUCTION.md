# دليل اختبار نسخة الإنتاج قبل الرفع

---

## 🎯 الطرق المتاحة لاختبار نسخة Production

### ✅ الطريقة 1: بناء نسخة Production للاختبار (الأسرع)
**يستخدم نفس إعدادات Production لكن يثبت مباشرة على جهازك**

#### Android:
```bash
cd kom-mobile-app

# بناء APK للاختبار بإعدادات production
eas build --profile production-test --platform android

# بعد اكتمال البناء، ستحصل على رابط تنزيل APK
# حمله على جهازك الأندرويد وثبته مباشرة
```

#### iOS:
```bash
# بناء نسخة Ad Hoc (تعمل على أجهزة محددة مسجلة في Apple)
eas build --profile production-test --platform ios

# ملاحظة: يجب تسجيل UDID جهازك في Apple Developer
# للحصول على UDID: وصل iPhone → iTunes/Finder → اضغط على رقم التسلسل
```

---

### ✅ الطريقة 2: استخدام TestFlight (الأفضل لـ iOS)
**توزيع رسمي من Apple قبل النشر النهائي**

```bash
cd kom-mobile-app

# 1. بناء نسخة production كاملة
eas build --profile production --platform ios

# 2. رفعها تلقائياً على TestFlight
eas submit --platform ios --profile production

# 3. افتح App Store Connect → TestFlight
# 4. أضف نفسك كـ Internal Tester
# 5. حمل تطبيق TestFlight على iPhone
# 6. ستظهر لك النسخة للتثبيت والاختبار
```

**المميزات:**
- ✅ بيئة production حقيقية 100%
- ✅ نفس تجربة المستخدم النهائي
- ✅ لا يحتاج UDID أو certificates معقدة
- ✅ يمكن دعوة مختبرين آخرين (حتى 10,000 مستخدم)

---

### ✅ الطريقة 3: استخدام Preview Build (سريع لكن ليس 100% production)

```bash
cd kom-mobile-app

# Android - APK سريع للاختبار
eas build --profile preview --platform android

# iOS - Ad Hoc للأجهزة المسجلة
eas build --profile preview --platform ios
```

**ملاحظة:** هذا يستخدم channel "preview" وليس production بالضبط.

---

## 📱 الخطوات العملية الموصى بها

### لأجهزة Android:

```bash
# 1. سجل دخول EAS
eas login

# 2. ابنِ APK للاختبار
eas build --profile production-test --platform android

# 3. انتظر اكتمال البناء (10-20 دقيقة)
# 4. ستظهر لك رابط للتنزيل

# 5. افتح الرابط على جهاز Android
# 6. ثبت APK (قد تحتاج السماح بتثبيت من مصادر غير معروفة)
# 7. اختبر التطبيق بالكامل
```

### لأجهزة iOS:

**الخيار أ: TestFlight (الأسهل)**
```bash
# 1. ابنِ ورفع لـ TestFlight
eas build --platform ios --profile production
eas submit --platform ios

# 2. انتظر موافقة Apple التلقائية (عادة خلال دقائق)
# 3. حمل TestFlight من App Store
# 4. افتح الرابط الذي يظهر في App Store Connect
# 5. اختبر التطبيق
```

**الخيار ب: Ad Hoc Build (يحتاج UDID)**
```bash
# 1. احصل على UDID جهازك
# iPhone → Settings → General → About → اضغط طويلاً على Model Number

# 2. سجل UDID في Apple Developer
# https://developer.apple.com/account/resources/devices

# 3. ابنِ النسخة
eas build --profile production-test --platform ios

# 4. حمل ملف .ipa
# 5. ثبته عبر Xcode أو Apple Configurator
```

---

## ✅ قائمة فحص قبل الرفع النهائي

بعد اختبار نسخة Production، تأكد من:

- [ ] التطبيق يفتح بدون crash
- [ ] تسجيل الدخول يعمل بشكل صحيح
- [ ] API endpoints تتصل بالسيرفر الحقيقي
- [ ] الصور والفيديوهات تُرفع وتُعرض بشكل صحيح
- [ ] Push Notifications تصل للجهاز
- [ ] RTL والواجهة العربية تعمل بشكل سليم
- [ ] إنشاء إعلان جديد يعمل من البداية للنهاية
- [ ] الدفع والاشتراكات تعمل (إن كانت مفعلة)
- [ ] الانتقال بين الشاشات سلس بدون أخطاء
- [ ] اختبار على iOS و Android

---

## 🚨 ملاحظات مهمة

### iOS:
- ⚠️ **لا يمكن بناء iOS محلياً على Windows** - يجب استخدام EAS Build
- ⚠️ تحتاج **Apple Developer Account نشط** ($99/سنة)
- ⚠️ TestFlight يحتاج **موافقة Apple** قبل التوزيع (عادة سريعة)

### Android:
- ✅ APK يعمل على أي جهاز مباشرة
- ✅ لا يحتاج موافقات مسبقة للاختبار
- ⚠️ للرفع النهائي يجب استخدام AAB وليس APK

### Environment Variables:
تأكد أن `EXPO_PUBLIC_API_URL` في profile production يشير للسيرفر الحقيقي:
```json
"production": {
  "env": {
    "EXPO_PUBLIC_API_URL": "https://api.kotm.app/api/v1"
  }
}
```

---

## 🎬 البداية السريعة (التوصية)

**للاختبار السريع على Android:**
```bash
cd kom-mobile-app
eas login
eas build --profile production-test --platform android
# انتظر الرابط → حمله → ثبته → اختبر
```

**للاختبار الاحترافي على iOS:**
```bash
cd kom-mobile-app
eas login
eas build --platform ios --profile production
eas submit --platform ios
# افتح TestFlight → اختبر التطبيق في بيئة production حقيقية
```

---

*آخر تحديث: مارس 2026*
