import Papa from "papaparse";

import { t } from "../../core/shared/infrastructure/i18n";
import {
    includeAccounts,
    includeBalanceEvolution,
    includeCategories,
    includeComparison
} from "./dom";
import { state } from "./state";
import { formatDate } from "./tables";
import { buildReportCsvRows } from "./csvContent";

export const exportReportCsv = (): void => {
    if (!state.lastReport) return;

    const rows = buildReportCsvRows({
        report: state.lastReport,
        comparison: state.lastComparison,
        currentPeriod: state.lastCurrentPeriod,
        previousPeriod: state.lastPreviousPeriod,
        filterLabels: state.lastFilterLabels,
        includeComparison: includeComparison.checked,
        includeBalanceEvolution: includeBalanceEvolution.checked,
        includeAccounts: includeAccounts.checked,
        includeCategories: includeCategories.checked
    }, t, formatDate);

    const csv = Papa.unparse(rows, { newline: "\r\n" });
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
