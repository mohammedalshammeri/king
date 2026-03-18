# الفرق بين أنواع البناء المختلفة

## 📊 مقارنة سريعة

| النوع | الاستخدام | التوزيع | السرعة | التكلفة |
|-------|-----------|---------|---------|---------|
| **Development** | التطوير المحلي | مطورين فقط | سريع جداً | مجاني |
| **Preview** | اختبار سريع | فريق داخلي | سريع | مجاني |
| **Production-Test** | اختبار نسخة الإنتاج | أجهزة محددة | متوسط | مجاني (EAS) |
| **Production** | الرفع النهائي | App Store/Play Store | بطيء | يحتاج حسابات مدفوعة |

---

## 🔧 Development Build

**متى تستخدمه؟**
- أثناء التطوير اليومي
- لاختبار features جديدة
- مع Expo DevClient

**الخصائص:**
- ✅ Hot reload مفعل
- ✅ Debug mode مفعل
- ✅ يمكن تشغيله على Simulator/Emulator
- ❌ ليس للتوزيع أو الاختبار النهائي

**الأمر:**
```bash
eas build --profile development --platform android
```

---

## 🎬 Preview Build

**متى تستخدمه؟**
- اختبار سريع لـ feature معين
- مشاركة مع فريق التطوير
- اختبار قبل production

**الخصائص:**
- ✅ APK مباشر للأندرويد
- ✅ Ad Hoc لـ iOS
- ✅ يثبت مباشرة بدون Store
- ⚠️ قد يستخدم API مختلف عن production
- ⚠️ ليس production حقيقي بنسبة 100%

**الأمر:**
```bash
eas build --profile preview --platform android
```

---

## 🧪 Production-Test Build (الذي أضفناه)

**متى تستخدمه؟**
- ✅ **قبل الرفع على Store مباشرةً**
- ✅ اختبار بيئة production الحقيقية
- ✅ التأكد من عدم وجود bugs
- ✅ اختبار API endpoints الحقيقية

**الخصائص:**
- ✅ نفس إعدادات production بالضبط
- ✅ نفس API URL الحقيقي
- ✅ نفس environment variables
- ✅ APK للأندرويد يثبت مباشرة
- ✅ Ad Hoc لـ iOS (بدون Store)
- ❌ ليس للتوزيع العام

**الأمر:**
```bash
eas build --profile production-test --platform android
```

**الفرق عن Production:**
- Production-Test: `distribution: "internal"` → يمكن تثبيته مباشرة
- Production: `distribution: "store"` → يجب رفعه على Store

---

## 🚀 Production Build

**متى تستخدمه؟**
- ✅ **الرفع النهائي على App Store/Play Store**
- ✅ بعد اكتمال كل الاختبارات
- ✅ للمستخدمين النهائيين

**الخصائص:**
- ✅ AAB للأندرويد (App Bundle)
- ✅ IPA لـ iOS
- ✅ موقّع ومُحسّن
- ✅ ProGuard/Minification مفعل
- ✅ Production API endpoints
- ❌ لا يمكن تثبيته محلياً مباشرة
- ❌ يجب رفعه عبر eas submit

**الأمر:**
```bash
# بناء
eas build --profile production --platform android
eas build --profile production --platform ios

# رفع
eas submit --platform android
eas submit --platform ios
```

---

## 📱 الطريقة الموصى بها للاختبار

### للأندرويد:

```bash
# 1. ابنِ APK اختباري
eas build --profile production-test --platform android

# 2. حمله على جهازك
# 3. ثبته واختبره بالكامل
# 4. إذا كل شيء تمام، ابنِ النسخة النهائية
eas build --profile production --platform android
eas submit --platform android
```

### لـ iOS:

```bash
# 1. ابنِ ورفع على TestFlight مباشرة
eas build --profile production --platform ios
eas submit --platform ios

# 2. اذهب لـ App Store Connect → TestFlight
# 3. اختبر التطبيق على جهازك (بيئة production حقيقية)
# 4. إذا كل شيء تمام، قدم للمراجعة النهائية
```

---

## 🎯 السيناريو الكامل المقترح

### المرحلة 1: التطوير
```bash
eas build --profile development --platform android
# اختبر features جديدة
```

### المرحلة 2: الاختبار الأولي
```bash
eas build --profile preview --platform android
# شارك مع الفريق للاختبار السريع
```

### المرحلة 3: اختبار Production (مهم جداً!)
```bash
eas build --profile production-test --platform android
# اختبر بإعدادات production الحقيقية قبل الرفع
```

### المرحلة 4: الرفع النهائي
```bash
eas build --profile production --platform android
eas build --profile production --platform ios
eas submit --platform android
eas submit --platform ios
# النشر للمستخدمين
```

---

## ⚠️ أخطاء شائعة

### ❌ **رفع production مباشرة بدون اختبار**
```bash
# خطأ! قد تكتشف bugs بعد الرفع
eas build --profile production --platform android
eas submit --platform android
```

### ✅ **الطريقة الصحيحة**
```bash
# 1. اختبر أولاً
eas build --profile production-test --platform android
# ... اختبر التطبيق بالكامل ...

# 2. ثم ارفع
eas build --profile production --platform android
eas submit --platform android
```

---

## 📋 قائمة فحص قبل production

قبل تشغيل `eas build --profile production`:

- [ ] اختبرت production-test بالكامل
- [ ] API endpoints تشير للسيرفر الحقيقي
- [ ] لا توجد console.log كثيرة في الكود
- [ ] الإصدار (version) محدث في app.json
- [ ] الأيقونات والـ splash screen جاهزة
- [ ] Privacy Policy و Terms محدثة
- [ ] Push Notifications تعمل
- [ ] In-app purchases مفعلة (إن وجدت)
- [ ] اختبرت على أجهزة حقيقية (ليس emulator فقط)

---

*آخر تحديث: مارس 2026*
