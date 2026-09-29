import { Request, Response, NextFunction } from "express";

import { UserToken, TokenType } from "./UserToken";

export const UserAuthenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) 
        return res.status(401).send("Unauthorized");

    const token = authHeader.split(" ")[1]!;
    try {
        const payload = UserToken.verify(token);
        if (payload.typ !== TokenType.Session) 
            return res.status(401).send("Unauthorized");

        req.user = payload;
        next();
    } catch (err: any) {
        if (err instanceof Error) res.status(401).send("Unauthorized");
    }
};
