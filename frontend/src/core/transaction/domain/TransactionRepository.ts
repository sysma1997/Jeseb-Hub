import { Transaction } from "./Transaction";
import type { TransactionFilter } from "./TransactionFilter";
import type { TransactionComparison } from "./TransactionComparison";
import type { BalanceEvolution } from "./BalanceEvolution";
import { Pagination } from "../../shared/domain/Pagination";

export interface TransactionRepository {
    add(transaction: Transaction): Promise<void>;
    update(transaction: Transaction): Promise<void>;
    delete(id: string): Promise<void>;

    get(id: string): Promise<Transaction>;

    getList(limit?: number, page?: number): Promise<Pagination<Transaction>>;
    getListFilter(transactionFilter: TransactionFilter, limit?: number, page?: number): Promise<Pagination<Transaction>>;

    getMonthlyIncome(transactionFilter?: TransactionFilter, compareLastMonth?: boolean): Promise<TransactionComparison>;
    getMonthlyExpenses(transactionFilter?: TransactionFilter, compareLastMonth?: boolean): Promise<TransactionComparison>;
    getBalanceEvolution(): Promise<BalanceEvolution[]>;

    import(transactions: Transaction[]): Promise<void>;
    export(action: (chunk: any, progress: number) => void): Promise<void>;
}