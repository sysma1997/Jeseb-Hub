import { Transaction } from "./Transaction";
import { Pagination } from "../../shared/domain/Pagination";

export interface TransactionRepository {
    add(transaction: Transaction): Promise<void>;
    addRange(transactions: Transaction[]): Promise<void>;
    update(transaction: Transaction): Promise<void>;
    delete(idUser: string, id: string): Promise<void>;

    get(idUser: string, id: string): Promise<Transaction>;

    getList(idUser: string, limit?: number, page?: number): Promise<Pagination<Transaction>>;
    getCount(idUser: string): Promise<number>;
}