import { Base } from "../../shared/domain/Base";
import { User, UserDto } from "../../user/domain/User";

import { TranslatorRepository } from "../../shared/domain/TranslatorRepository";
import { MessageBuilder } from "../../shared/domain/MessageBuilder";
import { Money } from "../../shared/domain/Money";

export class Account implements Base {
    private readonly translator: TranslatorRepository;
    
    public readonly name: string;
    // el saldo se maneja en CENTAVOS enteros dentro del dominio. AccountDto.balance es
    // el mismo importe en decimales, que es lo que viaja por la API
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
        // 0 es un saldo valido: el chequeo va sobre null/undefined y no sobre la
        // falsia del numero, que antes hacia fallar cualquier cuenta sin saldo
        const sinSaldo = (dto.balance === null || dto.balance === undefined || 
            (typeof dto.balance === "number" && Number.isNaN(dto.balance)));

        if (!dto.name || 
            sinSaldo) {
            const message = new MessageBuilder();

            if (!dto.name) message.add(translator.translate("accounts.errors.nameRequired"));
            if (sinSaldo) message.add(translator.translate("accounts.errors.balanceRequired"));

            throw new Error(message.toString());
        }

        let user: User | undefined = (dto.user) ? User.FromDto(translator, dto.user) : undefined;
        return new Account(translator, dto.name, Money.toCents(dto.balance), 
            dto.id, dto.idUser,
            user);
    }

    setName(name: string): Account {
        return new Account(this.translator, name, this.balance, 
            this.id, this.idUser, 
            this.user);
    }
    setBalance(balance: number): Account {
        return new Account(this.translator, this.name, balance, 
            this.id, this.idUser, 
            this.user);
    }

    // value llega en centavos, igual que balance: sumar enteros no acumula error de
    // coma flotante, a diferencia de sumar 0.1 + 0.2
    ingressBalance(value: number): Account {
        return new Account(this.translator, this.name, this.balance + value, 
            this.id, this.idUser, 
            this.user);
    }
    egressBalance(value: number): Account {
        return new Account(this.translator, this.name, this.balance - value, 
            this.id, this.idUser, 
            this.user);
    }

    toDto(): AccountDto {
        const dto: AccountDto = {
            name: this.name, 
            balance: Money.fromCents(this.balance)
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