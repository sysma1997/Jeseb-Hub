import type { Report } from "../../core/report/domain/Report";
import { reportDirtyNotice, exportCsvButton, exportPdfButton } from "./dom";

export interface MultiSelection {
    all: boolean;
    selected: Set<string>;
    options: string[];
}

export interface ComparisonRow {
    label: string;
    currentCents: number;
    previousCents: number;
    changeCents: number;
    changePercentage: number | null;
}

export const state = {
    theme: window.localStorage.getItem("theme") ?? "light",
    lastReport: null as Report | null,
    lastComparison: [] as ComparisonRow[],
    lastCurrentPeriod: "",
    lastPreviousPeriod: "",
    lastFileName: "",
    lastFilterLabels: { accounts: "", categories: "" } as { accounts: string; categories: string },
    reportIsDirty: false
};

export const dateState = {
    yearInit: 0,
    yearEnd: 0,
    dateInit: 0,
    dateEnd: 0,
    applyingQuickRange: false
};

export const accountSelection: MultiSelection = { all: true, selected: new Set(), options: [] };
export const categorySelection: MultiSelection = { all: true, selected: new Set(), options: [] };

export const markReportDirty = (): void => {
    if (!state.lastReport) return;
    state.reportIsDirty = true;
    reportDirtyNotice.hidden = false;
    exportCsvButton.disabled = true;
    exportPdfButton.disabled = true;
};
