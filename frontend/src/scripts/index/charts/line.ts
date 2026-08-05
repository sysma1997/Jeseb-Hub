import { Chart } from "chart.js";
import type { BalanceEvolution } from "../../../core/transaction/domain/BalanceEvolution";
import { FormatNumber } from "../../../core/shared/domain/FormatNumber";
import { lineChartTotals } from "./plugins";

export const createGraphicsLine = (
    canvas: HTMLCanvasElement,
    evolutions: BalanceEvolution[],
    theme: string
): Chart | null => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    return new Chart(ctx, {
        type: "line",
        plugins: [lineChartTotals],
        data: {
            labels: evolutions.map(item => {
                const d = new Date(item.date + "T00:00:00");
                return d.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
            }),
            datasets: [
                {
                    label: "Ingresos",
                    data: evolutions.map(item => item.income),
                    borderColor: "#00d1b2",
                    backgroundColor: "rgba(0, 209, 178, 0.05)",
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: "#00d1b2",
                    pointBorderColor: "transparent",
                    borderWidth: 2,
                },
                {
                    label: "Gastos",
                    data: evolutions.map(item => item.expenses),
                    borderColor: '#ff3860',
                    backgroundColor: 'rgba(255, 56, 96, 0.05)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: '#ff3860',
                    pointBorderColor: "transparent",
                    borderWidth: 2,
                },
                {
                    label: 'Balance',
                    data: evolutions.map(item => item.balance),
                    borderColor: '#3273dc',
                    backgroundColor: 'rgba(50, 115, 220, 0.03)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#3273dc',
                    pointBorderColor: "transparent",
                    borderWidth: 2.5,
                    borderDash: [5, 5],
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: { top: 24 }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value: any) => {
                            if (value >= 1000000) return '$' + (value / 1000000).toFixed(1) + 'M';
                            if (value >= 1000) return '$' + (value / 1000).toFixed(0) + 'K';
                            return '$' + value.toLocaleString();
                        },
                        font: { size: 11, weight: 'bold' },
                        color: (theme === "light") ? "#1e293b" : "#f1f5f9"
                    },
                    grid: {
                        color: (theme === "light") ? "#e2e8f0" : "#1e293b",
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { size: 11, weight: 'bold' },
                        color: (theme === "light") ? "#1e293b" : "#f1f5f9",
                        maxRotation: 45,
                        autoSkip: true,
                        maxTicksLimit: 12
                    }
                }
            },
            plugins: {
                lineChartTotals: {
                    textColor: (theme === "light") ? "#64748b" : "#94a3b8",
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 20,
                        font: { size: 12, weight: 'bold' },
                        color: (theme === "light") ? "#1e293b" : "#f1f5f9"
                    },
                    onClick: (_e: any, legendItem: any, legend: any) => {
                        const index = legendItem.datasetIndex;
                        const ci = legend.chart;
                        ci.setDatasetVisibility(index, ci.isDatasetVisible(index));
                        ci.update();
                    }
                },
                tooltip: {
                    backgroundColor: (theme === "light") ? "rgba(255, 255, 255, 0.95)" : "rgba(15, 23, 42, 0.95)",
                    titleColor: (theme === "light") ? "#1e293b" : "#f1f5f9",
                    bodyColor: (theme === "light") ? "#1e293b" : "#f1f5f9",
                    borderColor: (theme === "light") ? "#e2e8f0" : "#1e293b",
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: (context: any) => {
                            return `  ${context.dataset.label}: ${FormatNumber(context.parsed.y)}`;
                        }
                    }
                }
            }
        }
    });
};
