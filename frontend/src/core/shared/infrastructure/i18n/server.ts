import en from './locales/en.json';
import es from './locales/es.json';

export type Locale = 'en' | 'es';

const dictionaries: Record<Locale, any> = { en, es };

const translate = (locale: Locale, key: string, params?: Record<string, string | number>): string => {
    const dict = dictionaries[locale];
    const keys = key.split('.');
    let result: any = dict;

    for (const k of keys) {
        if (result && typeof result === 'object' && k in result) {
            result = result[k];
        } else {
            console.warn(`Translation key "${key}" not found for locale "${locale}"`);
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
}

export const getLocaleFromUrl = (url: URL | string): Locale => {
    const pathname = typeof url === 'string' ? url : url.pathname;
    if (pathname.startsWith('/es')) {
        return 'es';
    }
    return 'en';
};
export const createTranslations = (locale: Locale) => {
    return (key: string, params?: Record<string, string | number>) => translate(locale, key, params);
}