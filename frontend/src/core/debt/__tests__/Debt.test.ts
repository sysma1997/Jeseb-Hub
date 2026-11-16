import { describe, it, expect } from "vitest";

import { Debt, getDebtStatus } from "../domain/Debt";
import { DebtPayment } from "../domain/DebtPayment";

const date = new Date(Date.UTC(2026, 0, 10, 12, 0, 0));

describe("Debt", () => {
    it("derives the pending amount from the original amount and payments", () => {
        const debt = new Debt("Ana", true, 100, date, "debt-1", undefined, 
            undefined, undefined, 25, 1);

        expect(debt.amount).toBe(100);
        expect(debt.paidAmount).toBe(25);
        expect(debt.pendingAmount).toBe(75);
        expect(debt.status).toBe("pending");
    });

    it("uses exact cents when rounding API amounts", () => {
        const debt = new Debt("Ana", false, 10.005, date, "debt-1");

        expect(debt.amount).toBe(10.01);
        expect(debt.pendingAmount).toBe(10.01);
    });

    it("marks a debt as paid when its pending amount is zero", () => {
        const debt = new Debt("Ana", true, 50, date, "debt-1", undefined, 
            undefined, undefined, 50, 2);

        expect(debt.pendingAmount).toBe(0);
        expect(debt.status).toBe("paid");
    });

    it("marks a debt as overdue only after the due day", () => {
        const dueDate = new Date(Date.UTC(2026, 0, 9));
        const now = new Date(Date.UTC(2026, 0, 10, 23, 59, 59));

        expect(getDebtStatus(100, dueDate, now)).toBe("overdue");
        expect(getDebtStatus(100, new Date(Date.UTC(2026, 0, 10)), now)).toBe("pending");
    });

    it("rejects a due date earlier than the debt date", () => {
        expect(() => new Debt("Ana", true, 100, date, "debt-1", undefined, 
            undefined, new Date(Date.UTC(2026, 0, 9)))).toThrow();
    });

    it("converts an API dto and serializes dates in UTC", () => {
        const debt = Debt.FromDto({
            id: "debt-1",
            person: "Ana",
            type: true,
            amount: 120.5,
            date: "2026-01-10T12:00:00Z",
            dueDate: "2099-02-10T12:00:00Z",
            paidAmount: 20.5,
            pendingAmount: 100,
            status: "pending",
            paymentCount: 1
        });

        expect(debt.pendingAmount).toBe(100);
        expect(debt.status).toBe("pending");

        const dto = debt.toDto();
        expect(dto.date).toBe("2026-01-10T12:00:00Z");
        expect(dto.dueDate).toBe("2099-02-10T12:00:00Z");
        expect(dto.pendingAmount).toBe(100);
    });
});

describe("DebtPayment", () => {
    it("normalizes the payment amount to cents", () => {
        const payment = new DebtPayment(date, 15.555, "debt-1", "payment-1");

        expect(payment.amount).toBe(15.56);
        expect(payment.toDto().amount).toBe(15.56);
    });

    it("rejects non-positive amounts", () => {
        expect(() => new DebtPayment(date, 0, "debt-1")).toThrow();
    });

    it("converts an API dto", () => {
        const payment = DebtPayment.FromDto({
            id: "payment-1",
            idDebt: "debt-1",
            amount: 10.25,
            date: "2026-01-10T12:00:00Z",
            description: "Cash",
            idAccount: "account-1",
            account: "Checking",
            category: "Debt",
            idTransaction: "transaction-1"
        });

        expect(payment.id).toBe("payment-1");
        expect(payment.idDebt).toBe("debt-1");
        expect(payment.amount).toBe(10.25);
        expect(payment.description).toBe("Cash");
        expect(payment.toDto()).toMatchObject({
            date: "2026-01-10T12:00:00Z",
            idAccount: "account-1",
            account: "Checking",
            category: "Debt",
            idTransaction: "transaction-1"
        });
    });
});
