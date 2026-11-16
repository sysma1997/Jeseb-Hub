import { describe, it, expect, beforeEach } from "@jest/globals";
import { prismaMock } from "../shared/prisma/Singleton";
import { mockTranslator } from "../shared/TranslatorMock";

import { Debt } from "../../core/debt/domain/Debt";
import { DebtPayment } from "../../core/debt/domain/DebtPayment";
import { DebtRepository } from "../../core/debt/domain/DebtRepository";
import { DebtPrismaRepository } from "../../core/debt/infrastructure/DebtPrismaRepository";
import { Prisma } from "../../generated/prisma/client";
const Decimal = Prisma.Decimal;

describe("Debt Prisma Repository", () => {
    let repository: DebtRepository;

    const id = "4d511d6e-ea14-4b9b-a40b-b63231e6bb91";
    const idUser = "3bff1d1b-e647-47cc-a151-e54b52c1e673";
    const idDebt = "b3180f4e-445a-491f-8e2c-ef234b5c0314";
    const idAccount = "f2a6f450-2c24-4e3e-bf79-11ae31e23940";
    const date = new Date("2026-01-10T00:00:00.000Z");
    const dueDate = new Date("2026-02-10T00:00:00.000Z");

    beforeEach(() => {
        repository = new DebtPrismaRepository(prismaMock, mockTranslator);
    });

    it("Should add a debt.", async () => {
        const debt = new Debt(mockTranslator, "Ana", true, 1250, date, 
            id, idUser, 
            "Loan", dueDate);

        prismaMock.debt.create.mockResolvedValue({
            id, idUser, 
            person: "Ana", type: true, 
            amount: Decimal("12.50"), date, dueDate, 
            description: "Loan"
        });

        await expect(repository.add(debt)).resolves.toBeUndefined();
        expect(prismaMock.debt.create).toHaveBeenCalledWith({
            data: {
                id, idUser, 
                person: "Ana", type: true, 
                amount: "12.50", date, dueDate, 
                description: "Loan"
            }
        });
    });
    it("Should update a debt.", async () => {
        const debt = new Debt(mockTranslator, "Ana", false, 15000, date, 
            id, idUser, 
            "Credit card", dueDate);

        prismaMock.debt.update.mockResolvedValue({
            id, idUser, 
            person: "Ana", type: false, 
            amount: Decimal("150.00"), date, dueDate, 
            description: "Credit card"
        });

        await expect(repository.update(debt)).resolves.toBeUndefined();
        expect(prismaMock.debt.update).toHaveBeenCalledWith({
            where: { idUser, id }, 
            data: {
                person: "Ana", type: false, 
                amount: "150.00", date, dueDate, 
                description: "Credit card"
            }
        });
    });
    it("Should delete a debt.", async () => {
        prismaMock.debt.deleteMany.mockResolvedValue({ count: 1 });

        await expect(repository.delete(idUser, id)).resolves.toBeUndefined();
        expect(prismaMock.debt.deleteMany).toHaveBeenCalledWith({
            where: { idUser, id }
        });
    });
    it("Should throw an error when deleting a debt that does not exist.", async () => {
        prismaMock.debt.deleteMany.mockResolvedValue({ count: 0 });

        await expect(repository.delete(idUser, id)).rejects.toThrow("Debt not found.");
    });

    it("Should get a debt with its derived paid amount.", async () => {
        prismaMock.debt.findFirst.mockResolvedValue({
            id, idUser, 
            person: "Ana", type: true, 
            amount: Decimal("100.00"), date, dueDate, 
            description: "Loan", 
            payments: [
                { amount: Decimal("30.00") }, 
                { amount: Decimal("20.00") }
            ]
        } as any);

        const result = await repository.get(idUser, id);

        expect(result.id).toBe(id);
        expect(result.amount).toBe(10000);
        expect(result.paidAmount).toBe(5000);
        expect(result.pendingAmount).toBe(5000);
        expect(result.paymentCount).toBe(2);
        expect(prismaMock.debt.findFirst).toHaveBeenCalledWith({
            where: { idUser, id }, 
            include: { payments: { select: { amount: true } } }
        });
    });
    it("Should throw an error if the debt is not found.", async () => {
        prismaMock.debt.findFirst.mockResolvedValue(null);

        await expect(repository.get(idUser, id)).rejects.toThrow("Debt not found.");
    });

    it("Should get a paginated list of debts.", async () => {
        prismaMock.debt.findMany.mockResolvedValue([
            {
                id: "1", idUser, 
                person: "Ana", type: true, 
                amount: Decimal("100.00"), date, dueDate, 
                description: null, 
                payments: [{ amount: Decimal("25.00") }]
            }, 
            {
                id: "2", idUser, 
                person: "Luis", type: false, 
                amount: Decimal("50.00"), date: new Date("2026-01-09T00:00:00.000Z"), dueDate: null, 
                description: null, 
                payments: []
            }
        ] as any);
        prismaMock.debt.count.mockResolvedValue(2);

        const result = await repository.getList(idUser);

        expect(result.list).toHaveLength(2);
        expect(result.list[0]!.person).toBe("Ana");
        expect(result.list[0]!.pendingAmount).toBe(7500);
        expect(result.list[1]!.pendingAmount).toBe(5000);
        expect(result.pages).toBe(1);

        expect(prismaMock.debt.findMany).toHaveBeenCalledWith({
            where: { idUser }, 
            orderBy: { date: "desc" }, 
            include: { payments: { select: { amount: true } } }, 
            skip: 0, 
            take: 30
        });
        expect(prismaMock.debt.count).toHaveBeenCalledWith({
            where: { idUser }
        });
    });
    it("Should search debts by person.", async () => {
        prismaMock.debt.findMany.mockResolvedValue([
            {
                id, idUser, 
                person: "Ana", type: true, 
                amount: Decimal("100.00"), date, dueDate, 
                description: null, 
                payments: []
            }
        ] as any);
        prismaMock.debt.count.mockResolvedValue(1);

        const result = await repository.getListSearch(idUser, "an");

        expect(result.list).toHaveLength(1);
        expect(prismaMock.debt.findMany).toHaveBeenCalledWith({
            where: { idUser, person: { contains: "an", mode: "insensitive" } }, 
            orderBy: { date: "desc" }, 
            include: { payments: { select: { amount: true } } }, 
            skip: 0, 
            take: 30
        });
    });

    it("Should add a payment to an owned debt.", async () => {
        const payment = new DebtPayment(mockTranslator, date, 1250, idDebt, 
            id, idUser, 
            "Partial payment", undefined, idAccount, undefined, "Loans");

        prismaMock.debt.findFirst.mockResolvedValue({ id: idDebt } as any);
        prismaMock.debtPayment.create.mockResolvedValue({
            id, idUser, idDebt, 
            idAccount,
            date, amount: Decimal("12.50"), 
            description: "Partial payment",
            category: "Loans"
        } as any);

        await expect(repository.addPayment(idUser, payment)).resolves.toBeUndefined();
        expect(prismaMock.debt.findFirst).toHaveBeenCalledWith({
            where: { idUser, id: idDebt }, 
            select: { id: true }
        });
        expect(prismaMock.debtPayment.create).toHaveBeenCalledWith({
            data: {
                id, idUser, idDebt, 
                idAccount,
                date, amount: "12.50", 
                description: "Partial payment",
                category: "Loans"
            }
        });
    });
    it("Should not add a payment to a debt owned by another user.", async () => {
        const payment = new DebtPayment(mockTranslator, date, 1250, idDebt, 
            id, idUser);

        prismaMock.debt.findFirst.mockResolvedValue(null);

        await expect(repository.addPayment(idUser, payment)).rejects.toThrow("Debt not found.");
        expect(prismaMock.debtPayment.create).not.toHaveBeenCalled();
    });

    it("Should get the payment history of a debt.", async () => {
        prismaMock.debt.findFirst.mockResolvedValue({ id: idDebt } as any);
        prismaMock.debtPayment.findMany.mockResolvedValue([
            { id, idUser, idDebt, date, amount: Decimal("12.50"), description: "First" }, 
            { id: "2", idUser, idDebt, date, amount: Decimal("7.50"), description: null }
        ] as any);
        prismaMock.debtPayment.count.mockResolvedValue(2);

        const result = await repository.getPayments(idUser, idDebt);

        expect(result.list).toHaveLength(2);
        expect(result.list[0]!.amount).toBe(1250);
        expect(result.pages).toBe(1);
        expect(prismaMock.debtPayment.findMany).toHaveBeenCalledWith({
            where: { idUser, idDebt }, 
            orderBy: { date: "desc" }, 
            take: 30, 
            skip: 0,
            include: {
                account: { select: { name: true } },
                transaction: { select: { id: true } }
            }
        });
        expect(prismaMock.debtPayment.count).toHaveBeenCalledWith({
            where: { idUser, idDebt }
        });
    });
    it("Should not return the payment history of a debt owned by another user.", async () => {
        prismaMock.debt.findFirst.mockResolvedValue(null);

        await expect(repository.getPayments(idUser, idDebt)).rejects.toThrow("Debt not found.");
    });
    it("Should delete a payment.", async () => {
        prismaMock.debtPayment.deleteMany.mockResolvedValue({ count: 1 });

        await expect(repository.deletePayment(idUser, idDebt, id)).resolves.toBeUndefined();
        expect(prismaMock.debtPayment.deleteMany).toHaveBeenCalledWith({
            where: { idUser, idDebt, id }
        });
    });
    it("Should throw an error when deleting a payment that does not exist.", async () => {
        prismaMock.debtPayment.deleteMany.mockResolvedValue({ count: 0 });

        await expect(repository.deletePayment(idUser, idDebt, id)).rejects.toThrow("Payment not found.");
    });

    it("Should summarize pending, overdue and paid debts.", async () => {
        prismaMock.debt.findMany.mockResolvedValue([
            {
                type: true, amount: Decimal("100.00"), 
                dueDate: new Date("2000-01-01T00:00:00.000Z"), 
                payments: [{ amount: Decimal("30.00") }]
            }, 
            {
                type: false, amount: Decimal("50.00"), 
                dueDate: new Date("2100-01-01T00:00:00.000Z"), 
                payments: []
            }, 
            {
                type: true, amount: Decimal("20.00"), 
                dueDate: new Date("2100-01-01T00:00:00.000Z"), 
                payments: [{ amount: Decimal("20.00") }]
            }, 
            {
                type: false, amount: Decimal("10.00"), 
                dueDate: new Date("2000-01-01T00:00:00.000Z"), 
                payments: [{ amount: Decimal("4.00") }]
            }
        ] as any);

        const result = await repository.getSummary(idUser);

        expect(result).toEqual({
            receivable: 70, 
            payable: 56, 
            net: 14, 
            overdueReceivable: 70, 
            overduePayable: 6, 
            totalCount: 4, 
            pendingCount: 1, 
            overdueCount: 2, 
            paidCount: 1
        });
        expect(prismaMock.debt.findMany).toHaveBeenCalledWith({
            where: { idUser }, 
            select: {
                type: true, 
                amount: true, 
                dueDate: true, 
                payments: { select: { amount: true } }
            }
        });
    });
});
