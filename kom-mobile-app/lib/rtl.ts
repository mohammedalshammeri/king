import { I18nManager, StyleSheet, TextStyle, ViewStyle, ImageStyle } from 'react-native';

type RNStyle = ViewStyle | TextStyle | ImageStyle;
type AnyStyle = RNStyle & Record<string, any>;

export const isRTL = I18nManager.isRTL;

const swap = (o: AnyStyle, a: string, b: string) => {
  if (o[a] !== undefined || o[b] !== undefined) {
    const t = o[a];
    o[a] = o[b];
    o[b] = t;
  }
};

/**
 * rtlify(style):
 * - يقلب أي style تلقائياً ليتوافق مع RTL
 * - يعكس row/left/right/margins/paddings/radius
 * - يدعم style object أو array
 */
export const rtlify = <T,>(style: T): T => {
  if (!isRTL || !style) return style;

  const one = (s: AnyStyle): AnyStyle => {
    if (!s || typeof s !== 'object') return s;
    const o: AnyStyle = { ...s };

    // 1) انعكاس الصفوف
    if (o.flexDirection === 'row') o.flexDirection = 'row-reverse';
    else if (o.flexDirection === 'row-reverse') o.flexDirection = 'row';

    // 2) محاذاة النص: لا نقلب right إلى left داخل RTL لأن التطبيق عربي-first
    if (o.textAlign === 'left') o.textAlign = 'right';

    // 3) خصائص left/right الشائعة
    swap(o, 'left', 'right');
    swap(o, 'marginLeft', 'marginRight');
    swap(o, 'paddingLeft', 'paddingRight');
    swap(o, 'borderLeftWidth', 'borderRightWidth');
    swap(o, 'borderTopLeftRadius', 'borderTopRightRadius');
    swap(o, 'borderBottomLeftRadius', 'borderBottomRightRadius');
    swap(o, 'borderLeftColor', 'borderRightColor');

    // 4) اجبار RTL للنصوص لو ما كان محدد
    if (o.writingDirection === undefined) o.writingDirection = 'rtl';

    return o;
  };

  return (Array.isArray(style) ? (style as any[]).map(one) : one(style as any)) as T;
};

/**
 * ستايلات جاهزة “صحية” للـ RTL
 * (بدون flex-end لأن flex-end يخرب كثير من التصميم)
 */
export const rtlStyles = StyleSheet.create({
  // استخدمه في أعلى الصفحة لو تحتاج
  container: {
    flex: 1,
  } as ViewStyle,

  // لأي row: icons + texts + buttons
  row: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
  } as ViewStyle,

  // نصوص عامة
  text: {
    writingDirection: isRTL ? 'rtl' : 'ltr',
    textAlign: isRTL ? 'right' : 'left',
  } as TextStyle,

  // محتوى داخل Card أو section
  // (محاذاة آمنة بدون ما تكسّر flex)
  content: {
    alignSelf: 'stretch',
  } as ViewStyle,
});

/**
 * Helper للنص: يضمن RTL + محاذاة يمين
 */
export const rtlText = (style?: TextStyle): TextStyle =>
  rtlify([
    { writingDirection: isRTL ? 'rtl' : 'ltr', textAlign: isRTL ? 'right' : 'left' } as TextStyle,
    style,
  ] as unknown) as TextStyle;

/**
 * Helper للصفوف: يضمن row-reverse في RTL
 */
export const rtlRow = (style?: ViewStyle): ViewStyle =>
  rtlify([{ flexDirection: isRTL ? 'row-reverse' : 'row' } as ViewStyle, style] as unknown) as ViewStyle;

/**
 * Helper للكونتينر: يحافظ على layout “صحي”
 * إذا تبي تدفع شيء لليمين استخدم justifyContent/space-between في row بدل flex-end هنا.
 */
export const rtlContainer = (style?: ViewStyle): ViewStyle =>
  rtlify([{ flex: 1 } as ViewStyle, style] as unknown) as ViewStyle;
