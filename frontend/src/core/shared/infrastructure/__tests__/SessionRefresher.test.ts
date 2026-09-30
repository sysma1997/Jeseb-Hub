import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { SessionRefresher } from "../SessionRefresher";
import { Session } from "../Session";

const ok = (access: string, refresh: string): Response => new Response(
    JSON.stringify({ accessToken: access, refreshToken: refresh }),
    { status: 200, headers: { "Content-Type": "application/json" } }
);
const fail = (status: number = 401): Response => new Response("nope", { status });

describe("SessionRefresher", () => {
    let fetchMock: ReturnType<typeof vi.fn>;
    let replaceMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        replaceMock = vi.fn();
        window.localStorage.clear();
        SessionRefresher.invalidate();
        fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);
        Object.defineProperty(window, "location", {
            value: { ...window.location, replace: replaceMock, pathname: "/es/profile" },
            writable: true,
            configurable: true
        });
    });
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it("Should not call the backend when the access token is still fresh.", async () => {
        const fresh: string = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
        Session.save(`h.${fresh}.s`, "refresh-xyz");

        expect(await SessionRefresher.beforeRequest()).toBe(true);
        expect(fetchMock).not.toHaveBeenCalled();
    });
    it("Should rotate the pair when the access token expired.", async () => {
        const expired: string = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 10 }));
        Session.save(`h.${expired}.s`, "refresh-xyz");
        fetchMock.mockResolvedValue(ok("new-access", "new-refresh"));

        expect(await SessionRefresher.beforeRequest()).toBe(true);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(Session.getAccess()).toBe("new-access");
        expect(Session.getRefresh()).toBe("new-refresh");
    });
    it("Should send the refresh token in the body.", async () => {
        const expired: string = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 10 }));
        Session.save(`h.${expired}.s`, "refresh-xyz");
        fetchMock.mockResolvedValue(ok("new-access", "new-refresh"));

        await SessionRefresher.beforeRequest();

        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toContain("/user/refresh");
        expect(options.method).toBe("POST");
        expect(JSON.parse(options.body).refreshToken).toBe("refresh-xyz");
    });
    it("Should share one in flight refresh between simultaneous requests.", async () => {
        const expired: string = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 10 }));
        Session.save(`h.${expired}.s`, "refresh-xyz");

        let release: (() => void) | undefined;
        fetchMock.mockImplementation(() => new Promise<Response>((resolve) => {
            release = () => resolve(ok("new-access", "new-refresh"));
        }));

        const all = Promise.all([
            SessionRefresher.beforeRequest(),
            SessionRefresher.beforeRequest(),
            SessionRefresher.beforeRequest()
        ]);
        release!();

        expect(await all).toEqual([true, true, true]);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    it("Should clear the tokens and redirect when the backend rejects the refresh.", async () => {
        const expired: string = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 10 }));
        Session.save(`h.${expired}.s`, "refresh-xyz");
        fetchMock.mockResolvedValue(fail());

        expect(await SessionRefresher.beforeRequest()).toBe(false);
        expect(Session.isStored()).toBe(false);
        expect(replaceMock).toHaveBeenCalled();
        expect(replaceMock).toHaveBeenCalledWith("/es/login");
    });
    it("Should let the request through when there is no session at all.", async () => {
        // la pagina de login consulta el usuario al cargar; si esto redirigia, se recargaba en bucle
        expect(await SessionRefresher.beforeRequest()).toBe(true);
        expect(fetchMock).not.toHaveBeenCalled();
        expect(replaceMock).not.toHaveBeenCalled();
    });
    it("Should use a leftover refresh token to restore a lost access token.", async () => {
        // quedo el refresh pero se perdio el access: hay que canjearlo, no rendirse
        window.localStorage.setItem("refreshToken", "refresh-xyz");
        fetchMock.mockResolvedValue(ok("new-access", "new-refresh"));

        expect(await SessionRefresher.beforeRequest()).toBe(true);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(Session.getAccess()).toBe("new-access");
    });
    it("Should not redirect when already sitting on the login page.", async () => {
        window.localStorage.setItem("token", "access-abc");
        window.localStorage.setItem("refreshToken", "refresh-xyz");
        fetchMock.mockResolvedValue(fail());
        Object.defineProperty(window, "location", {
            value: { ...window.location, replace: replaceMock, pathname: "/es/login" },
            writable: true,
            configurable: true
        });

        expect(await SessionRefresher.beforeRequest()).toBe(false);
        expect(replaceMock).not.toHaveBeenCalled();
    });
    it("Should clear the tokens when the response has no tokens.", async () => {
        const expired: string = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 10 }));
        Session.save(`h.${expired}.s`, "refresh-xyz");
        fetchMock.mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));

        expect(await SessionRefresher.beforeRequest()).toBe(false);
        expect(Session.isStored()).toBe(false);
    });
    it("Should treat a network failure as an expired session.", async () => {
        const expired: string = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 10 }));
        Session.save(`h.${expired}.s`, "refresh-xyz");
        fetchMock.mockRejectedValue(new Error("offline"));

        expect(await SessionRefresher.beforeRequest()).toBe(false);
        expect(Session.isStored()).toBe(false);
    });
    it("Should allow a new refresh attempt after the shared one settles.", async () => {
        const expired: string = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 10 }));
        Session.save(`h.${expired}.s`, "refresh-xyz");
        fetchMock.mockResolvedValue(ok("new-access", "new-refresh"));

        await SessionRefresher.refresh();
        await SessionRefresher.refresh();

        expect(fetchMock).toHaveBeenCalledTimes(2);
    });
});