import { describe, it, expect, beforeEach } from "@jest/globals";
import { createHash } from "crypto";

import { SessionService, SessionRecord, SessionRow, SessionStore, Redeemed, SessionSweeper } from "../../core/user/domain/SessionService";

class InMemoryStore implements SessionStore {
    public readonly rows: Map<string, SessionRow> = new Map();
    async create(id: string, idUser: string, family: string, secretHash: string, expiresAt: Date, ip?: string, userAgent?: string): Promise<void> {
        this.rows.set(id, {
            id: id,
            idUser: idUser,
            family: family,
            secretHash: secretHash,
            createdAt: new Date(),
            lastSeenAt: new Date(),
            expiresAt: expiresAt,
            revokedAt: undefined,
            rotatedAt: undefined,
            ip: ip,
            userAgent: userAgent
        });
    }
    async get(id: string): Promise<SessionRow | undefined> {
        return this.rows.get(id);
    }
    async touch(id: string, lastSeenAt: Date): Promise<void> {
        const row = this.rows.get(id);
        if (row) row.lastSeenAt = lastSeenAt;
    }
    async revoke(id: string, revokedAt: Date): Promise<void> {
        const row = this.rows.get(id);
        if (row) row.revokedAt = revokedAt;
    }
    async markRotated(id: string, rotatedAt: Date): Promise<void> {
        const row = this.rows.get(id);
        if (row) row.rotatedAt = rotatedAt;
    }
    async revokeFamily(family: string, revokedAt: Date): Promise<number> {
        let count = 0;
        for (const row of this.rows.values())
            if (row.family === family && !row.revokedAt) { row.revokedAt = revokedAt; count++; }

        return count;
    }
    async revokeAllForUser(idUser: string, revokedAt: Date): Promise<number> {
        let count = 0;
        for (const row of this.rows.values())
            if (row.idUser === idUser && !row.revokedAt) { row.revokedAt = revokedAt; count++; }

        return count;
    }
    async deleteOlderThan(cutoff: Date): Promise<number> {
        // replica exacta del where de PrismaSessionStore: un null nunca casa con lte
        let count = 0;
        for (const [id, row] of this.rows) {
            const old: boolean = ((row.revokedAt !== undefined) && (row.revokedAt <= cutoff))
                || ((row.rotatedAt !== undefined) && (row.rotatedAt <= cutoff))
                || (row.expiresAt <= cutoff);
            if (old) { this.rows.delete(id); count++; }
        }
        return count;
    }
}

const userId = "4d511d6e-ea14-4b9b-a40b-b63231e6bb91";
const otherUserId = "9a2b7c31-1f4e-4a55-8d21-7c3e5b0a9d44";
const hash = (secret: string): string => createHash("sha256").update(secret).digest("hex");

const rotated = (result: Redeemed): Extract<Redeemed, { status: "rotated" }> => {
    expect(result.status).toBe("rotated");
    if (result.status !== "rotated") throw new Error(`Expected a rotation, got ${result.status}.`);

    return result;
};
const familyOf = (result: Redeemed): string => {
    if (result.status !== "rotated" && result.status !== "reused") throw new Error(`Expected a session, got ${result.status}.`);

    return result.session.family;
};

let store: InMemoryStore;
let sessions: SessionService;

describe("SessionService domain", () => {
    beforeEach(() => {
        store = new InMemoryStore();
        sessions = new SessionService(store);
    });

    it("Should open a session storing only the hash of the secret.", async () => {
        const opened = await sessions.open(userId);

        const parts = SessionService.split(opened.token)!;
        expect(parts.id).toBe(opened.id);
        expect(store.rows.get(opened.id)!.secretHash).toBe(hash(parts.secret));
        expect(opened.token).toBe(`${opened.id}.${parts.secret}`);
        expect(JSON.stringify(store.rows.get(opened.id))).not.toContain(parts.secret);
    });
    it("Should give each login a different family.", async () => {
        const first = await sessions.open(userId);
        const second = await sessions.open(userId);

        const familyFirst = store.rows.get(first.id)!.family;
        const familySecond = store.rows.get(second.id)!.family;
        expect(familyFirst).not.toBe(familySecond);
    });
    it("Should set a sliding refresh expiry of thirty days.", async () => {
        const opened = await sessions.open(userId);
        const expiresAt = store.rows.get(opened.id)!.expiresAt.getTime();
        const days = (expiresAt - Date.now()) / (24 * 60 * 60 * 1000);

        expect(days).toBeGreaterThan(29.9);
        expect(days).toBeLessThan(30.1);
    });
    it("Should reject a malformed refresh token.", () => {
        expect(SessionService.split("")).toBeUndefined();
        expect(SessionService.split("no-separator")).toBeUndefined();
        expect(SessionService.split("a.b.c")).toBeUndefined();
        expect(SessionService.split("not-a-uuid.secret")).toBeUndefined();
        expect(SessionService.split(`${"0".repeat(36)}.`)).toBeUndefined();
    });
    it("Should not accept a session opened for another secret.", async () => {
        const opened = await sessions.open(userId);
        const forged = SessionService.encode(opened.id, SessionService.newSecret());

        expect((await sessions.redeem(forged)).status).toBe("invalid");
    });
    it("Should rotate a refresh token into a new one of the same family.", async () => {
        const opened = await sessions.open(userId);

        const result = rotated(await sessions.redeem(opened.token));

        const next = store.rows.get(result.id)!;
        expect(next.id).not.toBe(opened.id);
        expect(next.family).toBe(store.rows.get(opened.id)!.family);
        expect(next.idUser).toBe(userId);
        expect(store.rows.get(opened.id)!.rotatedAt).toBeInstanceOf(Date);
    });
    it("Should extend the expiry on every rotation so active sessions never expire.", async () => {
        const opened = await sessions.open(userId);

        let token = opened.token;
        for (let i = 0; i < 5; i++) {
            const result = rotated(await sessions.redeem(token));

            token = result.token;
            const expiresAt = store.rows.get(result.id)!.expiresAt.getTime();
            expect(expiresAt).toBeGreaterThan(Date.now());
        }
    });
    it("Should detect reuse of an already rotated refresh token.", async () => {
        const opened = await sessions.open(userId);
        const first = rotated(await sessions.redeem(opened.token));

        const reused = await sessions.redeem(opened.token);
        expect(reused.status).toBe("reused");
        expect(familyOf(reused)).toBe(store.rows.get(first.id)!.family);
    });
    it("Should keep the rotated child usable after the parent is reused.", async () => {
        const opened = await sessions.open(userId);
        const first = rotated(await sessions.redeem(opened.token));
        await sessions.redeem(opened.token);

        expect((await sessions.redeem(first.token)).status).toBe("rotated");
    });
    it("Should kill the whole family when the controller reports a reuse.", async () => {
        const opened = await sessions.open(userId);
        const first = rotated(await sessions.redeem(opened.token));
        await sessions.redeem(opened.token);

        const killed = await sessions.revokeFamily(store.rows.get(first.id)!.family);
        expect(killed).toBe(2);
        expect((await sessions.redeem(first.token)).status).toBe("revoked");
    });
    it("Should refuse an expired refresh token.", async () => {
        const opened = await sessions.open(userId);
        store.rows.get(opened.id)!.expiresAt = new Date(Date.now() - 1000);

        expect((await sessions.redeem(opened.token)).status).toBe("expired");
    });
    it("Should report a revoked session as not active.", async () => {
        const opened = await sessions.open(userId);
        await sessions.revoke(opened.token);

        expect(await sessions.isActive(opened.id)).toBeUndefined();
    });
    it("Should not revoke a session with a forged secret.", async () => {
        const opened = await sessions.open(userId);
        await sessions.revoke(SessionService.encode(opened.id, SessionService.newSecret()));

        expect(await sessions.isActive(opened.id)).toBeDefined();
    });
    it("Should logout only the current session and leave other devices alone.", async () => {
        const phone = await sessions.open(userId);
        const laptop = await sessions.open(userId);

        await sessions.revoke(phone.token);

        expect(await sessions.isActive(phone.id)).toBeUndefined();
        expect(await sessions.isActive(laptop.id)).toBeDefined();
    });
    it("Should revoke every session of the user on a password change.", async () => {
        const first = await sessions.open(userId);
        const second = await sessions.open(userId);
        const otherUser = await sessions.open(otherUserId);

        expect(await sessions.revokeAllForUser(userId)).toBe(2);
        expect(await sessions.isActive(first.id)).toBeUndefined();
        expect(await sessions.isActive(second.id)).toBeUndefined();
        expect(await sessions.isActive(otherUser.id)).toBeDefined();
    });
    it("Should keep the user of a session consistent with the access token claim.", async () => {
        const mine = await sessions.open(userId);
        const theirs = await sessions.open(otherUserId);

        const mineSession: SessionRecord | undefined = await sessions.isActive(mine.id);
        expect(mineSession!.idUser).toBe(userId);
        expect((await sessions.isActive(theirs.id))!.idUser).toBe(otherUserId);
    });
    it("Should return undefined for an unknown session id.", async () => {
        expect(await sessions.isActive("00000000-0000-0000-0000-000000000000")).toBeUndefined();
    });
    it("Should throttle lastSeenAt writes.", async () => {
        const now = new Date();
        expect(SessionService.needsTouch(new Date(now.getTime() - 60 * 1000), now)).toBe(false);
        expect(SessionService.needsTouch(new Date(now.getTime() - 10 * 60 * 1000), now)).toBe(true);
    });
    it("Should give access tokens a one hour life.", () => {
        const minutes = (SessionService.accessExpiry().getTime() - Date.now()) / (60 * 1000);

        expect(minutes).toBeGreaterThan(59.9);
        expect(minutes).toBeLessThan(60.1);
    });
    it("Should never store the plain secret in the store.", async () => {
        const opened = await sessions.open(userId);
        const parts = SessionService.split(opened.token)!;

        expect(store.rows.get(opened.id)!.secretHash).not.toBe(parts.secret);
        expect(store.rows.get(opened.id)!.secretHash).toHaveLength(64);
      });

    describe("SessionSweeper", () => {
        const daysAgo = (days: number): Date => new Date(Date.now() - (days * 24 * 60 * 60 * 1000));

        it("Should keep a closed session for the whole retention window.", async () => {
            const opened = await sessions.open(userId);
            await sessions.revoke(opened.token);
            const row = store.rows.get(opened.id)!;
            row.expiresAt = daysAgo(10);

            expect(await new SessionSweeper(store).run()).toBe(0);
            expect(store.rows.get(opened.id)).toBeDefined();
        });
        it("Should delete a closed session once it falls outside the window.", async () => {
            const opened = await sessions.open(userId);
            await sessions.revoke(opened.token);
            store.rows.get(opened.id)!.expiresAt = daysAgo(SessionSweeper.RetentionDays + 1);

            expect(await new SessionSweeper(store).run()).toBe(1);
            expect(store.rows.get(opened.id)).toBeUndefined();
        });
        it("Should delete a rotated session that fell out of the window.", async () => {
            const opened = await sessions.open(userId);
            const result = await sessions.redeem(opened.token);
            if (result.status !== "rotated") throw new Error("expected rotation");

            store.rows.get(result.id)!.expiresAt = daysAgo(SessionSweeper.RetentionDays + 1);
            store.rows.get(opened.id)!.expiresAt = daysAgo(SessionSweeper.RetentionDays + 1);

            expect(await new SessionSweeper(store).run()).toBe(2);
        });
        it("Should delete a session revoked long ago even if it had not expired yet.", async () => {
            const opened = await sessions.open(userId);
            const row = store.rows.get(opened.id)!;
            await sessions.revoke(opened.token);
            row.revokedAt = daysAgo(SessionSweeper.RetentionDays + 1);
            row.expiresAt = new Date(Date.now() + (5 * 24 * 60 * 60 * 1000));

            expect(await new SessionSweeper(store).run()).toBe(1);
        });
        it("Should never delete a session that is still valid.", async () => {
            const opened = await sessions.open(userId);
            const row = store.rows.get(opened.id)!;
            row.expiresAt = new Date(Date.now() + (5 * 24 * 60 * 60 * 1000));

            expect(await new SessionSweeper(store).run()).toBe(0);
            expect(store.rows.get(opened.id)).toBeDefined();
        });
        it("Should delete a long abandoned session that already expired.", async () => {
            const opened = await sessions.open(userId);

            store.rows.get(opened.id)!.expiresAt = daysAgo(SessionSweeper.RetentionDays + 30);

            expect(await new SessionSweeper(store).run()).toBe(1);
            expect(store.rows.get(opened.id)).toBeUndefined();
        });
        it("Should compute a cutoff ninety days back.", () => {
            const days: number = (SessionSweeper.cutoff().getTime() - Date.now()) / (24 * 60 * 60 * 1000);

            expect(SessionSweeper.RetentionDays).toBe(90);
            expect(days).toBeCloseTo(-90, 1);
        });
        it("Should survive a store failure without throwing at startup.", async () => {
            const broken: SessionStore = {
                ...store,
                deleteOlderThan: async () => { throw new Error("database is down"); }
            } as unknown as SessionStore;

            let handle: NodeJS.Timeout | undefined;
            expect(() => { handle = new SessionSweeper(broken, 100000).start(); }).not.toThrow();
            expect(handle).toBeDefined();
            if (handle) clearInterval(handle);
        });
    });
});
