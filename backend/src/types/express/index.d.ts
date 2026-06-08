declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                expiresToken: string;
            };
        }
    }
}

export {};