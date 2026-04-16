import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import i18n, {
  AppLanguage,
  fallbackLanguage,
  LANGUAGE_STORAGE_KEY,
  normalizeLanguage,
} from '@/lib/i18n';

type LanguageDirection = 'rtl' | 'ltr';

type LanguageContextType = {
  language: AppLanguage;
  direction: LanguageDirection;
  isRTL: boolean;
  ready: boolean;
  setLanguage: (language: AppLanguage) => Promise<void>;
  toggleLanguage: () => Promise<void>;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getDeviceLanguage = (): AppLanguage => {
  const locales = Localization.getLocales();
  const primaryLocale = locales[0]?.languageTag ?? locales[0]?.languageCode ?? fallbackLanguage;
  return normalizeLanguage(primaryLocale);
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(fallbackLanguage);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const bootstrapLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        const nextLanguage = savedLanguage ? normalizeLanguage(savedLanguage) : getDeviceLanguage();
        await i18n.changeLanguage(nextLanguage);
        if (!mounted) return;
        setLanguageState(nextLanguage);
      } catch {
        const nextLanguage = getDeviceLanguage();
        await i18n.changeLanguage(nextLanguage);
        if (!mounted) return;
        setLanguageState(nextLanguage);
      } finally {
        if (mounted) setReady(true);
      }
    };

    void bootstrapLanguage();

    return () => {
      mounted = false;
    };
  }, []);

  const setLanguage = async (nextLanguage: AppLanguage) => {
    const normalized = normalizeLanguage(nextLanguage);
    await i18n.changeLanguage(normalized);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
    setLanguageState(normalized);
  };

  const toggleLanguage = async () => {
    await setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.body.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const value = useMemo<LanguageContextType>(() => {
    const isRTL = language === 'ar';

    return {
      language,
      direction: isRTL ? 'rtl' : 'ltr',
      isRTL,
      ready,
      setLanguage,
      toggleLanguage,
    };
  }, [language, ready]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }

  return context;
}

export function useAppTranslation() {
  return useTranslation();
}