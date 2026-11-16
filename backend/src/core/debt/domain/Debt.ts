import dayjs from "dayjs";
import dayjsUtc from "dayjs/plugin/utc";

import { Base } from "../../shared/domain/Base";
import { User, UserDto } from "../../user/domain/User";

import { TranslatorRepository } from "../../shared/domain/TranslatorRepository";
import { MessageBuilder } from "../../shared/domain/MessageBuilder";
import { Money } from "../../shared/domain/Money";
import { DebtStatus, getDebtStatus } from "./DebtStatus";

dayjs.extend(dayjsUtc);

export class Debt implements Base {
    private readonly translator: TranslatorRepository;

    // persona con la que se tiene la deuda
    public readonly person: string;
    // true = le deben al usuario (cuenta por cobrar); false = el usuario debe
    // (cuenta por pagar). Conserva la misma convencion que Transaction.type,
    // donde true representa dinero que entra.
    public readonly type: boolean;
    // el monto original se maneja en CENTAVOS enteros dentro del dominio.
    // DebtDto.amount es el mismo importe en decimales, que es lo que viaja por la API
    public readonly amount: number;
    public readonly date: Date;
    public readonly description?: string | undefined;
    public readonly dueDate?: Date | undefined;

    // se calculan a partir de los abonos registrados; nunca se escriben a mano
    public readonly paidAmount: number;
    public readonly paymentCount: number;

    public readonly id?: string | undefined;
    public readonly idUser?: string | undefined;

    public readonly user?: User | undefined;

    constructor(translator: TranslatorRepository, 
        person: string, type: boolean, amount: number, date: Date, 
        id?: string | undefined, idUser?: string | undefined, 
        description?: string | undefined, dueDate?: Date | undefined, 
        paidAmount: number = 0, paymentCount: number = 0, 
        user?: User | undefined) {
        this.translator = translator;

        if (!person || 
            (type === undefined || type === null || typeof type !== "boolean") || 
            !Number.isSafeInteger(amount) || amount <= 0 || 
            !date || !(date instanceof Date) || Number.isNaN(date.getTime())) {
            const message = new MessageBuilder();

            if (!person) message.add(translator.translate("debts.errors.personRequired"));
            if (type === undefined || type === null || typeof type !== "boolean") 
                message.add(translator.translate("debts.errors.typeRequired"));
            if (!Number.isSafeInteger(amount) || amount <= 0) 
                message.add(translator.translate("debts.errors.amountRequired"));
            if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) 
                message.add(translator.translate("debts.errors.dateRequired"));

            throw new Error(message.toString());
        }

        if (dueDate && 
            (!(dueDate instanceof Date) || Number.isNaN(dueDate.getTime()))) 
            throw new Error(translator.translate("debts.errors.dueDateInvalid"));

        if (dueDate && 
            dayjs.utc(dueDate).startOf("day").isBefore(dayjs.utc(date).startOf("day"))) 
            throw new Error(translator.translate("debts.errors.dueDateBeforeDate"));

        if (!Number.isSafeInteger(paidAmount) || paidAmount < 0) 
            throw new Error(translator.translate("debts.errors.paidAmountInvalid"));

        if (paidAmount > amount) 
            throw new Error(translator.translate("debts.errors.amountBelowPaid", { 
                paid: Money.toDecimalString(paidAmount) 
            }));

        this.person = person;
        this.type = type;
        this.amount = amount;
        this.date = date;
        this.description = description;
        this.dueDate = dueDate;

        this.paidAmount = paidAmount;
        this.paymentCount = paymentCount;

        this.id = id;
        this.idUser = idUser;

        this.user = user;
    }

    static FromDto(translator: TranslatorRepository, dto: DebtDto): Debt {
        const sinMonto = (dto.amount === null || dto.amount === undefined || 
            (typeof dto.amount === "number" && Number.isNaN(dto.amount)));

        if (!dto.person || 
            (dto.type === undefined || dto.type === null) || 
            sinMonto || 
            !dto.date) {
            const message = new MessageBuilder();

            if (!dto.person) message.add(translator.translate("debts.errors.personRequired"));
            if (dto.type === undefined || dto.type === null) 
                message.add(translator.translate("debts.errors.typeRequired"));
            if (sinMonto) message.add(translator.translate("debts.errors.amountRequired"));
            if (!dto.date) message.add(translator.translate("debts.errors.dateRequired"));

            throw new Error(message.toString());
        }

        const date: Date = dayjs.utc(dto.date as any).toDate();
        const dueDate: Date | undefined = (dto.dueDate) ? 
            dayjs.utc(dto.dueDate as any).toDate() : undefined;
        const paidAmount: number = (dto.paidAmount === undefined || dto.paidAmount === null) ? 
            0 : Money.toCents(dto.paidAmount);

        let user: User | undefined = (dto.user) ? User.FromDto(translator, dto.user) : undefined;
        return new Debt(translator, dto.person, dto.type, Money.toCents(dto.amount as any), date, 
            dto.id, dto.idUser, 
            dto.description, dueDate, 
            paidAmount, dto.paymentCount ?? 0, 
            user);
    }

    get pendingAmount(): number {
        // el saldo pendiente se deriva del monto original y los abonos. El maximo
        // protege la lectura si algun dato historico quedara por encima del monto.
        return Math.max(0, this.amount - this.paidAmount);
    }

    getStatus(now: Date = new Date()): DebtStatus {
        return getDebtStatus(this.pendingAmount, this.dueDate, now);
    }

    setPerson(person: string): Debt {
        return new Debt(this.translator, person, this.type, this.amount, this.date, 
            this.id, this.idUser, 
            this.description, this.dueDate, 
            this.paidAmount, this.paymentCount, 
            this.user);
    }
    setType(type: boolean): Debt {
        return new Debt(this.translator, this.person, type, this.amount, this.date, 
            this.id, this.idUser, 
            this.description, this.dueDate, 
            this.paidAmount, this.paymentCount, 
            this.user);
    }
    setAmount(amount: number): Debt {
        return new Debt(this.translator, this.person, this.type, amount, this.date, 
            this.id, this.idUser, 
            this.description, this.dueDate, 
            this.paidAmount, this.paymentCount, 
            this.user);
    }
    setDate(date: Date): Debt {
        return new Debt(this.translator, this.person, this.type, this.amount, date, 
            this.id, this.idUser, 
            this.description, this.dueDate, 
            this.paidAmount, this.paymentCount, 
            this.user);
    }
    setDescription(description?: string | undefined): Debt {
        return new Debt(this.translator, this.person, this.type, this.amount, this.date, 
            this.id, this.idUser, 
            description, this.dueDate, 
            this.paidAmount, this.paymentCount, 
            this.user);
    }
    setDueDate(dueDate?: Date | undefined): Debt {
        return new Debt(this.translator, this.person, this.type, this.amount, this.date, 
            this.id, this.idUser, 
            this.description, dueDate, 
            this.paidAmount, this.paymentCount, 
            this.user);
    }

    toDto(): DebtDto {
        const dto: DebtDto = {
            person: this.person, 
            type: this.type, 
            amount: Money.fromCents(this.amount), 
            date: dayjs.utc(this.date).format("YYYY-MM-DDTHH:mm:ss[Z]"), 
            paidAmount: Money.fromCents(this.paidAmount), 
            pendingAmount: Money.fromCents(this.pendingAmount), 
            status: this.getStatus(), 
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
