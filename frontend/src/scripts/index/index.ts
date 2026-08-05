import {
    Chart,
    DoughnutController, ArcElement, Tooltip, Legend,
    LineController, LineElement, PointElement, LinearScale,
    CategoryScale, Filler
} from "chart.js";
import dayjs from "dayjs";
import dayjsUtc from "dayjs/plugin/utc";

import type { AccountRepository } from "../../core/account/domain/AccountRepository";
import { AccountApiRepository } from "../../core/account/infrastructure/AccountApiRepository";
import type { TransactionRepository } from "../../core/transaction/domain/TransactionRepository";
import { TransactionApiRepository } from "../../core/transaction/infrastructure/TransactionApiRepository";
import type { TransactionComparison } from "../../core/transaction/domain/TransactionComparison";
import type { CategoryRepository } from "../../core/category/domain/CategoryRepository";
import { CategoryApiRepository } from "../../core/category/infrastructure/CategoryApiRepository";

import { FormatNumber } from "../../core/shared/domain/FormatNumber";
import { Attach } from "../../core/shared/domain/Subject";
import { t } from "../../core/shared/infrastructure/i18n";

import { updateBadge, formatDifference } from "./helpers/kpi";
import { createGraphicsDoughnut } from "./charts/doughnut";
import { createGraphicsLine } from "./charts/line";

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
const incomeBadge = document.getElementById("incomeBadge") as HTMLSpanElement;

const expensesCurrent = document.getElementById("expensesCurrent") as HTMLSpanElement;
const expensesPrevious = document.getElementById("expensesPrevious") as HTMLSpanElement;
const expensesDiff = document.getElementById("expensesDiff") as HTMLSpanElement;
const expensesBadge = document.getElementById("expensesBadge") as HTMLSpanElement;

const netSavingCurrent = document.getElementById("netSavingCurrent") as HTMLSpanElement;
const netSavingPrevious = document.getElementById("netSavingPrevious") as HTMLSpanElement;
const netSavingDiff = document.getElementById("netSavingDiff") as HTMLSpanElement;
const netSavingBadge = document.getElementById("netSavingBadge") as HTMLSpanElement;

const categoryBreakdownIncome = document.getElementById("categoryBreakdownIncome") as HTMLCanvasElement;
let chartCategoryBreakdownIncome: Chart | null = null;
const categoryBreakdownExpenses = document.getElementById("categoryBreakdownExpenses") as HTMLCanvasElement;
let chartCategoryBreakdownExpenses: Chart | null = null;
const balanceEvolution = document.getElementById("balanceEvolution") as HTMLCanvasElement;
let chartBalanceEvolution: Chart | null = null;

const topExpenses = document.getElementById("topExpenses") as HTMLUListElement;

function showEmptyState(parent: Element, svgPath: string) {
    const canvas = parent.querySelector('canvas');
    if (!canvas) return;
    canvas.style.display = 'none';
    const wrapper = canvas.parentElement!;
    wrapper.innerHTML = `<div class="empty-state">
        <svg class="empty-state-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            ${svgPath}
        </svg>
        <span class="empty-state-text">${t("index.empty.charts")}</span>
    </div>`;
}

function showTopExpensesEmpty() {
    topExpenses.innerHTML = `<div class="top-expenses-empty">
        <svg class="top-expenses-empty-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
        </svg>
        <span class="top-expenses-empty-text">${t("index.empty.top")}</span>
    </div>`;
}

function renderTopExpenses(breakdowns: any[]) {
    const rankColors = [
        'linear-gradient(135deg, #ffd700, #ffb300)',
        'linear-gradient(135deg, #c0c0c0, #a8a8a8)',
        'linear-gradient(135deg, #cd7f32, #b87333)'
    ];
    for (let i = 0; i < breakdowns.length; i++) {
        const b = breakdowns[i];
        const li = document.createElement("li") as HTMLLIElement;
        li.className = 'top-expense-item-modern';
        li.innerHTML = `<div class="top-expense-rank">
                <span class="rank-number" style="background: ${rankColors[i] || '#95a5a6'}">${i + 1}</span>
            </div>
            <div class="top-expense-info">
                <div class="top-expense-category">${b.name}</div>
                <div class="top-expense-amount">${FormatNumber(b.total)}</div>
            </div>
            <div class="top-expense-percentage">
                <span class="percentage-bar-wrapper">
                    <span class="percentage-bar" style="width: ${Math.min(b.percentage, 100)}%"></span>
                    <span class="percentage-text">${FormatNumber(b.percentage)}%</span>
                </span>
            </div>`;
        topExpenses.appendChild(li);
    }
}

try {
    accountRepository.getTotalBalance().then((total: number) => {
        if (total === 0) {
            totalBalance.textContent = t("index.empty.balance");
            totalBalance.classList.add('empty');
        } else {
            totalBalance.textContent = FormatNumber(total);
        }
    });

    (async () => {
        const income: TransactionComparison = await transactionRepository.getMonthlyIncome(undefined, true);
        incomeCurrent.textContent = FormatNumber(income.current);
        incomePrevious.textContent = FormatNumber(income.previous);
        if (income.current === 0 && income.previous === 0) {
            incomeBadge.style.display = 'none';
            incomeDiff.style.display = 'none';
        } else {
            const diff = formatDifference(income.difference);
            incomeDiff.textContent = diff.text;
            incomeDiff.className = 'kpi-difference ' + diff.className;
            updateBadge(incomeBadge, income);
        }

        const expenses: TransactionComparison = await transactionRepository.getMonthlyExpenses(undefined, true);
        expensesCurrent.textContent = FormatNumber(expenses.current);
        expensesPrevious.textContent = FormatNumber(expenses.previous);
        if (expenses.current === 0 && expenses.previous === 0) {
            expensesBadge.style.display = 'none';
            expensesDiff.style.display = 'none';
        } else {
            const diff = formatDifference(expenses.difference, true);
            expensesDiff.textContent = diff.text;
            expensesDiff.className = 'kpi-difference ' + diff.className;
            updateBadge(expensesBadge, expenses, true);
        }

        const netSC = income.current - expenses.current;
        const netSP = income.previous - expenses.previous;
        const netSD = netSC - netSP;
        const netSPC = (netSP === 0) ? 0 : (netSD / netSP) * 100;
        const netSaving: TransactionComparison = {
            current: netSC, previous: netSP, difference: netSD, percentageChange: netSPC
        };
        netSavingCurrent.textContent = FormatNumber(netSaving.current);
        netSavingPrevious.textContent = FormatNumber(netSaving.previous);
        if (netSaving.current === 0 && netSaving.previous === 0) {
            netSavingBadge.style.display = 'none';
            netSavingDiff.style.display = 'none';
        } else {
            const diff = formatDifference(netSaving.difference);
            netSavingDiff.textContent = diff.text;
            netSavingDiff.className = 'kpi-difference ' + diff.className;
            updateBadge(netSavingBadge, netSaving);
        }

        const theme: string = window.localStorage.getItem("theme") ?? "light";

        const cbIncome = await categoryRepository.getMonthlyReport(true);
        if (cbIncome.length === 0) {
            showEmptyState(categoryBreakdownIncome.parentElement!, '<path d="M12 19V5M5 12l7-7 7 7"/>');
        } else {
            chartCategoryBreakdownIncome = createGraphicsDoughnut(categoryBreakdownIncome, cbIncome, theme, '#00d1b2');
        }

        const cbExpenses = await categoryRepository.getMonthlyReport(false);
        if (cbExpenses.length === 0) {
            showEmptyState(categoryBreakdownExpenses.parentElement!, '<path d="M12 5v14M5 12l7 7 7-7"/>');
        } else {
            chartCategoryBreakdownExpenses = createGraphicsDoughnut(categoryBreakdownExpenses, cbExpenses, theme, '#ff3860');
        }

        topExpenses.innerHTML = "";
        const nBreakdowns = [...cbExpenses].sort((a, b) => b.total - a.total).slice(0, 3);
        if (nBreakdowns.length === 0) {
            showTopExpensesEmpty();
        } else {
            renderTopExpenses(nBreakdowns);
        }

        const evolutions = await transactionRepository.getBalanceEvolution();
        if (evolutions.length === 0) {
            showEmptyState(balanceEvolution.parentElement!, '<path d="M3 12L7 8L11 12L17 6L21 10"/><path d="M3 16L7 12L11 16L17 10L21 14"/>');
        } else {
            chartBalanceEvolution = createGraphicsLine(balanceEvolution, evolutions, theme);
        }

        Attach("menu:theme", async (theme: string) => {
            if (chartCategoryBreakdownIncome && cbIncome.length > 0) {
                chartCategoryBreakdownIncome.destroy();
                chartCategoryBreakdownIncome = createGraphicsDoughnut(categoryBreakdownIncome, cbIncome, theme, '#00d1b2');
            }
            if (chartCategoryBreakdownExpenses && cbExpenses.length > 0) {
                chartCategoryBreakdownExpenses.destroy();
                chartCategoryBreakdownExpenses = createGraphicsDoughnut(categoryBreakdownExpenses, cbExpenses, theme, '#ff3860');
            }
            if (chartBalanceEvolution && evolutions.length > 0) {
                chartBalanceEvolution.destroy();
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
