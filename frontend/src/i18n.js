import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import thLocale from './locales/th.json';
import enLocale from './locales/en.json';

const savedLang = (() => {
  try {
    return localStorage.getItem('soundwave_lang') || 'th';
  } catch {
    return 'th';
  }
})();

const resources = {
  th: {
    translation: thLocale,
  },
  en: {
    translation: enLocale,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: savedLang,
  fallbackLng: 'th',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
