import { Category } from "./Category";
import { Pagination } from "../../shared/domain/Pagination";

export interface CategoryRepository {
    add(category: Category): Promise<void>;
    addRange(categories: Category[]): Promise<void>;
    update(category: Category): Promise<void>;
    delete(idUser: string, id: string): Promise<void>;

    get(idUser: string, id: string): Promise<Category>;
    search(idUser: string, name: string): Promise<Category | undefined>;

    getList(idUser: string, limit?: number, page?: number): Promise<Pagination<Category>>;
    getListSearch(idUser: string, name: string, limit?: number, page?: number): Promise<Pagination<Category>>;
}