import type { Base } from "../../shared/domain/Base";
import { User } from "../../user/domain/User";
import type { UserDto } from "../../user/domain/User";

export class Account implements Base {
    public readonly name: string;
    public readonly balance: number;

    public readonly id?: string | undefined;
    public readonly idUser?: string | undefined;

    public readonly user?: User | undefined;

    constructor(name: string, balance: number = 0, 
        id?: string | undefined, 
        idUser?: string | undefined, 
        user?: User | undefined) {
        if (!name) throw new Error("The name is required.");

        this.name = name;
        this.balance = balance;

        this.id = id;
        this.idUser = idUser;
        
        this.user = user;
    }

    static FromDto(dto: AccountDto): Account {
        if (!dto.name) 
            throw new Error("The name is required.");

        let user: User | undefined = (dto.user) ? User.FromDto(dto.user) : undefined;
        return new Account(dto.name, Number(dto.balance), 
            dto.id, dto.idUser,
            user);
    }

    setName(name: string): Account {
        return new Account(name, Number(this.balance), 
            this.id, this.idUser, 
            this.user);
    }

    ingressBalance(value: number): Account {
        return new Account(this.name, Number(this.balance) + Number(value), 
            this.id, this.idUser, 
            this.user);
    }
    egressBalance(value: number): Account {
        return new Account(this.name, Number(this.balance) - Number(value), 
            this.id, this.idUser, 
            this.user);
    }

    toDto(): AccountDto {
        const dto: AccountDto = {
            name: this.name, 
            balance: this.balance
        };

        if (this.id) dto.id = this.id;
        if (this.idUser) dto.idUser = this.idUser;

        if (this.user) dto.user = this.user.toDto();

        return dto;
    }
    toString(): string {
        return JSON.stringify(this.toDto());
    }
}
export interface AccountDto {
    name: string;
    balance: number;

    id?: string;
    idUser?: string;

    user?: UserDto;
}