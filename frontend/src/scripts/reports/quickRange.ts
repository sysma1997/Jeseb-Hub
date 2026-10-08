import dayjs from "dayjs";

import {
    dateInitDropdown,
    dateEndDropdown,
    yearInitDropdown,
    yearEndDropdown,
    quickRangeButtons
} from "./dom";
import { dateState, markReportDirty } from "./state";

const clearQuickRangeSelection = (): void => {
    if (dateState.applyingQuickRange) return;
    quickRangeButtons.forEach(button => button.classList.remove("is-active"));
};

const selectDropdownValue = (dropdown: HTMLDivElement, value: string): void => {
    const option = dropdown.querySelector<HTMLAnchorElement>(`.dropdown-item[data-value="${value}"]`);
    option?.click();
};

const applyQuickRange = (range: string): void => {
    const now = dayjs();
    let start: dayjs.Dayjs;
    let end: dayjs.Dayjs;
    switch (range) {
        case "thisMonth":
            start = now.startOf("month");
            end = now.startOf("month");
            break;
        case "previousMonth":
            start = now.subtract(1, "month").startOf("month");
            end = start;
            break;
        case "lastThreeMonths":
            start = now.subtract(2, "month").startOf("month");
            end = now.startOf("month");
            break;
        case "lastSixMonths":
            start = now.subtract(5, "month").startOf("month");
            end = now.startOf("month");
            break;
        case "yearToDate":
            start = now.startOf("year");
            end = now.startOf("month");
            break;
        case "previousYear":
            start = now.subtract(1, "year").startOf("year");
            end = start.endOf("year").startOf("month");
            break;
        default:
            return;
    }

    dateState.applyingQuickRange = true;
    selectDropdownValue(dateInitDropdown, String(start.month() + 1).padStart(2, "0"));
    selectDropdownValue(yearInitDropdown, String(start.year()));
    selectDropdownValue(dateEndDropdown, String(end.month() + 1).padStart(2, "0"));
    selectDropdownValue(yearEndDropdown, String(end.year()));
    dateState.applyingQuickRange = false;
    quickRangeButtons.forEach(button => button.classList.toggle("is-active", button.dataset.range === range));
};

export const initQuickRanges = (): void => {
    yearInitDropdown.addEventListener("dropdown-select", (event: Event) => {
        dateState.yearInit = Number((event as CustomEvent).detail.value);
        clearQuickRangeSelection();
        markReportDirty();
    });
    dateInitDropdown.addEventListener("dropdown-select", (event: Event) => {
        dateState.dateInit = Number((event as CustomEvent).detail.value);
        clearQuickRangeSelection();
        markReportDirty();
    });
    yearEndDropdown.addEventListener("dropdown-select", (event: Event) => {
        dateState.yearEnd = Number((event as CustomEvent).detail.value);
        clearQuickRangeSelection();
        markReportDirty();
    });
    dateEndDropdown.addEventListener("dropdown-select", (event: Event) => {
        dateState.dateEnd = Number((event as CustomEvent).detail.value);
        clearQuickRangeSelection();
        markReportDirty();
    });

    quickRangeButtons.forEach(button => {
        button.addEventListener("click", () => applyQuickRange(button.dataset.range ?? ""));
    });
};
