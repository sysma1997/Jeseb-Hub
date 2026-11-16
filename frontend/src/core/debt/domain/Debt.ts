import dayjs from "dayjs";
import dayjsUtc from "dayjs/plugin/utc";

import type { Base } from "../../shared/domain/Base";
import { Money } from "../../shared/domain/Money";
import { User } from "../../user/domain/User";
import type { UserDto } from "../../user/domain/User";

dayjs.extend(dayjsUtc);

export type DebtStatus = "pending" | "overdue" | "paid";

// El estado no se guarda: se deriva del saldo pendiente y de la fecha de
// vencimiento, igual que en el backend. Una deuda que vence hoy no está vencida
// hasta que empieza el día siguiente.
export const isDebtOverdue = (dueDate: Date | undefined, now: Date = new Date()): boolean => {
    if (!dueDate) return false;

    const due = dayjs.utc(dueDate).startOf("day");
    const today = dayjs.utc(now).startOf("day");

    return due.isBefore(today);
};

export const getDebtStatus = (pendingCents: number, dueDate: Date | undefined, 
    now: Date = new Date()): DebtStatus => {
    if (pendingCents <= 0) return "paid";

    return isDebtOverdue(dueDate, now) ? "overdue" : "pending";
};

export class Debt implements Base {
    // persona con la que se tiene la deuda
    public readonly person: string;
    // true = le deben al usuario (cuenta por cobrar); false = el usuario debe
    // (cuenta por pagar). Conserva la misma convención que Transaction.type.
    public readonly type: boolean;
    // importe original en decimales, como viaja por la API
    public readonly amount: number;
    public readonly date: Date;
    public readonly description?: string | undefined;
    public readonly dueDate?: Date | undefined;

    // se derivan de los abonos registrados; nunca se escriben a mano
    public readonly paidAmount: number;
    public readonly paymentCount: number;

    public readonly id?: string | undefined;
    public readonly idUser?: string | undefined;

    public readonly user?: User | undefined;

    constructor(person: string, type: boolean, amount: number, date: Date, 
        id?: string | undefined, idUser?: string | undefined, 
        description?: string | undefined, dueDate?: Date | undefined, 
        paidAmount: number = 0, paymentCount: number = 0, 
        user?: User | undefined) {
        if (!person) throw new Error("The person is required.");
        if (typeof type !== "boolean") throw new Error("The debt type is required.");
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) 
            throw new Error("The debt date is required.");

        if (dueDate && (!(dueDate instanceof Date) || Number.isNaN(dueDate.getTime()))) 
            throw new Error("The due date is not valid.");

        if (dueDate && dayjs.utc(dueDate).startOf("day").isBefore(dayjs.utc(date).startOf("day"))) 
            throw new Error("The due date cannot be earlier than the debt date.");

        let amountCents: number;
        let paidCents: number;
        try {
            amountCents = Money.toCents(amount);
            paidCents = Money.toCents(paidAmount);
        } catch {
            throw new Error("The amount is not valid.");
        }

        if (amountCents <= 0) throw new Error("The amount must be greater than 0.");
        if (paidCents < 0 || paidCents > amountCents) 
            throw new Error("The paid amount is not valid.");

        this.person = person;
        this.type = type;
        // se normaliza a dos decimales usando centavos enteros
        this.amount = Money.fromCents(amountCents);
        this.date = date;
        this.description = description;
        this.dueDate = dueDate;

        this.paidAmount = Money.fromCents(paidCents);
        this.paymentCount = paymentCount;

        this.id = id;
        this.idUser = idUser;

        this.user = user;
    }

    static FromDto(dto: DebtDto): Debt {
        if (!dto.person) throw new Error("The person is required.");
        if (dto.type === undefined || dto.type === null) 
            throw new Error("The debt type is required.");
        if (dto.amount === undefined || dto.amount === null || 
            (typeof dto.amount === "number" && Number.isNaN(dto.amount))) 
            throw new Error("The amount is required.");
        if (!dto.date) throw new Error("The debt date is required.");

        const date: Date = dayjs.utc(dto.date).toDate();
        const dueDate: Date | undefined = (dto.dueDate) ? 
            dayjs.utc(dto.dueDate).toDate() : undefined;
        const paidAmount: number = (dto.paidAmount === undefined || dto.paidAmount === null) ? 
            0 : Number(dto.paidAmount);

        let user: User | undefined = (dto.user) ? User.FromDto(dto.user) : undefined;

        return new Debt(dto.person, dto.type, Number(dto.amount), date, 
            dto.id, dto.idUser, 
            dto.description, dueDate, 
            paidAmount, dto.paymentCount ?? 0, 
            user);
    }

    get pendingAmountCents(): number {
        const amountCents: number = Money.toCents(this.amount);
        const paidCents: number = Money.toCents(this.paidAmount);

        return Math.max(0, amountCents - paidCents);
    }
    get pendingAmount(): number {
        return Money.fromCents(this.pendingAmountCents);
    }

    get status(): DebtStatus {
        return getDebtStatus(this.pendingAmountCents, this.dueDate);
    }

    toDto(): DebtDto {
        const dto: DebtDto = {
            person: this.person, 
            type: this.type, 
            amount: this.amount, 
            date: dayjs.utc(this.date).format("YYYY-MM-DDTHH:mm:ss[Z]"), 
            paidAmount: this.paidAmount, 
            pendingAmount: this.pendingAmount, 
            status: this.status, 
            paymentCount: this.paymentCount
        };

        if (this.id) dto.id = this.id;
        if (this.idUser) dto.idUser = this.idUser;
        if (this.description) dto.description = this.description;
        if (this.dueDate) dto.dueDate = dayjs.utc(this.dueDate).format("YYYY-MM-DDTHH:mm:ss[Z]");

        if (this.user) dto.user = this.user.toDto();

        return dto;
    }
    toString(): string {
        return JSON.stringify(this.toDto());
    }
}

export interface DebtDto {
    person: string;
    type: boolean;
    amount: number;
    date: string;

    paidAmount: number;
    pendingAmount: number;
    status: DebtStatus;
    paymentCount: number;

    id?: string;
    idUser?: string;
    description?: string;
    dueDate?: string;

    user?: UserDto;
}
