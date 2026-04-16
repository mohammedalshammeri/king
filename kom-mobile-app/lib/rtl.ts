import { StyleSheet, TextStyle, ViewStyle, ImageStyle } from 'react-native';
import {
  getDirectionalInputStyle,
  getDirectionalRowStyle,
  getDirectionalTextStyle,
  isLanguageRTL,
} from './layout-direction';

type RNStyle = ViewStyle | TextStyle | ImageStyle;
type AnyStyle = RNStyle & Record<string, any>;

export const isRTL = (): boolean => isCurrentRTL();
export const isCurrentRTL = (): boolean => isLanguageRTL();

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
  const rtl = isCurrentRTL();
  if (!rtl || !style) return style;

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
    swap(o, 'marginStart', 'marginEnd');
    swap(o, 'paddingStart', 'paddingEnd');
    swap(o, 'borderLeftWidth', 'borderRightWidth');
    swap(o, 'borderTopLeftRadius', 'borderTopRightRadius');
    swap(o, 'borderBottomLeftRadius', 'borderBottomRightRadius');
    swap(o, 'borderLeftColor', 'borderRightColor');

    // 4) اجبار اتجاه النص حسب اللغة الحالية لو ما كان محدد
    if (o.writingDirection === undefined) o.writingDirection = rtl ? 'rtl' : 'ltr';

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
    ...getDirectionalRowStyle(),
  } as ViewStyle,

  // نصوص عامة
  text: {
    ...getDirectionalTextStyle(),
  } as TextStyle,

  // محتوى داخل Card أو section
  // (محاذاة آمنة بدون ما تكسّر flex)
  content: {
    alignSelf: 'stretch',
  } as ViewStyle,
});

/**
 * Helper للنص: يضمن RTL + محاذاة يمين + writingDirection
 */
export const rtlText = (style?: TextStyle): TextStyle => {
  const baseStyle: TextStyle = getDirectionalTextStyle();
  
  if (!style) return rtlify(baseStyle) as TextStyle;
  return rtlify([baseStyle, style] as unknown) as TextStyle;
};

/**
 * Helper للصفوف: يضمن row-reverse في RTL
 */
export const rtlRow = (style?: ViewStyle): ViewStyle =>
  rtlify([getDirectionalRowStyle() as ViewStyle, style] as unknown) as ViewStyle;

/**
 * Helper للكونتينر: يحافظ على layout “صحي”
 * إذا تبي تدفع شيء لليمين استخدم justifyContent/space-between في row بدل flex-end هنا.
 */
export const rtlContainer = (style?: ViewStyle): ViewStyle =>
  rtlify([{ flex: 1 } as ViewStyle, style] as unknown) as ViewStyle;
/**
 * Helper لحقول الإدخال (TextInput): يضمن RTL + محاذاة يمين + writingDirection
 * استخدم مع TextInput لضمان محاذاة صحيحة
 */
export const rtlInput = (style?: TextStyle): TextStyle => {
  const baseStyle: TextStyle = getDirectionalInputStyle();
  
  if (!style) return rtlify(baseStyle) as TextStyle;
  return rtlify([baseStyle, style] as unknown) as TextStyle;
};