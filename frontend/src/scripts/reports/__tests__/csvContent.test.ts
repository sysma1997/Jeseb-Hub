import { describe, expect, it } from "vitest";

import { buildReportCsvRows } from "../csvContent";

const translate = (key: string): string => key;
const formatDate = (date: string): string => `formatted:${date}`;

describe("buildReportCsvRows", () => {
    it("groups export data in readable sections and orders detail rows by date", () => {
        const rows = buildReportCsvRows({
            report: {
                totalIncome: 1250.75,
                totalExpenses: 300.25,
                balanceEvolution: [
                    { name: "March", date: "2026-03", value: 100 },
                    { name: "February", date: "2026-02", value: 50 }
                ],
                accounts: [{ name: "Checking", date: "2026-03", value: 100 }],
                categories: [{ name: "Food", date: "2026-03", value: 300.25 }]
            },
            comparison: [{
                label: "reports.comparison.income",
                currentCents: 125075,
                previousCents: 100000,
                changeCents: 25075,
                changePercentage: 25.075
            }],
            currentPeriod: "Mar 2026",
            previousPeriod: "Feb 2026",
            filterLabels: { accounts: "All accounts", categories: "All categories" },
            includeComparison: true,
            includeBalanceEvolution: true,
            includeAccounts: true,
            includeCategories: true
        }, translate, formatDate);

        const sectionIndexes = [
            "reports.csv.totals",
            "reports.comparison.title",
            "reports.graphics.balanceEvolution",
            "reports.graphics.accounts",
            "reports.graphics.categories"
        ].map(section => rows.findIndex(row => row[0] === section));

        expect(sectionIndexes.every(index => index >= 0)).toBe(true);
        expect(sectionIndexes).toEqual([...sectionIndexes].sort((a, b) => a - b));
        expect(rows[9]).toEqual(["reports.totals.ingress", "1250.75"]);
        expect(rows[10]).toEqual(["reports.totals.egress", "300.25"]);

        const balanceIndex = sectionIndexes[2]!;
        expect(rows.slice(balanceIndex + 2, balanceIndex + 4)).toEqual([
            ["formatted:2026-02", "February", "50.00"],
            ["formatted:2026-03", "March", "100.00"]
        ]);

        const categoryIndex = sectionIndexes[4]!;
        expect(rows[categoryIndex + 2]).toEqual([
            "formatted:2026-03", "Food", "300.25", "100.00"
        ]);
    });

    it("escapes spreadsheet formulas in user-controlled text", () => {
        const rows = buildReportCsvRows({
            report: {
                totalIncome: 0,
                totalExpenses: 0,
                balanceEvolution: [],
                accounts: [],
                categories: [{ name: "=HYPERLINK(\"https://example.com\")", date: "2026-03", value: 0 }]
            },
            comparison: [],
            currentPeriod: "Mar 2026",
            previousPeriod: "Feb 2026",
            filterLabels: { accounts: "All accounts", categories: "All categories" },
            includeComparison: false,
            includeBalanceEvolution: false,
            includeAccounts: false,
            includeCategories: true
        }, translate, formatDate);

        expect(rows.some(row => row[1] === "'=HYPERLINK(\"https://example.com\")")).toBe(true);
    });
});
