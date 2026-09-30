import { createHash, randomBytes, randomUUID, timingSafeEqual } from "crypto";

export interface SessionRecord {
    id: string;
    idUser: string;
    family: string;
    createdAt: Date;
    lastSeenAt: Date;
    expiresAt: Date;
    revokedAt: Date | undefined;
    rotatedAt: Date | undefined;
    ip: string | undefined;
    userAgent: string | undefined;
}

export interface SessionRow extends SessionRecord {
    secretHash: string;
}

export interface SessionStore {
    create(id: string, idUser: string, family: string, secretHash: string, expiresAt: Date, ip?: string, userAgent?: string): Promise<void>;
    get(id: string): Promise<SessionRow | undefined>;
    touch(id: string, lastSeenAt: Date): Promise<void>;
    revoke(id: string, revokedAt: Date): Promise<void>;
    markRotated(id: string, rotatedAt: Date): Promise<void>;
    revokeFamily(family: string, revokedAt: Date): Promise<number>;
    revokeAllForUser(idUser: string, revokedAt: Date): Promise<number>;
}

export type Redeemed =
    | { status: "rotated", session: SessionRecord, id: string, token: string }
    | { status: "expired" }
    | { status: "revoked" }
    | { status: "reused", session: SessionRecord }
    | { status: "invalid" };

export class SessionService {
    public static readonly AccessMinutes: number = 60;
    public static readonly RefreshDays: number = 30;
    public static readonly SecretBytes: number = 32;
    public static readonly SeenThrottleMinutes: number = 5;

    private static readonly Separator: string = ".";
    private static readonly UuidPattern: RegExp = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

    constructor(private readonly store: SessionStore) {}

    private static hash(secret: string): string {
        return createHash("sha256").update(secret).digest("hex");
    }
    private static matches(secretHash: string, secret: string): boolean {
        const expected: Buffer = Buffer.from(secretHash, "hex");
        const given: Buffer = Buffer.from(SessionService.hash(secret), "hex");

        return (expected.length === given.length) && timingSafeEqual(expected, given);
    }
    private static find(session: SessionRow | undefined, secret: string): SessionRow | undefined {
        if (!session) return undefined;

        return SessionService.matches(session.secretHash, secret) ? session : undefined;
    }
    public static newSecret(): string {
        return randomBytes(SessionService.SecretBytes).toString("base64url");
    }
    public static encode(id: string, secret: string): string {
        return `${id}${SessionService.Separator}${secret}`;
    }
    public static split(token: string): { id: string, secret: string } | undefined {
        if (!token) return undefined;

        const parts: string[] = token.split(SessionService.Separator);
        if (parts.length !== 2) return undefined;

        const id: string = parts[0]!;
        const secret: string = parts[1]!;
        if (!SessionService.UuidPattern.test(id)) return undefined;
        if (!secret) return undefined;

        return { id: id, secret: secret };
    }
    public static accessExpiry(from: Date = new Date()): Date {
        return new Date(from.getTime() + (SessionService.AccessMinutes * 60 * 1000));
    }
    public static refreshExpiry(from: Date = new Date()): Date {
        return new Date(from.getTime() + (SessionService.RefreshDays * 24 * 60 * 60 * 1000));
    }
    public static needsTouch(lastSeenAt: Date, now: Date = new Date()): boolean {
        return (now.getTime() - lastSeenAt.getTime()) > (SessionService.SeenThrottleMinutes * 60 * 1000);
    }

    public async open(idUser: string, ip?: string, userAgent?: string): Promise<{ id: string, token: string }> {
        const family: string = randomUUID();
        return this.issue(idUser, family, ip, userAgent);
    }
    private async issue(idUser: string, family: string, ip?: string, userAgent?: string): Promise<{ id: string, token: string }> {
        const id: string = randomUUID();
        const secret: string = SessionService.newSecret();

        await this.store.create(id, idUser, family, SessionService.hash(secret), SessionService.refreshExpiry(), ip, userAgent);

        return { id: id, token: SessionService.encode(id, secret) };
    }

    public async isActive(id: string): Promise<SessionRecord | undefined> {
        const session: SessionRow | undefined = await this.store.get(id);
        if (!session) return undefined;
        if (session.expiresAt.getTime() <= Date.now()) return undefined;
        if (session.revokedAt) return undefined;

        return session;
    }

    public async redeem(token: string, ip?: string, userAgent?: string): Promise<Redeemed> {
        const parts = SessionService.split(token);
        if (!parts) return { status: "invalid" };

        const session = SessionService.find(await this.store.get(parts.id), parts.secret);
        if (!session) return { status: "invalid" };

        if (session.expiresAt.getTime() <= Date.now())
            return { status: "expired" };

        if (session.rotatedAt)
            return { status: "reused", session: session };

        if (session.revokedAt)
            return { status: "revoked" };

        const next = await this.issue(session.idUser, session.family, ip ?? session.ip, userAgent ?? session.userAgent);
        await this.store.markRotated(session.id, new Date());

        return { status: "rotated", session: session, id: next.id, token: next.token };
    }

    public async revoke(token: string): Promise<void> {
        const parts = SessionService.split(token);
        if (!parts) return;

        const session = SessionService.find(await this.store.get(parts.id), parts.secret);
        if (!session) return;

        await this.store.revoke(session.id, new Date());
    }
    public async revokeFamily(family: string): Promise<number> {
        return this.store.revokeFamily(family, new Date());
    }
    public async revokeAllForUser(idUser: string): Promise<number> {
        return this.store.revokeAllForUser(idUser, new Date());
    }
    public async touch(id: string): Promise<void> {
        await this.store.touch(id, new Date());
    }
}