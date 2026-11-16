import type { ReportItem } from "../../core/report/domain/Report";
import { FormatNumber } from "../../core/shared/domain/FormatNumber";
import { Money } from "../../core/shared/domain/Money";

export const formatDate = (date: string): string => {
    if (!/^\d{4}-\d{2}$/.test(date)) return date;
    const parsed = new Date(`${date}-01T00:00:00`);
    return Number.isNaN(parsed.getTime())
        ? date
        : parsed.toLocaleDateString(document.documentElement.lang || undefined, { month: "short", year: "numeric" });
};

export const setNumberTone = (element: HTMLElement, value: number): void => {
    element.classList.remove("is-positive", "is-negative", "is-neutral");
    element.classList.add(value > 0 ? "is-positive" : value < 0 ? "is-negative" : "is-neutral");
};

export const renderTable = (table: HTMLTableElement, totalCell: HTMLTableCellElement, 
    items: ReportItem[], expenseTotalCents?: number, totalPercentageCell?: HTMLTableCellElement): void => {
    const tbody = table.querySelector("tbody") as HTMLTableSectionElement;
    tbody.replaceChildren();

    let totalCents = 0;
    const sortedItems = [...items].sort((a, b) =>
        a.date.localeCompare(b.date) || a.name.localeCompare(b.name)
    );
    for (const item of sortedItems) {
        totalCents += Money.toCents(item.value);
        const row = document.createElement("tr");
        const dateCell = document.createElement("td");
        const nameCell = document.createElement("td");
        const amountCell = document.createElement("td");
        dateCell.textContent = formatDate(item.date);
        nameCell.textContent = item.name;
        amountCell.textContent = `$ ${FormatNumber(item.value)}`;
        setNumberTone(amountCell, item.value);
        row.append(dateCell, nameCell, amountCell);
        if (expenseTotalCents !== undefined) {
            const percentageCell = document.createElement("td");
            const itemCents = Money.toCents(item.value);
            const percentage = expenseTotalCents > 0 ? (itemCents / expenseTotalCents) * 100 : 0;
            percentageCell.textContent = `${FormatNumber(percentage)}%`;
            setNumberTone(percentageCell, percentage);
            row.append(percentageCell);
        }
        tbody.append(row);
    }

    totalCell.textContent = `$ ${FormatNumber(Money.fromCents(totalCents))}`;
    setNumberTone(totalCell, totalCents);
    if (totalPercentageCell && expenseTotalCents !== undefined) {
        const totalPercentage = expenseTotalCents > 0 ? (totalCents / expenseTotalCents) * 100 : 0;
        totalPercentageCell.textContent = `${FormatNumber(totalPercentage)}%`;
        setNumberTone(totalPercentageCell, totalPercentage);
    }
};

export const toggleBlock = (
    block: HTMLDivElement,
    canvas: HTMLCanvasElement,
    emptyMessage: HTMLParagraphElement,
    table: HTMLTableElement,
    hasItems: boolean
): void => {
    block.style.display = "flex";
    emptyMessage.hidden = hasItems;
    canvas.parentElement!.style.display = hasItems ? "block" : "none";
    table.parentElement!.style.display = hasItems ? "block" : "none";
};
