import dayjs from "dayjs";
import "dayjs/plugin/utc";

import { Base } from "../../shared/domain/Base";
import { User, UserDto } from "../../user/domain/User";

import { TranslatorRepository } from "../../shared/domain/TranslatorRepository";
import { MessageBuilder } from "../../shared/domain/MessageBuilder";

export class Transaction implements Base {
    private readonly translator: TranslatorRepository;

    public readonly date: Date;
    public readonly type: boolean;
    public readonly account: string;
    public readonly value: number;

    public readonly id?: string | undefined;
    public readonly idUser?: string | undefined;
    public readonly category?: string | undefined;
    public readonly description?: string | undefined;

    public readonly user?: User | undefined;

    constructor(translator: TranslatorRepository, 
        date: Date, type: boolean, account: string, 
        value: number, 
        id?: string, idUser?: string, 
        category?: string, description?: string, 
        user?: User) {
        this.translator = translator;

        if (!account || 
            value <= 0) {
            const message = new MessageBuilder(true);

            if (!account) message.add(translator.translate("transactions.errors.accountRequired"));
            if (value <= 0) message.add(translator.translate("transactions.errors.valueRequired"));
            
            throw new Error(message.toString());
        }
        
        this.date = date;
        this.type = type;
        this.account = account;
        this.value = value;

        this.id = id;
        this.idUser = idUser;
        this.category = category;
        this.description = description;

        this.user = user;
    }

    static FromDto(translator: TranslatorRepository, dto: TransactionDto): Transaction {
        if (!dto.date || 
            (dto.type === undefined || dto.type === null) || 
            !dto.account || 
            !dto.value) {
            const message = new MessageBuilder();

            if (!dto.date) message.add(translator.translate("transactions.errors.dateRequired"));
            if ((dto.type === undefined || dto.type === null)) message.add(translator.translate("transactions.errors.typeRequired"));
            if (!dto.account) message.add(translator.translate("transactions.errors.accountRequired"));
            if (!dto.value) message.add(translator.translate("transactions.errors.valueRequired"));

            throw new Error(message.toString());
        }

        const date = dayjs.utc(dto.date).toDate();
        let user: User | undefined = (dto.user) ? User.FromDto(translator, dto.user) : undefined;
        return new Transaction(translator, date, dto.type, dto.account, 
            Number(dto.value), 
            dto.id, dto.idUser, 
            dto.category, dto.description, 
            user);
    }

    toDto(): TransactionDto {
        const transaction: TransactionDto = {
            date: dayjs.utc(this.date).format("YYYY-MM-DDTHH:mm:ss[Z]"), 
            type: this.type, 
            account: this.account, 
            value: this.value, 
        };

        if (this.id) transaction.id = this.id;
        if (this.idUser) transaction.idUser = this.idUser;
        if (this.category) transaction.category = this.category;
        if (this.description) transaction.description = this.description;

        if (this.user) transaction.user = this.user.toDto();

        return transaction;
    }
    toString(): string {
        return JSON.stringify(this.toDto());
    }
}
export interface TransactionDto {
    date: string;
    type: boolean;
    account: string;
    value: number;

    id?: string;
    idUser?: string;
    category?: string;
    description?: string;

    user?: UserDto;
}