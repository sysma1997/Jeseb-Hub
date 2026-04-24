import { PrismaClient } from "@prisma/client";
import { v4 as Uuid } from "uuid";

import { Transaction } from "../domain/Transaction";
import type { TransactionFilter } from "../domain/TransactionFilter";
import { TransactionRepository } from "../domain/TransactionRepository";
import { Pagination } from "../../shared/domain/Pagination";
import { TranslatorRepository } from "../../shared/domain/TranslatorRepository";

export class TransactionPrismaRepository implements TransactionRepository {
    private readonly prisma: PrismaClient;
    private readonly translator: TranslatorRepository;

    constructor(prisma: PrismaClient, translator: TranslatorRepository) {
        this.prisma = prisma;
        this.translator = translator;
    }
    
    async add(transaction: Transaction): Promise<void> {
        await this.prisma.transaction.create({
            data: {
                id: transaction.id ?? Uuid(), 
                idUser: transaction.idUser!, 
                date: transaction.date, 
                type: transaction.type, 
                account: transaction.account, 
                value: transaction.value,

                category: transaction.category ?? null, 
                description: transaction.description ?? null
            }
        });
    }
    async addRange(transactions: Transaction[]): Promise<void> {
        await this.prisma.$transaction(transactions.map(transaction => this.prisma.transaction.create({
            data: {
                id: transaction.id ?? Uuid(), 
                idUser: transaction.idUser!, 
                date: transaction.date, 
                type: transaction.type, 
                account: transaction.account, 
                value: transaction.value,

                category: transaction.category ?? null, 
                description: transaction.description ?? null
            }
        })));
    }
    async update(transaction: Transaction): Promise<void> {
        await this.prisma.transaction.update({
            where: { id: transaction.id!, idUser: transaction.idUser! }, 
            data: {
                date: transaction.date, 
                type: transaction.type, 
                account: transaction.account, 
                value: transaction.value,

                category: transaction.category ?? null,
                description: transaction.description ?? null
            }
        });
    }
    async delete(idUser: string, id: string): Promise<void> {
        await this.prisma.transaction.delete({ 
            where: { id: id, idUser: idUser } 
        });
    }

    async get(idUser: string, id: string): Promise<Transaction> {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id, idUser },
        });
        if (!transaction) throw new Error(this.translator.translate("transactions.errors.notFound"));

        return new Transaction(this.translator, transaction.date, transaction.type, transaction.account, 
            Number(transaction.value), 
            transaction.id ?? undefined, 
            transaction.idUser ?? undefined, 
            transaction.category ?? undefined, 
            transaction.description ?? undefined, 
            undefined);
    }

    async getList(idUser: string, limit?: number, page?: number): Promise<Pagination<Transaction>> {
        const take = limit ?? 30;
        const skip = page ?? 1;
        const shouldPaginate = (limit !== undefined || limit !== null);

        const [transactions, total] = await Promise.all([
            this.prisma.transaction.findMany({
                where: { idUser: idUser }, 
                orderBy: { date: 'desc' }, 
                ...(shouldPaginate && {
                    take: take, 
                    skip: (skip - 1) * take
                })
            }),
            this.prisma.transaction.count({ where: { idUser } })
        ]);

        const pagination = new Pagination<Transaction>();
        pagination.list = transactions.map(t => new Transaction(this.translator, t.date, t.type, t.account, 
            Number(t.value), 
            t.id ?? undefined, 
            t.idUser ?? undefined, 
            t.category ?? undefined, 
            t.description ?? undefined, 
            undefined
        ));
        pagination.pages = (limit) ? Pagination.PageLength(total, limit) : 1;
        return pagination;
    }
    async getCount(idUser: string): Promise<number> {
        return await this.prisma.transaction.count({ where: { idUser } });
    }
    async getListFilter(idUser: string, filter: TransactionFilter, limit?: number, page?: number): Promise<Pagination<Transaction>> {
        const take = limit ?? 30;
        const skip = page ?? 1;
        const shouldPaginate = (limit !== undefined || limit !== null);
        
        const where: any = { idUser };
        if (filter.dateFrom) where.date = { gte: filter.dateFrom };
        if (filter.dateTo) where.date = { lte: filter.dateTo };
        if (filter.type !== undefined) where.type = filter.type;
        if (filter.account) where.account = filter.account;
        if (filter.category) where.category = filter.category;

        const [transactions, total] = await Promise.all([
            this.prisma.transaction.findMany({
                where, 
                orderBy: { date: 'desc' }, 
                ...(shouldPaginate && {
                    take, 
                    skip: (skip - 1) * take
                })
            }),
            this.prisma.transaction.count({ where })
        ]);

        const pagination = new Pagination<Transaction>();
        pagination.list = transactions.map(t => new Transaction(this.translator, t.date, t.type, t.account, 
            Number(t.value), 
            t.id ?? undefined, 
            t.idUser ?? undefined, 
            t.category ?? undefined, 
            t.description ?? undefined, 
            undefined
        ));
        pagination.pages = (limit) ? Pagination.PageLength(total, limit) : 1;
        return pagination;
    }
}