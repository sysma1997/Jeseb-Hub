import { Chart } from "chart.js";
import type { CategoryBreakdown } from "../../../core/category/domain/CategoryBreakdown";
import { FormatNumber } from "../../../core/shared/domain/FormatNumber";
import { createDoughnutCenterText } from "./plugins";

export const doughnutColors = [
    '#00d1b2',
    '#4a9eff',
    '#ff6b6b',
    '#ffd93d',
    '#6c5ce7',
    '#fd79a8',
    '#00b894',
    '#fdcb6e',
    '#e17055',
    '#0984e3',
];

export const createGraphicsDoughnut = (
    canvas: HTMLCanvasElement,
    breakdowns: CategoryBreakdown[],
    theme: string,
    accentColor: string = '#00d1b2'
): Chart | null => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    return new Chart(ctx, {
        type: "doughnut",
        plugins: [createDoughnutCenterText(accentColor)],
        data: {
            labels: breakdowns.map(item => item.name),
            datasets: [{
                data: breakdowns.map(item => item.total),
                backgroundColor: doughnutColors.slice(0, breakdowns.length),
                borderWidth: 0,
                hoverOffset: 15,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '55%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 16,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        color: (theme === "light") ? "#1e293b" : "#f1f5f9",
                    },
                    onClick: (_e: any, legendItem: any, legend: any) => {
                        const index = legendItem.index;
                        legend.chart.toggleDataVisibility(index);
                        legend.chart.update();
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
                            const value = context.parsed;
                            const item = breakdowns[context.dataIndex];
                            return `  ${item.name}: ${FormatNumber(value)} (${item.percentage.toFixed(1)}%)`;
                        }
                    }
                }
            }
        }
    });
};
