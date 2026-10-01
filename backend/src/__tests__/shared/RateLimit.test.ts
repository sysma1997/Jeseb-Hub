import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import type { Request, Response } from "express";

type Limiter = (req: Request, res: Response, next: () => void) => void | Promise<void>;

// los limitadores son singletones a nivel de modulo, asi que cada prueba necesita
// instancias limpias o el estado de las pruebas anteriores contaminaria el cubo
const load = (): { EmailChangeRateLimit: Limiter; TwoStepCodeRateLimit: Limiter } => {
    let loaded: any = null;
    jest.isolateModules(() => { loaded = require("../../core/shared/infrastructure/RateLimit"); });

    return { EmailChangeRateLimit: loaded.EmailChangeRateLimit, TwoStepCodeRateLimit: loaded.TwoStepCodeRateLimit };
};

const request = (idUser?: string, ip: string = "10.0.0.1"): Request =>
    ({ ip, user: idUser ? { id: idUser } : undefined } as unknown as Request);

// el limitador escribe cabeceras RateLimit y, si el mock no las soporta, el error
// se enruta a next(error): un next ingenuo contaria eso como peticion permitida
const response = (): { res: Response; status: number | undefined } => {
    const state: { res: Response; status: number | undefined } = { res: undefined!, status: undefined };
    state.res = {
        status(code: number) { state.status = code; return this; },
        send() { state.status = state.status ?? 200; return this; },
        setHeader() { return this; },
        getHeader() { return undefined; },
        removeHeader() { return this; },
        headersSent: false,
        writableEnded: false
    } as unknown as Response;

    return state;
};

// ejecuta el limitador y devuelve true si la peticion paso, false si fue rechazada.
// el middleware de express-rate-limit v8 es async, asi que hay que esperarlo: cuando
// permite llama next() y cuando rechaza responde 429, nunca las dos cosas
const call = async (limiter: Limiter, idUser?: string, ip?: string): Promise<boolean> => {
    const { res, status } = response();
    let allowed = false;
    await limiter(request(idUser, ip), res, ((err?: any) => { if (!err) allowed = true; }) as any);

    return status !== 429 && allowed;
};

const allowedTimes = async (limiter: Limiter, times: number, idUser?: string, ip?: string): Promise<boolean> => {
    for (let i = 0; i < times; i++)
        if (!await call(limiter, idUser, ip)) return false;

    return true;
};

describe("Rate limit", () => {
    beforeEach(() => { jest.resetModules(); });

    describe("EmailChangeRateLimit", () => {
        it("Should let the three steps of a legitimate email change through.", async () => {
            const { EmailChangeRateLimit } = load();

            expect(await allowedTimes(EmailChangeRateLimit, 3, "u1")).toBe(true);
        });
        it("Should reject the seventh request of the same user.", async () => {
            const { EmailChangeRateLimit } = load();

            expect(await allowedTimes(EmailChangeRateLimit, 6, "u1")).toBe(true);
            expect(await call(EmailChangeRateLimit, "u1")).toBe(false);
        });
        it("Should count the three email change routes on one shared bucket.", async () => {
            const { EmailChangeRateLimit } = load();

            // el mismo middleware para iniciar, confirmar y reenviar: si cada ruta
            // tuviera su cubo, reenviar seria la via trivial para eludir el limite
            expect(await allowedTimes(EmailChangeRateLimit, 6, "u1")).toBe(true);
            expect(await call(EmailChangeRateLimit, "u1")).toBe(false);
        });
        it("Should not let one user exhaust another user bucket from the same IP.", async () => {
            const { EmailChangeRateLimit } = load();

            expect(await allowedTimes(EmailChangeRateLimit, 7, "u1", "10.0.0.1")).toBe(false);
            expect(await call(EmailChangeRateLimit, "u2", "10.0.0.1")).toBe(true);
        });
        it("Should share one bucket across IPs when the user is the same.", async () => {
            const { EmailChangeRateLimit } = load();

            expect(await call(EmailChangeRateLimit, "u1", "10.0.0.1")).toBe(true);
            expect(await allowedTimes(EmailChangeRateLimit, 5, "u1", "10.0.0.2")).toBe(true);
            expect(await call(EmailChangeRateLimit, "u1", "10.0.0.3")).toBe(false);
        });
        it("Should fall back to the IP bucket when there is no user.", async () => {
            const { EmailChangeRateLimit } = load();

            expect(await allowedTimes(EmailChangeRateLimit, 7, undefined, "10.0.0.7")).toBe(false);
        });
        it("Should group IPv6 addresses of the same subnet on the fallback key.", async () => {
            const { EmailChangeRateLimit } = load();

            expect(await allowedTimes(EmailChangeRateLimit, 6, undefined, "2001:db8:85a3::8a2e:370:7334")).toBe(true);
            // misma subnet, distinto host: debe seguir bloqueado, no reiniciar el cubo
            expect(await call(EmailChangeRateLimit, undefined, "2001:db8:85a3::1")).toBe(false);
        });
    });

    describe("TwoStepCodeRateLimit", () => {
        it("Should reject the eleventh code request of the same user.", async () => {
            const { TwoStepCodeRateLimit } = load();

            expect(await allowedTimes(TwoStepCodeRateLimit, 10, "u1")).toBe(true);
            expect(await call(TwoStepCodeRateLimit, "u1")).toBe(false);
        });
        it("Should keep separate buckets per user.", async () => {
            const { TwoStepCodeRateLimit } = load();

            expect(await allowedTimes(TwoStepCodeRateLimit, 11, "u1")).toBe(false);
            expect(await call(TwoStepCodeRateLimit, "u2")).toBe(true);
        });
    });
});
