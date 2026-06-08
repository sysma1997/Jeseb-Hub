import { describe, it, expect } from "@jest/globals";

import { Account } from "../../core/account/domain/Account";

describe("Account Domain", () => {
    it("Should create an account with correct properties.", () => {
        const id = "4d511d6e-ea14-4b9b-a40b-b63231e6bb91";
        const idUser = "3bff1d1b-e647-47cc-a151-e54b52c1e673";
        const account = new Account("Bank", 120, id, idUser);

        expect(account.name).toBe("Bank");
        expect(account.balance).toBe(120);
        expect(account.id).toBe(id);
        expect(account.idUser).toBe(idUser);
    });
    it("Should update the account name correctly.", () => {
        let account = new Account("Bank");
        account = account.setName("Cash");

        expect(account.name).toBe("Cash");
    });
    it("Should ingress balance correctly.", () => {
        let account = new Account("Bank", 0);
        account = account.ingressBalance(119.9);

        expect(account.balance).toBe(119.9);
    });
    it("Should egress balance correctly.", () => {
        let account = new Account("Bank", 200);
        account = account.egressBalance(50.9);

        expect(account.balance).toBe(149.1);
    });
    it("Should egress balance with debt appear correctly.", () => {
        let account = new Account("Bank", 50);
        account = account.egressBalance(100);

        expect(account.balance).toBe(-50);
    });

    it("Should throw an error when creating an account with missing name.", () => {
        expect(() => new Account("")).toThrow("The name is required.");
    });
    it("Should throw an error when creating an account with a name that contains spaces.", () => {
        expect(() => new Account("Bank Error")).toThrow("The account name cannot contain spaces.");
    });
});