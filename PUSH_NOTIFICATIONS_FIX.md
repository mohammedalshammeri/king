# 🔔 إصلاح Push Notifications

**التاريخ:** 17 مارس 2026  
**المشكلة:** الإشعارات لا تشتغل

---

## 🐛 المشاكل التي تم اكتشافها

### 1. ❌ Project ID خاطئ
- **المشكلة:** `notifications.ts` كان يستخدم project ID خاطئ
- **القديم:** `076a3d84-3f92-4bf7-b8b3-9b208fa98891`
- **الصحيح:** `38364066-6118-4eb7-ad6a-22eeecd37a69` (من app.json)
- **التأثير:** الـ push tokens كانت تُنشأ بـ project خاطئ ولا تعمل

### 2. ❌ Android Permission ناقصة
- **المشكلة:** `POST_NOTIFICATIONS` permission مفقودة
- **التأثير:** على Android 13+ (API 33+)، الإشعارات لن تعمل بدون هذه الصلاحية
- **الحل:** أضيفت في app.json

### 3. ❌ Notification Listeners غير موجودة
- **المشكلة:** لا يوجد listeners لاستقبال الإشعارات
- **التأثير:** 
  - الإشعارات تصل لكن لا تُعرض في foreground
  - لا يمكن معالجة الإشعارات عند الضغط عليها
- **الحل:** أضيفت في `_layout.tsx`:
  - `addNotificationReceivedListener` - لالتقاط الإشعارات الواردة
  - `addNotificationResponseReceivedListener` - لمعالجة الضغط على الإشعار

### 4. ⚠️ Error Handling ضعيف
- **المشكلة:** try-catch blocks تخفي الأخطاء بدون logging
- **التأثير:** صعوبة في تشخيص المشاكل
- **الحل:** أضيفت console.log statements تفصيلية في كل مرحلة

---

## ✅ الإصلاحات المطبقة

### 1. app.json
```json
{
  "ios": {
    "buildNumber": "19",  // رفع من 18
    "infoPlist": {
      "UIBackgroundModes": ["remote-notification"]  // ✅ موجود مسبقاً
    }
  },
  "android": {
    "versionCode": 13,  // رفع من 12
    "permissions": [
      "android.permission.POST_NOTIFICATIONS"  // ✅ جديد - مهم لـ Android 13+
    ]
  },
  "plugins": [
    ["expo-notifications", {
      "iosDisplayInForeground": true  // ✅ موجود مسبقاً
    }]
  ]
}
```

### 2. lib/notifications.ts
```typescript
// ✅ تصحيح project ID
const tokenData = await Notifications.getExpoPushTokenAsync({
  projectId: '38364066-6118-4eb7-ad6a-22eeecd37a69',  // الصحيح
});

// ✅ تحسين logging
console.log('✅ Push token obtained:', tokenData.data.substring(0, 30) + '...');
console.log('✅ Push token saved to server (authenticated)');

// ✅ error handling أفضل
catch (error) {
  console.error('❌ Failed to get push token:', error);
  return null;
}
```

### 3. app/_layout.tsx
```typescript
// ✅ Listener للإشعارات الواردة (foreground)
const notificationListener = Notifications.addNotificationReceivedListener(notification => {
  console.log('📬 Notification received:', notification);
});

// ✅ Listener للضغط على الإشعار
const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
  console.log('👆 Notification tapped:', response);
  const data = response.notification.request.content.data;
  // يمكن إضافة navigation logic هنا
});

// ✅ Cleanup
return () => {
  Notifications.removeNotificationSubscription(notificationListener);
  Notifications.removeNotificationSubscription(responseListener);
};
```

---

## 🧪 كيفية الاختبار

### الخطوة 1: بناء التطبيق من جديد

**مهم:** يجب إعادة build لأن التغييرات في:
- app.json (permissions & build numbers)
- notification configuration
- listeners code

```powershell
cd kom-mobile-app

# لـ iOS
eas build --platform ios --profile production-test

# لـ Android (اختياري)
eas build --platform android --profile production-test
```

**الوقت المتوقع:** 15-30 دقيقة

### الخطوة 2: تثبيت التطبيق

1. انتظر انتهاء البناء
2. افتح الرابط على جهازك الحقيقي
3. اضغط "Install"
4. (iOS) ثق بالـ certificate: Settings → General → VPN & Device Management

### الخطوة 3: تسجيل Push Token

1. افتح التطبيق
2. سجل الدخول (أو افتح كضيف)
3. افحص logs:
   ```
   ✅ Notification permission granted
   ✅ Push token obtained: ExponentPushToken[...
   ✅ Guest push token saved
   ```
4. **انسخ الـ push token** (يبدأ بـ `ExponentPushToken[`)

### الخطوة 4: إرسال إشعار تجريبي

#### الطريقة A: باستخدام السكريبت
1. افتح `test-push-notification.js`
2. استبدل `pushToken` بالـ token الذي نسخته
3. نفذ:
   ```powershell
   npm install expo-server-sdk
   node test-push-notification.js
   ```

#### الطريقة B: من الباكند مباشرة
إذا كان لديك endpoint في الباكند لإرسال إشعار تجريبي:
```powershell
curl -X POST https://api.kotm.app/api/v1/notifications/test `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"title":"اختبار","body":"إشعار تجريبي"}'
```

### الخطوة 5: التحقق

**عندما التطبيق مفتوح (Foreground):**
- ✅ يجب أن يظهر الإشعار في أعلى الشاشة
- ✅ انظر Console logs: `📬 Notification received`

**عندما التطبيق مغلق (Background/Killed):**
- ✅ يجب أن يظهر الإشعار في notification center
- ✅ اضغط على الإشعار → يفتح التطبيق
- ✅ انظر Console logs: `👆 Notification tapped`

---

## 🔍 Troubleshooting

### المشكلة: "Push token is invalid"
**السبب:** Project ID خاطئ أو build قديم  
**الحل:** 
- تأكد من build جديد بعد التحديثات
- تأكد من أن app.json و notifications.ts يستخدمان نفس project ID

### المشكلة: "DeviceNotRegistered"
**السبب:** Push token قديم أو غير مسجل  
**الحل:**
- احذف التطبيق وأعد تثبيته
- افتحه من جديد ليسجل push token جديد
- استخدم الـ token الجديد

### المشكلة: لا تظهر الإشعارات على iOS
**الأسباب المحتملة:**
1. ❌ Simulator (لا يدعم push notifications)
   - **الحل:** استخدم جهاز حقيقي
2. ❌ Expo Go (لا يدعم background notifications)
   - **الحل:** استخدم production build
3. ❌ الصلاحيات مرفوضة
   - **الحل:** Settings → Notifications → KOM → تفعيل
4. ❌ Do Not Disturb مفعّل
   - **الحل:** أطفئ Focus mode

### المشكلة: لا تظهر الإشعارات على Android
**الأسباب المحتملة:**
1. ❌ POST_NOTIFICATIONS permission مرفوضة (Android 13+)
   - **الحل:** Settings → Apps → KOM → Notifications → تفعيل
2. ❌ Battery optimization يقتل التطبيق
   - **الحل:** Settings → Battery → Unrestricted
3. ❌ Notification channel غير صحيح
   - **الحل:** Build جديد مع التحديثات

### المشكلة: Console لا يظهر logs
**السبب:** لم تفتح DevTools  
**الحل:** 
- انتقل لجهاز iOS: Safari → Develop → [Device] → Inspect
- على Android: Chrome → chrome://inspect → Inspect

---

## 📊 كيف تتحقق من أن كل شيء يعمل

### ✅ Checklist

1. [ ] Build رقم 19 (iOS) أو 13 (Android)
2. [ ] Push token يبدأ بـ `ExponentPushToken[`
3. [ ] Token مسجل في الباكند (ظهر "✅ Push token saved")
4. [ ] الصلاحيات ممنوحة (Settings → Notifications)
5. [ ] الإشعار يظهر عند التطبيق مفتوح
6. [ ] الإشعار يظهر عند التطبيق مغلق
7. [ ] الضغط على الإشعار يفتح التطبيق

### Backend Logs

افحص logs الباكند للتأكد من إرسال الإشعارات:
```powershell
cd kom-backend\kom-backend
fly logs --app kom-api
```

ابحث عن:
```
✅ Push notification sent successfully to ios
```

---

## 🎯 الخلاصة

### المشاكل الرئيسية كانت:
1. ❌ Project ID خاطئ في notifications.ts
2. ❌ POST_NOTIFICATIONS permission ناقصة لـ Android
3. ❌ Notification listeners غير موجودة

### تم إصلاحها بـ:
1. ✅ تصحيح project ID
2. ✅ إضافة Android permission
3. ✅ إضافة notification listeners في _layout.tsx
4. ✅ تحسين error handling و logging

### Next Steps:
1. **Build التطبيق من جديد** (مهم!)
2. Test على جهاز حقيقي
3. تأكد من ظهور الإشعارات في foreground و background
4. إذا نجح، submit للـ App Store و Play Store

---

**💡 ملاحظة مهمة:** إذا كنت تختبر على Expo Go، لن تعمل background notifications. يجب استخدام production/development build.
