import { describe, it, expect, beforeAll } from "@jest/globals";
import jwt from "jsonwebtoken";

import { UserToken, TokenType } from "../../core/user/infrastructure/UserToken";
import { UserAuthenticate } from "../../core/user/infrastructure/UserAuthenticate";
import type { Request, Response, NextFunction } from "express";

const SECRET = "test_secret_for_token_purposes";
const ID = "4d511d6e-ea14-4b9b-a40b-b63231e6bb91";

describe("UserToken", () => {
    beforeAll(() => {
        process.env.JWT_SECRET = SECRET;
    });

    it("Should embed the token purpose in the payload.", () => {
        const token = UserToken.sign({ id: ID }, TokenType.Session, "1d");
        const payload = UserToken.verify(token);

        expect(payload.typ).toBe(TokenType.Session);
        expect(payload.id).toBe(ID);
    });

    it("Should keep the purposes distinguishable between them.", () => {
        const session = UserToken.verify(UserToken.sign({ id: ID }, TokenType.Session, "1d"));
        const activation = UserToken.verify(UserToken.sign({ id: ID }, TokenType.Activation, "1d"));
        const recovery = UserToken.verify(UserToken.sign({ id: ID }, TokenType.Recovery, "1d"));

        expect(session.typ).not.toBe(activation.typ);
        expect(session.typ).not.toBe(recovery.typ);
        expect(activation.typ).not.toBe(recovery.typ);
    });

    it("Should reject a token signed without a purpose.", () => {
        const legacy = jwt.sign({ id: ID }, SECRET, { expiresIn: "1d" });

        expect(() => UserToken.verify(legacy)).toThrow();
    });

    it("Should reject a token signed with a foreign secret.", () => {
        process.env.JWT_SECRET = "another_secret";
        const foreign = UserToken.sign({ id: ID }, TokenType.Session, "1d");
        process.env.JWT_SECRET = SECRET;

        expect(() => UserToken.verify(foreign)).toThrow();
    });

    it("Should reject an expired token.", () => {
        const token = UserToken.sign({ id: ID }, TokenType.Session, "-1s");

        expect(() => UserToken.verify(token)).toThrow();
    });

    it("Should reject the 'none' algorithm.", () => {
        const unsigned = jwt.sign({ id: ID, typ: TokenType.Session }, "", { algorithm: "none" });

        expect(() => UserToken.verify(unsigned)).toThrow();
    });
});

describe("UserAuthenticate", () => {
    const run = (authorization?: string) => {
        let status: number | undefined = undefined;
        let nextCalled = false;

        const res = {
            status(code: number) { status = code; return this; },
            send() { return this; }
        } as unknown as Response;
        const next = (() => { nextCalled = true; }) as NextFunction;

        UserAuthenticate({ headers: { authorization } } as unknown as Request, res, next);
        return { status, nextCalled };
    };

    beforeAll(() => {
        process.env.JWT_SECRET = SECRET;
    });

    it("Should accept a session token.", () => {
        const token = UserToken.sign({ id: ID }, TokenType.Session, "1d");

        expect(run(`Bearer ${token}`).nextCalled).toBe(true);
    });

    it("Should not accept a password recovery token as a session.", () => {
        const token = UserToken.sign({ id: ID }, TokenType.Recovery, "1d");
        const result = run(`Bearer ${token}`);

        expect(result.nextCalled).toBe(false);
        expect(result.status).toBe(401);
    });

    it("Should not accept an activation token as a session.", () => {
        const token = UserToken.sign({ id: ID }, TokenType.Activation, "1d");
        const result = run(`Bearer ${token}`);

        expect(result.nextCalled).toBe(false);
        expect(result.status).toBe(401);
    });

    it("Should not accept a token without purpose as a session.", () => {
        const legacy = jwt.sign({ id: ID }, SECRET, { expiresIn: "1d" });
        const result = run(`Bearer ${legacy}`);

        expect(result.nextCalled).toBe(false);
        expect(result.status).toBe(401);
    });

    it("Should reject a missing header.", () => {
        const result = run(undefined);

        expect(result.nextCalled).toBe(false);
        expect(result.status).toBe(401);
    });
});
