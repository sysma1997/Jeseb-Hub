import { Category } from "./Category";
import { Pagination } from "../../shared/domain/Pagination";

export interface CategoryRepository {
    add(category: Category): Promise<void>;
    update(category: Category): Promise<void>;
    delete(id: string): Promise<void>;

    get(id: string): Promise<Category>;
    search(name: string): Promise<Category | undefined>;

    getList(limit?: number, page?: number): Promise<Pagination<Category>>;
}