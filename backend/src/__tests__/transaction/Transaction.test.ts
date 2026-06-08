import { describe, it, expect } from "@jest/globals";
import dayjs from "dayjs";
import dayjsUtc from "dayjs/plugin/utc";

import { Transaction } from "../../core/transaction/domain/Transaction";

dayjs.extend(dayjsUtc);

describe("Transaction Domain", () => {
    it("Should create a Transaction with valid properties.", () => {
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

        expect(transaction.id).toBe(id);
        expect(transaction.idUser).toBe(idUser);
        expect(transaction.date).toBe(date);
        expect(transaction.type).toBe(type);
        expect(transaction.account).toBe(account);
        expect(transaction.value).toBe(value);
        expect(transaction.category).toBe(category);
        expect(transaction.description).toBe(description);
    });
    
    it("Should throw an error when creating transaction without account.", () => {
        const date = new Date(2025, 8, 12);
        const type = true;
        const value = 12.57;

        expect(() => new Transaction(date, type, "", value)).toThrow("The account for transaction is required.");
    });
    it("Should throw an error when creating transaction with negative value.", () => {
        const date = new Date(2025, 8, 12);
        const type = true;
        const account = "Bank";

        expect(() => new Transaction(date, type, account, -4.88)).toThrow("The value must be greater than 0.");
    });
});