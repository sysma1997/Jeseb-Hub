import { Account } from "./Account";
import { Pagination } from "../../shared/domain/Pagination";

export interface AccountRepository {
    add(account: Account): Promise<void>;
    update(account: Account): Promise<void>;
    delete(id: string): Promise<void>;

    get(id: string): Promise<Account>;
    search(name: string): Promise<Account | undefined>;

    getList(limit?: number, page?: number): Promise<Pagination<Account>>;
    getListSearch(name: string, limit?: number, page?: number): Promise<Pagination<Account>>;
}