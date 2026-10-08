import {
    includeComparison,
    includeBalanceEvolution,
    includeAccounts,
    includeCategories,
    graphicBalanceEvolution,
    graphicAccounts,
    graphicCategories,
    graphics,
    comparisonSection
} from "./dom";
import { state } from "./state";

export const applyBlockVisibility = (): void => {
    if (!state.lastReport) return;
    const balanceVisible = includeBalanceEvolution.checked;
    const accountsVisible = includeAccounts.checked;
    const categoriesVisible = includeCategories.checked;
    graphicBalanceEvolution.style.display = balanceVisible ? "flex" : "none";
    graphicAccounts.style.display = accountsVisible ? "flex" : "none";
    graphicCategories.style.display = categoriesVisible ? "flex" : "none";
    graphics.style.display = balanceVisible || accountsVisible || categoriesVisible ? "flex" : "none";
    comparisonSection.style.display = includeComparison.checked ? "flex" : "none";
};

export const initBlockVisibility = (): void => {
    [includeComparison, includeBalanceEvolution, includeAccounts, includeCategories].forEach(checkbox => {
        checkbox.addEventListener("change", applyBlockVisibility);
    });
};
