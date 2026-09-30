import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { Session, StorageKeys } from "../Session";

const encode = (payload: Record<string, any>): string => {
    const json: string = JSON.stringify(payload);
    const b64: string = btoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    return `header.${b64}.signature`;
};
const future = (seconds: number): string => encode({ exp: Math.floor(Date.now() / 1000) + seconds });

describe("Session", () => {
    beforeEach(() => {
        window.localStorage.clear();
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-03-01T12:00:00Z"));
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it("Should save both tokens.", () => {
        Session.save("access-abc", "refresh-xyz");

        expect(Session.getAccess()).toBe("access-abc");
        expect(Session.getRefresh()).toBe("refresh-xyz");
        expect(window.localStorage.getItem(StorageKeys.AccessToken)).toBe("access-abc");
        expect(window.localStorage.getItem(StorageKeys.RefreshToken)).toBe("refresh-xyz");
    });
    it("Should clear both tokens.", () => {
        Session.save("access-abc", "refresh-xyz");
        Session.clear();

        expect(Session.getAccess()).toBeUndefined();
        expect(Session.getRefresh()).toBeUndefined();
        expect(Session.isStored()).toBe(false);
    });
    it("Should report a stored session only when there is a refresh token.", () => {
        expect(Session.isStored()).toBe(false);

        window.localStorage.setItem(StorageKeys.AccessToken, "access-abc");
        expect(Session.isStored()).toBe(false);

        window.localStorage.setItem(StorageKeys.RefreshToken, "refresh-xyz");
        expect(Session.isStored()).toBe(true);
    });
    it("Should read the expiry from the access token.", () => {
        expect(Session.expiresIn(future(3600))).toBeCloseTo(3540, 0);
    });
    it("Should not refresh an access token that still has time left.", () => {
        Session.save(future(3600), "refresh-xyz");

        expect(Session.needsRefresh()).toBe(false);
    });
    it("Should refresh an access token that already expired.", () => {
        Session.save(future(-10), "refresh-xyz");

        expect(Session.needsRefresh()).toBe(true);
    });
    it("Should refresh inside the one minute safety margin.", () => {
        Session.save(future(30), "refresh-xyz");

        expect(Session.needsRefresh()).toBe(true);
    });
    it("Should refresh when there is no access token at all.", () => {
        Session.save("", "refresh-xyz");

        expect(Session.needsRefresh()).toBe(true);
    });
    it("Should treat a malformed token as expired instead of throwing.", () => {
        expect(Session.expiresIn("not-a-jwt")).toBe(-1);
        expect(Session.expiresIn(undefined)).toBe(-1);
        expect(Session.needsRefresh()).toBe(true);
    });
    it("Should treat a token without exp as expired.", () => {
        expect(Session.expiresIn(encode({ sub: "someone" }))).toBe(-1);
    });
});