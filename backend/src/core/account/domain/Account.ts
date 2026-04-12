import { Base } from "../../shared/domain/Base";
import { User, UserDto } from "../../user/domain/User";

import { TranslatorRepository } from "../../shared/domain/TranslatorRepository";
import { MessageBuilder } from "../../shared/domain/MessageBuilder";

export class Account implements Base {
    private readonly translator: TranslatorRepository;
    
    public readonly name: string;
    public readonly balance: number;

    public readonly id?: string | undefined;
    public readonly idUser?: string | undefined;

    public readonly user?: User | undefined;

    constructor(translator: TranslatorRepository, 
        name: string, balance: number = 0, 
        id?: string | undefined, 
        idUser?: string | undefined, 
        user?: User | undefined) {
        this.translator = translator;

        if (!name) 
            throw new Error(translator.translate("accounts.errors.nameRequired"));

        this.name = name;
        this.balance = balance;

        this.id = id;
        this.idUser = idUser;
        
        this.user = user;
    }

    static FromDto(translator: TranslatorRepository, dto: AccountDto): Account {
        if (!dto.name || 
            !dto.balance) {
            const message = new MessageBuilder(true);

            if (!dto.name) message.add(translator.translate("accounts.errors.nameRequired"));
            if (!dto.balance) message.add(translator.translate("accounts.errors.balanceRequired"));

            throw new Error(message.toString());
        }

        let user: User | undefined = (dto.user) ? User.FromDto(translator, dto.user) : undefined;
        return new Account(translator, dto.name, Number(dto.balance), 
            dto.id, dto.idUser,
            user);
    }

    setName(name: string): Account {
        return new Account(this.translator, name, Number(this.balance), 
            this.id, this.idUser, 
            this.user);
    }

    ingressBalance(value: number): Account {
        return new Account(this.translator, this.name, Number(this.balance) + Number(value), 
            this.id, this.idUser, 
            this.user);
    }
    egressBalance(value: number): Account {
        return new Account(this.translator, this.name, Number(this.balance) - Number(value), 
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