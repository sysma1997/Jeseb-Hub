import { PrismaClient } from "@prisma/client";
import { v4 as Uuid } from "uuid";

import { Account } from "../domain/Account";
import { AccountRepository } from "../domain/AccountRepository";
import { Pagination } from "../../shared/domain/Pagination";

export class AccountPrismaRepository implements AccountRepository {
    private readonly prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }
    
    private parse(account: any): Account {
        return Account.FromDto(account);
    }

    async add(account: Account): Promise<void> {
        const exists = await this.search(account.idUser!, account.name);
        if (exists) 
            throw new Error(`The account with name '${account.name}' already exists.`);

        await this.prisma.account.create({
            data: {
                id: account.id ?? Uuid(), 
                idUser: account.idUser!, 
                name: account.name, 
                balance: account.balance
            }
        });
    }
    async addRange(accounts: Account[]): Promise<void> {
        await this.prisma.$transaction(accounts.map(account => this.prisma.account.upsert({
            where: { idUser: account.idUser!, id: account.id! },
            update: {
                balance: account.balance
            },
            create: {
                id: account.id ?? Uuid(), 
                idUser: account.idUser!, 
                name: account.name, 
                balance: account.balance
            }
        })));
    }
    async update(account: Account): Promise<void> {
        await this.prisma.account.update({
            where: { idUser: account.idUser!, id: account.id! }, 
            data: {
                name: account.name, 
                balance: account.balance
            }
        });
    }
    async delete(idUser: string, id: string): Promise<void> {
        await this.prisma.account.delete({
            where: { idUser, id }
        });
    }

    async get(idUser: string, id: string): Promise<Account> {
        const account = await this.prisma.account.findFirst({
            where: { idUser, id }
        });
        if (!account) throw new Error("Account not found or not exists.");

        const ac = this.parse(account);
        return ac;
    }
    async search(idUser: string, name: string): Promise<Account | undefined> {
        const account = await this.prisma.account.findFirst({
            where: { idUser, name }
        });
        if (!account) return undefined;

        const ac = this.parse(account);
        return ac;
    }
    
    async getList(idUser: string, limit?: number, page?: number): Promise<Pagination<Account>> {
        const take = limit ?? 30;
        const skip = page ?? 1;
        const shouldPaginate = (limit !== undefined || limit !== null);

        const [accounts, total] = await Promise.all([
            this.prisma.account.findMany({
                where: { idUser }, 
                orderBy: { name: "asc" }, 
                ...(shouldPaginate && {
                    take: take, 
                    skip: (skip - 1) * take
                })
            }), 
            this.prisma.account.count({ where: { idUser } })
        ]);

        const pagination = new Pagination<Account>();
        pagination.list = accounts.map(ac => this.parse(ac));
        pagination.pages = (limit) ? Pagination.PageLength(total, limit) : 1;

        return pagination;
    }
}