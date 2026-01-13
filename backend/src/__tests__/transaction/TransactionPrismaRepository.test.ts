import { describe, it, expect, beforeEach } from "@jest/globals";
import { prismaMock } from "../shared/prisma/Singleton";

import { Transaction } from "../../core/transaction/domain/Transaction";
import { TransactionRepository } from "../../core/transaction/domain/TransactionRepository";
import { TransactionPrismaRepository } from "../../core/transaction/infrastructure/TransactionPrismaRepository";
import { Decimal } from "@prisma/client/runtime/library";

describe("Transaction Prisma Repository", () => {
    let repository: TransactionRepository;

    beforeEach(() => {
        repository = new TransactionPrismaRepository(prismaMock);
    });

    it("Should add a transaction.", async () => {
        const id = "4d511d6e-ea14-4b9b-a40b-b63231e6bb91";
        const idUser = "3bff1d1b-e647-47cc-a151-e54b52c1e673";
        const date = new Date(2025, 8, 12);
        const type = true;
        const account = "Bank";
        const value = 12.57;
        const category = "Savings";
        const description = "Testing with Jest";
        
        const transaction = new Transaction(date, type, account, value, 
            id, idUser, 
            category, description);

        prismaMock.transaction.create.mockResolvedValue({
            id, idUser, date, type, account, 
            value: Decimal(value), 
            category, description
        });

        await expect(repository.add(transaction)).resolves.toBeUndefined();
        expect(prismaMock.transaction.create).toHaveBeenCalledWith({
            data: {
                id, idUser, 
                date, type, account, 
                value, 
                category, description
            },
        });
    });
    it("Should update a transaction.", async () => {
        const id = "4d511d6e-ea14-4b9b-a40b-b63231e6bb91";
        const idUser = "3bff1d1b-e647-47cc-a151-e54b52c1e673";
        const date = new Date(2025, 8, 12);
        const type = true;
        const account = "Bank";
        const value = 12.57;
        const category = "Savings";
        const description = "Testing with Jest";
        
        const transaction = new Transaction(date, type, account, value, 
            id, idUser, 
            category, description);

        prismaMock.transaction.update.mockResolvedValue({
            id, idUser, date, type, account, 
            value: Decimal(value), 
            category, description
        });

        await expect(repository.update(transaction)).resolves.toBeUndefined();
        expect(prismaMock.transaction.update).toHaveBeenCalledWith({
            where: { idUser, id },
            data: { 
                date, type, account, 
                value, 
                category, description
            },
        });
    });
    it("Should delete a transaction.", async () => {
        const id = "4d511d6e-ea14-4b9b-a40b-b63231e6bb91";
        const idUser = "3bff1d1b-e647-47cc-a151-e54b52c1e673";
        const date = new Date(2025, 8, 12);
        const type = true;
        const account = "Bank";
        const value = 12.57;
        const category = "Savings";
        const description = "Testing with Jest";

        prismaMock.transaction.delete.mockResolvedValue({
            id, idUser, date, type, account, 
            value: Decimal(value), 
            category, description
        });

        await expect(repository.delete(idUser, id)).resolves.toBeUndefined();
        expect(prismaMock.transaction.delete).toHaveBeenCalledWith({
            where: { idUser, id },
        });
    });

    it("Should get a transaction.", async () => {
        const id = "4d511d6e-ea14-4b9b-a40b-b63231e6bb91";
        const idUser = "3bff1d1b-e647-47cc-a151-e54b52c1e673";
        const date = new Date(2025, 8, 12);
        const type = true;
        const account = "Bank";
        const value = 12.57;
        const category = "Savings";
        const description = "Testing with Jest";
        
        const transaction = new Transaction(date, type, account, value, 
            id, idUser, 
            category, description);

        prismaMock.transaction.findUnique.mockResolvedValue({
            id, idUser, date, type, account, 
            value: Decimal(value), 
            category, description
        });

        const result = await repository.get(idUser, id);

        expect(result).toEqual(transaction);
        expect(prismaMock.transaction.findUnique).toHaveBeenCalledWith({
            where: { idUser, id },
        });
    });

    it("Should get a paginated list of transactions.", async () => {
        const idUser = "3bff1d1b-e647-47cc-a151-e54b52c1e673";

        prismaMock.transaction.findMany.mockResolvedValue([
            { 
                id: "4d511d6e-ea14-4b9b-a40b-b63231e6bb911", 
                idUser, 
                date: new Date(2025, 8, 12), 
                type: true, 
                account: "Bank",
                value: Decimal(25.3), 
                category: "Groceries",
                description: null 
            },
            { 
                id: "c40b4cff-407b-4d43-80b4-e885de34ac97", 
                idUser, 
                date: new Date(2025, 8, 13), 
                type: false, 
                account: "Cash",
                value: Decimal(12.99), 
                category: "Utilities",
                description: "Movies and musics"
            },
        ]);
        prismaMock.transaction.count.mockResolvedValue(2);

        const result = await repository.getList(idUser);

        expect(result.list).toEqual([
            new Transaction(new Date(2025, 8, 12), true, "Bank", 
                25.3, "4d511d6e-ea14-4b9b-a40b-b63231e6bb911", idUser, 
                "Groceries"),
            new Transaction(new Date(2025, 8, 13), false, "Cash", 
                12.99, "c40b4cff-407b-4d43-80b4-e885de34ac97", idUser, 
                "Utilities", "Movies and musics"),
        ]);
        expect(result.pages).toBe(1);

        expect(prismaMock.transaction.findMany).toHaveBeenCalledWith({
            where: { idUser },
            orderBy: { date: "desc" },
            skip: 0,
            take: 30,
        });
        expect(prismaMock.transaction.count).toHaveBeenCalledWith({
            where: { idUser },
        });
    });
});