import { describe, it, expect, beforeEach } from "@jest/globals";
import { prismaMock } from "../shared/prisma/Singleton";

import { Category } from "../../core/category/domain/Category";
import { CategoryRepository } from "../../core/category/domain/CategoryRepository";
import { CategoryPrismaRepository } from "../../core/category/infrastructure/CategoryPrismaRepository";

describe("Category Prisma Repository", () => {
    let repository: CategoryRepository;

    beforeEach(() => {
        repository = new CategoryPrismaRepository(prismaMock);
    });

    it("Should add a category.", async () => {
        const id = "6b50041d-9f47-4124-9c81-c61e3b262763";
        const idUser = "998f4fa5-f903-47a4-b6bd-ec25ed9d3452";
        const category = new Category("Food", id, idUser);

        prismaMock.category.findFirst.mockResolvedValue(null);
        prismaMock.category.create.mockResolvedValue({
            id,
            idUser,
            name: "Food",
        });

        await expect(repository.add(category)).resolves.toBeUndefined();
        expect(prismaMock.category.findFirst).toHaveBeenCalledWith({
            where: { idUser, name: "Food" },
        });
        expect(prismaMock.category.create).toHaveBeenCalledWith({
            data: { id, idUser, name: "Food" },
        });
    });
    it("Should update a category.", async () => {
        const id = "6b50041d-9f47-4124-9c81-c61e3b262763";
        const idUser = "998f4fa5-f903-47a4-b6bd-ec25ed9d3452";
        const category = new Category("Travel", id, idUser);

        prismaMock.category.update.mockResolvedValue({
            id,
            idUser,
            name: "Travel",
        });

        await expect(repository.update(category)).resolves.toBeUndefined();
        expect(prismaMock.category.update).toHaveBeenCalledWith({
            where: { idUser, id },
            data: { name: "Travel" },
        });
    });
    it("Should delete a category.", async () => {
        const id = "6b50041d-9f47-4124-9c81-c61e3b262763";
        const idUser = "998f4fa5-f903-47a4-b6bd-ec25ed9d3452";

        prismaMock.category.delete.mockResolvedValue({
            id,
            idUser,
            name: "Food",
        });

        await expect(repository.delete(idUser, id)).resolves.toBeUndefined();
        expect(prismaMock.category.delete).toHaveBeenCalledWith({
            where: { idUser, id },
        });
    });

    it("Should get a category.", async () => {
        const id = "6b50041d-9f47-4124-9c81-c61e3b262763";
        const idUser = "998f4fa5-f903-47a4-b6bd-ec25ed9d3452";

        prismaMock.category.findFirst.mockResolvedValue({
            id,
            idUser,
            name: "Food",
        });

        const result = await repository.get(idUser, id);

        expect(result).toEqual(new Category("Food", id, idUser));
        expect(prismaMock.category.findFirst).toHaveBeenCalledWith({
            where: { idUser, id },
        });
    });
    it("Should search a category.", async () => {
        const id = "6b50041d-9f47-4124-9c81-c61e3b262763";
        const idUser = "998f4fa5-f903-47a4-b6bd-ec25ed9d3452";
        const name = "Food";

        prismaMock.category.findFirst.mockResolvedValue({
            id,
            idUser,
            name: "Food",
        });

        const result = await repository.search(idUser, name);

        expect(result).toEqual(new Category("Food", id, idUser));
        expect(prismaMock.category.findFirst).toHaveBeenCalledWith({
            where: { idUser, name },
        });
    });

    it("Should get a paginated list of categories.", async () => {
        const idUser = "998f4fa5-f903-47a4-b6bd-ec25ed9d3452";

        prismaMock.category.findMany.mockResolvedValue([
            { id: "6b50041d-9f47-4124-9c81-c61e3b262763", idUser, name: "Food" },
            { id: "3dbe67c9-b0b9-4e04-bd5b-cc2b4d8b0638", idUser, name: "Travel" },
        ]);
        prismaMock.category.count.mockResolvedValue(2);

        const result = await repository.getList(idUser);

        expect(result.list).toEqual([
            new Category("Food", "6b50041d-9f47-4124-9c81-c61e3b262763", idUser),
            new Category("Travel", "3dbe67c9-b0b9-4e04-bd5b-cc2b4d8b0638", idUser),
        ]);
        expect(result.pages).toBe(1);

        expect(prismaMock.category.findMany).toHaveBeenCalledWith({
            where: { idUser },
            orderBy: { name: "asc" },
            skip: 0,
            take: 30,
        });
        expect(prismaMock.category.count).toHaveBeenCalledWith({
            where: { idUser },
        });
    });
});