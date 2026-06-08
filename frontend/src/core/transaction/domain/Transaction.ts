import dayjs from "dayjs";
import "dayjs/plugin/utc";

import type { Base } from "../../shared/domain/Base";
import { User } from "../../user/domain/User";
import type { UserDto } from "../../user/domain/User";

export class Transaction implements Base {
    public readonly date: Date;
    public readonly type: boolean;
    public readonly account: string;
    public readonly value: number;

    public readonly id?: string | undefined;
    public readonly idUser?: string | undefined;
    public readonly category?: string | undefined;
    public readonly description?: string | undefined;

    public readonly user?: User | undefined;

    constructor(date: Date, type: boolean, account: string, 
        value: number, 
        id?: string, idUser?: string, 
        category?: string, description?: string, 
        user?: User) {
        if (!account || 
            value <= 0) {
            let message: string = "";
            let lineBreak: number = 0;

            if (!account) {
                message += "The account for transaction is required.";
                lineBreak++;
            }
            if (value <= 0) message += ((lineBreak > 0) ? "\n" : "") + 
                "The value must be greater than 0.";
            
            throw new Error(message);
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

    static FromDto(dto: TransactionDto): Transaction {
        if (!dto.date || 
            (dto.type === undefined || dto.type === null) || 
            !dto.account || 
            !dto.value) {
            let message: string = "";
            let lineBreak: number = 0;

            if (!dto.date) {
                message += "The date for transaction is required."
                lineBreak++;
            }
            if ((dto.type === undefined || dto.type === null)) message += ((lineBreak++ > 0) ? "\n" : "") + 
                "The type (ingress, egress) for transaction is required.";
            if (!dto.account) message += ((lineBreak++ > 0) ? "\n" : "") + 
                "The account for transaction is required.";
            if (!dto.value) message += ((lineBreak > 0) ? "\n" : "") + 
                "The value for transaction is required.";
            
            throw new Error(message);
        }

        const date = dayjs.utc(dto.date).toDate();
        let user: User | undefined = (dto.user) ? User.FromDto(dto.user) : undefined;
        return new Transaction(date, dto.type, dto.account, 
            dto.value, 
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