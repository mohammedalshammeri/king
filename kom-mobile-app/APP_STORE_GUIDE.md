# 🎨 دليل أيقونات وأصول تطبيق KOM

## الملفات المطلوبة في `assets/images/`

| الملف | الاستخدام | الأبعاد |
|-------|-----------|---------|
| `icon.png` | أيقونة iOS الرئيسية | **1024 × 1024 px** |
| `adaptive-icon.png` | Foreground أيقونة Android | **1024 × 1024 px** |
| `splash.png` | شاشة التحميل (الصورة المتحركة) | **1284 × 2778 px** |
| `favicon.png` | أيقونة متصفح الويب | **48 × 48 px** |

## متطلبات الأيقونة (icon.png)

- **الحجم:** 1024 × 1024 بكسل بالضبط
- **الصيغة:** PNG بخلفية صلبة (بدون شفافية)
- **الخلفية المقترحة:** `#0f172a` (كحلي داكن – لون العلامة التجارية)
- **المحتوى:** شعار KOM بلون ذهبي `#D4AF37` في المنتصف
- **الهوامش:** 20% من كل جانب (الشعار لا يلمس الحواف)

## متطلبات Android Adaptive Icon

يعمل Android Adaptive Icon بطبقتين:
```
foregroundImage → adaptive-icon.png  (الشعار بخلفية شفافة)
backgroundColor → #0f172a           (مُعرَّف في app.json)
```

- **الأبعاد:** 1024 × 1024 بكسل
- **منطقة الأمان:** احتفظ بالشعار في الـ 66% المركزية (512px)
- **الخلفية:** شفافة (PNG-32)

## متطلبات App Store
متجر Apple يتطلب الأيقونة بدون:
- زوايا مدورة (Apple تضيفها تلقائياً)
- ظلال
- شفافية

## أيقونات iOS المولّدة تلقائياً بـ EAS
عند البناء مع `eas build`، يُولّد Expo تلقائياً:
- 20×20, 29×29, 40×40, 60×60, 76×76, 83.5×83.5, 1024×1024

## أيقونات Android المولّدة تلقائياً
- mdpi: 48×48
- hdpi: 72×72
- xhdpi: 96×96
- xxhdpi: 144×144
- xxxhdpi: 192×192
- Play Store: 512×512

## شاشة Splash المتحركة

الصورة الموجودة `splash.png` تُعرض بعد انتهاء الفيديو مع أنيمشن (scale + fade).
- **الأبعاد المثالية:** 1284 × 2778 px (iPhone 14 Pro Max)
- **الخلفية:** `#0f172a` (مُعيَّنة في app.json splash.backgroundColor)
- **المحتوى:** شعار KOM مع slogan

## متجر التطبيقات – معلومات ضرورية

### App Store Connect (iOS)
- **App Name:** KOM
- **Subtitle:** سوق السيارات في البحرين
- **Category:** Shopping (أو Automotive)
- **Privacy Policy URL:** https://kotm.app/privacy
- **Support URL:** https://kotm.app/support
- **Marketing URL:** https://kotm.app
- **Age Rating:** 4+
- **Description (Arabic):**
  ```
  KOM هو سوق السيارات الرائد في البحرين.
  بيع واشترِ سيارتك بكل سهولة مع آلاف الإعلانات من الأفراد والمعارض.
  
  المميزات:
  • أضف إعلانك في أقل من 3 دقائق
  • تصفح آلاف السيارات بفلاتر متقدمة
  • تواصل مباشرة مع البائعين
  • معارض سيارات معتمدة
  • باقات اشتراك مرنة
  • واجهة عربية بالكامل
  ```

### Google Play Console (Android)
- **App Name:** KOM
- **Short Description:** سوق السيارات الأول في البحرين
- **Category:** Auto & Vehicles
- **Privacy Policy URL:** https://kotm.app/privacy
- **Email:** support@kotm.app
- **Content Rating:** Everyone
- **Data Safety:**
  - Name: ✅ Collected (account management)
  - Email address: ✅ Collected (account management)
  - Phone number: ✅ Collected (account management)
  - Photos/Videos: ✅ Collected (app functionality – car images)
  - Device ID: ✅ Collected (analytics)

## Screenshots مطلوبة

### iOS
- **iPhone 6.9":** 1320 × 2868 px (3 – 10 صور)
- **iPhone 6.5":** 1242 × 2688 px (3 – 10 صور)
- **iPad Pro 12.9":** 2048 × 2732 px (إذا دعم الـ tablet)

### Android
- **Phone:** 1080 × 1920 px (2 – 8 صور)
- **Feature Graphic:** 1024 × 500 px (مطلوب)

## متطلبات الرفع (ضرورية قبل `eas submit`)

### iOS (Apple)
- لازم يكون عندك **Apple Developer Program** مفعّل.
- لازم تُنشئ التطبيق في **App Store Connect** بنفس الـBundle ID الموجود في `app.json`:
  - `ios.bundleIdentifier`: `app.kotm.kom`
- عند الرفع بـ`eas submit` سيُطلب منك:
  - **Apple Team ID**
  - **App Store Connect App ID (ascAppId)**

### Android (Google Play)
- لازم يكون عندك **Google Play Console** مفعّل.
- لازم تُنشئ التطبيق في Play Console بنفس الـPackage الموجود في `app.json`:
  - `android.package`: `app.kotm.kom`
- للرفع التلقائي عبر `eas submit` ضع ملف service account هنا:
  - `kom-mobile-app/credentials/google-play-service-account.json`

## بناء التطبيق للمتجر

```bash
# iOS (App Store)
eas build --platform ios --profile production

# Android (Google Play)
eas build --platform android --profile production

# الاثنان معاً
eas build --platform all --profile production

# رفع للمتجر
eas submit --platform ios --profile production
eas submit --platform android --profile production
```
