import { I18nManager, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import {
  getDirectionalInputStyle,
  getDirectionalRowStyle,
  getDirectionalTextStyle,
  isLanguageRTL,
} from './layout-direction';

export const isRTL = (): boolean => isCurrentRTL();
export const isCurrentRTL = (): boolean => I18nManager.isRTL || isLanguageRTL();

/**
 * rtlify(style):
 * - يحافظ على الـ style كما هو
 * - يبقي التحكم بالاتجاه عند I18nManager والأنماط المنطقية
 * - يدعم style object أو array
 */
export const rtlify = <T,>(style: T): T => {
  return style;
};

/**
 * ستايلات جاهزة محايدة تعتمد على اتجاه النظام
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
 * Helper للنص: يضيف محاذاة نص حيادية فقط
 */
export const rtlText = (style?: TextStyle): TextStyle => {
  const baseStyle: TextStyle = getDirectionalTextStyle();
  
  if (!style) return baseStyle;
  return StyleSheet.flatten([baseStyle, style]) as TextStyle;
};

/**
 * Helper للصفوف: يجمع ستايل الصف المحايد فقط
 */
export const rtlRow = (style?: ViewStyle): ViewStyle =>
  StyleSheet.flatten([getDirectionalRowStyle() as ViewStyle, style]) as ViewStyle;

/**
 * Helper للكونتينر: يحافظ على layout “صحي”
 * إذا تبي تدفع شيء لليمين استخدم justifyContent/space-between في row بدل flex-end هنا.
 */
export const rtlContainer = (style?: ViewStyle): ViewStyle =>
  StyleSheet.flatten([{ flex: 1 } as ViewStyle, style]) as ViewStyle;
/**
 * Helper لحقول الإدخال (TextInput): يضيف محاذاة حيادية فقط
 */
export const rtlInput = (style?: TextStyle): TextStyle => {
  const baseStyle: TextStyle = getDirectionalInputStyle();
  
  if (!style) return baseStyle;
  return StyleSheet.flatten([baseStyle, style]) as TextStyle;
};