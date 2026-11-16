import { PrismaClient, Prisma } from "../../../generated/prisma/client";
import { v4 as Uuid } from "uuid";

import { Debt } from "../domain/Debt";
import { DebtPayment } from "../domain/DebtPayment";
import { DebtRepository } from "../domain/DebtRepository";
import type { DebtSummary } from "../domain/DebtSummary";
import { isDebtOverdue } from "../domain/DebtStatus";
import { Pagination } from "../../shared/domain/Pagination";
import { TranslatorRepository } from "../../shared/domain/TranslatorRepository";
import { Money } from "../../shared/domain/Money";

export class DebtPrismaRepository implements DebtRepository {
    // igual que los demas repositorios, acepta el cliente de una transaccion
    // para poder participar en una unit of work sin cambiar su interfaz
    private readonly prisma: PrismaClient | Prisma.TransactionClient;
    private readonly translator: TranslatorRepository;

    constructor(prisma: PrismaClient | Prisma.TransactionClient, translator: TranslatorRepository) {
        this.prisma = prisma;
        this.translator = translator;
    }

    private parse(debt: any): Debt {
        const payments: any[] = Array.isArray(debt.payments) ? debt.payments : [];
        // el saldo abonado se deriva de los abonos guardados, nunca de un campo
        // editable. Se acumula en centavos enteros para no arrastrar error decimal.
        const paidAmount: number = payments.reduce((sum, payment) => 
            sum + Money.fromDecimal(payment.amount), 0);

        return Debt.FromDto(this.translator, {
            ...debt, 
            description: debt.description ?? undefined, 
            dueDate: debt.dueDate ?? undefined, 
            paidAmount: Money.fromCents(paidAmount), 
            paymentCount: payments.length
        });
    }
    private parsePayment(payment: any): DebtPayment {
        return DebtPayment.FromDto(this.translator, {
            ...payment, 
            description: payment.description ?? undefined,
            idAccount: payment.idAccount ?? undefined,
            account: payment.account?.name ?? undefined,
            category: payment.category ?? undefined,
            idTransaction: payment.transaction?.id ?? undefined
        });
    }

    async add(debt: Debt): Promise<void> {
        await this.prisma.debt.create({
            data: {
                id: debt.id ?? Uuid(), 
                idUser: debt.idUser!, 
                person: debt.person, 
                type: debt.type, 
                amount: Money.toDecimalString(debt.amount), 
                date: debt.date, 
                dueDate: debt.dueDate ?? null, 
                description: debt.description ?? null
            }
        });
    }
    async update(debt: Debt): Promise<void> {
        await this.prisma.debt.update({
            where: { idUser: debt.idUser!, id: debt.id! }, 
            data: {
                person: debt.person, 
                type: debt.type, 
                amount: Money.toDecimalString(debt.amount), 
                date: debt.date, 
                dueDate: debt.dueDate ?? null, 
                description: debt.description ?? null
            }
        });
    }
    async delete(idUser: string, id: string): Promise<void> {
        // deleteMany permite filtrar por idUser y comprobar el resultado sin
        // exponer si el id existe en otro usuario. Los abonos caen por cascade.
        const result = await this.prisma.debt.deleteMany({
            where: { idUser, id }
        });
        if (result.count === 0) throw new Error(this.translator.translate("debts.errors.notFound"));
    }

    async lockDebt(idUser: string, id: string): Promise<void> {
        const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`
            SELECT "id" FROM "debts"
            WHERE "idUser" = ${idUser} AND "id" = ${id}
            FOR UPDATE
        `;
        if (rows.length === 0)
            throw new Error(this.translator.translate("debts.errors.notFound"));
    }

    async get(idUser: string, id: string): Promise<Debt> {
        const debt = await this.prisma.debt.findFirst({
            where: { idUser, id }, 
            include: { payments: { select: { amount: true } } }
        });
        if (!debt) throw new Error(this.translator.translate("debts.errors.notFound"));

        return this.parse(debt);
    }
    async getList(idUser: string, limit?: number, page?: number): Promise<Pagination<Debt>> {
        const take = limit ?? 30;
        const skip = page ?? 1;
        const shouldPaginate = (limit !== undefined || limit !== null);

        const [debts, total] = await Promise.all([
            this.prisma.debt.findMany({
                where: { idUser }, 
                orderBy: { date: "desc" }, 
                include: { payments: { select: { amount: true } } }, 
                ...(shouldPaginate && {
                    take: take, 
                    skip: (skip - 1) * take
                })
            }), 
            this.prisma.debt.count({ where: { idUser } })
        ]);

        const pagination = new Pagination<Debt>();
        pagination.list = debts.map(debt => this.parse(debt));
        pagination.pages = (limit) ? Pagination.PageLength(total, limit) : 1;

        return pagination;
    }
    async getListSearch(idUser: string, person: string, limit?: number, page?: number): Promise<Pagination<Debt>> {
        const take = limit ?? 30;
        const skip = page ?? 1;
        const shouldPaginate = (limit !== undefined || limit !== null);
        const where = { idUser, person: { contains: person, mode: "insensitive" as const } };

        const [debts, total] = await Promise.all([
            this.prisma.debt.findMany({
                where, 
                orderBy: { date: "desc" }, 
                include: { payments: { select: { amount: true } } }, 
                ...(shouldPaginate && {
                    take: take, 
                    skip: (skip - 1) * take
                })
            }), 
            this.prisma.debt.count({ where })
        ]);

        const pagination = new Pagination<Debt>();
        pagination.list = debts.map(debt => this.parse(debt));
        pagination.pages = (limit) ? Pagination.PageLength(total, limit) : 1;

        return pagination;
    }

    async addPayment(idUser: string, payment: DebtPayment): Promise<void> {
        // defensa en profundidad: aunque el servicio ya cargo la deuda con el
        // idUser autenticado, el repositorio no crea abonos sobre deudas ajenas
        const debt = await this.prisma.debt.findFirst({
            where: { idUser, id: payment.idDebt }, 
            select: { id: true }
        });
        if (!debt) throw new Error(this.translator.translate("debts.errors.notFound"));

        await this.prisma.debtPayment.create({
            data: {
                id: payment.id ?? Uuid(), 
                idUser, 
                idDebt: payment.idDebt, 
                idAccount: payment.idAccount ?? null,
                date: payment.date, 
                amount: Money.toDecimalString(payment.amount), 
                description: payment.description ?? null,
                category: payment.category ?? null
            }
        });
    }
    async getPayment(idUser: string, idDebt: string, id: string): Promise<DebtPayment> {
        const payment = await this.prisma.debtPayment.findFirst({
            where: { idUser, idDebt, id },
            include: {
                account: { select: { name: true } },
                transaction: { select: { id: true } }
            }
        });
        if (!payment)
            throw new Error(this.translator.translate("debts.errors.paymentNotFound"));

        return this.parsePayment(payment);
    }
    async getPayments(idUser: string, idDebt: string, limit?: number, page?: number): Promise<Pagination<DebtPayment>> {
        const debt = await this.prisma.debt.findFirst({
            where: { idUser, id: idDebt }, 
            select: { id: true }
        });
        if (!debt) throw new Error(this.translator.translate("debts.errors.notFound"));

        const take = limit ?? 30;
        const skip = page ?? 1;
        const where = { idUser, idDebt };

        const [payments, total] = await Promise.all([
            this.prisma.debtPayment.findMany({
                where, 
                orderBy: { date: "desc" }, 
                take: take, 
                skip: (skip - 1) * take,
                include: {
                    account: { select: { name: true } },
                    transaction: { select: { id: true } }
                }
            }), 
            this.prisma.debtPayment.count({ where })
        ]);

        const pagination = new Pagination<DebtPayment>();
        pagination.list = payments.map(payment => this.parsePayment(payment));
        pagination.pages = (limit) ? Pagination.PageLength(total, limit) : 1;

        return pagination;
    }
    async deletePayment(idUser: string, idDebt: string, id: string): Promise<void> {
        const result = await this.prisma.debtPayment.deleteMany({
            where: { idUser, idDebt, id }
        });
        if (result.count === 0) 
            throw new Error(this.translator.translate("debts.errors.paymentNotFound"));
    }

    async getSummary(idUser: string): Promise<DebtSummary> {
        const debts = await this.prisma.debt.findMany({
            where: { idUser }, 
            select: {
                type: true, 
                amount: true, 
                dueDate: true, 
                payments: { select: { amount: true } }
            }
        });

        const now = new Date();
        let receivable = 0;
        let payable = 0;
        let overdueReceivable = 0;
        let overduePayable = 0;
        let pendingCount = 0;
        let overdueCount = 0;
        let paidCount = 0;

        for (const debt of debts) {
            const paid = debt.payments.reduce((sum, payment) => 
                sum + Money.fromDecimal(payment.amount), 0);
            const pending = Math.max(0, Money.fromDecimal(debt.amount) - paid);

            if (pending <= 0) {
                paidCount++;
                continue;
            }

            const overdue = isDebtOverdue(debt.dueDate ?? undefined, now);
            if (overdue) overdueCount++;
            else pendingCount++;

            if (debt.type) {
                receivable += pending;
                if (overdue) overdueReceivable += pending;
            }
            else {
                payable += pending;
                if (overdue) overduePayable += pending;
            }
        }

        return {
            receivable: Money.fromCents(receivable), 
            payable: Money.fromCents(payable), 
            net: Money.fromCents(receivable - payable), 
            overdueReceivable: Money.fromCents(overdueReceivable), 
            overduePayable: Money.fromCents(overduePayable), 
            totalCount: debts.length, 
            pendingCount, 
            overdueCount, 
            paidCount
        };
    }
}
