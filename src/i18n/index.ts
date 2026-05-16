import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import bn from "../content/translations/bn";
import en from "../content/translations/en";

const resources = {
  en: { translation: en },
  bn: { translation: bn },
};

void i18n.use(initReactI18next).init({
  resources,
  lng: "bn",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
