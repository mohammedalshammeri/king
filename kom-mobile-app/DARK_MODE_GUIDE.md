# نظام الوضع الليلي - Dark Mode System

تم إضافة نظام وضع ليلي كامل للتطبيق يعمل بدون الحاجة لـ metro config.

## المميزات

✅ **التبديل الفوري**: تبديل سريع بين الوضع الليلي والنهاري
✅ **حفظ التفضيلات**: يتم حفظ اختيارك تلقائياً
✅ **دعم نظام التشغيل**: يدعم تفضيلات النظام (قريباً)
✅ **متوافق مع NativeWind**: يستخدم Tailwind CSS classes

## كيفية الاستخدام

### في أي صفحة

```tsx
import { useTheme } from '../context/ThemeContext';
import { ThemedView, ThemedText } from '../context/ThemedComponents';

function MyScreen() {
  const { isDark, setThemeMode } = useTheme();
  
  return (
    <ThemedView className="flex-1 bg-white dark:bg-gray-900">
      <ThemedText className="text-black dark:text-white">
        النص يتغير حسب الوضع
      </ThemedText>
    </ThemedView>
  );
}
```

### تبديل الوضع الليلي

```tsx
const { setThemeMode } = useTheme();

// تفعيل الوضع الليلي
setThemeMode('dark');

// تفعيل الوضع النهاري
setThemeMode('light');

// استخدام إعدادات النظام (قريباً)
setThemeMode('auto');
```

## المكونات المتاحة

- `ThemedView` - بديل لـ View
- `ThemedText` - بديل لـ Text
- `ThemedScrollView` - بديل لـ ScrollView
- `ThemedTouchableOpacity` - بديل لـ TouchableOpacity
- `ThemedTextInput` - بديل لـ TextInput

## ملاحظات

- يتم حفظ التفضيلات في AsyncStorage
- يعمل بدون الحاجة لـ metro config
- متوافق مع Node.js v22 على Windows
- استخدم classes من Tailwind مع `dark:` prefix

## مثال كامل

```tsx
import { ThemedView, ThemedText } from '../context/ThemedComponents';
import { useTheme } from '../context/ThemeContext';
import { Switch } from 'react-native';

export default function SettingsScreen() {
  const { isDark, themeMode, setThemeMode } = useTheme();
  
  return (
    <ThemedView className="flex-1 bg-gray-50 dark:bg-black p-4">
      <ThemedText className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        الإعدادات
      </ThemedText>
      
      <ThemedView className="flex-row items-center justify-between">
        <Switch 
          value={themeMode === 'dark'}
          onValueChange={(value) => setThemeMode(value ? 'dark' : 'light')}
        />
        <ThemedText className="text-base text-gray-700 dark:text-gray-300">
          الوضع الليلي
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}
```
