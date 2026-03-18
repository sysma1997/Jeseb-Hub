import { Transaction } from "./Transaction";
import { Pagination } from "../../shared/domain/Pagination";

export interface TransactionRepository {
    add(transaction: Transaction): Promise<void>;
    update(transaction: Transaction): Promise<void>;
    delete(id: string): Promise<void>;

    get(id: string): Promise<Transaction>;

    getList(limit?: number, page?: number): Promise<Pagination<Transaction>>;

    import(transactions: Transaction[]): Promise<void>;
    export(action: (chunk: any, progress: number) => void): Promise<void>;
}