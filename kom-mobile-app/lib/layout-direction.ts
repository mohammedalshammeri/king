import type { TextStyle, ViewStyle } from 'react-native';
import i18n, { AppLanguage, fallbackLanguage, normalizeLanguage } from './i18n';

export type LayoutDirection = 'rtl' | 'ltr';

export function getLanguage(value?: string | null): AppLanguage {
  return normalizeLanguage(value ?? i18n.resolvedLanguage ?? i18n.language ?? fallbackLanguage);
}

export function isLanguageRTL(value?: string | null): boolean {
  return getLanguage(value) === 'ar';
}

export function getLayoutDirection(value?: string | null): LayoutDirection {
  return isLanguageRTL(value) ? 'rtl' : 'ltr';
}

export function getRowDirection(value?: string | null): 'row' | 'row-reverse' {
  return isLanguageRTL(value) ? 'row-reverse' : 'row';
}

export function getTextAlignStart(value?: string | null): 'left' | 'right' {
  return isLanguageRTL(value) ? 'right' : 'left';
}

export function getTextAlignEnd(value?: string | null): 'left' | 'right' {
  return isLanguageRTL(value) ? 'left' : 'right';
}

export function getStartEdge(value?: string | null): 'left' | 'right' {
  return isLanguageRTL(value) ? 'right' : 'left';
}

export function getEndEdge(value?: string | null): 'left' | 'right' {
  return isLanguageRTL(value) ? 'left' : 'right';
}

export function getDirectionalTextStyle(value?: string | null): TextStyle {
  const isRTL = isLanguageRTL(value);
  return {
    writingDirection: isRTL ? 'rtl' : 'ltr',
    textAlign: isRTL ? 'right' : 'left',
  };
}

export function getDirectionalInputStyle(value?: string | null): TextStyle {
  return getDirectionalTextStyle(value);
}

export function getDirectionalRowStyle(value?: string | null): ViewStyle {
  return {
    flexDirection: getRowDirection(value),
  };
}