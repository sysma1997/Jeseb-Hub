import en from "./locales/en.json";
import es from "./locales/es.json";

const dicts: Record<string, Record<string, unknown>> = { en, es };

export function getLocaleFromUrl(url: URL): string {
  if (url.pathname.startsWith("/es")) return "es";
  return "en";
}

export function createTranslations(locale: string) {
  const dict = dicts[locale] || dicts.en;
  return (key: string): string => {
    const keys = key.split(".");
    let value: unknown = dict;
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return key;
      }
    }
    return typeof value === "string" ? value : key;
  };
}
