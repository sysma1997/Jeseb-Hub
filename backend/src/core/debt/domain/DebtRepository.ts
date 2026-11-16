import { Debt } from "./Debt";
import { DebtPayment } from "./DebtPayment";
import type { DebtSummary } from "./DebtSummary";
import { Pagination } from "../../shared/domain/Pagination";

export interface DebtRepository {
    add(debt: Debt): Promise<void>;
    update(debt: Debt): Promise<void>;
    delete(idUser: string, id: string): Promise<void>;

    lockDebt(idUser: string, id: string): Promise<void>;
    get(idUser: string, id: string): Promise<Debt>;
    getList(idUser: string, limit?: number, page?: number): Promise<Pagination<Debt>>;
    getListSearch(idUser: string, person: string, limit?: number, page?: number): Promise<Pagination<Debt>>;

    addPayment(idUser: string, payment: DebtPayment): Promise<void>;
    getPayment(idUser: string, idDebt: string, id: string): Promise<DebtPayment>;
    getPayments(idUser: string, idDebt: string, limit?: number, page?: number): Promise<Pagination<DebtPayment>>;
    deletePayment(idUser: string, idDebt: string, id: string): Promise<void>;

    getSummary(idUser: string): Promise<DebtSummary>;
}
