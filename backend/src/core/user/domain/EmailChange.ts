import { TranslatorRepository } from "../../shared/domain/TranslatorRepository";

export type EmailChangeStep = "current" | "new";

export interface EmailChangeRequest {
    idUser: string;
    currentEmail: string;
    newEmail: string;
}

export interface PendingEmailChange extends EmailChangeRequest {
    step: EmailChangeStep;
}

interface PendingEntry extends PendingEmailChange {
    expires: number;
}

export class EmailChange {
    public static readonly ExpiresMinutes: number = 15;

    private static readonly MessageNotFound: string = "users.errors.emailChangeNotStarted";

    private static pending: Map<string, PendingEntry> = new Map();

    private static clean(): void {
        const now: number = Date.now();

        for (const [key, entry] of EmailChange.pending.entries())
            if (now > entry.expires) EmailChange.pending.delete(key);
    }
    public static start(challenge: EmailChangeRequest): void {
        if (!challenge?.idUser) return;

        EmailChange.clean();

        EmailChange.pending.set(challenge.idUser, {
            idUser: challenge.idUser,
            currentEmail: challenge.currentEmail,
            newEmail: challenge.newEmail,
            step: "current",
            expires: Date.now() + (EmailChange.ExpiresMinutes * 60 * 1000)
        });
    }
    public static get(translator: TranslatorRepository, idUser: string): PendingEmailChange {
        EmailChange.clean();

        const entry: PendingEntry | undefined = EmailChange.pending.get(idUser);
        if (!entry) throw new Error(translator.translate(EmailChange.MessageNotFound));

        return { idUser: entry.idUser, currentEmail: entry.currentEmail, newEmail: entry.newEmail, step: entry.step };
    }
    public static advance(translator: TranslatorRepository, idUser: string, step: EmailChangeStep): PendingEmailChange {
        const challenge: PendingEmailChange = EmailChange.get(translator, idUser);

        EmailChange.pending.set(idUser, {
            idUser: challenge.idUser,
            currentEmail: challenge.currentEmail,
            newEmail: challenge.newEmail,
            step: step,
            expires: Date.now() + (EmailChange.ExpiresMinutes * 60 * 1000)
        });

        return { ...challenge, step: step };
    }
    public static clear(idUser: string): void {
        EmailChange.pending.delete(idUser);
    }
    public static count(): number {
        EmailChange.clean();

        return EmailChange.pending.size;
    }
    public static reset(): void {
        EmailChange.pending.clear();
    }
}