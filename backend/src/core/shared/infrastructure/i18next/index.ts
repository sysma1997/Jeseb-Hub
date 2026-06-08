import i18next from "i18next";

import { TranslatorRepository } from "../../domain/TranslatorRepository";

import en from "./locales/en.json";
import es from "./locales/es.json";

const defaultLanguage = "en";

i18next.init({
    resources: {
        en: { translation: en }, 
        es: { translation: es }
    }, 
    lng: defaultLanguage, 
    fallbackLng: defaultLanguage, 
    interpolation: {
        escapeValue: false
    }
});

export default i18next;

export const getLanguageFromRequest = (req: any): string => {
    const acceptLanguage = req.headers["accept-language"];
    if (acceptLanguage) {
        const languages = acceptLanguage.split(",")[0].split("-")[0].toLowerCase();
        if (languages === "es") return "es";
    }

    return defaultLanguage;
};
export class TranslatorI18nRepository implements TranslatorRepository {
    translate(key: string, params?: Record<string, any>): string {
        const result = (params) ? i18next.t(key, params) : i18next.t(key);
        return (typeof result === "string") ? result : key;
    }
    getLocale(): string {
        return i18next.language;
    }
}