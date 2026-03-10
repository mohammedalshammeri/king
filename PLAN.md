# خطة إصلاح المشروع قبل الرفع على App Store & Google Play

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

## خطوات الرفع (بعد إصلاح كل شيء)

```bash
# 1. ادخل مجلد التطبيق
cd kom-mobile-app

# 2. تسجيل الدخول لـ EAS
eas login

# 3. بناء Android (APK/AAB)
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

*آخر تحديث: فبراير 2026*
