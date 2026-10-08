export const dateInitDropdown = document.getElementById("dateInitDropdown") as HTMLDivElement;
export const dateInitDropdownText = dateInitDropdown.querySelector(".text") as HTMLDivElement;
export const dateEndDropdown = document.getElementById("dateEndDropdown") as HTMLDivElement;
export const dateEndDropdownText = dateEndDropdown.querySelector(".text") as HTMLDivElement;
export const yearInitDropdown = document.getElementById("yearInitDropdown") as HTMLDivElement;
export const yearInitDropdownText = yearInitDropdown.querySelector(".text") as HTMLDivElement;
export const yearEndDropdown = document.getElementById("yearEndDropdown") as HTMLDivElement;
export const yearEndDropdownText = yearEndDropdown.querySelector(".text") as HTMLDivElement;

export const generateReport = document.getElementById("btnGenerateReport") as HTMLButtonElement;
export const generateReportLabel = generateReport.querySelector(".button-label") as HTMLSpanElement;
export const reportFiltersElement = document.getElementById("reportFilters") as HTMLDivElement;
export const noItems = document.getElementById("dNoItems") as HTMLDivElement;
export const totals = document.getElementById("dTotals") as HTMLDivElement;
export const totalIncomes = document.getElementById("lblTotalIncomes") as HTMLLabelElement;
export const totalExpenses = document.getElementById("lblTotalExpenses") as HTMLLabelElement;
export const totalDiff = document.getElementById("lblDiff") as HTMLLabelElement;
export const reportDateRange = document.getElementById("reportDateRange") as HTMLParagraphElement;
export const comparisonSection = document.getElementById("reportComparison") as HTMLDivElement;
export const comparisonPeriods = document.getElementById("reportComparisonPeriods") as HTMLParagraphElement;
export const comparisonRowsElement = document.getElementById("reportComparisonRows") as HTMLTableSectionElement;
export const reportActions = document.getElementById("reportActions") as HTMLDivElement;
export const reportDirtyNotice = document.getElementById("reportDirtyNotice") as HTMLParagraphElement;
export const exportCsvButton = document.getElementById("btnExportCsv") as HTMLButtonElement;
export const exportPdfButton = document.getElementById("btnExportPdf") as HTMLButtonElement;
export const graphics = document.getElementById("dGraphics") as HTMLDivElement;
export const includeComparison = document.getElementById("includeComparison") as HTMLInputElement;
export const includeBalanceEvolution = document.getElementById("includeBalanceEvolution") as HTMLInputElement;
export const includeAccounts = document.getElementById("includeAccounts") as HTMLInputElement;
export const includeCategories = document.getElementById("includeCategories") as HTMLInputElement;
export const quickRangeButtons = Array.from(document.querySelectorAll<HTMLButtonElement>(".quick-range-button"));
export const reportPdf = document.getElementById("reportPdf") as HTMLElement;
export const reportPdfFilters = document.getElementById("reportPdfFilters") as HTMLParagraphElement;
export const reportPdfIncome = document.getElementById("reportPdfIncome") as HTMLElement;
export const reportPdfExpenses = document.getElementById("reportPdfExpenses") as HTMLElement;
export const reportPdfDifference = document.getElementById("reportPdfDifference") as HTMLElement;
export const reportPdfVersion = document.getElementById("reportPdfVersion") as HTMLSpanElement;
export const reportPdfChartsSection = document.querySelector(".report-pdf-charts") as HTMLElement;
export const reportPdfTablesSection = document.querySelector(".report-pdf-tables") as HTMLElement;

export const graphicBalanceEvolution = document.getElementById("dgBalanceEvolution") as HTMLDivElement;
export const canvasBalanceEvolution = document.getElementById("dgcBalanceEvolution") as HTMLCanvasElement;
export const emptyBalanceEvolution = document.getElementById("emptyBalanceEvolution") as HTMLParagraphElement;
export const tableBalanceEvolution = document.getElementById("tableBalanceEvolution") as HTMLTableElement;
export const totalBalanceEvolution = document.getElementById("totalBalanceEvolution") as HTMLTableCellElement;

export const graphicAccounts = document.getElementById("dgAccounts") as HTMLDivElement;
export const canvasAccounts = document.getElementById("dgcAccounts") as HTMLCanvasElement;
export const emptyAccounts = document.getElementById("emptyAccounts") as HTMLParagraphElement;
export const tableAccounts = document.getElementById("tableAccounts") as HTMLTableElement;
export const totalAccounts = document.getElementById("totalAccounts") as HTMLTableCellElement;

export const graphicCategories = document.getElementById("dgCategories") as HTMLDivElement;
export const canvasCategories = document.getElementById("dgcCategories") as HTMLCanvasElement;
export const emptyCategories = document.getElementById("emptyCategories") as HTMLParagraphElement;
export const tableCategories = document.getElementById("tableCategories") as HTMLTableElement;
export const totalCategories = document.getElementById("totalCategories") as HTMLTableCellElement;
export const totalPercentCategories = document.getElementById("totalPercentCategories") as HTMLTableCellElement;

export const accountFilterUi = {
    root: document.getElementById("accountsFilter") as HTMLDivElement,
    toggle: document.getElementById("accountsFilterToggle") as HTMLButtonElement,
    panel: document.getElementById("accountsFilterPanel") as HTMLDivElement,
    summary: document.getElementById("accountsSelectionSummary") as HTMLSpanElement,
    options: document.getElementById("accountFilterOptions") as HTMLDivElement,
    search: document.getElementById("accountsSearch") as HTMLInputElement,
    selectAll: document.getElementById("selectAllAccounts") as HTMLButtonElement,
    clear: document.getElementById("clearAccounts") as HTMLButtonElement
};

export const categoryFilterUi = {
    root: document.getElementById("categoriesFilter") as HTMLDivElement,
    toggle: document.getElementById("categoriesFilterToggle") as HTMLButtonElement,
    panel: document.getElementById("categoriesFilterPanel") as HTMLDivElement,
    summary: document.getElementById("categoriesSelectionSummary") as HTMLSpanElement,
    options: document.getElementById("categoryFilterOptions") as HTMLDivElement,
    search: document.getElementById("categoriesSearch") as HTMLInputElement,
    selectAll: document.getElementById("selectAllCategories") as HTMLButtonElement,
    clear: document.getElementById("clearCategories") as HTMLButtonElement
};
