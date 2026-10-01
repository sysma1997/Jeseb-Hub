import { describe, it, expect } from "@jest/globals";

import { Money } from "../../core/shared/domain/Money";

describe("Money", () => {
    describe("toCents", () => {
        it("Should convert decimals to integer cents.", () => {
            expect(Money.toCents(15523.43)).toBe(1552343);
            expect(Money.toCents("15523.43")).toBe(1552343);
            expect(Money.toCents("10000.00")).toBe(1000000);
            expect(Money.toCents("0.1")).toBe(10);
            expect(Money.toCents("0")).toBe(0);
            expect(Money.toCents("-67000")).toBe(-6700000);
            expect(Money.toCents(".5")).toBe(50);
        });
        it("Should accept the Decimal coming from the database.", () => {
            const prismaDecimal = { toString: () => "1825714.68" };

            expect(Money.toCents(prismaDecimal)).toBe(182571468);
        });
        it("Should round the third decimal instead of truncating it.", () => {
            expect(Money.toCents("0.005")).toBe(1);
            expect(Money.toCents("0.006")).toBe(1);
            expect(Money.toCents("7.999")).toBe(800);
        });
        it("Should reject values that are not amounts.", () => {
            expect(() => Money.toCents("abc")).toThrow();
            expect(() => Money.toCents("")).toThrow();
            expect(() => Money.toCents(Number.NaN)).toThrow();
            expect(() => Money.toCents(Number.POSITIVE_INFINITY)).toThrow();
        });
        it("Should reject amounts beyond the safe integer range.", () => {
            expect(() => Money.toCents("1e30")).toThrow();
        });
    });

    describe("fromCents", () => {
        it("Should convert cents back to decimals.", () => {
            expect(Money.fromCents(1552343)).toBe(15523.43);
            expect(Money.fromCents(0)).toBe(0);
            expect(Money.fromCents(-5)).toBe(-0.05);
        });
        it("Should reject values that are not integer cents.", () => {
            expect(() => Money.fromCents(1.5)).toThrow();
        });
    });

    describe("fromDecimal", () => {
        it("Should treat null and undefined as zero.", () => {
            expect(Money.fromDecimal(null)).toBe(0);
            expect(Money.fromDecimal(undefined)).toBe(0);
        });
    });

    describe("toDecimalString", () => {
        it("Should render exactly two decimals without float error.", () => {
            expect(Money.toDecimalString(1552343)).toBe("15523.43");
            expect(Money.toDecimalString(5)).toBe("0.05");
            expect(Money.toDecimalString(-5)).toBe("-0.05");
            expect(Money.toDecimalString(100)).toBe("1.00");
            expect(Money.toDecimalString(0)).toBe("0.00");
        });
    });

    describe("exactness", () => {
        it("Should not accumulate the float error that decimal sums produce.", () => {
            // con coma flotante, 0.1 + 0.2 deja 0.30000000000000004
            expect(0.1 + 0.2).not.toBe(0.3);

            const cents = Money.toCents(0.1) + Money.toCents(0.2);
            expect(Money.fromCents(cents)).toBe(0.3);
        });
        it("Should keep a long run of additions exact.", () => {
            let balance = Money.toCents(0);
            for (let i = 0; i < 1000; i++) balance += Money.toCents(0.1);

            // con float, 1000 x 0.1 no da 100
            expect(Money.fromCents(balance)).toBe(100);
        });
    });
});