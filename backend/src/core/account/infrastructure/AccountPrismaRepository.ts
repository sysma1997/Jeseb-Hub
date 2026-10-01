import { PrismaClient, Prisma } from "../../../generated/prisma/client";
import { v4 as Uuid } from "uuid";

import { Account } from "../domain/Account";
import { AccountRepository } from "../domain/AccountRepository";
import { Pagination } from "../../shared/domain/Pagination";
import { TranslatorRepository } from "../../shared/domain/TranslatorRepository";
import { Money } from "../../shared/domain/Money";

export class AccountPrismaRepository implements AccountRepository {
    // admite el cliente transaccional de Prisma para que este repositorio pueda
    // participar en una unit of work sin cambiar su interfaz
    private readonly prisma: PrismaClient | Prisma.TransactionClient;
    private readonly translator: TranslatorRepository;

    constructor(prisma: PrismaClient | Prisma.TransactionClient, translator: TranslatorRepository) {
        this.prisma = prisma;
        this.translator = translator;
    }
    
    private parse(account: any): Account {
        return Account.FromDto(this.translator, account);
    }

    async add(account: Account): Promise<void> {
        const exists = await this.search(account.idUser!, account.name);
        if (exists) 
            throw new Error(this.translator.translate("accounts.errors.nameAlreadyExists", { name: account.name }));

        await this.prisma.account.create({
            data: {
                id: account.id ?? Uuid(), 
                idUser: account.idUser!, 
                name: account.name, 
                balance: Money.toDecimalString(account.balance)
            }
        });
    }
    async addRange(accounts: Account[]): Promise<void> {
        await this.prisma.$transaction(accounts.map(account => this.prisma.account.upsert({
            where: { idUser: account.idUser!, id: account.id! },
            update: {
                balance: Money.toDecimalString(account.balance)
            },
            create: {
                id: account.id ?? Uuid(), 
                idUser: account.idUser!, 
                name: account.name, 
                balance: Money.toDecimalString(account.balance)
            }
        })));
    }
    async update(account: Account): Promise<void> {
        await this.prisma.account.update({
            where: { idUser: account.idUser!, id: account.id! }, 
            data: {
                name: account.name, 
                balance: Money.toDecimalString(account.balance)
            }
        });
    }
    async delete(idUser: string, id: string): Promise<void> {
        await this.prisma.account.delete({
            where: { idUser, id }
        });
    }

    // Suma o resta un importe (en centavos) con increment/decrement de Postgres.
    // El saldo lo calcula la base dentro de la propia sentencia, asi que dos
    // operaciones concurrentes se acumulan en vez de pisarse. Es la diferencia con
    // leer el saldo, restarlo en JavaScript y escribir el absoluto.
    async adjust(idUser: string, id: string, cents: number): Promise<void> {
        await this.prisma.account.update({
            where: { idUser, id },
            data: { balance: { increment: Money.toDecimalString(cents) } }
        });
    }

    // Igual que adjust pero con la condicion de saldo suficiente en el propio filtro.
    // Devuelve false si no habia saldo, sin haber tocado nada. Es lo que evita que dos
    // transferencias simultaneas gasten dos veces el mismo dinero.
    async adjustIfEnough(idUser: string, id: string, cents: number): Promise<boolean> {
        const result = await this.prisma.account.updateMany({
            where: {
                idUser, id,
                balance: { gte: Money.toDecimalString(cents) }
            },
            data: { balance: { decrement: Money.toDecimalString(cents) } }
        });

        return result.count === 1;
    }

    async get(idUser: string, id: string): Promise<Account> {
        const account = await this.prisma.account.findFirst({
            where: { idUser, id }
        });
        if (!account) throw new Error(this.translator.translate("accounts.errors.notFound"));

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
    async getListSearch(idUser: string, name: string, limit?: number, page?: number): Promise<Pagination<Account>> {
        const take = limit ?? 30;
        const skip = page ?? 1;
        const shouldPaginate = (limit !== undefined || limit !== null);
        
        const [accounts, total] = await Promise.all([
            this.prisma.account.findMany({
                where: { idUser, name: { contains: name, mode: 'insensitive' } }, 
                orderBy: { name: "asc" },
                ...(shouldPaginate && {
                    take: take,
                    skip: (skip - 1) * take
                })
            }),
            this.prisma.account.count({
                where: { idUser, name: { contains: name, mode: 'insensitive' } }
            })
        ]);

        const pagination = new Pagination<Account>();
        pagination.list = accounts.map(ac => this.parse(ac));
        pagination.pages = (limit) ? Pagination.PageLength(total, limit) : 1;

        return pagination;
    }

    async getTotalBalance(idUser: string): Promise<number> {
        const total = await this.prisma.account.aggregate({
            where: { idUser },
            _sum: { balance: true }
        });

        return Money.fromDecimal(total._sum.balance);
    }
}