import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const UserAuthenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) 
        return res.status(401).send("Unauthorized");

    const token = authHeader.split(" ")[1]!;
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
        req.user = payload;
        next();
    } catch (err: any) {
        if (err instanceof jwt.TokenExpiredError) res.status(401).send(err.message);
        if (err instanceof Error) res.status(400).send(err.message);
    }
};