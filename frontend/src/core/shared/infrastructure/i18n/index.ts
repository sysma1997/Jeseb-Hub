import en from "./locales/en.json";
import es from "./locales/es.json";

export type Locale = "en" | "es";

const dictionaries: Record<Locale, any> = { en, es };

let currentLocale: Locale = "en";

const detectLocaleFromURL = (): Locale | null => {
    if (typeof window === 'undefined') return null;

    const path = window.location.pathname;
    if (path.startsWith('/es/') || path === '/es') {
        return 'es';
    }
    if (path.startsWith('/en/') || path === '/en' || path === '/') {
        return 'en';
    }

    return null;
};
const detectLocaleFromStorage = (): Locale | null => {
    if (typeof localStorage === 'undefined') return null;

    const saved = localStorage.getItem('locale') as Locale;
    if (saved && (saved === 'en' || saved === 'es')) {
        return saved;
    }

    return null;
};
const detectLocaleFromBrowser = (): Locale | null => {
    if (typeof navigator === 'undefined') return null;

    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'es') return 'es';

    return 'en';
}

export const initTranslations = (defaultLocale: Locale = "en") => {
    const urlLocale = detectLocaleFromURL();
    if (urlLocale) {
        currentLocale = urlLocale;
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('locale', urlLocale);
        }
        return;
    }
    const storedLocale = detectLocaleFromStorage();
    if (storedLocale) {
        currentLocale = storedLocale;
        return;
    }
    const browserLocale = detectLocaleFromBrowser();
    if (browserLocale) {
        currentLocale = browserLocale;
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('locale', browserLocale);
        }
        return;
    }

    currentLocale = defaultLocale;
};
export const getLocale = (): Locale => currentLocale;
export const setLocale = (locale: Locale) => {
    currentLocale = locale;
    if (typeof localStorage !== "undefined")
        localStorage.setItem("locale", locale);
};

export const t = (key: string, params?: Record<string, string | number>): string => {
    const dict = dictionaries[currentLocale];
    const keys = key.split(".");
    let result: any = dict;

    for (const k of keys) {
        if (result && typeof result === "object" && k in result)
            result = result[k];
        else {
            console.warn(`Translation key '${key}' not found for locale '${currentLocale}'`);
            return key;
        }
    }

    let text = typeof result === 'string' ? result : key;

    if (params) {
        Object.entries(params).forEach(([param, value]) => {
            text = text.replace(new RegExp(`{{${param}}}`, 'g'), String(value));
        });
    }

    return text;
};