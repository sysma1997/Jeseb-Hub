import { describe, it, expect, beforeEach } from "@jest/globals";
import { prismaMock } from "../shared/prisma/Singleton";

import { Account } from "../../core/account/domain/Account";
import { AccountRepository } from "../../core/account/domain/AccountRepository";
import { AccountPrismaRepository } from "../../core/account/infrastructure/AccountPrismaRepository"; 
import { Decimal } from "@prisma/client/runtime/library";

describe("Account Prisma Repository", () => {
    let repository: AccountRepository;

    beforeEach(() => {
        repository = new AccountPrismaRepository(prismaMock);
    });

    it("Should add an account.", async () => {
        const id = "4d511d6e-ea14-4b9b-a40b-b63231e6bb91";
        const idUser = "3bff1d1b-e647-47cc-a151-e54b52c1e673";
        const account = new Account("Bank", 0, id, idUser);

        prismaMock.account.findFirst.mockResolvedValue(null);
        prismaMock.account.create.mockResolvedValue({
            id: id, 
            idUser: idUser, 
            name: "Bank", 
            balance: Decimal(0)
        });

        await expect(repository.add(account)).resolves.toBeUndefined();
        expect(prismaMock.account.findFirst).toHaveBeenCalledWith({
            where: { idUser, name: "Bank" }
        });
        expect(prismaMock.account.create).toHaveBeenCalledWith({
            data: {
                id, idUser, 
                name: "Bank", 
                balance: 0
            }
        });
    });
    it("Should update an account.", async () => {
        const id = "4d511d6e-ea14-4b9b-a40b-b63231e6bb91";
        const idUser = "3bff1d1b-e647-47cc-a151-e54b52c1e673";
        const account = new Account("Cash", 120.4, id, idUser);

        prismaMock.account.update.mockResolvedValue({
            id, 
            idUser, 
            name: "Cash", 
            balance: Decimal(120.4)
        });

        await expect(repository.update(account)).resolves.toBeUndefined();
        expect(prismaMock.account.update).toHaveBeenCalledWith({
            where: { idUser, id }, 
            data: {
                name: "Cash", 
                balance: 120.4
            }
        });
    });
    it("Should delete an account.", async () => {
        const id = "4d511d6e-ea14-4b9b-a40b-b63231e6bb91";
        const idUser = "3bff1d1b-e647-47cc-a151-e54b52c1e673";

        prismaMock.account.delete.mockResolvedValue({
            id, idUser, 
            name: "Bank", 
            balance: Decimal(0)
        });

        await expect(repository.delete(idUser, id)).resolves.toBeUndefined();
        expect(prismaMock.account.delete).toHaveBeenCalledWith({
            where: { idUser, id }
        });
    });

    it("Should a get account.", async () => {
        const id = "4d511d6e-ea14-4b9b-a40b-b63231e6bb91";
        const idUser = "3bff1d1b-e647-47cc-a151-e54b52c1e673";

        prismaMock.account.findFirst.mockResolvedValue({
            id, idUser, 
            name: "Bank", 
            balance: Decimal(0)
        });
        
        const result = await repository.get(idUser, id);

        expect(result).toEqual(new Account("Bank", 0, id, idUser));
        expect(prismaMock.account.findFirst).toHaveBeenCalledWith({
            where: { idUser, id }
        });
    });
    it("Should a search account.", async () => {
        const id = "4d511d6e-ea14-4b9b-a40b-b63231e6bb91";
        const idUser = "3bff1d1b-e647-47cc-a151-e54b52c1e673";
        const name = "Bank";

        prismaMock.account.findFirst.mockResolvedValue({
            id, idUser, 
            name: "Bank", 
            balance: Decimal(0)
        });

        const result = await repository.search(idUser, name);

        expect(result).toEqual(new Account("Bank", 0, id, idUser));
        expect(prismaMock.account.findFirst).toHaveBeenCalledWith({
            where: { idUser, name }
        });
    });

    it("Should get a paginated list of accounts.", async () => {
        const idUser = "3bff1d1b-e647-47cc-a151-e54b52c1e673";

        prismaMock.account.findMany.mockResolvedValue([
            { id: "b3180f4e-445a-491f-8e2c-ef234b5c0314", idUser, name: "Bank", balance: Decimal(120.4) }, 
            { id: "030e06a5-b557-423a-b8a5-98c49778c156", idUser, name: "Cash", balance: Decimal(232.32) }
        ]);
        prismaMock.account.count.mockResolvedValue(2);

        const result = await repository.getList(idUser);

        expect(result.list).toEqual([
            new Account("Bank", 120.4, "b3180f4e-445a-491f-8e2c-ef234b5c0314", idUser), 
            new Account("Cash", 232.32, "030e06a5-b557-423a-b8a5-98c49778c156", idUser)
        ]);
        expect(result.pages).toBe(1);

        expect(prismaMock.account.findMany).toHaveBeenCalledWith({
            where: { idUser }, 
            orderBy: { name: "asc" }, 
            skip: 0, 
            take: 30,
        });
        expect(prismaMock.account.count).toHaveBeenCalledWith({
            where: { idUser }
        });
    });

    it("Shouldn't there be a search account.", async () => {
        const id = "4d511d6e-ea14-4b9b-a40b-b63231e6bb91";
        const idUser = "3bff1d1b-e647-47cc-a151-e54b52c1e673";
        const name = "Cash";

        prismaMock.account.findFirst.mockResolvedValue(null);

        const result = await repository.search(idUser, name);

        expect(result).toBeUndefined();
        expect(prismaMock.account.findFirst).toHaveBeenCalledWith({
            where: { idUser, name: name }
        });
    });
    it("Should throw an error if account is not found.", async () => {
        const id = "non-existent-id";
        const idUser = "3bff1d1b-e647-47cc-a151-e54b52c1e673";

        prismaMock.account.findFirst.mockResolvedValue(null);

        await expect(repository.get(idUser, id)).rejects.toThrow("Account not found or not exists.");
    });
});