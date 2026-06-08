import { createHash } from "crypto";
import dayjs from "dayjs";

import { Base } from "../../shared/domain/Base";
import { TranslatorRepository } from "../../shared/domain/TranslatorRepository";
import { MessageBuilder } from "../../shared/domain/MessageBuilder";

export class User implements Base {
    private readonly translator: TranslatorRepository;

    public readonly name: string;
    public readonly email: string;
    public readonly password: string;
    public readonly createAt: Date;
    
    public readonly id?: string | undefined;
    public readonly lastUpdate?: Date | undefined;
    public readonly profile?: string | undefined;
    public readonly config?: UserConfig | undefined;

    constructor(translator: TranslatorRepository, 
        name: string, 
        email: string, password: string, 
        createAt: Date, 
        id?: string, 
        lastUpdate?: Date, 
        profile?: string, 
        config?: UserConfig) {
        this.translator = translator;

        if (!name || !email || !password) {
            const message = new MessageBuilder();

            if (!name) message.add(this.translator.translate("users.errors.nameRequired"));
            if (!email) message.add(this.translator.translate("users.errors.emailRequired"));
            if (!password) message.add(this.translator.translate("users.errors.passwordRequired"));
            
            throw new Error(message.toString());
        }
        if (!User.IsValidEmail(email)) 
            throw new Error(this.translator.translate("users.errors.emailInvalid", { email }));
        if (password.length != 64 && password.length != 60) 
            throw new Error(this.translator.translate("users.errors.passwordInvalid"));
        
        this.name = name;
        this.email = email;
        this.password = password;
        this.createAt = createAt;
            
        this.id = id;
        this.lastUpdate = lastUpdate;
        this.profile = profile;
        this.config = config;
    }

    static FromDto(translator: TranslatorRepository, dto: UserDto): User {
        if (!dto.password) 
            throw new Error(translator.translate("users.errors.passwordRequired"));

        const createAt = dayjs.utc(dto.createAt).toDate();
        const lastUpdate = (dto.lastUpdate) ? dayjs.utc(dto.lastUpdate).toDate() : undefined;
        return new User(translator, dto.name, dto.email, dto.password, createAt, 
            dto.id, lastUpdate, dto.profile, dto.config);
    }
    static ConvertPassword(value: string): string {
        return createHash("sha256").update(value).digest("hex");
    }
    static IsValidEmail(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    toDto(showPassword: boolean = false): UserDto {
        const user: UserDto =  {
            name: this.name, 
            email: this.email, 
            createAt: dayjs.utc(this.createAt).toDate().toString()
        };

        if (this.id != null) user.id = this.id;
        if (showPassword) user.password = this.password;
        if (this.lastUpdate != null) user.lastUpdate = dayjs.utc(this.lastUpdate).toDate().toString();
        if (this.profile) user.profile = this.profile;
        if (this.config) user.config = this.config;

        return user;
    }
    toString(showPassword: boolean = false): string {
        return JSON.stringify(this.toDto(showPassword));
    }
}
export interface UserDto {
    name: string;
    email: string;
    createAt: string;
    
    id?: string;
    password?: string;
    lastUpdate?: string;
    profile?: string;
    config?: UserConfig;
}
export interface UserConfig {
    twoStep: {
        active: boolean, 
        type: string
    }
}