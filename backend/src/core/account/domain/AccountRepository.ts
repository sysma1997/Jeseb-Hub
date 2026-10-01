import { Account } from "./Account";
import { Pagination } from "../../shared/domain/Pagination";

export interface AccountRepository {
    add(account: Account): Promise<void>;
    addRange(accounts: Account[]): Promise<void>;
    update(account: Account): Promise<void>;
    // movimientos de saldo en centavos que la base aplica de forma atomica
    adjust(idUser: string, id: string, cents: number): Promise<void>;
    adjustIfEnough(idUser: string, id: string, cents: number): Promise<boolean>;
    delete(idUser: string, id: string): Promise<void>;

    get(idUser: string, id: string): Promise<Account>;
    search(idUser: string, name: string): Promise<Account | undefined>;

    getList(idUser: string, limit?: number, page?: number): Promise<Pagination<Account>>;
    getListSearch(idUser: string, name: string, limit?: number, page?: number): Promise<Pagination<Account>>;

    getTotalBalance(idUser: string): Promise<number>;
}