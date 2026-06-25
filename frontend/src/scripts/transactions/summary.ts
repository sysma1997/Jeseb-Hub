import dayjs from "dayjs";

import type { TransactionRepository } from "../../core/transaction/domain/TransactionRepository";
import type { TransactionFilter } from "../../core/transaction/domain/TransactionFilter";
import type { TransactionComparison } from "../../core/transaction/domain/TransactionComparison";

import { Attach } from "../../core/shared/domain/Subject";

import { FormatNumber } from "../../core/shared/domain/FormatNumber";
import { t } from "../../core/shared/infrastructure/i18n";

let incomeThisMonth: number = 0.0;
let expensesThisMonth: number = 0.0;

let transactionFilter: TransactionFilter | null = null;

const dSTags = document.getElementById("dSTags")!;
const lSIncome = document.getElementById("lSIncome")!;
const lSExpenses = document.getElementById("lSExpenses")!;
const lSDiff = document.getElementById("lSDiff")!;

const setSummary = (income: number, expenses: number) => {
    const diff: number = income - expenses;

    lSIncome.style.color = "green";
    lSIncome.innerHTML = `<b>${FormatNumber(income)}</b>`;
    lSExpenses.style.color = "red";
    lSExpenses.innerHTML = `<b>${FormatNumber(expenses)}</b>`;
    lSDiff.style.color = (diff < 0) ? "red" : "green";
    lSDiff.innerHTML = `<b>${FormatNumber(diff)}</b>`;
};
const getSummaryThisMonth = async () => {
    dSTags.innerHTML = `<span class="tag">${t("transactions.summary.thisMonth")}</span>`;
    setSummary(incomeThisMonth, expensesThisMonth);
};
const addSpan = (key: string, value: string) => {
    const span = document.createElement("span");
    span.classList.add("tag");
    span.innerText = `${key}: ${value}`;
    dSTags.appendChild(span);
};

export const summaryInit = async (transactionRepository: TransactionRepository) => {
    const income = await transactionRepository.getMonthlyIncome();
    const expenses = await transactionRepository.getMonthlyExpenses();
    incomeThisMonth = income.current;
    expensesThisMonth = expenses.current;

    getSummaryThisMonth();

    Attach("transaction:filter:clear", () => {
        transactionFilter = null;
        getSummaryThisMonth();
    });
    Attach("transaction:filter", async (filter: TransactionFilter) => {
        transactionFilter = filter;

        dSTags.innerHTML = "";
        if (filter.dateFrom) {
            const dateFrom = dayjs(filter.dateFrom);
            addSpan(t("transactions.summary.filter.dateFrom"), dateFrom.format("DD/MM/YYYY"));
        }
        if (filter.dateTo) {
            const dateTo = dayjs(filter.dateTo);
            addSpan(t("transactions.summary.filter.dateTo"), dateTo.format("DD/MM/YYYY"));
        }
        if (filter.type !== undefined) addSpan(t("transactions.type"), (filter.type === true) ? 
            t("transactions.ingress") : t("transactions.egress"));
        if (filter.account) addSpan(t("transactions.account"), filter.account);
        if (filter.category) addSpan(t("transactions.category"), filter.category);

        const income: TransactionComparison = (filter.type === undefined || filter.type === true) ? 
            await transactionRepository.getMonthlyIncome(filter) : 
            { current: 0, previous: 0, difference: 0, percentageChange: 0 };
        const expenses: TransactionComparison = (filter.type === undefined || filter.type === false) ? 
            await transactionRepository.getMonthlyExpenses(filter) : 
            { current: 0, previous: 0, difference: 0, percentageChange: 0 };
        setSummary(income.current, expenses.current);
    });
    Attach("transaction:add", async () => {
        if (transactionFilter) return;

        incomeThisMonth = (await transactionRepository.getMonthlyIncome()).current;
        expensesThisMonth = (await transactionRepository.getMonthlyExpenses()).current;

        getSummaryThisMonth();
    });
    Attach("transaction:update", async () => {
        if (transactionFilter) return;

        incomeThisMonth = (await transactionRepository.getMonthlyIncome()).current;
        expensesThisMonth = (await transactionRepository.getMonthlyExpenses()).current;

        getSummaryThisMonth();
    });
    Attach("transaction:delete", async () => {
        if (transactionFilter) return;

        incomeThisMonth = (await transactionRepository.getMonthlyIncome()).current;
        expensesThisMonth = (await transactionRepository.getMonthlyExpenses()).current;

        getSummaryThisMonth();
    });
};