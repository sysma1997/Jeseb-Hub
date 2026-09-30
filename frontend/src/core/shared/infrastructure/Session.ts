export enum StorageKeys {
    AccessToken = "token",
    RefreshToken = "refreshToken"
}
export class Session {
    public static getAccess(): string | undefined {
        return window.localStorage.getItem(StorageKeys.AccessToken) ?? undefined;
    }
    public static getRefresh(): string | undefined {
        return window.localStorage.getItem(StorageKeys.RefreshToken) ?? undefined;
    }
    public static save(access: string, refresh: string): void {
        window.localStorage.setItem(StorageKeys.AccessToken, access);
        window.localStorage.setItem(StorageKeys.RefreshToken, refresh);
    }
    public static clear(): void {
        window.localStorage.removeItem(StorageKeys.AccessToken);
        window.localStorage.removeItem(StorageKeys.RefreshToken);
    }
    public static isStored(): boolean {
        return !!Session.getRefresh();
    }
    private static decode(token: string): Record<string, any> | undefined {
        const parts: string[] = token.split(".");
        if (parts.length !== 3) return undefined;

        try {
            const payload: string = parts[1]!.replace(/-/g, "+").replace(/_/g, "/");
            const json: string = decodeURIComponent(
                atob(payload).split("").map((c: string) =>
                    `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`).join("")
            );

            return JSON.parse(json);
        } catch (err: any) {
            return undefined;
        }
    }
    public static expiresIn(token: string | undefined, marginSeconds: number = Session.MarginSeconds): number {
        if (!token) return -1;

        const payload = Session.decode(token);
        if (!payload?.exp) return -1;

        return (payload.exp as number) - Math.floor(Date.now() / 1000) - marginSeconds;
    }
    public static MarginSeconds: number = 60;
    public static needsRefresh(): boolean {
        return Session.expiresIn(Session.getAccess()) <= 0;
    }
}