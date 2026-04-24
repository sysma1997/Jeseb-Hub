import { Account } from "./Account";
import { Pagination } from "../../shared/domain/Pagination";

export interface AccountRepository {
    add(account: Account): Promise<void>;
    addRange(accounts: Account[]): Promise<void>;
    update(account: Account): Promise<void>;
    delete(idUser: string, id: string): Promise<void>;

    get(idUser: string, id: string): Promise<Account>;
    search(idUser: string, name: string): Promise<Account | undefined>;

    getList(idUser: string, limit?: number, page?: number): Promise<Pagination<Account>>;
    getListSearch(idUser: string, name: string, limit?: number, page?: number): Promise<Pagination<Account>>;
}