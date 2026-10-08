import Papa from "papaparse";

import type { ReportItem } from "../../core/report/domain/Report";
import { Money } from "../../core/shared/domain/Money";
import { t } from "../../core/shared/infrastructure/i18n";
import { includeComparison, includeBalanceEvolution, includeAccounts, includeCategories } from "./dom";
import { state } from "./state";
import { formatDate } from "./tables";

const safeCsvText = (value: string): string => /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;

export const exportReportCsv = (): void => {
    if (!state.lastReport) return;

    const fields = [
        t("reports.csv.period"),
        t("reports.csv.previousPeriod"),
        t("reports.csv.accounts"),
        t("reports.csv.categories"),
        t("reports.csv.section"),
        t("reports.csv.date"),
        t("reports.csv.name"),
        t("reports.csv.currentAmount"),
        t("reports.csv.previousAmount"),
        t("reports.csv.absoluteChange"),
        t("reports.csv.percentageChange"),
        t("reports.csv.expensePercentage")
    ];
    const rows: string[][] = [];
    const addRow = (
        section: string,
        name: string,
        currentAmount = "",
        previousAmount = "",
        change = "",
        changePercentage = "",
        expensePercentage = "",
        date = ""
    ): void => {
        rows.push([
            state.lastCurrentPeriod,
            state.lastPreviousPeriod,
            safeCsvText(state.lastFilterLabels.accounts),
            safeCsvText(state.lastFilterLabels.categories),
            section,
            date,
            name,
            currentAmount,
            previousAmount,
            change,
            changePercentage,
            expensePercentage
        ]);
    };

    const currentIncomeCents = Money.toCents(state.lastReport.totalIncome);
    const currentExpensesCents = Money.toCents(state.lastReport.totalExpenses);
    addRow(t("reports.csv.totals"), t("reports.totals.ingress"), Money.toDecimalString(currentIncomeCents));
    addRow(t("reports.csv.totals"), t("reports.totals.egress"), Money.toDecimalString(currentExpensesCents));
    addRow(t("reports.csv.totals"), t("reports.totals.diff"), Money.toDecimalString(currentIncomeCents - currentExpensesCents));

    if (includeComparison.checked) {
        for (const comparison of state.lastComparison) {
            addRow(
                t("reports.comparison.title"),
                comparison.label,
                Money.toDecimalString(comparison.currentCents),
                Money.toDecimalString(comparison.previousCents),
                Money.toDecimalString(comparison.changeCents),
                comparison.changePercentage === null ? "" : comparison.changePercentage.toFixed(2)
            );
        }
    }

    const addDetailRows = (section: string, items: ReportItem[], includeExpenseShare = false): void => {
        let totalCents = 0;
        const expenseTotalCents = Money.toCents(state.lastReport!.totalExpenses);
        const sortedItems = [...items].sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
        for (const item of sortedItems) {
            const amountCents = Money.toCents(item.value);
            totalCents += amountCents;
            addRow(
                section,
                safeCsvText(item.name),
                Money.toDecimalString(amountCents),
                "",
                "",
                "",
                includeExpenseShare && expenseTotalCents > 0
                    ? ((amountCents / expenseTotalCents) * 100).toFixed(2)
                    : "",
                formatDate(item.date)
            );
        }
        addRow(
            section,
            t("reports.table.total"),
            Money.toDecimalString(totalCents),
            "",
            "",
            "",
            includeExpenseShare && expenseTotalCents > 0
                ? ((totalCents / expenseTotalCents) * 100).toFixed(2)
                : ""
        );
    };

    if (includeBalanceEvolution.checked)
        addDetailRows(t("reports.graphics.balanceEvolution"), state.lastReport.balanceEvolution);
    if (includeAccounts.checked)
        addDetailRows(t("reports.graphics.accounts"), state.lastReport.accounts);
    if (includeCategories.checked)
        addDetailRows(t("reports.graphics.categories"), state.lastReport.categories, true);

    const csv = Papa.unparse({ fields, data: rows }, { newline: "\r\n" });
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = state.lastFileName;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
};
