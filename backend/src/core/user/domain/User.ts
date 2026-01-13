import { createHash } from "crypto";
import dayjs from "dayjs";

import { Base } from "../../shared/domain/Base";

export class User implements Base {
    public readonly name: string;
    public readonly email: string;
    public readonly password: string;
    public readonly createAt: Date;
    
    public readonly id?: string | undefined;
    public readonly lastUpdate?: Date | undefined;
    public readonly profile?: string | undefined;
    public readonly config?: UserConfig | undefined;

    constructor(name: string, 
        email: string, password: string, 
        createAt: Date, 
        id?: string, 
        lastUpdate?: Date, 
        profile?: string, 
        config?: UserConfig) {
        if (!name || !email || !password) {
            let message: string = "";
            let lineBreak: number = 0;

            if (!name) {
                message += "The name for user is required.";
                lineBreak++;
            }
            if (!email) message += ((lineBreak++ > 0) ? "\n" : "") + 
                "The email for user is required.";
            if (!password) message += ((lineBreak++ > 0) ? "\n" : "") + 
                "The password for user is required.";
            
            throw new Error(message);
        }
        if (!User.IsValidEmail(email)) 
            throw new Error(`The '${email}' is not a valid email.`);
        if (password.length != 64 && password.length != 60) 
            throw new Error("The password is not valid, please check that it is in SHA256.");
        
        this.name = name;
        this.email = email;
        this.password = password;
        this.createAt = createAt;
            
        this.id = id;
        this.lastUpdate = lastUpdate;
        this.profile = profile;
        this.config = config;
    }

    static FromDto(dto: UserDto): User {
        if (!dto.password) 
            throw new Error("The password in user is required.");

        const createAt = dayjs.utc(dto.createAt).toDate();
        const lastUpdate = (dto.lastUpdate) ? dayjs.utc(dto.lastUpdate).toDate() : undefined;
        return new User(dto.name, dto.email, dto.password, createAt, 
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