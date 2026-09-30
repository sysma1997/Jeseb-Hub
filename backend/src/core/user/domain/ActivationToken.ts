import { TranslatorRepository } from "../../shared/domain/TranslatorRepository";

export interface PendingUser {
    id: string;
    name: string;
    email: string;
    password: string;
}

interface PendingEntry extends PendingUser {
    expires: number;
}

export class ActivationToken {
    public static readonly ExpiresHours: number = 24;
    public static readonly MaxPending: number = 3;

    private static readonly MessageInvalid: string = "users.errors.invalidToken";
    private static pending: Map<string, PendingEntry> = new Map();

    private static clean(): void {
        const now: number = Date.now();

        for (const [key, entry] of ActivationToken.pending.entries())
            if (now > entry.expires) ActivationToken.pending.delete(key);
    }
    public static save(token: string, user: PendingUser): void {
        if (!token || !user?.id) return;

        ActivationToken.clean();

        ActivationToken.pending.set(token, {
            id: user.id,
            name: user.name,
            email: user.email,
            password: user.password,
            expires: Date.now() + (ActivationToken.ExpiresHours * 60 * 60 * 1000)
        });

        while (ActivationToken.pending.size > ActivationToken.MaxPending) {
            const oldest: string | undefined = ActivationToken.pending.keys().next().value;
            if (oldest === undefined) break;

            ActivationToken.pending.delete(oldest);
        }
    }
    public static consume(translator: TranslatorRepository, token: string): PendingUser {
        if (!token) throw new Error(translator.translate(ActivationToken.MessageInvalid));

        ActivationToken.clean();

        const entry: PendingEntry | undefined = ActivationToken.pending.get(token);
        if (!entry) throw new Error(translator.translate(ActivationToken.MessageInvalid));

        ActivationToken.pending.delete(token);

        return { id: entry.id, name: entry.name, email: entry.email, password: entry.password };
    }
    public static count(): number {
        ActivationToken.clean();

        return ActivationToken.pending.size;
    }
    public static reset(): void {
        ActivationToken.pending.clear();
    }
}
