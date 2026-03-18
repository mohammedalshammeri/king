# خطوات فحص الأدمن Dashboard

## الخطوة 1: فحص Browser Console

1. افتح: https://admin.kotm.app/dashboard/users
2. اضغط `F12` (أو Right Click → Inspect)
3. اذهب لتبويب **Console**
4. ابحث عن:
   - ❌ أخطاء باللون الأحمر
   - ⚠️ تحذيرات باللون الأصفر
   - 🔍 رسائل console.log

**اللي يجب تشوفه:**
```
🔍 جاري تحميل المستخدمين...
✅ تم استلام البيانات: {data: Array(48), meta: {...}}
📊 عدد المستخدمين: 48
```

**إذا شفت:**
```
❌ خطأ في تحميل المستخدمين: Network Error
```
> معناها: الأدمن لا يستطيع الاتصال بالباكند

**إذا شفت:**
```
❌ خطأ في تحميل المستخدمين: 401 Unauthorized
```
> معناها: Token غير صالح - سجل خروج ودخول من جديد

---

## الخطوة 2: فحص Network Requests

1. في Developer Tools، اذهب لتبويب **Network**
2. اضغط `Ctrl+R` لعمل Refresh
3. ابحث عن request اسمه: `users`
4. اضغط عليه
5. شوف:
   - **Status Code**: يجب أن يكون `200`
   - **Response**: يجب أن يحتوي على `data: [...]`

**إذا Status Code = 404:**
> الـ endpoint خاطئ أو الباكند لا يستجيب

**إذا Status Code = 401:**
> مشكلة authentication

**إذا Request فشل (CORS أو Network Error):**
> الأدمن لا يتصل بالباكند الصحيح

---

## الخطوة 3: فحص API Base URL

1. افتح: https://admin.kotm.app/dashboard/debug
2. شوف `NEXT_PUBLIC_API_BASE_URL`

**يجب أن يظهر:**
```
NEXT_PUBLIC_API_BASE_URL: https://api.kotm.app/api/v1
```

**إذا ظهر:**
```
NEXT_PUBLIC_API_BASE_URL: NOT SET
```
أو
```
NEXT_PUBLIC_API_BASE_URL: http://localhost:3002/api/v1
```

> **المشكلة:** الأدمن لا يعرف عنوان الباكند الصحيح!

**الحل:**
```powershell
cd kom-admin-dashboard
fly deploy --no-cache
```

---

## الخطوة 4: اختبار Button

في صفحة Debug:
1. اضغط زر "اختبار API"
2. شوف النتيجة

**إذا نجح:**
```json
{
  "status": 200,
  "baseURL": "https://api.kotm.app/api/v1",
  "response": {"success": true, "data": {"status": "ok"}}
}
```
> الاتصال سليم ✅

**إذا فشل:**
```
Error: Network Error
```
> مشكلة في الاتصال ❌

---

## ملخص الاحتمالات

### السيناريو A: Console يظهر "عدد المستخدمين: 48"
**المشكلة:** البيانات تصل لكن لا تُعرض في الجدول  
**السبب:** Bug في rendering الجدول  
**الحل:** أرسل لي screenshot من Console

### السيناريو B: Console يظهر "Network Error"
**المشكلة:** الأدمن لا يتصل بالباكند  
**السبب:** NEXT_PUBLIC_API_BASE_URL غير معرف أو خاطئ  
**الحل:** `fly deploy --no-cache` للأدمن

### السيناريو C: Console يظهر "401 Unauthorized"
**المشكلة:** Token غير صالح  
**السبب:** انتهت صلاحية الجلسة  
**الحل:** Logout ثم Login من جديد

### السيناريو D: لا يوجد console logs أصلاً
**المشكلة:** الكود لا يعمل  
**السبب:** الأدمن لم يُحدث بعد التعديلات  
**الحل:** `fly deploy` للأدمن

---

## الأوامر السريعة

### لو المشكلة في API Base URL:
```powershell
cd C:\Users\Dell\Desktop\KOM\kom-admin-dashboard
fly deploy --no-cache
```

### لو المشكلة في Authentication:
1. اذهب لـ https://admin.kotm.app
2. Logout
3. Login من جديد
4. اذهب لصفحة المستخدمين

### لو المشكلة في البيانات نفسها:
```powershell
# اختبر الباكند مباشرة:
.\quick-test-admin-api.ps1
```
