import { Debt } from "./Debt";
import { DebtPayment } from "./DebtPayment";
import type { DebtSummary } from "./DebtSummary";
import { Pagination } from "../../shared/domain/Pagination";

export interface DebtRepository {
    add(debt: Debt): Promise<void>;
    update(debt: Debt): Promise<void>;
    delete(id: string): Promise<void>;

    get(id: string): Promise<Debt>;

    getList(limit?: number, page?: number): Promise<Pagination<Debt>>;
    getListSearch(person: string, limit?: number, page?: number): Promise<Pagination<Debt>>;

    getSummary(): Promise<DebtSummary>;

    addPayment(payment: DebtPayment): Promise<void>;
    getPayments(idDebt: string, limit?: number, page?: number): Promise<Pagination<DebtPayment>>;
    deletePayment(idDebt: string, id: string): Promise<void>;
}
