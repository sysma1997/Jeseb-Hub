import jwt from "jsonwebtoken";

export enum TokenType {
    Session = "session",
    Activation = "activation",
    Recovery = "recovery"
}

const ALGORITHM: jwt.Algorithm = "HS256";

export interface TokenPayload {
    id: string;
    typ: TokenType;
    [key: string]: any;
}

export class UserToken {
    static sign(payload: Record<string, any>, type: TokenType, expiresIn: jwt.SignOptions["expiresIn"]): string {
        return jwt.sign({ ...payload, typ: type }, process.env.JWT_SECRET!, {
            expiresIn,
            algorithm: ALGORITHM
        });
    }

    static verify(token: string): TokenPayload {
        const payload = jwt.verify(token, process.env.JWT_SECRET!, {
            algorithms: [ALGORITHM]
        }) as any;

        if (!payload?.typ) throw new Error("Invalid token.");
        return payload as TokenPayload;
    }
}
