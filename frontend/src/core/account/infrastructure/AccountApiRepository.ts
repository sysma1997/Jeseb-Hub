import { Account } from "../domain/Account";
import type { AccountDto } from "../domain/Account";
import type { AccountRepository } from "../domain/AccountRepository";
import { Api, ApiMethods } from "../../shared/infrastructure/Api";
import type { ApiResponse } from "../../shared/infrastructure/Api";
import { Pagination } from "../../shared/domain/Pagination";

export class AccountApiRepository extends Api implements AccountRepository {
    async add(account: Account): Promise<void> {
        const response: ApiResponse = await this.fetch(ApiMethods.POST, "account/add", account.toDto());
        if (response.status >= 400) 
            throw new Error(response.data);
    }
    async update(account: Account): Promise<void> {
        const response: ApiResponse = await this.fetch(ApiMethods.PUT, "account/update", account.toDto());
        if (response.status >= 400) 
            throw new Error(response.data);
    }
    async delete(id: string): Promise<void> {
        const response: ApiResponse = await this.fetch(ApiMethods.DELETE, `account/delete/${id}`);
        if (response.status >= 400) 
            throw new Error(response.data);
    }

    async get(id: string): Promise<Account> {
        const response: ApiResponse = await this.fetch(ApiMethods.GET, `account/get/${id}`);
        if (response.status >= 400) 
            throw new Error(response.data);

        const accountDto: AccountDto = JSON.parse(response.data);
        return Account.FromDto(accountDto);
    }
    async search(name: string): Promise<Account | undefined> {
        const response: ApiResponse = await this.fetch(ApiMethods.GET, `account/search/${name}`);
        if (response.status >= 400) 
            throw new Error(response.data);

        if (!response.data) return undefined;
        const accountDto: AccountDto = JSON.parse(response.data);
        return Account.FromDto(accountDto);
    }

    async getList(limit?: number, page?: number): Promise<Pagination<Account>> {
        let method = "account/list";
        if (limit) method += `/${limit}`;
        if (page) method += `/${page}`;
        const response: ApiResponse = await this.fetch(ApiMethods.GET, method);
        if (response.status >= 400) 
            throw new Error(response.data);

        const data: any = JSON.parse(response.data);
        const pages: number = data.pages;
        const list: Account[] = [];
        for (let i = 0; i < data.list.length; i++) 
            list.push(Account.FromDto(data.list[i]));

        const pagination: Pagination<Account> = new Pagination();
        pagination.pages = pages;
        pagination.list = list;
        return pagination;
    }
}