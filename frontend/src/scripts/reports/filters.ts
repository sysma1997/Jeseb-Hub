import { AccountApiRepository } from "../../core/account/infrastructure/AccountApiRepository";
import { CategoryApiRepository } from "../../core/category/infrastructure/CategoryApiRepository";
import type { ReportFilters } from "../../core/report/domain/ReportFilters";
import { t } from "../../core/shared/infrastructure/i18n";
import { accountFilterUi, categoryFilterUi } from "./dom";
import { accountSelection, categorySelection, markReportDirty, type MultiSelection } from "./state";

const updateSelectionSummary = (selection: MultiSelection, summary: HTMLSpanElement): void => {
    summary.textContent = selection.all
        ? t("reports.filters.all")
        : selection.selected.size === 0
            ? t("reports.filters.none")
            : t("reports.filters.selected", { count: selection.selected.size });
};

const renderFilterOptions = (
    selection: MultiSelection,
    names: string[],
    container: HTMLDivElement,
    search: HTMLInputElement,
    summary: HTMLSpanElement,
    idPrefix: string
): void => {
    selection.options = Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
    container.replaceChildren();

    selection.options.forEach((name, index) => {
        const label = document.createElement("label");
        label.className = "filter-option";
        label.dataset.search = name.toLocaleLowerCase();
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `${idPrefix}-${index}`;
        checkbox.value = name;
        checkbox.checked = selection.all || selection.selected.has(name);
        const text = document.createElement("span");
        text.textContent = name;
        label.append(checkbox, text);
        container.append(label);

        checkbox.addEventListener("change", () => {
            if (selection.all) {
                selection.all = false;
                selection.selected = new Set(selection.options);
            }
            if (checkbox.checked) selection.selected.add(name);
            else selection.selected.delete(name);
            if (selection.selected.size === selection.options.length && selection.options.length > 0) {
                selection.all = true;
                selection.selected.clear();
            }
            container.querySelectorAll<HTMLInputElement>("input[type='checkbox']").forEach(option => {
                option.checked = selection.all || selection.selected.has(option.value);
            });
            updateSelectionSummary(selection, summary);
            markReportDirty();
        });
    });

    search.oninput = () => {
        const query = search.value.trim().toLocaleLowerCase();
        container.querySelectorAll<HTMLElement>(".filter-option").forEach(option => {
            option.hidden = !option.dataset.search!.includes(query);
        });
    };
    updateSelectionSummary(selection, summary);
};

const setAllOptions = (
    selection: MultiSelection,
    ui: typeof accountFilterUi | typeof categoryFilterUi,
    all: boolean
): void => {
    selection.all = all;
    selection.selected.clear();
    ui.options.querySelectorAll<HTMLInputElement>("input[type='checkbox']").forEach(checkbox => {
        checkbox.checked = all;
    });
    updateSelectionSummary(selection, ui.summary);
    markReportDirty();
};

const bindMultiFilter = (
    selection: MultiSelection,
    ui: typeof accountFilterUi | typeof categoryFilterUi
): void => {
    ui.toggle.addEventListener("click", () => {
        ui.panel.hidden = !ui.panel.hidden;
        ui.toggle.setAttribute("aria-expanded", String(!ui.panel.hidden));
        if (!ui.panel.hidden) ui.search.focus();
    });
    ui.selectAll.addEventListener("click", () => setAllOptions(selection, ui, true));
    ui.clear.addEventListener("click", () => setAllOptions(selection, ui, false));
    document.addEventListener("click", event => {
        if (!ui.root.contains(event.target as Node)) {
            ui.panel.hidden = true;
            ui.toggle.setAttribute("aria-expanded", "false");
        }
    });
    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !ui.panel.hidden) {
            ui.panel.hidden = true;
            ui.toggle.setAttribute("aria-expanded", "false");
            ui.toggle.focus();
        }
    });
};

const loadAllNames = async (
    getList: (limit: number, page: number) => Promise<{ list: Array<{ name: string }>; pages: number }>
): Promise<string[]> => {
    const pageSize = 100;
    const firstPage = await getList(pageSize, 1);
    const otherPages = await Promise.all(
        Array.from({ length: Math.max(0, firstPage.pages - 1) }, (_, index) => getList(pageSize, index + 2))
    );
    return [firstPage, ...otherPages].flatMap(page => page.list.map(item => item.name));
};

export const initFilters = (): void => {
    bindMultiFilter(accountSelection, accountFilterUi);
    bindMultiFilter(categorySelection, categoryFilterUi);

    void (async () => {
        try {
            const accountsRepository = new AccountApiRepository();
            const categoriesRepository = new CategoryApiRepository();
            const [accounts, categories] = await Promise.all([
                loadAllNames(accountsRepository.getList.bind(accountsRepository)),
                loadAllNames(categoriesRepository.getList.bind(categoriesRepository))
            ]);
            renderFilterOptions(accountSelection, accounts, accountFilterUi.options, accountFilterUi.search, accountFilterUi.summary, "report-account-filter");
            renderFilterOptions(categorySelection, categories, categoryFilterUi.options, categoryFilterUi.search, categoryFilterUi.summary, "report-category-filter");
        } catch (error) {
            if (error instanceof Error) {
                console.error(error);
                window.showAlert(error.message);
            }
        }
    })();
};

export const reportFilters = (): ReportFilters => ({
    accounts: accountSelection.all ? null : Array.from(accountSelection.selected),
    categories: categorySelection.all ? null : Array.from(categorySelection.selected)
});

export const reportFilterLabels = (): { accounts: string; categories: string } => ({
    accounts: accountSelection.all ? t("reports.filters.all") : accountSelection.selected.size === 0
        ? t("reports.filters.none")
        : Array.from(accountSelection.selected).join(", "),
    categories: categorySelection.all ? t("reports.filters.all") : categorySelection.selected.size === 0
        ? t("reports.filters.none")
        : Array.from(categorySelection.selected).join(", ")
});

export const reportFiltersDescription = (
    period: string,
    selected = reportFilterLabels()
): string => {
    return `${t("reports.visibleRange")}: ${period} · ${t("reports.filters.accounts")}: ${selected.accounts} · ${t("reports.filters.categories")}: ${selected.categories}`;
};
