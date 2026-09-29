import { randomInt } from "crypto";

import { TranslatorRepository } from "../../shared/domain/TranslatorRepository";

export type VerificationPurpose = "login" | "email";

interface VerificationChallenge {
    code: string;
    expires: number;
    attempts: number;
}

export class VerificationCode {
    public static readonly MaxActiveCodes: number = 3;
    public static readonly MaxAttempts: number = 5;
    public static readonly ExpiresMinutes: number = 10;

    private static readonly CodePattern: RegExp = /^\d{6}$/;
    private static challenges: Map<string, VerificationChallenge[]> = new Map();

    private static key(purpose: VerificationPurpose, userId: string): string {
        return `${purpose}:${userId}`;
    }
    public static build(): string {
        return randomInt(100000, 1000000).toString();
    }
    public static clean(): void {
        const now: number = new Date().getTime();

        for (const [key, items] of VerificationCode.challenges.entries()) {
            const alive: VerificationChallenge[] = items.filter(item => now <= item.expires);

            if (alive.length === 0) VerificationCode.challenges.delete(key);
            else if (alive.length !== items.length) VerificationCode.challenges.set(key, alive);
        }
    }
    public static save(purpose: VerificationPurpose, userId: string, code: string): void {
        if (!code) return;

        VerificationCode.clean();

        const key: string = VerificationCode.key(purpose, userId);
        const items: VerificationChallenge[] = VerificationCode.challenges.get(key) ?? [];

        items.push({
            code: code.trim(),
            expires: Date.now() + (VerificationCode.ExpiresMinutes * 60 * 1000),
            attempts: 0
        });
        while (items.length > VerificationCode.MaxActiveCodes) items.shift();

        VerificationCode.challenges.set(key, items);
    }
    public static validate(translator: TranslatorRepository, purpose: VerificationPurpose, userId: string, rawCode: any): void {
        const code: string = ((rawCode === undefined) || (rawCode === null)) ? "" : String(rawCode).trim();
        if (!VerificationCode.CodePattern.test(code))
            throw new Error(translator.translate("users.errors.codeInvalid"));

        VerificationCode.clean();

        const key: string = VerificationCode.key(purpose, userId);
        const items: VerificationChallenge[] | undefined = VerificationCode.challenges.get(key);
        if (!items || items.length === 0)
            throw new Error(translator.translate("users.errors.codeNotFound"));
        if (!items.find(item => item.code === code)) {
            for (const item of items) item.attempts += 1;

            const alive: VerificationChallenge[] = items.filter(item => item.attempts < VerificationCode.MaxAttempts);
            if (alive.length === 0) {
                VerificationCode.challenges.delete(key);
                console.warn(`Verification codes for "${key}" were discarded after ${VerificationCode.MaxAttempts} failed attempts.`);
                throw new Error(translator.translate("users.errors.tooManyAttempts"));
            }
            if (alive.length !== items.length) VerificationCode.challenges.set(key, alive);

            throw new Error(translator.translate("users.errors.codeNotMatch"));
        }

        VerificationCode.challenges.delete(key);
    }
    public static clear(purpose: VerificationPurpose, userId: string): void {
        VerificationCode.challenges.delete(VerificationCode.key(purpose, userId));
    }
    public static count(purpose: VerificationPurpose, userId: string): number {
        VerificationCode.clean();

        return VerificationCode.challenges.get(VerificationCode.key(purpose, userId))?.length ?? 0;
    }
    public static reset(): void {
        VerificationCode.challenges.clear();
    }
}
