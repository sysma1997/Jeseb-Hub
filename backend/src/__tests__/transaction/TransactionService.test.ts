import { describe, it, expect, beforeEach } from "@jest/globals";
import { mockDeep, mockReset, DeepMockProxy } from "jest-mock-extended";

import { AccountRepository } from "../../core/account/domain/AccountRepository";
import { CategoryRepository } from "../../core/category/domain/CategoryRepository";
import { Transaction } from "../../core/transaction/domain/Transaction";
import { TransactionRepository } from "../../core/transaction/domain/TransactionRepository";
import { TransactionService } from "../../core/transaction/application/TransactionService";
import { UnitOfWork, UnitOfWorkContext } from "../../core/shared/domain/UnitOfWork";
import { mockTranslator } from "../shared/TranslatorMock";

describe("Transaction Service debt payment protections", () => {
    let accounts: DeepMockProxy<AccountRepository>;
    let categories: DeepMockProxy<CategoryRepository>;
    let transactions: DeepMockProxy<TransactionRepository>;
    let service: TransactionService;

    const idUser = "3bff1d1b-e647-47cc-a151-e54b52c1e673";
    const date = new Date("2026-01-10T00:00:00.000Z");

    beforeEach(() => {
        accounts = mockDeep<AccountRepository>();
        categories = mockDeep<CategoryRepository>();
        transactions = mockDeep<TransactionRepository>();
        mockReset(accounts);
        mockReset(categories);
        mockReset(transactions);

        const unitOfWork: UnitOfWork = {
            run: async <T>(work: (context: UnitOfWorkContext) => Promise<T>): Promise<T> =>
                work({ accounts, transactions, debts: mockDeep() })
        };

        service = new TransactionService(transactions, accounts, categories, mockTranslator, unitOfWork);
    });

    it("does not allow updating a debt-payment transaction directly", async () => {
        const linked = new Transaction(mockTranslator, date, true, "Cash", 2500,
            "transaction-id", idUser, undefined, undefined, undefined, false, undefined, "payment-id");
        transactions.get.mockResolvedValue(linked);

        const updated = new Transaction(mockTranslator, date, true, "Cash", 3000,
            "transaction-id", idUser);
        await expect(service.update(updated))
            .rejects.toThrow("This transaction is linked to a debt payment. Manage it from the debt details.");

        expect(accounts.search).not.toHaveBeenCalled();
        expect(transactions.update).not.toHaveBeenCalled();
    });

    it("does not allow deleting a debt-payment transaction directly", async () => {
        const linked = new Transaction(mockTranslator, date, true, "Cash", 2500,
            "transaction-id", idUser, undefined, undefined, undefined, false, undefined, "payment-id");
        transactions.get.mockResolvedValue(linked);

        await expect(service.delete(idUser, "transaction-id"))
            .rejects.toThrow("This transaction is linked to a debt payment. Manage it from the debt details.");

        expect(accounts.search).not.toHaveBeenCalled();
        expect(transactions.delete).not.toHaveBeenCalled();
    });
});
