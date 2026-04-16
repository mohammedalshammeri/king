import 'react-i18next';
import type ar from '@/lib/i18n/resources/ar';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof ar;
    };
  }
}