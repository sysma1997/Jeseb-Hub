import { describe, it, expect, beforeAll, beforeEach } from "@jest/globals";
import jwt from "jsonwebtoken";

import { UserToken, TokenType } from "../../core/user/infrastructure/UserToken";
import { UserAuthenticate } from "../../core/user/infrastructure/UserAuthenticate";
import { SessionContext } from "../../core/user/infrastructure/SessionContext";
import { SessionService, SessionRecord, SessionRow, SessionStore } from "../../core/user/domain/SessionService";
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

class AuthStore implements SessionStore {
    public active: Map<string, SessionRow> = new Map();
    async create(id: string, idUser: string, family: string, secretHash: string, expiresAt: Date, ip?: string, userAgent?: string): Promise<void> {
        this.active.set(id, {
            id, idUser, family, secretHash, expiresAt,
            createdAt: new Date(), lastSeenAt: new Date(),
            revokedAt: undefined, rotatedAt: undefined, ip, userAgent
        });
    }
    async get(id: string): Promise<SessionRow | undefined> { return this.active.get(id); }
    async touch(): Promise<void> { }
    async revoke(id: string, revokedAt: Date): Promise<void> {
        const row = this.active.get(id);
        if (row) row.revokedAt = revokedAt;
    }
    async markRotated(id: string, rotatedAt: Date): Promise<void> {
        const row = this.active.get(id);
        if (row) row.rotatedAt = rotatedAt;
    }
    async revokeFamily(family: string, revokedAt: Date): Promise<number> {
        let count = 0;
        for (const row of this.active.values())
            if (row.family === family && !row.revokedAt) { row.revokedAt = revokedAt; count++; }
        return count;
    }
    async revokeAllForUser(idUser: string, revokedAt: Date): Promise<number> {
        let count = 0;
        for (const row of this.active.values())
            if (row.idUser === idUser && !row.revokedAt) { row.revokedAt = revokedAt; count++; }
        return count;
    }
}

describe("UserAuthenticate", () => {
    const SID = "3f1c9d20-8e5a-4a1e-9b77-2c4d6e8f0a13";
    let store: AuthStore;

    const run = async (authorization?: string) => {
        let status: number | undefined = undefined;
        let nextCalled = false;

        const res = {
            status(code: number) { status = code; return this; },
            send() { return this; }
        } as unknown as Response;
        const next = (() => { nextCalled = true; }) as NextFunction;

        await UserAuthenticate({ headers: { authorization } } as unknown as Request, res, next);
        return { status, nextCalled };
    };
    const sessionToken = (id: string = ID, sid: string = SID) =>
        UserToken.sign({ id, sid }, TokenType.Session, "1d");

    beforeEach(() => {
        store = new AuthStore();
        SessionContext.configure(new SessionService(store));
    });

    it("Should accept a session token bound to an active session.", async () => {
        await store.create(SID, ID, "family-1", "hash", new Date(Date.now() + 60_000));

        expect((await run(`Bearer ${sessionToken()}`)).nextCalled).toBe(true);
    });
    it("Should not accept a session token whose session was revoked.", async () => {
        await store.create(SID, ID, "family-1", "hash", new Date(Date.now() - 60_000));

        expect((await run(`Bearer ${sessionToken()}`)).nextCalled).toBe(false);
    });
    it("Should not accept a session token whose session does not exist.", async () => {
        const result = await run(`Bearer ${sessionToken()}`);

        expect(result.nextCalled).toBe(false);
        expect(result.status).toBe(401);
    });
    it("Should not accept a session token signed for another user.", async () => {
        await store.create(SID, ID, "family-1", "hash", new Date(Date.now() + 60_000));

        const result = await run(`Bearer ${sessionToken("9a2b7c31-1f4e-4a55-8d21-7c3e5b0a9d44")}`);
        expect(result.nextCalled).toBe(false);
        expect(result.status).toBe(401);
    });
    it("Should not accept a legacy session token without a session id.", async () => {
        const legacy = UserToken.sign({ id: ID }, TokenType.Session, "1d");
        const result = await run(`Bearer ${legacy}`);

        expect(result.nextCalled).toBe(false);
        expect(result.status).toBe(401);
    });
    it("Should not accept a password recovery token as a session.", async () => {
        const token = UserToken.sign({ id: ID, sid: SID }, TokenType.Recovery, "1d");
        const result = await run(`Bearer ${token}`);

        expect(result.nextCalled).toBe(false);
        expect(result.status).toBe(401);
    });
    it("Should not accept an activation token as a session.", async () => {
        const token = UserToken.sign({ id: ID, sid: SID }, TokenType.Activation, "1d");
        const result = await run(`Bearer ${token}`);

        expect(result.nextCalled).toBe(false);
        expect(result.status).toBe(401);
    });
    it("Should not accept a token without purpose as a session.", async () => {
        const legacy = jwt.sign({ id: ID, sid: SID }, SECRET, { expiresIn: "1d" });
        const result = await run(`Bearer ${legacy}`);

        expect(result.nextCalled).toBe(false);
        expect(result.status).toBe(401);
    });
    it("Should reject a missing header.", async () => {
        const result = await run(undefined);

        expect(result.nextCalled).toBe(false);
        expect(result.status).toBe(401);
    });
    it("Should reject a non bearer header.", async () => {
        const result = await run("Basic abc123");

        expect(result.nextCalled).toBe(false);
        expect(result.status).toBe(401);
    });
});
