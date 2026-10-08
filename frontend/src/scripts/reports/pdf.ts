import { FormatNumber } from "../../core/shared/domain/FormatNumber";
import { Money } from "../../core/shared/domain/Money";
import { accordionControls, setReportBoxExpanded } from "./accordion";
import { applyBlockVisibility } from "./blocks";
import {
    renderCharts,
    updateGraphicOptionsTheme,
    getBalanceEvolutionChart,
    getAccountsChart,
    getCategoriesChart
} from "./charts";
import {
    reportPdf,
    reportPdfFilters,
    reportPdfIncome,
    reportPdfExpenses,
    reportPdfDifference,
    reportPdfVersion,
    reportPdfChartsSection,
    reportPdfTablesSection,
    includeComparison,
    includeBalanceEvolution,
    includeAccounts,
    includeCategories,
    graphicBalanceEvolution,
    canvasBalanceEvolution,
    tableBalanceEvolution,
    graphicAccounts,
    canvasAccounts,
    tableAccounts,
    graphicCategories,
    canvasCategories,
    tableCategories,
    comparisonSection
} from "./dom";
import { reportFiltersDescription } from "./filters";
import { state } from "./state";

const reportPdfChartBlocks = [
    { checkbox: includeBalanceEvolution, reportBox: graphicBalanceEvolution, pdfBox: document.getElementById("reportPdfBalanceBlock") as HTMLDivElement, canvas: canvasBalanceEvolution, image: document.getElementById("reportPdfBalanceImage") as HTMLImageElement, empty: document.getElementById("reportPdfBalanceEmpty") as HTMLParagraphElement, chart: getBalanceEvolutionChart, table: tableBalanceEvolution, pdfTableBlock: document.getElementById("reportPdfBalanceTableBlock") as HTMLDivElement, pdfTable: document.getElementById("reportPdfBalanceTable") as HTMLDivElement },
    { checkbox: includeAccounts, reportBox: graphicAccounts, pdfBox: document.getElementById("reportPdfAccountsBlock") as HTMLDivElement, canvas: canvasAccounts, image: document.getElementById("reportPdfAccountsImage") as HTMLImageElement, empty: document.getElementById("reportPdfAccountsEmpty") as HTMLParagraphElement, chart: getAccountsChart, table: tableAccounts, pdfTableBlock: document.getElementById("reportPdfAccountsTableBlock") as HTMLDivElement, pdfTable: document.getElementById("reportPdfAccountsTable") as HTMLDivElement },
    { checkbox: includeCategories, reportBox: graphicCategories, pdfBox: document.getElementById("reportPdfCategoriesBlock") as HTMLDivElement, canvas: canvasCategories, image: document.getElementById("reportPdfCategoriesImage") as HTMLImageElement, empty: document.getElementById("reportPdfCategoriesEmpty") as HTMLParagraphElement, chart: getCategoriesChart, table: tableCategories, pdfTableBlock: document.getElementById("reportPdfCategoriesTableBlock") as HTMLDivElement, pdfTable: document.getElementById("reportPdfCategoriesTable") as HTMLDivElement }
];

const copyTableForPdf = (source: HTMLTableElement, target: HTMLDivElement): void => {
    const table = source.cloneNode(true) as HTMLTableElement;
    table.removeAttribute("id");
    table.querySelectorAll<HTMLElement>("[id]").forEach(element => element.removeAttribute("id"));
    target.replaceChildren(table);
};

export const preparePdfReport = (): void => {
    if (!state.lastReport) return;

    document.body.classList.add("report-pdf-active");
    reportPdf.setAttribute("aria-hidden", "false");
    const previousTheme = state.theme;
    const collapsedStates = accordionControls.map(control => control.content.hidden);
    accordionControls.forEach(control => setReportBoxExpanded(control, true, false));
    applyBlockVisibility();

    state.theme = "light";
    updateGraphicOptionsTheme();
    renderCharts(state.lastReport);

    reportPdfFilters.textContent = reportFiltersDescription(state.lastCurrentPeriod, state.lastFilterLabels);
    reportPdfIncome.textContent = `$ ${FormatNumber(state.lastReport.totalIncome)}`;
    reportPdfExpenses.textContent = `$ ${FormatNumber(state.lastReport.totalExpenses)}`;
    const netCents = Money.toCents(state.lastReport.totalIncome) - Money.toCents(state.lastReport.totalExpenses);
    reportPdfDifference.textContent = `$ ${FormatNumber(Money.fromCents(netCents))}`;
    reportPdfIncome.style.color = "#00b894";
    reportPdfExpenses.style.color = "#ff3860";
    reportPdfDifference.style.color = netCents < 0 ? "#ff3860" : "#00b894";
    const versionText = document.getElementById("appVersion")?.textContent?.trim();
    if (versionText) reportPdfVersion.textContent = versionText;

    for (const block of reportPdfChartBlocks) {
        const hasData = block.chart() !== null;
        block.pdfBox.hidden = !block.checkbox.checked;
        block.pdfTableBlock.hidden = !block.checkbox.checked;
        block.image.hidden = !hasData || !block.checkbox.checked;
        block.empty.hidden = hasData || !block.checkbox.checked;
        if (hasData && block.checkbox.checked) {
            try {
                block.image.src = block.chart()!.toBase64Image("image/png", 1);
            } catch {
                block.image.hidden = true;
                block.empty.hidden = false;
            }
        }
        if (block.checkbox.checked)
            copyTableForPdf(block.table, block.pdfTable);
        else
            block.pdfTable.replaceChildren();
    }
    const hasSelectedCharts = reportPdfChartBlocks.some(block => block.checkbox.checked);
    const hasSelectedTables = includeComparison.checked || hasSelectedCharts;
    reportPdfChartsSection.hidden = !hasSelectedCharts;
    reportPdfTablesSection.hidden = !hasSelectedTables;

    const pdfComparisonBlock = document.getElementById("reportPdfComparisonBlock") as HTMLDivElement;
    const pdfComparisonTable = document.getElementById("reportPdfComparisonTable") as HTMLDivElement;
    pdfComparisonBlock.hidden = !includeComparison.checked;
    if (includeComparison.checked) {
        copyTableForPdf(comparisonSection.querySelector("table") as HTMLTableElement, pdfComparisonTable);
    } else {
        pdfComparisonTable.replaceChildren();
    }

    state.theme = previousTheme;
    updateGraphicOptionsTheme();
    renderCharts(state.lastReport);
    accordionControls.forEach((control, index) => {
        setReportBoxExpanded(control, !collapsedStates[index], false);
    });
    applyBlockVisibility();
};
