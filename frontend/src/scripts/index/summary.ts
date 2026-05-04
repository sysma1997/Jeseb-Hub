import dayjs from "dayjs";

import { Transaction } from "../../core/transaction/domain/Transaction";
import type { TransactionRepository } from "../../core/transaction/domain/TransactionRepository";
import type { TransactionFilter } from "../../core/transaction/domain/TransactionFilter";

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
    dSTags.innerHTML = `<span class="tag">${t("index.summary.thisMonth")}</span>`;
    setSummary(incomeThisMonth, expensesThisMonth);
};
const addSpan = (key: string, value: string) => {
    const span = document.createElement("span");
    span.classList.add("tag");
    span.innerText = `${key}: ${value}`;
    dSTags.appendChild(span);
};

export const summaryInit = async (transactionRepository: TransactionRepository) => {
    incomeThisMonth = await transactionRepository.getMonthlyIncome();
    expensesThisMonth = await transactionRepository.getMonthlyExpenses();

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
            addSpan(t("index.summary.filter.dateFrom"), dateFrom.format("DD/MM/YYYY"));
        }
        if (filter.dateTo) {
            const dateTo = dayjs(filter.dateTo);
            addSpan(t("index.summary.filter.dateTo"), dateTo.format("DD/MM/YYYY"));
        }
        if (filter.type !== undefined) addSpan(t("index.transactions.type"), (filter.type === true) ? 
            t("index.transactions.ingress") : t("index.transactions.egress"));
        if (filter.account) addSpan(t("index.transactions.account"), filter.account);
        if (filter.category) addSpan(t("index.transactions.category"), filter.category);

        const income = (filter.type === undefined || filter.type === true) ? 
            await transactionRepository.getMonthlyIncome(filter) : 0.0;
        const expenses = (filter.type === undefined || filter.type === false) ? 
            await transactionRepository.getMonthlyExpenses(filter) : 0.0;
        setSummary(income, expenses);
    });
    Attach("transaction:add", async () => {
        if (transactionFilter) return;

        incomeThisMonth = await transactionRepository.getMonthlyIncome();
        expensesThisMonth = await transactionRepository.getMonthlyExpenses();

        getSummaryThisMonth();
    });
    Attach("transaction:update", async () => {
        if (transactionFilter) return;

        incomeThisMonth = await transactionRepository.getMonthlyIncome();
        expensesThisMonth = await transactionRepository.getMonthlyExpenses();

        getSummaryThisMonth();
    });
    Attach("transaction:delete", async () => {
        if (transactionFilter) return;

        incomeThisMonth = await transactionRepository.getMonthlyIncome();
        expensesThisMonth = await transactionRepository.getMonthlyExpenses();

        getSummaryThisMonth();
    });
};