import type { Report } from "../../core/report/domain/Report";
import { FormatNumber } from "../../core/shared/domain/FormatNumber";
import { Money } from "../../core/shared/domain/Money";
import { t } from "../../core/shared/infrastructure/i18n";
import { comparisonRowsElement, comparisonPeriods } from "./dom";
import { state } from "./state";
import { setNumberTone } from "./tables";

export const formatPeriodLabel = (start: Date, end: Date): string => {
    const formatter = new Intl.DateTimeFormat(document.documentElement.lang || undefined, {
        month: "short",
        year: "numeric",
        timeZone: "UTC"
    });
    const startLabel = formatter.format(start);
    const endLabel = formatter.format(end);
    return startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;
};

const formatSignedMoney = (cents: number): string => {
    const sign = cents > 0 ? "+ " : cents < 0 ? "− " : "";
    return `${sign}$ ${FormatNumber(Money.fromCents(Math.abs(cents)))}`;
};

const formatSignedPercentage = (percentage: number): string => {
    const sign = percentage > 0 ? "+" : percentage < 0 ? "−" : "";
    return `${sign}${FormatNumber(Math.abs(percentage))}%`;
};

export const renderComparison = (
    current: Report,
    previous: Report,
    currentPeriod: string,
    previousPeriod: string
): void => {
    const currentIncomeCents = Money.toCents(current.totalIncome);
    const currentExpensesCents = Money.toCents(current.totalExpenses);
    const previousIncomeCents = Money.toCents(previous.totalIncome);
    const previousExpensesCents = Money.toCents(previous.totalExpenses);
    const metrics = [
        {
            label: t("reports.comparison.income"),
            currentCents: currentIncomeCents,
            previousCents: previousIncomeCents
        },
        {
            label: t("reports.comparison.expenses"),
            currentCents: currentExpensesCents,
            previousCents: previousExpensesCents
        },
        {
            label: t("reports.comparison.diff"),
            currentCents: currentIncomeCents - currentExpensesCents,
            previousCents: previousIncomeCents - previousExpensesCents
        }
    ];

    state.lastComparison = metrics.map(metric => {
        const changeCents = metric.currentCents - metric.previousCents;
        return {
            ...metric,
            changeCents,
            changePercentage: metric.previousCents === 0
                ? null
                : (changeCents / Math.abs(metric.previousCents)) * 100
        };
    });

    comparisonRowsElement.replaceChildren();
    for (const rowData of state.lastComparison) {
        const row = document.createElement("tr");
        const values = [
            rowData.label,
            `$ ${FormatNumber(Money.fromCents(rowData.currentCents))}`,
            `$ ${FormatNumber(Money.fromCents(rowData.previousCents))}`,
            formatSignedMoney(rowData.changeCents),
            rowData.changePercentage === null
                ? t("reports.comparison.notAvailable")
                : formatSignedPercentage(rowData.changePercentage)
        ];
        for (const value of values) {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.append(cell);
        }
        setNumberTone(row.children[1] as HTMLElement, rowData.currentCents);
        setNumberTone(row.children[2] as HTMLElement, rowData.previousCents);
        setNumberTone(row.children[3] as HTMLElement, rowData.changeCents);
        if (rowData.changePercentage !== null)
            setNumberTone(row.children[4] as HTMLElement, rowData.changePercentage);
        comparisonRowsElement.append(row);
    }
    comparisonPeriods.textContent = t("reports.comparison.periods", {
        current: currentPeriod,
        previous: previousPeriod
    });
};
