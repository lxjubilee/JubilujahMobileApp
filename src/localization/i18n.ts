import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import en from './en.json';

/**
 * i18next setup. Device locale is detected via expo-localization; English is the
 * seed/fallback. Add a locale by dropping a JSON file here and registering it in
 * `resources` — no component changes required.
 */
export const resources = {
  en: { translation: en },
} as const;

const deviceLanguage = getLocales()[0]?.languageCode ?? 'en';

void i18n.use(initReactI18next).init({
  resources,
  lng: deviceLanguage in resources ? deviceLanguage : 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export default i18n;
