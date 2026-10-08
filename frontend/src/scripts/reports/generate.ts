import dayjs from "dayjs";

import { ReportApiRepository } from "../../core/report/infrastructure/ReportApiRepository";
import type { ReportRepository } from "../../core/report/domain/ReportRepository";
import { FormatNumber } from "../../core/shared/domain/FormatNumber";
import { MessageBuilder } from "../../core/shared/domain/MessageBuilder";
import { Money } from "../../core/shared/domain/Money";
import { t } from "../../core/shared/infrastructure/i18n";
import { applyBlockVisibility } from "./blocks";
import { renderCharts } from "./charts";
import { formatPeriodLabel, renderComparison } from "./comparison";
import {
    canvasAccounts,
    canvasBalanceEvolution,
    canvasCategories,
    dateEndDropdownText,
    dateInitDropdownText,
    emptyAccounts,
    emptyBalanceEvolution,
    emptyCategories,
    exportCsvButton,
    exportPdfButton,
    generateReport,
    generateReportLabel,
    graphicAccounts,
    graphicBalanceEvolution,
    graphicCategories,
    noItems,
    reportActions,
    reportDateRange,
    reportDirtyNotice,
    reportFiltersElement,
    tableAccounts,
    tableBalanceEvolution,
    tableCategories,
    totalAccounts,
    totalBalanceEvolution,
    totalCategories,
    totalDiff,
    totalExpenses,
    totalIncomes,
    totalPercentCategories,
    totals,
    yearEndDropdownText,
    yearInitDropdownText
} from "./dom";
import { reportFilterLabels, reportFilters, reportFiltersDescription } from "./filters";
import { dateState, state } from "./state";
import { renderTable, toggleBlock } from "./tables";

const repository: ReportRepository = new ReportApiRepository();

export const generateReportFlow = async (): Promise<void> => {
    if (yearInitDropdownText.innerText === t("reports.dateRange.year") ||
        dateInitDropdownText.innerText === t("reports.dateRange.month") ||
        yearEndDropdownText.innerText === t("reports.dateRange.year") ||
        dateEndDropdownText.innerText === t("reports.dateRange.month")) {
        const message = new MessageBuilder();
        if (yearInitDropdownText.innerText === t("reports.dateRange.year") ||
            yearEndDropdownText.innerText === t("reports.dateRange.year")) message.add(t("reports.dateRange.selectYear"));
        if (dateInitDropdownText.innerText === t("reports.dateRange.month") ||
            dateEndDropdownText.innerText === t("reports.dateRange.month")) message.add(t("reports.dateRange.selectFrom"));
        window.showAlert(message.toString());
        return;
    }
    if (dateState.yearInit > dateState.yearEnd || (dateState.yearInit === dateState.yearEnd && dateState.dateInit > dateState.dateEnd)) {
        window.showAlert(t("reports.dateRange.selectDateRangeValid"));
        return;
    }

    const requestedYearInit = dateState.yearInit;
    const requestedYearEnd = dateState.yearEnd;
    const requestedStartMonth = dateState.dateInit;
    const requestedEndMonth = dateState.dateEnd;
    const monthCount = (requestedYearEnd - requestedYearInit) * 12 + requestedEndMonth - requestedStartMonth + 1;
    const vdi = dayjs.utc(`${requestedYearInit}-${String(requestedStartMonth).padStart(2, "0")}-01`).startOf("month").toDate();
    const vde = dayjs.utc(`${requestedYearEnd}-${String(requestedEndMonth).padStart(2, "0")}-01`).endOf("month").toDate();
    const previousDateInit = dayjs.utc(vdi).subtract(monthCount, "month").startOf("month").toDate();
    const previousDateEnd = dayjs.utc(vdi).subtract(1, "month").endOf("month").toDate();
    const requestedFilters = reportFilters();
    const requestedFilterLabels = reportFilterLabels();

    generateReport.disabled = true;
    exportCsvButton.disabled = true;
    exportPdfButton.disabled = true;
    reportFiltersElement.inert = true;
    reportFiltersElement.classList.add("is-loading");
    generateReport.setAttribute("aria-busy", "true");
    generateReport.classList.add("is-loading");
    generateReportLabel.textContent = t("reports.loading");

    try {
        const [report, previousReport] = await Promise.all([
            repository.generate(vdi, vde, requestedFilters),
            repository.generate(previousDateInit, previousDateEnd, requestedFilters)
        ]);
        state.lastReport = report;
        state.lastFilterLabels = requestedFilterLabels;
        state.reportIsDirty = false;
        reportDirtyNotice.hidden = true;
        state.lastCurrentPeriod = formatPeriodLabel(vdi, vde);
        state.lastPreviousPeriod = formatPeriodLabel(previousDateInit, previousDateEnd);
        state.lastFileName = `jeseb-report-${requestedYearInit}-${String(requestedStartMonth).padStart(2, "0")}-to-${requestedYearEnd}-${String(requestedEndMonth).padStart(2, "0")}.csv`;
        noItems.style.display = "none";
        totals.style.display = "flex";
        reportActions.style.display = "flex";

        totalIncomes.innerText = `$ ${FormatNumber(report.totalIncome)}`;
        totalExpenses.innerText = `$ ${FormatNumber(report.totalExpenses)}`;
        const diff = Money.fromCents(Money.toCents(report.totalIncome) - Money.toCents(report.totalExpenses));
        totalDiff.innerText = `$ ${FormatNumber(diff)}`;
        totalDiff.classList.toggle("is-success", diff >= 0);
        totalDiff.classList.toggle("is-cancel", diff < 0);

        reportDateRange.innerText = reportFiltersDescription(state.lastCurrentPeriod, state.lastFilterLabels);
        reportDateRange.style.display = "block";
        renderComparison(report, previousReport, state.lastCurrentPeriod, state.lastPreviousPeriod);

        toggleBlock(graphicBalanceEvolution, canvasBalanceEvolution, emptyBalanceEvolution, tableBalanceEvolution, report.balanceEvolution.length > 0);
        toggleBlock(graphicAccounts, canvasAccounts, emptyAccounts, tableAccounts, report.accounts.length > 0);
        toggleBlock(graphicCategories, canvasCategories, emptyCategories, tableCategories, report.categories.length > 0);
        const categoryCount = new Set(report.categories.map(item => item.name)).size;
        canvasCategories.parentElement!.style.height = `${Math.max(280, categoryCount * 36)}px`;
        renderTable(tableBalanceEvolution, totalBalanceEvolution, report.balanceEvolution);
        renderTable(tableAccounts, totalAccounts, report.accounts);
        renderTable(
            tableCategories,
            totalCategories,
            report.categories,
            Money.toCents(report.totalExpenses),
            totalPercentCategories
        );
        renderCharts(report);
        applyBlockVisibility();
    } catch (err: unknown) {
        if (err instanceof Error) {
            window.showAlert(err.message);
            console.error(err);
        }
    } finally {
        generateReport.disabled = false;
        exportCsvButton.disabled = state.reportIsDirty;
        exportPdfButton.disabled = state.reportIsDirty;
        reportFiltersElement.inert = false;
        reportFiltersElement.classList.remove("is-loading");
        generateReport.removeAttribute("aria-busy");
        generateReport.classList.remove("is-loading");
        generateReportLabel.textContent = t("reports.generate");
    }
};
