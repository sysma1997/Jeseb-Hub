import { describe, it, expect, beforeEach, jest } from "@jest/globals";

import { VerificationCode } from "../../core/user/domain/VerificationCode";
import { mockTranslator } from "../shared/TranslatorMock";

const userId = "4d511d6e-ea14-4b9b-a40b-b63231e6bb91";
const otherUserId = "9a2b7c31-1f4e-4a55-8d21-7c3e5b0a9d44";
const codeNotFound = "Verification code not found or not exists.";
const codeNotMatch = "The code entered does not match the verification code.";
const codeInvalid = "The code does not have 6 digits.";
const tooManyAttempts = "Too many failed attempts, please request a new verification code.";

describe("VerificationCode domain", () => {
    beforeEach(() => VerificationCode.reset());

    it("Should build a six digit code.", () => {
        for (let i = 0; i < 50; i++) 
            expect(VerificationCode.build()).toMatch(/^\d{6}$/);
    });
    it("Should validate a code that was just saved.", () => {
        const code = VerificationCode.build();
        VerificationCode.save("login", userId, code);

        expect(() => VerificationCode.validate(mockTranslator, "login", userId, code)).not.toThrow();
    });
    it("Should keep the previous code valid when a new one is saved.", () => {
        const first = VerificationCode.build();
        const second = VerificationCode.build();
        VerificationCode.save("login", userId, first);
        VerificationCode.save("login", userId, second);

        expect(VerificationCode.count("login", userId)).toBe(2);
        expect(() => VerificationCode.validate(mockTranslator, "login", userId, first)).not.toThrow();
    });
    it("Should consume every pending code once one is validated.", () => {
        const first = VerificationCode.build();
        const second = VerificationCode.build();
        VerificationCode.save("login", userId, first);
        VerificationCode.save("login", userId, second);
        VerificationCode.validate(mockTranslator, "login", userId, first);

        expect(VerificationCode.count("login", userId)).toBe(0);
        expect(() => VerificationCode.validate(mockTranslator, "login", userId, second)).toThrow(codeNotFound);
    });
    it("Should keep at most the three most recent codes.", () => {
        const codes: string[] = [];
        for (let i = 0; i < 4; i++) {
            const code = VerificationCode.build();
            codes.push(code);
            VerificationCode.save("login", userId, code);
        }

        expect(VerificationCode.count("login", userId)).toBe(VerificationCode.MaxActiveCodes);
        expect(() => VerificationCode.validate(mockTranslator, "login", userId, codes[0])).toThrow(codeNotMatch);
        expect(() => VerificationCode.validate(mockTranslator, "login", userId, codes[3])).not.toThrow();
    });
    it("Should not validate a code saved for another purpose.", () => {
        const code = VerificationCode.build();
        VerificationCode.save("login", userId, code);

        expect(() => VerificationCode.validate(mockTranslator, "emailNew", userId, code)).toThrow(codeNotFound);
        expect(VerificationCode.count("login", userId)).toBe(1);
    });
    it("Should not validate a code saved for another user.", () => {
        const code = VerificationCode.build();
        VerificationCode.save("login", userId, code);

        expect(() => VerificationCode.validate(mockTranslator, "login", otherUserId, code)).toThrow(codeNotFound);
    });
    it("Should discard the codes once the expiration time has passed.", () => {
        const now: number = new Date("2026-01-01T00:00:00.000Z").getTime();
        jest.useFakeTimers();
        jest.setSystemTime(now);
        try {
            const code = VerificationCode.build();
            VerificationCode.save("login", userId, code);
            expect(VerificationCode.count("login", userId)).toBe(1);

            jest.setSystemTime(now + ((VerificationCode.ExpiresMinutes * 60 * 1000) + 1));

            expect(VerificationCode.count("login", userId)).toBe(0);
            expect(() => VerificationCode.validate(mockTranslator, "login", userId, code)).toThrow(codeNotFound);
        }
        finally {
            jest.useRealTimers();
        }
    });
    it("Should accept a numeric code and a padded string code.", () => {
        VerificationCode.save("login", userId, "123456");
        expect(() => VerificationCode.validate(mockTranslator, "login", userId, 123456)).not.toThrow();

        VerificationCode.save("login", userId, "000000");
        expect(() => VerificationCode.validate(mockTranslator, "login", userId, " 000000 ")).not.toThrow();
    });
    it("Should reject codes that are not six digits.", () => {
        VerificationCode.save("login", userId, "123456");

        for (const invalid of ["", "   ", "12345", "1234567", "abcdef", "0", 0, null, undefined])
            expect(() => VerificationCode.validate(mockTranslator, "login", userId, invalid)).toThrow(codeInvalid);
    });
    it("Should reject a wrong code without consuming the pending one.", () => {
        const code = VerificationCode.build();
        VerificationCode.save("login", userId, code);

        expect(() => VerificationCode.validate(mockTranslator, "login", userId, "999999")).toThrow(codeNotMatch);
        expect(VerificationCode.count("login", userId)).toBe(1);
        expect(() => VerificationCode.validate(mockTranslator, "login", userId, code)).not.toThrow();
    });
    it("Should discard the codes after too many failed attempts.", () => {
        const code = VerificationCode.build();
        VerificationCode.save("login", userId, code);

        for (let i = 1; i < VerificationCode.MaxAttempts; i++)
            expect(() => VerificationCode.validate(mockTranslator, "login", userId, "999999")).toThrow(codeNotMatch);
        expect(() => VerificationCode.validate(mockTranslator, "login", userId, "999999")).toThrow(tooManyAttempts);

        expect(VerificationCode.count("login", userId)).toBe(0);
        expect(() => VerificationCode.validate(mockTranslator, "login", userId, code)).toThrow(codeNotFound);
    });
    it("Should clear the codes of a purpose without touching the other.", () => {
        VerificationCode.save("login", userId, VerificationCode.build());
        VerificationCode.save("emailNew", userId, VerificationCode.build());
        VerificationCode.clear("login", userId);

        expect(VerificationCode.count("login", userId)).toBe(0);
        expect(VerificationCode.count("emailNew", userId)).toBe(1);
    });
});
