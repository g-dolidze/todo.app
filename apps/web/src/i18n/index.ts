import { DEFAULT_LOCALE, LOCALES, type Locale } from '@progress/shared';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import ka from './ka.json';

/** Same key as Pro-gress v0.1. Keep in sync with the inline script in index.html. */
export const LOCALE_STORAGE_KEY = 'progress-locale';

export const resources = { ka: { translation: ka }, en: { translation: en } } as const;

export function readStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    return LOCALES.includes(stored as Locale) ? (stored as Locale) : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, lng);
  } catch {
    // Storage blocked: the choice applies for this visit only.
  }
});

void i18n.use(initReactI18next).init({
  resources,
  lng: readStoredLocale(),
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: [...LOCALES],
  interpolation: { escapeValue: false }, // React already escapes.
  returnNull: false,
});

export default i18n;
