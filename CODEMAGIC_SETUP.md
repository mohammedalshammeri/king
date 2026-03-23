# خطوات إعداد Codemagic لـ iOS Release

## ✅ تم إصلاح ملف codemagic.yaml

الآن يجب عليك إضافة **App-Specific Password** في Codemagic:

---

## 📝 الخطوات:

### 1️⃣ إنشاء App-Specific Password من Apple

1. اذهب إلى: https://appleid.apple.com/account/manage
2. سجل الدخول بـ Apple ID: `kalifaum47@gmail.com`
3. في قسم **"Security"** (الأمان)
4. اختر **"App-Specific Passwords"** (كلمات مرور خاصة بالتطبيقات)
5. اضغط **"Generate Password"** (إنشاء كلمة مرور)
6. أدخل اسم: `Codemagic KOM`
7. **انسخ كلمة المرور** (مثال: `xxxx-xxxx-xxxx-xxxx`)

---

### 2️⃣ إضافة Password في Codemagic

1. اذهب إلى: https://codemagic.io
2. افتح مشروع **KOM**
3. اذهب إلى **Settings** (الإعدادات)
4. اختر **Environment variables** (متغيرات البيئة)
5. اضغط **Add variable** (إضافة متغير)
6. املأ الحقول:
   ```
   Variable name: APP_STORE_CONNECT_PASSWORD
   Variable value: [الصق كلمة المرور من الخطوة 1]
   Group: ios-release
   Secure: ✅ (مهم جداً!)
   ```
7. اضغط **Add** (إضافة)

---

### 3️⃣ تشغيل Build

الآن يمكنك تشغيل build من Codemagic:

```bash
git push
```

أو من Codemagic UI:
- اذهب إلى **Builds**
- اضغط **Start new build**
- اختر workflow: **ios-release**
- اضغط **Start build**

---

## ✨ بعد نجاح البناء:

- سيتم رفع IPA تلقائياً إلى **TestFlight**
- ستتلقى إشعار عبر البريد من Apple
- يمكنك اختبار التطبيق من TestFlight على iPhone
- ستتأكد من أن إصلاحات RTL تعمل في الإنتاج! 🎉

---

## 🔄 الخيار البديل (App Store Connect API Key - أفضل):

إذا كنت تفضل استخدام API Key بدلاً من App-Specific Password:

1. اذهب إلى: https://appstoreconnect.apple.com/access/api
2. أنشئ API Key جديد
3. في Codemagic، اذهب إلى **Teams > Integrations**
4. أضف **App Store Connect integration**
5. أضف API Key, Key ID, Issuer ID
6. في `codemagic.yaml`، احذف `apple_id` و `password`
7. استبدلهم بـ: `auth: integration`

---

## ⚠️ مهم:

- تأكد أن `APP_STORE_CONNECT_PASSWORD` محدد كـ **Secure** ✅
- لا تشارك App-Specific Password مع أحد
- يمكنك إلغاء الـ password وإنشاء واحد جديد في أي وقت

---

**الآن جاهز للبناء والرفع على TestFlight!** 🚀
