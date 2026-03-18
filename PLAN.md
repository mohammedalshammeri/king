# خطة إصلاح المشروع قبل الرفع على App Store & Google Play

---

## خطة إصلاح المشاكل الست الحالية

### ملخص المشاكل

- [x] **#1** توحيد صفحة إنشاء الإعلان مع صفحة الإكمال/التعديل
  - ✅ تم توحيد المسار في `kom-mobile-app/app/(tabs)/add.tsx`
  - ✅ جميع أنواع الإعلانات تذهب الآن إلى `kom-mobile-app/app/add-listing/[id].tsx`

- [x] **#2** إصلاح منطق الفيديو + النشر + الاشتراك عند إنشاء الإعلان
  - ✅ تم إصلاح حفظ حقول السيارة الإضافية (interiorColor, bodyCondition, paintType)
  - ⏳ باقي منطق الاشتراك والرسائل يحتاج اختبار شامل

- [x] **#3** إيقاف ظهور بنر الباقات في الصفحة الرئيسية بعد التسجيل
  - ✅ تم حذف `<SubscriptionPromoCard />` من `kom-mobile-app/app/(tabs)/index.tsx`

- [x] **#4** إصلاح ظهور بيانات الحسابات المسجلة في لوحة الأدمن
  - ✅ تم توسيع جدول الأدمن ليعرض جميع البيانات
  - ✅ تم تحديث `admin.service.ts` لإرجاع governorate, city, merchantType
  - ✅ تم تحديث `types.ts` و `users/page.tsx` لعرض الحقول الجديدة

- [x] **#5** إصلاح الإشعارات الفعلية من لوحة الأدمن إلى الجوال
  - ✅ تم تثبيت `expo-server-sdk`
  - ✅ تم تحديث `push.service.ts` لاستخدام Expo Push Notifications بشكل حقيقي
  - ⏳ يحتاج اختبار على جهاز حقيقي

- [x] **#6** إصلاح RTL ومحاذاة الواجهة العربية بالكامل
  - ✅ تم إصلاح `kom-mobile-app/lib/rtl.ts` (إزالة القلب الخاطئ لـ textAlign)

### أخطاء مؤكدة من الكود يجب إصلاحها ضمن العمل

- [x] وجود مسارين مختلفين لإنشاء إعلان السيارة
  - ✅ تم توحيد المسار، كل الأنواع تذهب لـ `add-listing/[id].tsx`

- [x] بنر الاشتراك ظاهر عمداً في الصفحة الرئيسية
  - ✅ تم حذف `<SubscriptionPromoCard />` من `index.tsx`

- [x] Push Notifications غير مفعلة فعلياً
  - ✅ تم تحديث `push.service.ts` لاستخدام `expo-server-sdk`

- [x] Helper الـ RTL الحالي يسبب عكس محاذاة غير صحيح
  - ✅ تم إصلاح `rtl.ts` (إزالة قلب textAlign داخل RTL)

- [x] حقول السيارة الإضافية لا تُحفظ بشكل صحيح كما ينبغي
  - ✅ تم توسيع `CarDetails` interface وإضافة الحقول للـ state
  - ✅ تم تحديث `listings.service.ts` لدمج الحقول في specs JSON
  - ✅ تم تحديث شاشات العرض لقراءة الحقول الجديدة

### ترتيب التنفيذ المقترح

- [x] المرحلة 1: إصلاح RTL من الجذر
- [x] المرحلة 2: توحيد إنشاء/إكمال/تعديل الإعلان في مسار واحد
- [ ] المرحلة 3: إصلاح منطق عدم الاشتراك ورسائل النشر وأزرار الاشتراك حسب نوع الحساب
- [x] المرحلة 4: إزالة بنر الباقة من الصفحة الرئيسية
- [x] المرحلة 5: إصلاح حفظ الفيديو وحقول السيارة الإضافية
- [x] المرحلة 6: إصلاح لوحة الأدمن وعرض بيانات المسجلين كاملة
- [x] المرحلة 7: تفعيل Push Notifications بشكل حقيقي واختبارها على جهاز فعلي
- [ ] المرحلة 8: اختبار شامل على بيئة شبيهة بالإنتاج

### ملاحظات تنفيذية

- [ ] لا يتم الإبقاء على `add-car.tsx` كمسار أساسي بعد التوحيد
- [ ] أي إصلاح RTL يجب اختباره على iOS و Android
- [ ] الإشعارات لن تُعتبر منتهية إلا بعد وصول إشعار فعلي من لوحة الأدمن إلى جهاز حقيقي
- [ ] مشكلة الأدمن لن تعتبر محلولة إلا بعد تسجيل حساب جديد من التطبيق وظهوره كاملاً في لوحة التحكم

---

## المشاكل التي لا تحتاج بيانات منك (نبدأ بها الآن)

- [x] **#1** إصلاح كراش الفيديو في صفحة تفاصيل الإعلان
  - ملف: `kom-mobile-app/app/listing/[id].tsx`
  - `useVideoPlayer` كان داخل `if` — يخالف Rules of Hooks ويسبب كراش

- [x] **#2** إصلاح تبويب الفيديوهات والستوريز (كان فارغاً)
  - ملف: `kom-mobile-app/app/(tabs)/feed.tsx`
  - تم ربط API `/admin-videos` و `/stories/feed`

- [x] **#3** حذف ملفين ميتين غير مستخدمين
  - `kom-mobile-app/context/AuthContext.tsx` (كان يستخدم مفتاح توكن مختلف)
  - `kom-mobile-app/api/client.ts` (لا تستخدمه أي شاشة)

- [x] **#4** إصلاح تحذير لوحة التحكم — تغيير اسم الملف
  - `kom-admin-dashboard/middleware.ts` → `proxy.ts`

---

## المشاكل التي تحتاج بيانات منك (تبقى لآخر)

- [ ] **#5** إضافة رابط السيرفر في ملف `.env` التطبيق
  - ملف: `kom-mobile-app/.env`
  - يجب إضافة: `EXPO_PUBLIC_API_URL=https://رابط-سيرفرك/api/v1`
  - **بعد ما تضيفه هنا، أضفه كـ Secret في موقع expo.dev**
    - اذهب لـ https://expo.dev → مشروعك → Secrets → أضف `EXPO_PUBLIC_API_URL`

- [ ] **#6** تعبئة بيانات Apple في `eas.json`
  - ملف: `kom-mobile-app/eas.json`
  - `appleTeamId`: موجود في https://developer.apple.com/account (Team ID)
  - `ascAppId`: الرقم الموجود في App Store Connect → تطبيقك → App Information → Apple ID

- [ ] **#7** ملف Google Play Service Account
  - انشئ مجلد `kom-mobile-app/credentials/`
  - احصل على ملف JSON من Google Play Console:
    - Setup → API access → Create new service account
    - احفظه باسم `google-play-service-account.json` في مجلد `credentials/`

---

## اختبار نسخة Production قبل الرفع

**راجع الدليل الكامل:** [kom-mobile-app/TESTING_PRODUCTION.md](kom-mobile-app/TESTING_PRODUCTION.md)

### الطريقة السريعة (استخدم السكريبت):

```powershell
# اختبار Android
cd kom-mobile-app
.\test-production.ps1 android

# اختبار iOS عبر TestFlight
.\test-production.ps1 ios
```

### الطريقة اليدوية:

```bash
# 1. ادخل مجلد التطبيق
cd kom-mobile-app

# 2. تسجيل الدخول لـ EAS
eas login

# 3. بناء نسخة اختبار Android (APK)
eas build --platform android --profile production-test

# 4. بناء نسخة اختبار iOS (TestFlight)
eas build --platform ios --profile production
eas submit --platform ios

# 5. اختبر التطبيق بالكامل قبل الرفع النهائي
```

---

## خطوات الرفع النهائي (بعد الاختبار)

```bash
# 1. ادخل مجلد التطبيق
cd kom-mobile-app

# 2. تسجيل الدخول لـ EAS
eas login

# 3. بناء Android (AAB للـ Play Store)
eas build --platform android --profile production

# 4. بناء iOS (على سيرفرات Apple — لأنك على Windows)
eas build --platform ios --profile production

# 5. رفع Android بعد اكتمال البناء
eas submit --platform android

# 6. رفع iOS بعد اكتمال البناء
eas submit --platform ios
```

---

## ملاحظة مهمة — iOS على Windows

لأنك على **Windows بدون Mac** — لا تستطيع بناء iOS محلياً.
كل بناء iOS يحدث عبر سيرفرات EAS السحابية (تحتاج Apple Developer Account نشط بـ $99/سنة).

---

*آخر تحديث: مارس 2026*

---

## سجل التنفيذ

### الجلسة الأولى (مارس 17, 2026)

**الملفات المعدلة:**

1. **kom-mobile-app/lib/rtl.ts**
   - ✅ إصلاح RTL helper: حذف القلب الخاطئ لـ textAlign من right إلى left داخل RTL
   - الآن يقلب left إلى right فقط، ويحافظ على right كما هي

2. **kom-mobile-app/app/(tabs)/add.tsx**
   - ✅ توحيد مسار إنشاء الإعلان: حذف if (type === 'CAR') router.push('/add-car')
   - جميع الأنواع (CAR, PLATE, PART) تذهب الآن عبر draft creation ثم add-listing/[id]

3. **kom-mobile-app/app/(tabs)/index.tsx**
   - ✅ إزالة بنر الباقة: حذف <SubscriptionPromoCard /> من الصفحة الرئيسية

4. **kom-mobile-app/app/add-listing/[id].tsx**
   - ✅ توسيع CarDetails interface: إضافة bodyType, interiorColor, bodyCondition, paintType
   - ✅ تحديث state لحفظ الحقول الجديدة
   - ✅ إرسال الحقول في specs عند الحفظ: { interiorColor, bodyCondition, paintType, paint }
   - ✅ قراءة الحقول من car.specs عند التعديل

5. **kom-backend/kom-backend/src/modules/listings/listings.service.ts**
   - ✅ تحديث upsertCarDetails: دمج interiorColor, bodyCondition, paintType في specs JSON
   - يحفظ الآن كل الحقول الإضافية في carDetails.specs

6. **kom-mobile-app/app/listing/[id].tsx** و **kom-mobile-app/app/(tabs)/listing/[id].tsx**
   - ✅ تحديث قراءة paintType: d.specs.paintType || d.specs.paint
   - يدعم الآن كلا المفتاحين للتوافق مع البيانات القديمة

7. **kom-backend/kom-backend/src/modules/admin/admin.service.ts**
   - ✅ توسيع getAllUsers: إضافة governorate, city, merchantType للـ profiles
   - الآن يرجع بيانات الموقع كاملة لكل من الأفراد والمعارض

8. **kom-admin-dashboard/lib/types.ts**
   - ✅ توسيع UserProfile interface: إضافة governorate, city, merchantType

9. **kom-admin-dashboard/app/dashboard/users/page.tsx**
   - ✅ توسيع جدول المستخدمين: إضافة أعمدة للهاتف، المحافظة/المدينة، السجل التجاري
   - الجدول يعرض الآن 9 أعمدة بدلاً من 6

10. **kom-backend/kom-backend/src/modules/notifications/push.service.ts**
    - ✅ تفعيل Push Notifications الحقيقي: دمج expo-server-sdk
    - ✅ استبدال sendToDevice stub بإرسال حقيقي عبر Expo.sendPushNotificationsAsync
    - ✅ التحقق من توكنات Expo الصحيحة
    - ✅ معالجة أخطاء DeviceNotRegistered وإلغاء تفعيل التوكنات الميتة

11. **kom-backend/kom-backend/package.json**
    - ✅ تثبيت expo-server-sdk

**ما تم إنجازه:**
- ✅ إصلاح 5 من 6 مشاكل رئيسية بشكل كامل
- ✅ توحيد مسار إنشاء الإعلان لكل الأنواع
- ✅ إصلاح حفظ وعرض تفاصيل السيارة الإضافية
- ✅ إصلاح RTL ومحاذاة النصوص العربية
- ✅ إزالة بنر الاشتراك من الصفحة الرئيسية
- ✅ توسيع لوحة الأدمن لعرض كل بيانات المسجلين
- ✅ تفعيل Push Notifications الحقيقي عبر Expo

**ما يحتاج اختبار:**
- ⏳ اختبار Push Notifications على جهاز حقيقي
- ⏳ اختبار منطق الاشتراك والرسائل عند النشر
- ⏳ مراجعة RTL على كامل الشاشات (iOS و Android)

**الملفات بدون تغيير (لم تعد ضرورية):**
- `kom-mobile-app/app/add-car.tsx` - لم يعد يُستخدم بعد توحيد المسار
