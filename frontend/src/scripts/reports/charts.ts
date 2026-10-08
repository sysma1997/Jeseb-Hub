import { Chart } from "chart.js";

import type { Report, ReportItem } from "../../core/report/domain/Report";
import { FormatNumber } from "../../core/shared/domain/FormatNumber";
import { Money } from "../../core/shared/domain/Money";
import { t } from "../../core/shared/infrastructure/i18n";
import { state } from "./state";
import { canvasBalanceEvolution, canvasAccounts, canvasCategories } from "./dom";

const chartColors = [
    { border: "#00d1b2", background: "rgba(0, 209, 178, 0.3)" },
    { border: "#4a9eff", background: "rgba(74, 158, 255, 0.3)" },
    { border: "#ff6b6b", background: "rgba(255, 107, 107, 0.3)" },
    { border: "#ffd93d", background: "rgba(255, 217, 61, 0.3)" },
    { border: "#6c5ce7", background: "rgba(108, 92, 231, 0.3)" },
    { border: "#fd79a8", background: "rgba(253, 121, 168, 0.3)" },
    { border: "#00b894", background: "rgba(0, 184, 148, 0.3)" },
    { border: "#fdcb6e", background: "rgba(253, 203, 110, 0.3)" },
    { border: "#e17055", background: "rgba(225, 112, 85, 0.3)" },
    { border: "#0984e3", background: "rgba(9, 132, 227, 0.3)" },
];

let chartBalanceEvolution: Chart | null = null;
let chartAccounts: Chart | null = null;
let chartCategories: Chart | null = null;

const graphicGetOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    interaction: {
        intersect: false,
        mode: "index"
    },
    scales: {
        y: {
            beginAtZero: true,
            ticks: {
                callback: (value: number) => `$ ${FormatNumber(value)}`,
                font: { size: 11, weight: "bold" },
                color: state.theme === "light" ? "#1e293b" : "#f1f5f9"
            },
            grid: { color: state.theme === "light" ? "#e2e8f0" : "#1e293b" }
        },
        x: {
            grid: { display: false },
            ticks: {
                font: { size: 11, weight: "bold" },
                color: state.theme === "light" ? "#1e293b" : "#f1f5f9",
                maxRotation: 45,
                autoSkip: true,
                maxTicksLimit: 12
            }
        }
    },
    plugins: {
        legend: {
            position: "bottom",
            labels: {
                usePointStyle: true,
                pointStyle: "circle",
                padding: 20,
                font: { size: 12, weight: "bold" },
                color: state.theme === "light" ? "#1e293b" : "#f1f5f9"
            }
        },
        tooltip: {
            backgroundColor: state.theme === "light" ? "rgba(255, 255, 255, 0.95)" : "rgba(15, 23, 42, 0.95)",
            titleColor: state.theme === "light" ? "#1e293b" : "#f1f5f9",
            bodyColor: state.theme === "light" ? "#1e293b" : "#f1f5f9",
            borderColor: state.theme === "light" ? "#e2e8f0" : "#1e293b",
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            callbacks: {
                label: (context: any) => {
                    const value = context.chart.config.type === "bar" ? context.parsed.x : context.parsed.y;
                    return `${context.dataset.label}: $ ${FormatNumber(value)}`;
                }
            }
        }
    }
};

export const updateGraphicOptionsTheme = (): void => {
    const textColor = state.theme === "light" ? "#1e293b" : "#f1f5f9";
    const gridColor = state.theme === "light" ? "#e2e8f0" : "#1e293b";
    const tooltipBackground = state.theme === "light" ? "rgba(255, 255, 255, 0.95)" : "rgba(15, 23, 42, 0.95)";
    graphicGetOptions.scales.y.ticks.color = textColor;
    graphicGetOptions.scales.y.grid.color = gridColor;
    graphicGetOptions.scales.x.ticks.color = textColor;
    graphicGetOptions.plugins.legend.labels.color = textColor;
    graphicGetOptions.plugins.tooltip.backgroundColor = tooltipBackground;
    graphicGetOptions.plugins.tooltip.titleColor = textColor;
    graphicGetOptions.plugins.tooltip.bodyColor = textColor;
    graphicGetOptions.plugins.tooltip.borderColor = gridColor;
};

const createGraphicLineBalanceEvolution = (canvas: HTMLCanvasElement, items: ReportItem[]): Chart | null => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const color = chartColors[0];
    return new Chart(ctx, {
        type: "line",
        data: {
            labels: items.map(item => item.name),
            datasets: [{
                label: t("index.graphics.totalBalance"),
                data: items.map(item => item.value),
                borderColor: color.border,
                backgroundColor: color.background,
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointBackgroundColor: color.border,
                pointBorderColor: "transparent",
                borderWidth: 2
            }]
        },
        options: graphicGetOptions
    });
};

const createGraphicLineAcCa = (canvas: HTMLCanvasElement, items: ReportItem[]): Chart | null => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const labels = Array.from(new Set(items.map(item => item.date))).sort((a, b) => a.localeCompare(b));
    const names = Array.from(new Set(items.map(item => item.name))).sort((a, b) => a.localeCompare(b));
    const datasets = names.map((name, index) => {
        const color = chartColors[index % chartColors.length];
        return {
            label: name,
            data: labels.map(labelDate => items.find(item => item.name === name && item.date === labelDate)?.value ?? 0),
            borderColor: color.border,
            backgroundColor: color.background,
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: color.border,
            pointBorderColor: "transparent",
            borderWidth: 2
        };
    });

    return new Chart(ctx, {
        type: "line",
        data: { labels, datasets },
        options: graphicGetOptions
    });
};

const createGraphicCategories = (canvas: HTMLCanvasElement, items: ReportItem[], totalExpenses: number): Chart | null => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const totalsByCategory = new Map<string, number>();
    for (const item of items) {
        totalsByCategory.set(item.name, (totalsByCategory.get(item.name) ?? 0) + Money.toCents(item.value));
    }
    const categories = Array.from(totalsByCategory.entries()).sort((a, b) => b[1] - a[1]);
    const textColor = state.theme === "light" ? "#1e293b" : "#f1f5f9";
    const totalExpensesCents = Money.toCents(totalExpenses);

    return new Chart(ctx, {
        type: "bar",
        data: {
            labels: categories.map(([name]) => name),
            datasets: [{
                label: t("reports.graphics.categories"),
                data: categories.map(([, valueCents]) => Money.fromCents(valueCents)),
                backgroundColor: categories.map((_, index) => chartColors[index % chartColors.length].background),
                borderColor: categories.map((_, index) => chartColors[index % chartColors.length].border),
                borderWidth: 1,
                borderRadius: 5
            }]
        },
        options: {
            ...graphicGetOptions,
            indexAxis: "y",
            plugins: {
                ...graphicGetOptions.plugins,
                legend: { display: false },
                tooltip: {
                    ...graphicGetOptions.plugins.tooltip,
                    callbacks: {
                        label: (context: any) => {
                            const [categoryName, valueCents] = categories[context.dataIndex];
                            const percentage = totalExpensesCents > 0
                                ? (valueCents / totalExpensesCents) * 100
                                : 0;
                            return `${categoryName}: $ ${FormatNumber(Money.fromCents(valueCents))} (${FormatNumber(percentage)}%)`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value: number) => `$ ${FormatNumber(Number(value))}`,
                        color: textColor,
                        font: { size: 11, weight: "bold" }
                    },
                    grid: { color: state.theme === "light" ? "#e2e8f0" : "#1e293b" }
                },
                y: {
                    ticks: { color: textColor, font: { size: 11, weight: "bold" } },
                    grid: { display: false }
                }
            }
        } as any
    });
};

export const renderCharts = (report: Report): void => {
    chartBalanceEvolution?.destroy();
    chartAccounts?.destroy();
    chartCategories?.destroy();

    chartBalanceEvolution = report.balanceEvolution.length
        ? createGraphicLineBalanceEvolution(canvasBalanceEvolution, report.balanceEvolution)
        : null;
    chartAccounts = report.accounts.length
        ? createGraphicLineAcCa(canvasAccounts, report.accounts)
        : null;
    chartCategories = report.categories.length
        ? createGraphicCategories(canvasCategories, report.categories, report.totalExpenses)
        : null;
};

export const resizeChartForBox = (boxId: string): void => {
    if (boxId === "dgBalanceEvolution") chartBalanceEvolution?.resize();
    if (boxId === "dgAccounts") chartAccounts?.resize();
    if (boxId === "dgCategories") chartCategories?.resize();
};

export const getBalanceEvolutionChart = (): Chart | null => chartBalanceEvolution;
export const getAccountsChart = (): Chart | null => chartAccounts;
export const getCategoriesChart = (): Chart | null => chartCategories;
