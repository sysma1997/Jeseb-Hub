import { Transaction } from "../domain/Transaction";
import type { TransactionDto } from "../domain/Transaction";
import type { TransactionRepository } from "../domain/TransactionRepository";
import { Api, ApiMethods } from "../../shared/infrastructure/Api";
import type { ApiResponse } from "../../shared/infrastructure/Api";
import { Pagination } from "../../shared/domain/Pagination";

export class TransactionApiRepository extends Api implements TransactionRepository {
    async add(transaction: Transaction): Promise<void> {
        const response: ApiResponse = await this.fetch(ApiMethods.POST, "transaction/add", transaction.toDto());
        if (response.status >= 400) 
            throw new Error(response.data);
    }
    async update(transaction: Transaction): Promise<void> {
        const response: ApiResponse = await this.fetch(ApiMethods.PUT, "transaction/update", transaction.toDto());
        if (response.status >= 400) 
            throw new Error(response.data);
    }
    async delete(id: string): Promise<void> {
        const response: ApiResponse = await this.fetch(ApiMethods.DELETE, `transaction/delete/${id}`);
        if (response.status >= 400) 
            throw new Error(response.data);
    }

    async get(id: string): Promise<Transaction> {
        const response: ApiResponse = await this.fetch(ApiMethods.GET, `transaction/get/${id}`);
        if (response.status >= 400) 
            throw new Error(response.data);

        const transactionDto: TransactionDto = JSON.parse(response.data);
        return Transaction.FromDto(transactionDto);
    }
    
    async getList(limit?: number, page?: number): Promise<Pagination<Transaction>> {
        let method = "transaction/list";
        if (limit) method += `/${limit}`;
        if (page) method += `/${page}`;
        const response: ApiResponse = await this.fetch(ApiMethods.GET, method);
        if (response.status >= 400)
            throw new Error(response.data);

        const data: any = JSON.parse(response.data);
        const pages: number = data.pages;
        const list: Transaction[] = [];
        for (let i = 0; i < data.list.length; i++) 
            list.push(Transaction.FromDto(data.list[i]));

        const pagination: Pagination<Transaction> = new Pagination();
        pagination.pages = pages;
        pagination.list = list;
        return pagination;
    }
}
