import {
    Chart,
    DoughnutController, ArcElement, Tooltip, Legend,
    LineController, LineElement, PointElement, LinearScale,
    CategoryScale, Filler
} from "chart.js";
import dayjs from "dayjs";
import dayjsUtc from "dayjs/plugin/utc";

import type { AccountRepository } from "../core/account/domain/AccountRepository";
import { AccountApiRepository } from "../core/account/infrastructure/AccountApiRepository";
import type { TransactionRepository } from "../core/transaction/domain/TransactionRepository";
import { TransactionApiRepository } from "../core/transaction/infrastructure/TransactionApiRepository";
import type { TransactionComparison } from "../core/transaction/domain/TransactionComparison";
import type { BalanceEvolution } from "../core/transaction/domain/BalanceEvolution";
import type { CategoryRepository } from "../core/category/domain/CategoryRepository";
import { CategoryApiRepository } from "../core/category/infrastructure/CategoryApiRepository";
import type { CategoryBreakdown } from "../core/category/domain/CategoryBreakdown";

import { FormatNumber } from "../core/shared/domain/FormatNumber";
import { Attach } from "../core/shared/domain/Subject";

Chart.register(DoughnutController, ArcElement, Tooltip, Legend,
    LineController, LineElement, PointElement, LinearScale,
    CategoryScale, Filler);
dayjs.extend(dayjsUtc);

const accountRepository: AccountRepository = new AccountApiRepository();
const transactionRepository: TransactionRepository = new TransactionApiRepository();
const categoryRepository: CategoryRepository = new CategoryApiRepository();

const totalBalance = document.getElementById("totalBalance") as HTMLSpanElement;

const incomeCurrent = document.getElementById("incomeCurrent") as HTMLSpanElement;
const incomePrevious = document.getElementById("incomePrevious") as HTMLSpanElement;
const incomeDiff = document.getElementById("incomeDiff") as HTMLSpanElement;
//const incomePercentageChange = document.getElementById("incomePercentageChange") as HTMLSpanElement;
const incomeBadge = document.getElementById("incomeBadge") as HTMLSpanElement;

const expensesCurrent = document.getElementById("expensesCurrent") as HTMLSpanElement;
const expensesPrevious = document.getElementById("expensesPrevious") as HTMLSpanElement;
const expensesDiff = document.getElementById("expensesDiff") as HTMLSpanElement;
//const expensesPercentageChange = document.getElementById("expensesPercentageChange") as HTMLSpanElement;
const expensesBadge = document.getElementById("expensesBadge") as HTMLSpanElement;

const netSavingCurrent = document.getElementById("netSavingCurrent") as HTMLSpanElement;
const netSavingPrevious = document.getElementById("netSavingPrevious") as HTMLSpanElement;
const netSavingDiff = document.getElementById("netSavingDiff") as HTMLSpanElement;
//const netSavingPercentageChange = document.getElementById("netSavingPercentageChange") as HTMLSpanElement;
const netSavingBadge = document.getElementById("netSavingBadge") as HTMLSpanElement;

const categoryBreakdownIncome = document.getElementById("categoryBreakdownIncome") as HTMLCanvasElement;
let chartCategoryBreakdownIncome: Chart | null = null;
const categoryBreakdownExpenses = document.getElementById("categoryBreakdownExpenses") as HTMLCanvasElement;
let chartCategoryBreakdownExpenses: Chart | null = null;
const balanceEvolution = document.getElementById("balanceEvolution") as HTMLCanvasElement;
let chartBalanceEvolution: Chart | null = null;

const topExpenses = document.getElementById("topExpenses") as HTMLUListElement;

// Colores para los gráficos de dona - paleta moderna
const colors = [
    '#00d1b2',  // Menta
    '#4a9eff',  // Azul
    '#ff6b6b',  // Rojo
    '#ffd93d',  // Amarillo
    '#6c5ce7',  // Púrpura
    '#fd79a8',  // Rosa
    '#00b894',  // Verde
    '#fdcb6e',  // Dorado
    '#e17055',  // Naranja
    '#0984e3',  // Azul oscuro
];

// Función para actualizar badges con lógica correcta
function updateBadge(element: HTMLElement, comparison: TransactionComparison, isExpenses: boolean = false) {
    const formatted = FormatNumber(Math.abs(comparison.percentageChange)) + '%';
    const prefix = (comparison.difference > 0) ? '+' : '-';
    element.textContent = prefix + formatted;

    let isPositive: boolean = comparison.difference > 0;
    if (isExpenses) isPositive = comparison.difference < 0;
    if (isPositive)
        element.className = 'kpi-badge kpi-badge-success';
    else element.className = 'kpi-badge kpi-badge-danger';
}
// Función para formatear la diferencia con signo
function formatDifference(value: number, isExpenses: boolean = false) {
    const formatted = FormatNumber(Math.abs(value));
    const prefix = value > 0 ? '+' : '-';

    let className = value > 0 ? 'kpi-diff-positive' : 'kpi-diff-negative';
    if (isExpenses) className = value < 0 ? 'kpi-diff-positive' : 'kpi-diff-negative';

    return {
        text: prefix + formatted,
        className: className
    };
}

const createGraphicsDoughnut = (canvas: HTMLCanvasElement,
    breakdowns: CategoryBreakdown[],
    theme: string): Chart | null => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    return new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: breakdowns.map(item => item.name),
            datasets: [{
                data: breakdowns.map(item => item.total),
                backgroundColor: colors.slice(0, breakdowns.length),
                borderWidth: 0, // Sin bordes
                hoverOffset: 15,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '0%', // Sin hueco - torta completa
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
const createGraphicsLine = (canvas: HTMLCanvasElement, evolutions: BalanceEvolution[], theme: string): Chart | null => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    return new Chart(ctx, {
        type: "line",
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
            interaction: {
                intersect: false,
                mode: 'index'
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value: any) => {
                            if (value >= 1000000) {
                                return '$' + (value / 1000000).toFixed(1) + 'M';
                            } else if (value >= 1000) {
                                return '$' + (value / 1000).toFixed(0) + 'K';
                            }
                            return '$' + value.toLocaleString();
                        },
                        font: {
                            size: 11,
                            weight: 'bold'
                        },
                        color: (theme === "light") ? "#1e293b" : "#f1f5f9"
                    },
                    grid: {
                        color: (theme === "light") ? "#e2e8f0" : "#1e293b",
                    }
                },
                x: {
                    grid: {
                        display: false,
                    },
                    ticks: {
                        font: {
                            size: 11,
                            weight: 'bold'
                        },
                        color: (theme === "light") ? "#1e293b" : "#f1f5f9",
                        maxRotation: 45,
                        autoSkip: true,
                        maxTicksLimit: 12
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 20,
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        color: (theme === "light") ? "#1e293b" : "#f1f5f9"
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
}

try {
    accountRepository.getTotalBalance().then((total: number) => {
        totalBalance.textContent = FormatNumber(total);
    });
    (async () => {
        const income: TransactionComparison = await transactionRepository.getMonthlyIncome(undefined, true);
        incomeCurrent.textContent = FormatNumber(income.current);
        incomePrevious.textContent = FormatNumber(income.previous);
        const incomeDiffFormatted = formatDifference(income.difference);
        incomeDiff.textContent = incomeDiffFormatted.text;
        incomeDiff.className = 'kpi-difference ' + incomeDiffFormatted.className;
        updateBadge(incomeBadge, income);

        const expenses: TransactionComparison = await transactionRepository.getMonthlyExpenses(undefined, true);
        expensesCurrent.textContent = FormatNumber(expenses.current);
        expensesPrevious.textContent = FormatNumber(expenses.previous);
        const expensesDiffFormatted = formatDifference(expenses.difference, true);
        expensesDiff.textContent = expensesDiffFormatted.text;
        expensesDiff.className = 'kpi-difference ' + expensesDiffFormatted.className;
        updateBadge(expensesBadge, expenses, true);

        const netSC = income.current - expenses.current;
        const netSP = income.previous - expenses.previous;
        const netSD = netSC - netSP;
        const netSPC = (netSP === 0) ? 0 : (netSD / netSP) * 100;
        const netSaving: TransactionComparison = {
            current: netSC,
            previous: netSP,
            difference: netSD,
            percentageChange: netSPC
        };
        netSavingCurrent.textContent = FormatNumber(netSaving.current);
        netSavingPrevious.textContent = FormatNumber(netSaving.previous);
        const netSavingDiffFormatted = formatDifference(netSaving.difference);
        netSavingDiff.textContent = netSavingDiffFormatted.text;
        netSavingDiff.className = 'kpi-difference ' + netSavingDiffFormatted.className;
        updateBadge(netSavingBadge, netSaving);

        const theme: string = window.localStorage.getItem("theme") ?? "light";
        const cbIncome = await categoryRepository.getMonthlyReport(true);
        chartCategoryBreakdownIncome = createGraphicsDoughnut(categoryBreakdownIncome, cbIncome, theme);

        const cbExpenses = await categoryRepository.getMonthlyReport(false);
        chartCategoryBreakdownExpenses = createGraphicsDoughnut(categoryBreakdownExpenses, cbExpenses, theme);

        topExpenses.innerHTML = "";
        // Colores para los rankings
        const rankColors = [
            'linear-gradient(135deg, #ffd700, #ffb300)', // Oro
            'linear-gradient(135deg, #c0c0c0, #a8a8a8)', // Plata
            'linear-gradient(135deg, #cd7f32, #b87333)'  // Bronce
        ];
        const nBreakdowns = [...cbExpenses]
            .sort((a, b) => b.total - a.total)
            .slice(0, 3);
        for (let i = 0; i < nBreakdowns.length; i++) {
            const breakdown: CategoryBreakdown = nBreakdowns[i];

            const li = document.createElement("li") as HTMLLIElement;
            li.className = 'top-expense-item-modern';

            // Crear estructura del item
            li.innerHTML = `<div class="top-expense-rank">
                    <span class="rank-number" style="background: ${rankColors[i] || '#95a5a6'}">
                        ${i + 1}
                    </span>
                </div>
                <div class="top-expense-info">
                    <div class="top-expense-category">${breakdown.name}</div>
                    <div class="top-expense-amount">${FormatNumber(breakdown.total)}</div>
                </div>
                <div class="top-expense-percentage">
                    <span class="percentage-bar-wrapper">
                        <span class="percentage-bar" style="width: ${Math.min(breakdown.percentage, 100)}%"></span>
                        <span class="percentage-text">${FormatNumber(breakdown.percentage)}%</span>
                    </span>
                </div>`;

            topExpenses.appendChild(li);
        }

        const evolutions = await transactionRepository.getBalanceEvolution();
        chartBalanceEvolution = createGraphicsLine(balanceEvolution, evolutions, theme);

        Attach("menu:theme", async (theme: string) => {
            if (chartCategoryBreakdownIncome) {
                chartCategoryBreakdownIncome.destroy();
                chartCategoryBreakdownIncome = null;
                chartCategoryBreakdownIncome = createGraphicsDoughnut(categoryBreakdownIncome, cbIncome, theme);
            }
            if (chartCategoryBreakdownExpenses) {
                chartCategoryBreakdownExpenses.destroy();
                chartCategoryBreakdownExpenses = null;
                chartCategoryBreakdownExpenses = createGraphicsDoughnut(categoryBreakdownExpenses, cbExpenses, theme);
            }
            if (chartBalanceEvolution) {
                chartBalanceEvolution.destroy();
                chartBalanceEvolution = null;
                chartBalanceEvolution = createGraphicsLine(balanceEvolution, evolutions, theme);
            }
        });
    })();
} catch (err: any) {
    if (err instanceof Error) {
        console.error(err);
        window.showAlert(err.message);
    }
}