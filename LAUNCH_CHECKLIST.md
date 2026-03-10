# خطة إطلاق مشروع KOM — قبل رفع التطبيق

## الحالة الحالية
> آخر تحديث: 26 فبراير 2026

---

## ✅ منتهي
- [x] Backend: lint نظيف (EXIT:0)
- [x] Backend: build نظيف (EXIT:0)
- [x] Admin Dashboard: build نظيف (EXIT:0)
- [x] Landing Page: build نظيف (EXIT:0)
- [x] حذف `api/client.ts` (كان ميتاً)
- [x] حذف `context/AuthContext.tsx` (كانت ميتة)

---

## 🔴 مطلوب — تصحيح كود (نعمله الآن)

- [x] **#1** إصلاح `useVideoPlayer` داخل `if` في `app/listing/[id].tsx`
      → كراش عند فتح أي إعلان فيه فيديو
      
- [x] **#2** إصلاح `feed.tsx` — الصفحة لا تجلب أي بيانات من السيرفر
      → التبويب فارغ دائماً
      
- [x] **#7** تغيير اسم `middleware.ts` ← `proxy.ts` في `kom-admin-dashboard`
      → Next.js 16 يقول الاسم القديم مهجور

---

## 🔴 مطلوب — معلومات منك (بعدين)

- [ ] **#3** إضافة `EXPO_PUBLIC_API_URL` في `.env`
      → رابط سيرفرك الحقيقي (مثال: https://api.kotm.app/api/v1)
      → يجب إضافته كذلك في EAS Secrets على expo.dev
      
- [ ] **#4** تعبئة `eas.json` - معلومات iOS
      → `appleTeamId` = Team ID من developer.apple.com → Account → Membership
      → `ascAppId`    = الرقم من App Store Connect → App Information → Apple ID
      
- [ ] **#5** ملف `credentials/google-play-service-account.json`
      → ينزّل من Google Play Console → Setup → API access → Service accounts

---

## 🟢 تنبيهات بسيطة (لا تأثير على الرفع)

- [ ] Landing: تحذير ESLint بخصوص `.eslintrc.json` — البناء يمر رغمه
- [ ] Admin: تحذير بخصوص وجود lockfile في مجلدين — لا يؤثر

---

## خطوات الرفع النهائية (بعد إصلاح كل شيء)

```bash
# 1. بناء iOS (على سيرفرات EAS — لأن ما عندك Mac)
eas build --platform ios --profile production

# 2. بناء Android
eas build --platform android --profile production

# 3. رفع Android لـ Google Play
eas submit --platform android

# 4. رفع iOS لـ App Store
eas submit --platform ios
```

> ⚠️ قبل الرفع لـ Apple تأكد أن التطبيق مسجل في App Store Connect
> وأن Bundle ID: `app.kotm.kom` مسجل في developer.apple.com
