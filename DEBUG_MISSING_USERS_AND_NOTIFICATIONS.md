# 🐛 حل المشاكل الجديدة - المستخدمين والإشعارات

تاريخ: 17 مارس 2026

## المشكلة 1: المستخدمين لا يظهرون في الأدمن (48 مستخدم موجودين)

### التشخيص

هناك 3 احتمالات:
1. ❌ **مشكلة في Frontend (الأدمن)**: البيانات تصل من الباكند لكن لا تُعرض
2. ❌ **مشكلة في API Connection**: الأدمن لا يتصل بالباكند الصحيح (localhost بدلاً من api.kotm.app)
3. ❌ **مشكلة في Authentication**: Token غير صالح أو expired

### خطوات الحل

#### الخطوة 1: اختبار الباكند API مباشرة

```powershell
# 1. عدّل السكريبت أولاً بتحديث اسم المستخدم وكلمة المرور
notepad test-admin-users-api.ps1

# 2. نفذ السكريبت
.\test-admin-users-api.ps1
```

**ما الذي سيظهر:**
- ✅ إذا ظهر: "📊 إجمالي المستخدمين: 48"
  - **النتيجة**: الباكند يعمل بشكل صحيح، المشكلة في الأدمن Frontend
  
- ❌ إذا ظهر: "❌ فشل تسجيل الدخول"
  - **السبب**: بيانات الدخول خاطئة
  - **الحل**: تحديث رقم الهاتف وكلمة المرور في السكريبت

- ❌ إذا ظهر: "📊 إجمالي المستخدمين: 0"
  - **السبب**: قاعدة البيانات فارغة أو filter خاطئ
  - **الحل**: فحص قاعدة البيانات مباشرة

#### الخطوة 2: فحص الأدمن Dashboard

1. افتح الأدمن في المتصفح: https://admin.kotm.app
2. سجل الدخول
3. اذهب إلى صفحة Debug: https://admin.kotm.app/dashboard/debug
4. افحص الناتج:
   - يجب أن يظهر: `NEXT_PUBLIC_API_BASE_URL: https://api.kotm.app/api/v1`
   - **إذا ظهر**: `NOT SET` أو `http://localhost:3002`
     - **السبب**: Environment variable غير معرّف في production
     - **الحل**: إعادة deploy الأدمن مع تأكيد build args

5. اضغط زر "اختبار API"
   - إذا نجح: الاتصال سليم
   - إذا فشل: مشكلة في CORS أو network

#### الخطوة 3: فحص Browser Console

1. افتح صفحة المستخدمين: https://admin.kotm.app/dashboard/users
2. اضغط F12 (DevTools)
3. اذهب إلى Console tab
4. ابحث عن:
   - ✅ `✅ تم استلام البيانات:` - يجب أن ترى Object مع 48 مستخدم
   - ✅ `📊 عدد المستخدمين: 48`
   - ❌ إذا رأيت: `❌ خطأ في تحميل المستخدمين:`
     - انظر للـ error message لمعرفة السبب الدقيق

### الحلول بناءً على النتائج

#### السيناريو A: البيانات تصل لكن لا تُعرض (Console يظهر 48 مستخدم)

**السبب:** مشكلة في rendering الجدول

**الحل:**
```bash
# تحقق من أن data?.data موجود وليس data فقط
# الكود يستخدم: data?.data?.map()
# والـ API يرجع: { data: [...users], meta: {total: 48} }
```

#### السيناريو B: NEXT_PUBLIC_API_BASE_URL غير معرّف

**السبب:** Build args لا تصل لـ Next.js build

**الحل:**
```powershell
cd kom-admin-dashboard

# إعادة deploy مع إعادة بناء كامل
fly deploy --no-cache
```

#### السيناريو C: Authentication Error (401 Unauthorized)

**السبب:** Token expired أو CORS issue

**الحل:**
1. سجل الدخول من جديد
2. حاول مرة أخرى
3. إذا استمرت المشكلة، افحص CORS settings في الباكند

---

## المشكلة 2: الإشعارات لا تظهر عند غلق التطبيق

### التشخيص

iOS يحتاج إلى:
1. ✅ `UIBackgroundModes` مع `remote-notification`
2. ✅ `iosDisplayInForeground: true` في expo-notifications plugin
3. ✅ Production build (ليس Expo Go)
4. ✅ جهاز حقيقي (ليس simulator)
5. ✅ Push token صالح ومسجل

### الحل المطبق

**✅ تم إضافة:**
1. `UIBackgroundModes: ["remote-notification"]` في app.json
2. `iosDisplayInForeground: true` في notifications plugin
3. رفع buildNumber من 17 إلى 18

### خطوات الاختبار

#### 1. بناء نسخة جديدة

```powershell
cd kom-mobile-app

# بناء لـ iOS (production-test profile)
eas build --platform ios --profile production-test
```

**ملاحظة:** سيستغرق ~15-30 دقيقة (مش 140 دقيقة لأن production-test أسرع من store build)

#### 2. تثبيت التطبيق على الجهاز

1. انتظر انتهاء البناء
2. افتح الرابط الذي سيظهر
3. اضغط "Install" على جهازك
4. ثق بالـ certificate في Settings → General → VPN & Device Management

#### 3. اختبار الإشعارات

1. افتح التطبيق
2. سجل الدخول بحساب حقيقي
3. تأكد من أن التطبيق سجل push token (انظر logs في Console)
4. **أغلق التطبيق تماماً** (swipe up)
5. من جهاز آخر أو المتصفح:
   - سجل دخول بحساب آخر
   - اضغط "like" على إعلان للمستخدم الأول
   - أو أرسل رسالة
6. **يجب أن تظهر الإشعار حتى لو التطبيق مغلق**

#### 4. إذا لم تظهر الإشعارات

**فحص 1: Push Token مسجل؟**
```powershell
# استخدم test-notifications-debug.js لفحص device tokens
node test-notifications-debug.js
```

**فحص 2: Expo يرسل الإشعارات فعلاً؟**
- افحص backend logs:
  ```powershell
  cd kom-backend\kom-backend
  fly logs --app kom-api
  ```
- ابحث عن: "Push notification sent successfully"

**فحص 3: الصلاحيات ممنوحة؟**
- Settings → Notifications → King of the Market
- تأكد أن الإشعارات مفعّلة

**فحص 4: Push token صالح؟**
- يجب أن يبدأ بـ: `ExponentPushToken[...]`
- إذا كان push token مختلف، قد يكون مشكلة في registration

---

## ✅ الخلاصة

### للمستخدمين:
1. نفذ `.\test-admin-users-api.ps1` بعد تعديل بيانات الدخول
2. افتح https://admin.kotm.app/dashboard/debug وافحص API URL
3. افتح https://admin.kotm.app/dashboard/users واضغط F12 وانظر Console
4. أخبرني بالنتيجة

### للإشعارات:
1. ✅ تم إصلاح app.json بإضافة UIBackgroundModes
2. ✅ رفع buildNumber إلى 18
3. **التالي**: بناء نسخة جديدة:
   ```powershell
   cd kom-mobile-app
   eas build --platform ios --profile production-test
   ```
4. تثبيت على جهاز حقيقي واختبار

---

## 🚀 الأوامر السريعة

### اختبار المستخدمين API
```powershell
.\test-admin-users-api.ps1
```

### فحص الأدمن Debug
```
افتح: https://admin.kotm.app/dashboard/debug
```

### بناء التطبيق مع إصلاح الإشعارات
```powershell
cd kom-mobile-app
eas build --platform ios --profile production-test
```

### فحص logs الباكند
```powershell
cd kom-backend\kom-backend
fly logs --app kom-api
```

---

**💡 نصيحة:** ابدأ بفحص المستخدمين أولاً (أسرع)، ثم انتظر بناء التطبيق للإشعارات (يستغرق وقت).
