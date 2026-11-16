import { describe, it, expect, beforeEach } from "@jest/globals";
import { mockDeep, mockReset, DeepMockProxy } from "jest-mock-extended";

import { Account } from "../../core/account/domain/Account";
import { Debt } from "../../core/debt/domain/Debt";
import { DebtPayment } from "../../core/debt/domain/DebtPayment";
import { DebtRepository } from "../../core/debt/domain/DebtRepository";
import { DebtService } from "../../core/debt/application/DebtService";
import { TransactionRepository } from "../../core/transaction/domain/TransactionRepository";
import { UnitOfWork, UnitOfWorkContext } from "../../core/shared/domain/UnitOfWork";
import { mockTranslator } from "../shared/TranslatorMock";

describe("Debt Service", () => {
    let repository: DeepMockProxy<DebtRepository>;
    let accounts: DeepMockProxy<import("../../core/account/domain/AccountRepository").AccountRepository>;
    let transactions: DeepMockProxy<TransactionRepository>;
    let service: DebtService;

    const idUser = "3bff1d1b-e647-47cc-a151-e54b52c1e673";
    const idDebt = "4d511d1b-e647-47cc-a151-e54b52c1e673";
    const idAccount = "b3180f4e-445a-491f-8e2c-ef234b5c0314";
    const date = new Date("2026-01-10T00:00:00.000Z");

    beforeEach(() => {
        repository = mockDeep<DebtRepository>();
        accounts = mockDeep<import("../../core/account/domain/AccountRepository").AccountRepository>();
        transactions = mockDeep<TransactionRepository>();
        mockReset(repository);
        mockReset(accounts);
        mockReset(transactions);

        const unitOfWork: UnitOfWork = {
            run: async <T>(work: (context: UnitOfWorkContext) => Promise<T>): Promise<T> =>
                work({ accounts, transactions, debts: repository })
        };
        service = new DebtService(mockTranslator, unitOfWork);
    });

    it("records an incoming payment as a transaction and increases the selected account", async () => {
        const debt = new Debt(mockTranslator, "Ana", true, 10000, date, idDebt, idUser);
        const account = new Account(mockTranslator, "Cash", 0, idAccount, idUser);
        const payment = new DebtPayment(mockTranslator, date, 2500, idDebt, "payment-id",
            idUser, "Partial payment", undefined, idAccount, undefined, "Loans");
        repository.get.mockResolvedValue(debt);
        accounts.get.mockResolvedValue(account);

        await service.addPayment(idUser, payment);

        expect(repository.lockDebt).toHaveBeenCalledWith(idUser, idDebt);
        expect(accounts.adjust).toHaveBeenCalledWith(idUser, idAccount, 2500);
        expect(repository.addPayment).toHaveBeenCalledWith(idUser, expect.objectContaining({
            id: "payment-id",
            idAccount,
            account: "Cash",
            category: "Loans"
        }));
        expect(transactions.add).toHaveBeenCalledWith(expect.objectContaining({
            type: true,
            account: "Cash",
            value: 2500,
            category: "Loans",
            debtPaymentId: "payment-id"
        }));
    });

    it("records an outgoing payment only when the account has sufficient balance", async () => {
        const debt = new Debt(mockTranslator, "Banco", false, 10000, date, idDebt, idUser);
        const account = new Account(mockTranslator, "Checking", 4000, idAccount, idUser);
        const payment = new DebtPayment(mockTranslator, date, 4000, idDebt, "payment-id",
            idUser, undefined, undefined, idAccount);
        repository.get.mockResolvedValue(debt);
        accounts.get.mockResolvedValue(account);
        accounts.adjustIfEnough.mockResolvedValue(true);

        await service.addPayment(idUser, payment);

        expect(accounts.adjustIfEnough).toHaveBeenCalledWith(idUser, idAccount, 4000);
        expect(transactions.add).toHaveBeenCalledWith(expect.objectContaining({
            type: false,
            value: 4000,
            debtPaymentId: "payment-id"
        }));
    });

    it("rejects an outgoing payment if the account balance is insufficient", async () => {
        const debt = new Debt(mockTranslator, "Banco", false, 10000, date, idDebt, idUser);
        const account = new Account(mockTranslator, "Checking", 3000, idAccount, idUser);
        const payment = new DebtPayment(mockTranslator, date, 4000, idDebt, "payment-id",
            idUser, undefined, undefined, idAccount);
        repository.get.mockResolvedValue(debt);
        accounts.get.mockResolvedValue(account);
        accounts.adjustIfEnough.mockResolvedValue(false);

        await expect(service.addPayment(idUser, payment))
            .rejects.toThrow("The selected account does not have enough balance.");
        expect(repository.addPayment).not.toHaveBeenCalled();
        expect(transactions.add).not.toHaveBeenCalled();
    });

    it("rejects a payment greater than the current pending amount", async () => {
        const debt = new Debt(mockTranslator, "Ana", true, 10000, date, idDebt, idUser,
            undefined, undefined, 4000, 1);
        const payment = new DebtPayment(mockTranslator, date, 6001, idDebt, "payment-id",
            idUser, undefined, undefined, idAccount);
        repository.get.mockResolvedValue(debt);

        await expect(service.addPayment(idUser, payment))
            .rejects.toThrow("The payment cannot exceed the pending amount of 60.00.");
        expect(accounts.adjust).not.toHaveBeenCalled();
        expect(repository.addPayment).not.toHaveBeenCalled();
    });

    it("reverses the account movement and deletes the linked transaction with a payment", async () => {
        const payment = new DebtPayment(mockTranslator, date, 2500, idDebt, "payment-id",
            idUser, undefined, undefined, idAccount);
        repository.getPayment.mockResolvedValue(payment);
        transactions.getByDebtPaymentId.mockResolvedValue({
            id: "transaction-id",
            type: true,
            value: 2500,
            account: "Renamed account"
        } as any);
        accounts.get.mockResolvedValue(new Account(mockTranslator, "Renamed account", 2500, idAccount, idUser));

        await service.deletePayment(idUser, idDebt, "payment-id");

        expect(repository.lockDebt).toHaveBeenCalledWith(idUser, idDebt);
        expect(accounts.adjust).toHaveBeenCalledWith(idUser, idAccount, -2500);
        expect(transactions.delete).toHaveBeenCalledWith(idUser, "transaction-id");
        expect(repository.deletePayment).toHaveBeenCalledWith(idUser, idDebt, "payment-id");
    });

    it("does not allow changing debt direction after a payment", async () => {
        const current = new Debt(mockTranslator, "Ana", true, 10000, date, idDebt, idUser,
            undefined, undefined, 1000, 1);
        const changed = new Debt(mockTranslator, "Ana", false, 10000, date, idDebt, idUser,
            undefined, undefined, 1000, 1);
        repository.get.mockResolvedValue(current);

        await expect(service.update(idUser, changed))
            .rejects.toThrow("The debt type cannot be changed after payments have been recorded.");
        expect(repository.update).not.toHaveBeenCalled();
    });

    it("deletes a debt without deleting any of its ledger transactions", async () => {
        await service.deleteDebt(idUser, idDebt);

        expect(repository.lockDebt).toHaveBeenCalledWith(idUser, idDebt);
        expect(repository.delete).toHaveBeenCalledWith(idUser, idDebt);
        expect(transactions.delete).not.toHaveBeenCalled();
        expect(transactions.deleteByIds).not.toHaveBeenCalled();
    });
});
