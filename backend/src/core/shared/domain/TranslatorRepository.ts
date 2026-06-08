export interface TranslatorRepository {
    translate(key: string, params?: Record<string, any>): string;
    getLocale(): string;
}