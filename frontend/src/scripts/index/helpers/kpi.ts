import type { TransactionComparison } from "../../../core/transaction/domain/TransactionComparison";
import { FormatNumber } from "../../../core/shared/domain/FormatNumber";

export function updateBadge(element: HTMLElement, comparison: TransactionComparison, isExpenses: boolean = false) {
    const formatted = FormatNumber(Math.abs(comparison.percentageChange)) + '%';
    const prefix = (comparison.difference > 0) ? '+' : '-';
    element.textContent = prefix + formatted;

    let isPositive: boolean = comparison.difference > 0;
    if (isExpenses) isPositive = comparison.difference < 0;
    if (isPositive)
        element.className = 'kpi-badge kpi-badge-success';
    else element.className = 'kpi-badge kpi-badge-danger';
}

export function formatDifference(value: number, isExpenses: boolean = false) {
    const formatted = FormatNumber(Math.abs(value));
    const prefix = value > 0 ? '+' : '-';

    let className = value > 0 ? 'kpi-diff-positive' : 'kpi-diff-negative';
    if (isExpenses) className = value < 0 ? 'kpi-diff-positive' : 'kpi-diff-negative';

    return {
        text: prefix + formatted,
        className: className
    };
}
