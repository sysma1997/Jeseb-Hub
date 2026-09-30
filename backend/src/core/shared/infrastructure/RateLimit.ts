import rateLimit, { type Options } from "express-rate-limit";
import type express from "express";

import { TranslatorI18nRepository } from "./i18next";

const translator = new TranslatorI18nRepository();

const MESSAGE: string = "users.errors.tooManyRequests";

function build(windowMs: number, limit: number): (req: express.Request, res: express.Response, next: express.NextFunction) => void {
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
    return rateLimit(options as Options);
}

export const AuthRateLimit = build(15 * 60 * 1000, 10);
export const EmailRateLimit = build(60 * 60 * 1000, 5);
