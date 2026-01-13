import { PrismaClient } from "@prisma/client";
import { v4 as Uuid } from "uuid";
import dayjs from "dayjs";
import dayjsUtc from "dayjs/plugin/utc";
import bcrypt from "bcryptjs";

import { User } from "../domain/User";
import type { UserConfig } from "../domain/User";
import { UserRepository } from "../domain/UserRepository";

dayjs.extend(dayjsUtc);

export class UserPrismaRepository implements UserRepository {
    private readonly prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }
    
    private parse(user: { 
        id: string, 
        email: string, 
        name: string, 
        password: string, 
        createAt: Date, 
        lastUpdate: Date | null, 
        profile: string | null, 
        config: string | null
    }): User {
        const lastUpdate = (user.lastUpdate) ? user.lastUpdate : undefined;
        const config: UserConfig | undefined = (user.config) ? JSON.parse(user.config) : undefined;

        return new User(user.name, user.email, user.password, user.createAt, 
            user.id, lastUpdate, 
            user.profile ?? undefined, config);
    }

    async register(user: User): Promise<void> {
        const exists = await this.prisma.user.findUnique({ 
            where: { email: user.email } 
        });
        if (exists) 
            throw new Error(`The email '${user.email}' already exists.`);

        const hashedPassword = await bcrypt.hash(user.password, 10);
        await this.prisma.user.create({
            data: {
                id: user.id ?? Uuid(), 
                name: user.name, 
                email: user.email, 
                password: hashedPassword, 
                createAt: user.createAt, 
            }
        });
    }
    async recoverPassword(id: string, password: string): Promise<void> {
        const hashedPassword = await bcrypt.hash(password, 10);
        await this.prisma.user.update({
            where: { id }, 
            data: {
                password: hashedPassword
            }
        });
    }
    
    async updateProfile(id: string, profile: string | undefined): Promise<void> {
        await this.prisma.user.update({
            where: { id }, 
            data: {
                profile: profile ?? null
            }
        });
    }
    async updateName(id: string, name: string): Promise<void> {
        await this.prisma.user.update({
            where: { id }, 
            data: {
                name: name, 
                lastUpdate: dayjs.utc().toDate()
            }
        });
    }
    async updateEmail(id: string, email: string): Promise<void> {
        const exists = await this.prisma.user.findUnique({ where: { email }});
        if (exists) throw new Error("The email already exists in another account.");

        await this.prisma.user.update({
            where: { id }, 
            data: {
                email: email, 
                lastUpdate: dayjs.utc().toDate()
            }
        });
    }
    async updatePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new Error("User not found or not exists.");
        const valid: boolean = await bcrypt.compare(currentPassword, user.password);
        if (!valid) throw new Error("The current password is incorrect.");

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id }, 
            data: {
                password: hashedPassword, 
                lastUpdate: dayjs.utc().toDate()
            }
        });
    }
    async updateTwoStep(id: string, config: UserConfig): Promise<void> {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new Error("User not found or not exists.");

        let _config: UserConfig = config;
        if (user.config) {
            _config = JSON.parse(user.config);
            _config.twoStep.active = config.twoStep.active;
            _config.twoStep.type = config.twoStep.type;
        }

        await this.prisma.user.update({
            where: { id }, 
            data: {
                config: JSON.stringify(_config)
            }
        });
    }

    async login(email: string, password: string): Promise<User> {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) throw new Error("The email not found.");
        const valid: boolean = await bcrypt.compare(password, user.password);
        if (!valid) throw new Error("The password is incorrect.");

        return this.parse(user);
    }

    async get(id: string): Promise<User> {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new Error("User not found.");

        return this.parse(user);
    }
    async getWithEmail(email: string): Promise<User | undefined> {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) return undefined;

        return this.parse(user);
    }
}