import { describe, it, expect } from "@jest/globals";

import { DebtPayment } from "../../core/debt/domain/DebtPayment";
import { mockTranslator } from "../shared/TranslatorMock";

describe("Debt Payment Domain", () => {
    const date = new Date("2026-01-15T00:00:00.000Z");
    const idDebt = "4d511d6e-ea14-4b9b-a40b-b63231e6bb91";

    it("Should create a payment with correct properties.", () => {
        const id = "b3180f4e-445a-491f-8e2c-ef234b5c0314";
        const idUser = "3bff1d1b-e647-47cc-a151-e54b52c1e673";
        const payment = new DebtPayment(mockTranslator, date, 2550, idDebt, 
            id, idUser, 
            "Partial payment");

        expect(payment.date).toBe(date);
        expect(payment.amount).toBe(2550);
        expect(payment.idDebt).toBe(idDebt);
        expect(payment.id).toBe(id);
        expect(payment.idUser).toBe(idUser);
        expect(payment.description).toBe("Partial payment");
    });
    it("Should expose the amount as decimals in the DTO.", () => {
        const payment = new DebtPayment(mockTranslator, date, 2550, idDebt);
        const dto = payment.toDto();

        expect(dto.amount).toBe(25.5);
        expect(dto.date).toBe("2026-01-15T00:00:00Z");
        expect(dto.idDebt).toBe(idDebt);
    });

    it("Should throw an error when the debt is missing.", () => {
        expect(() => new DebtPayment(mockTranslator, date, 2550, ""))
            .toThrow("The debt is required.");
    });
    it("Should throw an error when the payment amount is not positive.", () => {
        expect(() => new DebtPayment(mockTranslator, date, 0, idDebt))
            .toThrow("The payment amount must be greater than 0.");
    });
    it("Should throw an error when the payment date is invalid.", () => {
        expect(() => new DebtPayment(mockTranslator, new Date("invalid"), 2550, idDebt))
            .toThrow("The payment date is required.");
    });
});
