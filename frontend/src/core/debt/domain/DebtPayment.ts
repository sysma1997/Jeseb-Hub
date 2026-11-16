import dayjs from "dayjs";
import dayjsUtc from "dayjs/plugin/utc";

import type { Base } from "../../shared/domain/Base";
import { Money } from "../../shared/domain/Money";
import { User } from "../../user/domain/User";
import type { UserDto } from "../../user/domain/User";

dayjs.extend(dayjsUtc);

export class DebtPayment implements Base {
    public readonly date: Date;
    // importe en decimales, como viaja por la API
    public readonly amount: number;
    public readonly idDebt: string;
    public readonly idAccount?: string | undefined;
    public readonly account?: string | undefined;
    public readonly category?: string | undefined;
    public readonly idTransaction?: string | undefined;
    public readonly description?: string | undefined;

    public readonly id?: string | undefined;
    public readonly idUser?: string | undefined;

    public readonly user?: User | undefined;

    constructor(date: Date, amount: number, idDebt: string, 
        id?: string | undefined, idUser?: string | undefined, 
        description?: string | undefined, 
        user?: User | undefined,
        idAccount?: string | undefined,
        account?: string | undefined,
        category?: string | undefined,
        idTransaction?: string | undefined) {
        if (!idDebt) throw new Error("The debt is required.");
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) 
            throw new Error("The payment date is required.");

        let amountCents: number;
        try {
            amountCents = Money.toCents(amount);
        } catch {
            throw new Error("The payment amount is not valid.");
        }
        if (amountCents <= 0) 
            throw new Error("The payment amount must be greater than 0.");

        this.date = date;
        this.amount = Money.fromCents(amountCents);
        this.idDebt = idDebt;
        this.idAccount = idAccount;
        this.account = account;
        this.category = category;
        this.idTransaction = idTransaction;
        this.description = description;

        this.id = id;
        this.idUser = idUser;

        this.user = user;
    }

    static FromDto(dto: DebtPaymentDto): DebtPayment {
        if (!dto.idDebt) throw new Error("The debt is required.");
        if (dto.amount === undefined || dto.amount === null || 
            (typeof dto.amount === "number" && Number.isNaN(dto.amount))) 
            throw new Error("The payment amount is required.");
        if (!dto.date) throw new Error("The payment date is required.");

        const date: Date = dayjs.utc(dto.date).toDate();
        let user: User | undefined = (dto.user) ? User.FromDto(dto.user) : undefined;

        return new DebtPayment(date, Number(dto.amount), dto.idDebt, 
            dto.id, dto.idUser, dto.description, user,
            dto.idAccount, dto.account, dto.category, dto.idTransaction);
    }

    toDto(): DebtPaymentDto {
        const dto: DebtPaymentDto = {
            date: dayjs.utc(this.date).format("YYYY-MM-DDTHH:mm:ss[Z]"), 
            amount: this.amount, 
            idDebt: this.idDebt
        };

        if (this.id) dto.id = this.id;
        if (this.idUser) dto.idUser = this.idUser;
        if (this.idAccount) dto.idAccount = this.idAccount;
        if (this.account) dto.account = this.account;
        if (this.category) dto.category = this.category;
        if (this.idTransaction) dto.idTransaction = this.idTransaction;
        if (this.description) dto.description = this.description;

        if (this.user) dto.user = this.user.toDto();

        return dto;
    }
    toString(): string {
        return JSON.stringify(this.toDto());
    }
}

export interface DebtPaymentDto {
    date: string;
    amount: number;
    idDebt: string;

    id?: string;
    idUser?: string;
    idAccount?: string;
    account?: string;
    category?: string;
    idTransaction?: string;
    description?: string;

    user?: UserDto;
}
