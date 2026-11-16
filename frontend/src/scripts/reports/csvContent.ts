import type { Report, ReportItem } from "../../core/report/domain/Report";
import { Money } from "../../core/shared/domain/Money";

export interface CsvComparisonRow {
    label: string;
    currentCents: number;
    previousCents: number;
    changeCents: number;
    changePercentage: number | null;
}

export interface CsvReportData {
    report: Report;
    comparison: CsvComparisonRow[];
    currentPeriod: string;
    previousPeriod: string;
    filterLabels: { accounts: string; categories: string };
    includeComparison: boolean;
    includeBalanceEvolution: boolean;
    includeAccounts: boolean;
    includeCategories: boolean;
}

type Translate = (key: string) => string;
type FormatDate = (date: string) => string;

const safeCsvText = (value: string): string => /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;

export const buildReportCsvRows = (
    data: CsvReportData,
    translate: Translate,
    formatDate: FormatDate
): string[][] => {
    const { report } = data;
    const rows: string[][] = [
        [safeCsvText(translate("reports.pdf.title"))],
        [],
        [safeCsvText(translate("reports.csv.period")), safeCsvText(data.currentPeriod)],
        [safeCsvText(translate("reports.csv.previousPeriod")), safeCsvText(data.previousPeriod)],
        [safeCsvText(translate("reports.csv.accounts")), safeCsvText(data.filterLabels.accounts)],
        [safeCsvText(translate("reports.csv.categories")), safeCsvText(data.filterLabels.categories)]
    ];

    const startSection = (title: string): void => {
        rows.push([], [safeCsvText(title)]);
    };

    startSection(translate("reports.csv.totals"));
    rows.push([
        safeCsvText(translate("reports.csv.name")),
        safeCsvText(translate("reports.csv.currentAmount"))
    ]);

    const incomeCents = Money.toCents(report.totalIncome);
    const expenseCents = Money.toCents(report.totalExpenses);
    rows.push(
        [safeCsvText(translate("reports.totals.ingress")), Money.toDecimalString(incomeCents)],
        [safeCsvText(translate("reports.totals.egress")), Money.toDecimalString(expenseCents)],
        [safeCsvText(translate("reports.totals.diff")), Money.toDecimalString(incomeCents - expenseCents)]
    );

    if (data.includeComparison) {
        startSection(translate("reports.comparison.title"));
        rows.push([
            safeCsvText(translate("reports.comparison.metric")),
            safeCsvText(translate("reports.comparison.current")),
            safeCsvText(translate("reports.comparison.previous")),
            safeCsvText(translate("reports.csv.absoluteChange")),
            safeCsvText(translate("reports.csv.percentageChange"))
        ]);
        for (const comparison of data.comparison) {
            rows.push([
                safeCsvText(comparison.label),
                Money.toDecimalString(comparison.currentCents),
                Money.toDecimalString(comparison.previousCents),
                Money.toDecimalString(comparison.changeCents),
                comparison.changePercentage === null ? "" : comparison.changePercentage.toFixed(2)
            ]);
        }
    }

    const addDetailSection = (
        title: string,
        items: ReportItem[],
        includeExpenseShare = false
    ): void => {
        startSection(title);
        rows.push([
            safeCsvText(translate("reports.csv.date")),
            safeCsvText(translate("reports.csv.name")),
            safeCsvText(translate("reports.csv.currentAmount")),
            ...(includeExpenseShare ? [safeCsvText(translate("reports.csv.expensePercentage"))] : [])
        ]);

        let totalCents = 0;
        const expenseTotalCents = Money.toCents(report.totalExpenses);
        const sortedItems = [...items].sort((a, b) =>
            a.date.localeCompare(b.date) || a.name.localeCompare(b.name)
        );

        for (const item of sortedItems) {
            const amountCents = Money.toCents(item.value);
            totalCents += amountCents;
            const expensePercentage = includeExpenseShare && expenseTotalCents > 0
                ? ((amountCents / expenseTotalCents) * 100).toFixed(2)
                : "";
            rows.push([
                safeCsvText(formatDate(item.date)),
                safeCsvText(item.name),
                Money.toDecimalString(amountCents),
                ...(includeExpenseShare ? [expensePercentage] : [])
            ]);
        }

        const totalExpensePercentage = includeExpenseShare && expenseTotalCents > 0
            ? ((totalCents / expenseTotalCents) * 100).toFixed(2)
            : "";
        rows.push([
            "",
            safeCsvText(translate("reports.table.total")),
            Money.toDecimalString(totalCents),
            ...(includeExpenseShare ? [totalExpensePercentage] : [])
        ]);
    };

    if (data.includeBalanceEvolution)
        addDetailSection(translate("reports.graphics.balanceEvolution"), report.balanceEvolution);
    if (data.includeAccounts)
        addDetailSection(translate("reports.graphics.accounts"), report.accounts);
    if (data.includeCategories)
        addDetailSection(translate("reports.graphics.categories"), report.categories, true);

    return rows;
};
