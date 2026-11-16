import { describe, it, expect } from "@jest/globals";

import { Debt } from "../../core/debt/domain/Debt";
import { mockTranslator } from "../shared/TranslatorMock";

describe("Debt Domain", () => {
    const date = new Date("2026-01-10T00:00:00.000Z");
    const dueDate = new Date("2026-02-10T00:00:00.000Z");

    it("Should create a debt with correct properties.", () => {
        const id = "4d511d6e-ea14-4b9b-a40b-b63231e6bb91";
        const idUser = "3bff1d1b-e647-47cc-a151-e54b52c1e673";
        const debt = new Debt(mockTranslator, "Ana", true, 10050, date, 
            id, idUser, 
            "Loan", dueDate);

        expect(debt.person).toBe("Ana");
        expect(debt.type).toBe(true);
        expect(debt.amount).toBe(10050);
        expect(debt.date).toBe(date);
        expect(debt.description).toBe("Loan");
        expect(debt.dueDate).toBe(dueDate);
        expect(debt.id).toBe(id);
        expect(debt.idUser).toBe(idUser);

        expect(debt.paidAmount).toBe(0);
        expect(debt.pendingAmount).toBe(10050);
        expect(debt.paymentCount).toBe(0);
    });
    it("Should derive the pending amount from the registered payments.", () => {
        const debt = new Debt(mockTranslator, "Ana", true, 10050, date, 
            undefined, undefined, 
            undefined, dueDate, 
            4050, 2);

        expect(debt.paidAmount).toBe(4050);
        expect(debt.paymentCount).toBe(2);
        expect(debt.pendingAmount).toBe(6000);
    });
    it("Should mark a debt as pending, overdue or paid from its dates.", () => {
        const pending = new Debt(mockTranslator, "Ana", true, 10000, date, 
            undefined, undefined, 
            undefined, dueDate);
        const overdue = new Debt(mockTranslator, "Ana", true, 10000, new Date("2026-01-01T00:00:00.000Z"), 
            undefined, undefined, 
            undefined, new Date("2026-01-09T00:00:00.000Z"));
        const paid = new Debt(mockTranslator, "Ana", true, 10000, date, 
            undefined, undefined, 
            undefined, dueDate, 
            10000, 1);

        expect(pending.getStatus(new Date("2026-01-15T00:00:00.000Z"))).toBe("pending");
        expect(overdue.getStatus(new Date("2026-01-15T00:00:00.000Z"))).toBe("overdue");
        expect(paid.getStatus(new Date("2026-01-15T00:00:00.000Z"))).toBe("paid");
    });
    it("Should not mark a debt as overdue on its due date.", () => {
        const debt = new Debt(mockTranslator, "Ana", true, 10000, date, 
            undefined, undefined, 
            undefined, dueDate);

        expect(debt.getStatus(new Date("2026-02-10T23:59:59.000Z"))).toBe("pending");
        expect(debt.getStatus(new Date("2026-02-11T00:00:00.000Z"))).toBe("overdue");
    });
    it("Should expose the amount and pending balance as decimals in the DTO.", () => {
        const debt = new Debt(mockTranslator, "Ana", true, 10050, date, 
            "id", "idUser", 
            "Loan", dueDate, 
            4050, 2);
        const dto = debt.toDto();

        expect(dto.amount).toBe(100.5);
        expect(dto.paidAmount).toBe(40.5);
        expect(dto.pendingAmount).toBe(60);
        expect(dto.paymentCount).toBe(2);
        expect(dto.date).toBe("2026-01-10T00:00:00Z");
        expect(dto.dueDate).toBe("2026-02-10T00:00:00Z");
    });

    it("Should throw an error when creating a debt without person.", () => {
        expect(() => new Debt(mockTranslator, "", true, 1000, date)).toThrow("The person is required.");
    });
    it("Should throw an error when creating a debt without type.", () => {
        expect(() => new Debt(mockTranslator, "Ana", undefined as any, 1000, date))
            .toThrow("The debt type is required.");
    });
    it("Should throw an error when creating a debt with a non-positive amount.", () => {
        expect(() => new Debt(mockTranslator, "Ana", true, 0, date))
            .toThrow("The amount must be greater than 0.");
    });
    it("Should throw an error when creating a debt without date.", () => {
        expect(() => new Debt(mockTranslator, "Ana", true, 1000, undefined as any))
            .toThrow("The debt date is required.");
    });
    it("Should throw an error when the due date is before the debt date.", () => {
        expect(() => new Debt(mockTranslator, "Ana", true, 1000, date, 
            undefined, undefined, 
            undefined, new Date("2026-01-09T00:00:00.000Z")))
            .toThrow("The due date cannot be earlier than the debt date.");
    });
    it("Should throw an error when the amount is lower than the paid amount.", () => {
        expect(() => new Debt(mockTranslator, "Ana", true, 1000, date, 
            undefined, undefined, 
            undefined, dueDate, 
            2000, 1))
            .toThrow("The amount cannot be less than the amount already paid (20.00).");
    });
    it("Should update editable fields without losing the payments.", () => {
        const debt = new Debt(mockTranslator, "Ana", true, 10000, date, 
            "id", "idUser", 
            "Loan", dueDate, 
            2500, 1);

        const updated = debt.setPerson("Luis").setAmount(12000).setDescription(undefined).setDueDate(undefined);

        expect(updated.person).toBe("Luis");
        expect(updated.amount).toBe(12000);
        expect(updated.description).toBeUndefined();
        expect(updated.dueDate).toBeUndefined();
        expect(updated.paidAmount).toBe(2500);
        expect(updated.paymentCount).toBe(1);
        expect(updated.pendingAmount).toBe(9500);
    });
});
