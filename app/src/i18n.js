import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Cache from 'i18next-localstorage-cache';
import LanguageDetector from 'i18next-browser-languagedetector';
import resources from 'virtual:i18next-loader';

i18n
  .use(initReactI18next)
  .use(Cache)
  .use(LanguageDetector)
  .init({
    resources,
    supportedLngs: ['en', 'pt'],
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
