import type { TokenPayload } from "../../core/user/infrastructure/UserToken";

declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

export {};
