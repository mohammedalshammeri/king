import { I18nManager, type TextStyle, type ViewStyle } from 'react-native';
import i18n, { AppLanguage, fallbackLanguage, normalizeLanguage } from './i18n';

export type LayoutDirection = 'rtl' | 'ltr';

export function getLanguage(value?: string | null): AppLanguage {
  return normalizeLanguage(value ?? i18n.resolvedLanguage ?? i18n.language ?? fallbackLanguage);
}

export function isLanguageRTL(value?: string | null): boolean {
  if (value !== undefined && value !== null) {
    return getLanguage(value) === 'ar';
  }

  return I18nManager.isRTL;
}

export function getLayoutDirection(value?: string | null): LayoutDirection {
  return isLanguageRTL(value) ? 'rtl' : 'ltr';
}

export function getRowDirection(value?: string | null): 'row' {
  void value;
  return 'row';
}

export function getTextAlignStart(value?: string | null): 'auto' {
  void value;
  return 'auto';
}

export function getTextAlignEnd(value?: string | null): 'auto' {
  void value;
  return 'auto';
}

export function getStartEdge(value?: string | null): 'left' | 'right' {
  return isLanguageRTL(value) ? 'right' : 'left';
}

export function getEndEdge(value?: string | null): 'left' | 'right' {
  return isLanguageRTL(value) ? 'left' : 'right';
}

export function getDirectionalTextStyle(value?: string | null): TextStyle {
  return {
    textAlign: getTextAlignStart(value),
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