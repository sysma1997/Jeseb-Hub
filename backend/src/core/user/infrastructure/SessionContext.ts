import type { SessionService } from "../domain/SessionService";

export class SessionContext {
    private static service: SessionService | undefined;

    static configure(service: SessionService): void {
        SessionContext.service = service;
    }
    static get(): SessionService {
        if (!SessionContext.service)
            throw new Error("Session service is not configured.");

        return SessionContext.service;
    }
    static reset(): void {
        SessionContext.service = undefined;
    }
}