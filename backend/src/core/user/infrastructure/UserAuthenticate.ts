import { Request, Response, NextFunction } from "express";

import { UserToken, TokenType } from "./UserToken";
import { SessionContext } from "./SessionContext";
import { SessionService } from "../domain/SessionService";

const UNAUTHORIZED = "Unauthorized";

export const UserAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) 
        return res.status(401).send(UNAUTHORIZED);

    const token = authHeader.split(" ")[1]!;
    try {
        const payload = UserToken.verify(token);
        if (payload.typ !== TokenType.Session || !payload.sid)
            return res.status(401).send(UNAUTHORIZED);

        const session = await SessionContext.get().isActive(payload.sid);
        if (!session || session.idUser !== payload.id)
            return res.status(401).send(UNAUTHORIZED);

        if (SessionService.needsTouch(session.lastSeenAt)) {
            SessionContext.get().touch(session.id).catch(() => {
                console.warn(`Could not update lastSeenAt for session ${session.id}.`);
            });
        }

        req.user = payload;
        next();
    } catch (err: any) {
        if (err instanceof Error) res.status(401).send(UNAUTHORIZED);
    }
};