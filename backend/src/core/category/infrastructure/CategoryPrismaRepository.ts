import { PrismaClient } from "@prisma/client";
import { v4 as Uuid } from "uuid";

import { Category } from "../domain/Category";
import { CategoryRepository } from "../domain/CategoryRepository";
import { Pagination } from "../../shared/domain/Pagination";
import { TranslatorRepository } from "../../shared/domain/TranslatorRepository";

export class CategoryPrismaRepository implements CategoryRepository {
    private readonly prisma: PrismaClient;
    private readonly translator: TranslatorRepository;

    constructor(prisma: PrismaClient, translator: TranslatorRepository) {
        this.prisma = prisma;
        this.translator = translator;
    }

    private parse(category: any): Category {
        return Category.FromDto(this.translator, category);
    }
    
    async add(category: Category): Promise<void> {
        const exists = await this.search(category.idUser!, category.name);
        if (exists) throw new Error(this.translator.translate("categories.errors.nameAlreadyExists", { name: category.name }));

        await this.prisma.category.create({
            data: {
                id: category.id ?? Uuid(), 
                idUser: category.idUser!, 
                name: category.name
            }
        });
    }
    async addRange(categories: Category[]): Promise<void> {
        await this.prisma.$transaction(categories.map(category => this.prisma.category.create({
            data: {
                id: category.id ?? Uuid(), 
                idUser: category.idUser!, 
                name: category.name
            }
        })));
    }
    async update(category: Category): Promise<void> {
        await this.prisma.category.update({
            where: { idUser: category.idUser!, id: category.id! }, 
            data: {
                name: category.name
            }
        });
    }
    async delete(idUser: string, id: string): Promise<void> {
        await this.prisma.category.delete({
            where: { idUser, id }
        });
    }

    async get(idUser: string, id: string): Promise<Category> {
        const category = await this.prisma.category.findFirst({
            where: { idUser, id }
        });
        
        const ca = this.parse(category);
        return ca;
    }
    async search(idUser: string, name: string): Promise<Category | undefined> {
        const category = await this.prisma.category.findFirst({
            where: { idUser, name }
        });
        if (!category) return undefined;

        const ca = this.parse(category);
        return ca;
    }
    
    async getList(idUser: string, limit?: number, page?: number): Promise<Pagination<Category>> {
        const take = limit ?? 30;
        const skip = page ?? 1;
        const shouldPaginate = (limit !== undefined || limit !== null);

        const [categories, total] = await Promise.all([
            this.prisma.category.findMany({
                where: { idUser }, 
                orderBy: { name: "asc" }, 
                ...(shouldPaginate && {
                    take: take, 
                    skip: (skip - 1) * take
                })
            }), 
            this.prisma.category.count({ where: { idUser } })
        ]);

        const pagination = new Pagination<Category>();
        pagination.list = categories.map(ca => this.parse(ca));
        pagination.pages = (limit) ? Pagination.PageLength(total, limit) : 1;

        return pagination;
    }
    async getListSearch(idUser: string, name: string, limit?: number, page?: number): Promise<Pagination<Category>> {
        const take = limit ?? 30;
        const skip = page ?? 1;
        const shouldPaginate = (limit !== undefined || limit !== null);

        const [categories, total] = await Promise.all([
            this.prisma.category.findMany({
                where: { idUser, name: { contains: name } }, 
                orderBy: { name: "asc" }, 
                ...(shouldPaginate && {
                    take: take, 
                    skip: (skip - 1) * take
                })
            }), 
            this.prisma.category.count({ where: { idUser, name: { contains: name } } })
        ]);

        const pagination = new Pagination<Category>();
        pagination.list = categories.map(ca => this.parse(ca));
        pagination.pages = (limit) ? Pagination.PageLength(total, limit) : 1;

        return pagination;
    }
}