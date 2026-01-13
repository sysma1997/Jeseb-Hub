import { Category } from "../domain/Category";
import type { CategoryDto } from "../domain/Category";
import type { CategoryRepository } from "../domain/CategoryRepository";
import { Api, ApiMethods } from "../../shared/infrastructure/Api";
import type { ApiResponse } from "../../shared/infrastructure/Api";
import { Pagination } from "../../shared/domain/Pagination";

export class CategoryApiRepository extends Api implements CategoryRepository {
    async add(category: Category): Promise<void> {
        const response: ApiResponse = await this.fetch(ApiMethods.POST, "category/add", category.toDto());
        if (response.status >= 400) 
            throw new Error(response.data);
    }
    async update(category: Category): Promise<void> {
        const response: ApiResponse = await this.fetch(ApiMethods.PUT, "category/update", category.toDto());
        if (response.status >= 400) 
            throw new Error(response.data);
    }
    async delete(id: string): Promise<void> {
        const response: ApiResponse = await this.fetch(ApiMethods.DELETE, `category/delete/${id}`);
        if (response.status >= 400) 
            throw new Error(response.data);
    }

    async get(id: string): Promise<Category> {
        const response: ApiResponse = await this.fetch(ApiMethods.GET, `category/get/${id}`);
        if (response.status >= 400) 
            throw new Error(response.data);

        const categoryDto: CategoryDto = JSON.parse(response.data);
        return Category.FromDto(categoryDto);
    }
    async search(name: string): Promise<Category | undefined> {
        const response: ApiResponse = await this.fetch(ApiMethods.GET, `category/search/${name}`);
        if (response.status >= 400) 
            throw new Error(response.data);

        if (!response.data) return undefined;
        const categoryDto: CategoryDto = JSON.parse(response.data);
        return Category.FromDto(categoryDto);
    }

    async getList(limit?: number, page?: number): Promise<Pagination<Category>> {
        let method = "category/list";
        if (limit) method += `/${limit}`;
        if (page) method += `/${page}`;
        const response: ApiResponse = await this.fetch(ApiMethods.GET, method);
        if (response.status >= 400) 
            throw new Error(response.data);

        const data: any = JSON.parse(response.data);
        const pages: number = data.pages;
        const list: Category[] = [];
        for (let i = 0; i < data.list.length; i++) 
            list.push(Category.FromDto(data.list[i]));

        const pagination: Pagination<Category> = new Pagination();
        pagination.pages = pages;
        pagination.list = list;
        return pagination;
    }
}