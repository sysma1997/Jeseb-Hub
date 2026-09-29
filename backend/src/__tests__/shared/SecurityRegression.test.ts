import { describe, it, expect, beforeAll } from "@jest/globals";

import i18next from "../../core/shared/infrastructure/i18next";
import { User } from "../../core/user/domain/User";

const XSS_PAYLOADS = [
    '<img/src=x/onerror=alert(1)>@a.co',
    '"><svg/onload=alert(1)>@a.co',
    "<script>alert(1)</script>@a.co",
    "'><iframe src=javascript:alert(1)>@a.co",
    '"+alert(1)+"@a.co',
    'a@b.c\n<script>@a.co'
];

const VALID_EMAILS = [
    "user@gmail.com",
    "someone@hotmail.com",
    "juan.perez+tag@outlook.es",
    "a_b-c%d@sub.domain.co"
];

describe("Security regression", () => {
    beforeAll(() => {
        i18next.changeLanguage("en");
    });

    it("Should escape interpolated values in translations.", () => {
        const result = i18next.t("users.errors.emailInvalid", { email: '<img src=x onerror=alert(1)>' });

        expect(result).not.toContain("<img");
        expect(result).not.toContain("<script");
        expect(result).toContain("&lt;");
    });

    it("Should not leak raw HTML through the error used by the login flow.", () => {
        for (const payload of XSS_PAYLOADS) {
            const result = i18next.t("users.errors.emailInvalid", { email: payload });

            expect(result).not.toContain("<");
            expect(result).not.toContain(">");
        }
    });

    it("Should reject email addresses carrying markup.", () => {
        for (const payload of XSS_PAYLOADS) {
            expect(User.IsValidEmail(payload)).toBe(false);
        }
    });

    it("Should reject malformed or oversized email addresses.", () => {
        const invalid = [
            "no-at-sign.com",
            "a@b",
            "a b@c.com",
            "a@.com",
            "a@b.c\n<script>@a.co",
            "a".repeat(250) + "@a.co"
        ];

        for (const email of invalid) {
            expect(User.IsValidEmail(email)).toBe(false);
        }
    });

    it("Should keep accepting real email addresses.", () => {
        for (const email of VALID_EMAILS) {
            expect(User.IsValidEmail(email)).toBe(true);
        }
    });
});
