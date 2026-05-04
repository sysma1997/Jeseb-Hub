import { Transaction } from "./Transaction";
import type { TransactionFilter } from "./TransactionFilter";
import { Pagination } from "../../shared/domain/Pagination";

export interface TransactionRepository {
    add(transaction: Transaction): Promise<void>;
    update(transaction: Transaction): Promise<void>;
    delete(id: string): Promise<void>;

    get(id: string): Promise<Transaction>;

    getList(limit?: number, page?: number): Promise<Pagination<Transaction>>;
    getListFilter(transactionFilter: TransactionFilter, limit?: number, page?: number): Promise<Pagination<Transaction>>;

    getMonthlyIncome(transactionFilter?: TransactionFilter): Promise<number>;
    getMonthlyExpenses(transactionFilter?: TransactionFilter): Promise<number>;
    
    import(transactions: Transaction[]): Promise<void>;
    export(action: (chunk: any, progress: number) => void): Promise<void>;
}