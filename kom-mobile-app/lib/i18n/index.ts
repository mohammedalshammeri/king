import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './resources/ar';
import en from './resources/en';

export const LANGUAGE_STORAGE_KEY = 'app.language';

export const supportedLanguages = ['ar', 'en'] as const;
export type AppLanguage = (typeof supportedLanguages)[number];

export const resources = {
  ar: {
    translation: ar,
  },
  en: {
    translation: en,
  },
} as const;

export const fallbackLanguage: AppLanguage = 'ar';

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: fallbackLanguage,
    fallbackLng: fallbackLanguage,
    compatibilityJSON: 'v4',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    returnNull: false,
  });
}

export function normalizeLanguage(value?: string | null): AppLanguage {
  if (!value) return fallbackLanguage;

  const normalized = value.toLowerCase();
  if (normalized.startsWith('ar')) return 'ar';
  if (normalized.startsWith('en')) return 'en';
  return fallbackLanguage;
}

export default i18n;