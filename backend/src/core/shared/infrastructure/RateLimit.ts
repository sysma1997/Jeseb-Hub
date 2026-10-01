import rateLimit, { type Options } from "express-rate-limit";
import type express from "express";

import { TranslatorI18nRepository } from "./i18next";

const translator = new TranslatorI18nRepository();

const MESSAGE: string = "users.errors.tooManyRequests";

function build(windowMs: number, limit: number, key?: (req: express.Request) => string | undefined): (req: express.Request, res: express.Response, next: express.NextFunction) => void {
    const options: Partial<Options> = {
        windowMs,
        limit,
        standardHeaders: "draft-7",
        legacyHeaders: false,
        validate: {
            trustProxy: false,
            xForwardedForHeader: false
        },
        message: (_req: express.Request, res: express.Response) => {
            res.status(429).send(translator.translate(MESSAGE));
        }
    };
    // cuando la sesion ya esta autenticada conviene contar por usuario: por IP todos los
    // clientes de un proxy inverso comparten un unico cubo y se bloquean entre si
    if (key) options.keyGenerator = (req: express.Request) => key(req) ?? req.ip ?? "unknown";

    return rateLimit(options as Options);
}

export const AuthRateLimit = build(15 * 60 * 1000, 10);
export const EmailRateLimit = build(60 * 60 * 1000, 5);

// un unico cubo para iniciar, confirmar y reenviar: si cada ruta tuviera el suyo,
// reenviar seria la via trivial para eludir el limite y bombardear un correo ajeno.
// el flujo legitimo consume tres: iniciar, confirmar el correo viejo y cerrar el nuevo.
export const EmailChangeRateLimit = build(60 * 60 * 1000, 6, (req) => req.user?.id);
export const TwoStepCodeRateLimit = build(60 * 60 * 1000, 10, (req) => req.user?.id);
