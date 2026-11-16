import dayjs from "dayjs";
import dayjsUtc from "dayjs/plugin/utc";

import { Base } from "../../shared/domain/Base";
import { User, UserDto } from "../../user/domain/User";

import { TranslatorRepository } from "../../shared/domain/TranslatorRepository";
import { MessageBuilder } from "../../shared/domain/MessageBuilder";
import { Money } from "../../shared/domain/Money";

dayjs.extend(dayjsUtc);

export class DebtPayment implements Base {
    private readonly translator: TranslatorRepository;

    public readonly date: Date;
    // igual que en Debt, el importe se maneja en centavos enteros
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

    constructor(translator: TranslatorRepository, 
        date: Date, amount: number, idDebt: string, 
        id?: string | undefined, idUser?: string | undefined, 
        description?: string | undefined, 
        user?: User | undefined,
        idAccount?: string | undefined,
        account?: string | undefined,
        category?: string | undefined,
        idTransaction?: string | undefined) {
        this.translator = translator;

        if (!idDebt || 
            !Number.isSafeInteger(amount) || amount <= 0 || 
            !date || !(date instanceof Date) || Number.isNaN(date.getTime())) {
            const message = new MessageBuilder();

            if (!idDebt) message.add(translator.translate("debts.errors.paymentDebtRequired"));
            if (!Number.isSafeInteger(amount) || amount <= 0) 
                message.add(translator.translate("debts.errors.paymentAmountRequired"));
            if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) 
                message.add(translator.translate("debts.errors.paymentDateRequired"));

            throw new Error(message.toString());
        }

        this.date = date;
        this.amount = amount;
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

    static FromDto(translator: TranslatorRepository, dto: DebtPaymentDto): DebtPayment {
        const sinMonto = (dto.amount === null || dto.amount === undefined || 
            (typeof dto.amount === "number" && Number.isNaN(dto.amount)));

        if (!dto.idDebt || sinMonto || !dto.date) {
            const message = new MessageBuilder();

            if (!dto.idDebt) message.add(translator.translate("debts.errors.paymentDebtRequired"));
            if (sinMonto) message.add(translator.translate("debts.errors.paymentAmountRequired"));
            if (!dto.date) message.add(translator.translate("debts.errors.paymentDateRequired"));

            throw new Error(message.toString());
        }

        const date: Date = dayjs.utc(dto.date as any).toDate();
        let user: User | undefined = (dto.user) ? User.FromDto(translator, dto.user) : undefined;

        return new DebtPayment(translator, date, Money.toCents(dto.amount as any), dto.idDebt, 
            dto.id, dto.idUser, dto.description, user,
            dto.idAccount, dto.account, dto.category, dto.idTransaction);
    }

    toDto(): DebtPaymentDto {
        const dto: DebtPaymentDto = {
            date: dayjs.utc(this.date).format("YYYY-MM-DDTHH:mm:ss[Z]"), 
            amount: Money.fromCents(this.amount), 
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
