import { Transaction } from "../domain/Transaction";
import type { TransactionDto } from "../domain/Transaction";
import type { TransactionRepository } from "../domain/TransactionRepository";
import { Api, ApiMethods } from "../../shared/infrastructure/Api";
import type { ApiResponse } from "../../shared/infrastructure/Api";
import { Pagination } from "../../shared/domain/Pagination";
import type { TransactionFilter } from "../domain/TransactionFilter";

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
    async getListFilter(transactionFilter: TransactionFilter, limit?: number, page?: number): Promise<Pagination<Transaction>> {
        let method = "transaction/list/filter";
        const data: any = transactionFilter;
        if (limit) data.limit = limit;
        if (page) data.page = page;
        const response: ApiResponse = await this.fetch(ApiMethods.POST, method, data);
        if (response.status >= 400)
            throw new Error(response.data);

        const responseData: any = JSON.parse(response.data);
        const pages: number = responseData.pages;
        const list: Transaction[] = [];
        for (let i = 0; i < responseData.list.length; i++)
            list.push(Transaction.FromDto(responseData.list[i]));

        const pagination: Pagination<Transaction> = new Pagination();
        pagination.pages = pages;
        pagination.list = list;
        return pagination;
    }

    async import(transactions: Transaction[]): Promise<void> {
        const params: TransactionDto[] = transactions.map(t => t.toDto());
        const response: ApiResponse = await this.fetch(ApiMethods.POST, "transaction/import", params);
        if (response.status >= 400) 
            throw new Error(response.data);
    }
    async export(action: (chunk: any, progress: number) => void): Promise<void> {
        const token: string | undefined = window.localStorage.getItem("token") ?? undefined;
        const response = await fetch(`${Api.ApiUrl}/transaction/export`, {
            headers: {
                "Authorization": (token) ? `Bearer ${token}` : "", 
            }
        });
        if (response.status >= 400) throw Error(await response.text());

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        let buffer = '';
        let receiveChunks: number = 0;

        while (true) {
            const { done, value } = await reader!.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.trim() === '') continue;

                try {
                    const chunkData = JSON.parse(line);
                    receiveChunks++;

                    const progress = Math.round((receiveChunks / chunkData.chunks) * 100);
                    action(chunkData, progress);
                } catch (err: any) {
                    if (err instanceof Error) throw Error(`Error parsing chunk: ${err.message}`);
                }
            }
        }
    }
}
