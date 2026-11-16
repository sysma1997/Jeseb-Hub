import { Debt } from "../domain/Debt";
import type { DebtDto } from "../domain/Debt";
import { DebtPayment } from "../domain/DebtPayment";
import type { DebtPaymentDto } from "../domain/DebtPayment";
import type { DebtRepository } from "../domain/DebtRepository";
import type { DebtSummary } from "../domain/DebtSummary";
import { Api, ApiMethods } from "../../shared/infrastructure/Api";
import type { ApiResponse } from "../../shared/infrastructure/Api";
import { Pagination } from "../../shared/domain/Pagination";

export class DebtApiRepository extends Api implements DebtRepository {
    async add(debt: Debt): Promise<void> {
        const response: ApiResponse = await this.fetch(ApiMethods.POST, "debt/add", debt.toDto());
        if (response.status >= 400) 
            throw new Error(response.data);
    }
    async update(debt: Debt): Promise<void> {
        const response: ApiResponse = await this.fetch(ApiMethods.PUT, "debt/update", debt.toDto());
        if (response.status >= 400) 
            throw new Error(response.data);
    }
    async delete(id: string): Promise<void> {
        const response: ApiResponse = await this.fetch(ApiMethods.DELETE, `debt/delete/${id}`);
        if (response.status >= 400) 
            throw new Error(response.data);
    }

    async get(id: string): Promise<Debt> {
        const response: ApiResponse = await this.fetch(ApiMethods.GET, `debt/get/${id}`);
        if (response.status >= 400) 
            throw new Error(response.data);

        const debtDto: DebtDto = JSON.parse(response.data);
        return Debt.FromDto(debtDto);
    }

    async getList(limit?: number, page?: number): Promise<Pagination<Debt>> {
        let method = "debt/list";
        if (limit) method += `/${limit}`;
        if (page) method += `/${page}`;
        const response: ApiResponse = await this.fetch(ApiMethods.GET, method);
        if (response.status >= 400) 
            throw new Error(response.data);

        return this.parseDebtPagination(response.data);
    }
    async getListSearch(person: string, limit?: number, page?: number): Promise<Pagination<Debt>> {
        const body: any = { person };
        if (limit) body.limit = limit;
        if (page) body.page = page;

        const response: ApiResponse = await this.fetch(ApiMethods.POST, "debt/list/search", body);
        if (response.status >= 400)
            throw new Error(response.data);

        return this.parseDebtPagination(response.data);
    }

    async getSummary(): Promise<DebtSummary> {
        const response: ApiResponse = await this.fetch(ApiMethods.GET, "debt/summary");
        if (response.status >= 400)
            throw new Error(response.data);

        return JSON.parse(response.data) as DebtSummary;
    }

    async addPayment(payment: DebtPayment): Promise<void> {
        const response: ApiResponse = await this.fetch(ApiMethods.POST, "debt/payment/add", payment.toDto());
        if (response.status >= 400) 
            throw new Error(response.data);
    }
    async getPayments(idDebt: string, limit?: number, page?: number): Promise<Pagination<DebtPayment>> {
        let method = `debt/payment/list/${idDebt}`;
        const params = new URLSearchParams();
        if (limit) params.set("limit", String(limit));
        if (page) params.set("page", String(page));
        if (params.toString()) method += `?${params.toString()}`;

        const response: ApiResponse = await this.fetch(ApiMethods.GET, method);
        if (response.status >= 400)
            throw new Error(response.data);

        const data: any = JSON.parse(response.data);
        const pagination: Pagination<DebtPayment> = new Pagination();
        pagination.pages = data.pages;
        pagination.list = data.list.map((dto: DebtPaymentDto) => DebtPayment.FromDto(dto));
        return pagination;
    }
    async deletePayment(idDebt: string, id: string): Promise<void> {
        const response: ApiResponse = await this.fetch(ApiMethods.DELETE, 
            `debt/payment/delete/${idDebt}/${id}`);
        if (response.status >= 400)
            throw new Error(response.data);
    }

    private parseDebtPagination(raw: string): Pagination<Debt> {
        const data: any = JSON.parse(raw);
        const pagination: Pagination<Debt> = new Pagination();
        pagination.pages = data.pages;
        pagination.list = data.list.map((dto: DebtDto) => Debt.FromDto(dto));
        return pagination;
    }
}
