import { describe, it, expect, beforeAll, beforeEach } from "@jest/globals";

import { EmailChange } from "../../core/user/domain/EmailChange";
import { VerificationCode } from "../../core/user/domain/VerificationCode";
import { mockTranslator } from "./TranslatorMock";

const ID: string = "11111111-1111-1111-1111-111111111111";
const OTHER: string = "22222222-2222-2222-2222-222222222222";
const CURRENT: string = "old@jeseb.com";
const NEW_MAIL: string = "new@jeseb.com";
const OLD_MAIL: string = "abandoned@jeseb.com";

describe("Changing the email must prove ownership of both addresses", () => {
    beforeAll(() => {
        process.env.JWT_SECRET = "test_secret_for_email_change";
    });
    beforeEach(() => {
        EmailChange.reset();
        VerificationCode.reset();
    });

    it("Starts on the current step and stores the new address on the server, not on the client.", () => {
        EmailChange.start({ idUser: ID, currentEmail: CURRENT, newEmail: NEW_MAIL });

        const challenge = EmailChange.get(mockTranslator, ID);

        expect(challenge.step).toBe("current");
        expect(challenge.newEmail).toBe(NEW_MAIL);
        expect(challenge.currentEmail).toBe(CURRENT);
    });

    it("Advances to the new step and then forgets the request when it is cleared.", () => {
        EmailChange.start({ idUser: ID, currentEmail: CURRENT, newEmail: NEW_MAIL });

        const advanced = EmailChange.advance(mockTranslator, ID, "new");
        expect(advanced.step).toBe("new");

        EmailChange.clear(ID);
        expect(() => EmailChange.get(mockTranslator, ID)).toThrow();
    });

    it("A current-address code cannot be used to finish the change.", () => {
        EmailChange.start({ idUser: ID, currentEmail: CURRENT, newEmail: NEW_MAIL });
        VerificationCode.save("emailCurrent", ID, "111111");

        expect(() => VerificationCode.validate(mockTranslator, "emailNew", ID, "111111")).toThrow();
        expect(VerificationCode.count("emailCurrent", ID)).toBe(1);
    });

    it("The two codes live in separate challenges and do not validate each other.", () => {
        VerificationCode.save("emailCurrent", ID, "111111");
        VerificationCode.save("emailNew", ID, "222222");

        expect(() => VerificationCode.validate(mockTranslator, "emailNew", ID, "111111")).toThrow();
        expect(() => VerificationCode.validate(mockTranslator, "emailCurrent", ID, "222222")).toThrow();

        expect(() => VerificationCode.validate(mockTranslator, "emailCurrent", ID, "111111")).not.toThrow();
        expect(() => VerificationCode.validate(mockTranslator, "emailNew", ID, "222222")).not.toThrow();
    });

    it("Each code is single use, so the same one cannot replay both steps.", () => {
        VerificationCode.save("emailCurrent", ID, "333333");
        VerificationCode.save("emailNew", ID, "333333");

        expect(() => VerificationCode.validate(mockTranslator, "emailCurrent", ID, "333333")).not.toThrow();
        expect(() => VerificationCode.validate(mockTranslator, "emailNew", ID, "333333")).not.toThrow();
        expect(() => VerificationCode.validate(mockTranslator, "emailNew", ID, "333333")).toThrow();
    });

    it("One user cannot read or hijack the pending change of another user.", () => {
        EmailChange.start({ idUser: ID, currentEmail: CURRENT, newEmail: NEW_MAIL });

        expect(() => EmailChange.get(mockTranslator, OTHER)).toThrow();
    });

it("A code issued for a previous attempt cannot authorize a newer one.", () => {
        // intento 1: se llega a la etapa "new" y queda un codigo vivo para OLD_MAIL
        EmailChange.start({ idUser: ID, currentEmail: CURRENT, newEmail: OLD_MAIL });
        EmailChange.advance(mockTranslator, ID, "new");
        VerificationCode.save("emailNew", ID, "999999");

        // el usuario abandona el intento 1 y arranca el intento 2 hacia NEW_MAIL
        VerificationCode.clear("emailCurrent", ID);
        VerificationCode.clear("emailNew", ID);
        EmailChange.start({ idUser: ID, currentEmail: CURRENT, newEmail: NEW_MAIL });
        VerificationCode.save("emailCurrent", ID, "121212");

        // el codigo del intento 1 ya no sirve, ni tras validar la etapa actual
        expect(() => VerificationCode.validate(mockTranslator, "emailNew", ID, "999999")).toThrow();
        expect(() => VerificationCode.validate(mockTranslator, "emailCurrent", ID, "121212")).not.toThrow();
        VerificationCode.clear("emailNew", ID);
        expect(() => VerificationCode.validate(mockTranslator, "emailNew", ID, "999999")).toThrow();
    });

    it("Starting a new request replaces any older pending one.", () => {
        EmailChange.start({ idUser: ID, currentEmail: CURRENT, newEmail: NEW_MAIL });
        EmailChange.start({ idUser: ID, currentEmail: CURRENT, newEmail: "other@jeseb.com" });

        expect(EmailChange.get(mockTranslator, ID).newEmail).toBe("other@jeseb.com");
        expect(EmailChange.count()).toBe(1);
    });
});

describe("Disabling two-step verification must require a code", () => {
    beforeEach(() => {
        VerificationCode.reset();
    });

    it("Keeps the two-step code separate from the login and email codes.", () => {
        VerificationCode.save("login", ID, "444444");
        VerificationCode.save("twoStep", ID, "555555");

        expect(() => VerificationCode.validate(mockTranslator, "twoStep", ID, "444444")).toThrow();
        expect(() => VerificationCode.validate(mockTranslator, "login", ID, "555555")).toThrow();

        expect(() => VerificationCode.validate(mockTranslator, "twoStep", ID, "555555")).not.toThrow();
    });

    it("Consumes the two-step code so it cannot disable twice with the same value.", () => {
        VerificationCode.save("twoStep", ID, "666666");

        expect(() => VerificationCode.validate(mockTranslator, "twoStep", ID, "666666")).not.toThrow();
        expect(() => VerificationCode.validate(mockTranslator, "twoStep", ID, "666666")).toThrow();
    });

    it("Another account's two-step code is not accepted.", () => {
        VerificationCode.save("twoStep", ID, "777777");

        expect(() => VerificationCode.validate(mockTranslator, "twoStep", OTHER, "777777")).toThrow();
        expect(() => VerificationCode.validate(mockTranslator, "twoStep", ID, "777777")).not.toThrow();
    });
});