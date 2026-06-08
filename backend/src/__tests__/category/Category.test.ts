import { describe, it, expect } from "@jest/globals";

import { Category } from "../../core/category/domain/Category";

describe("Category Domain", () => {
    it("Should create a Category with valid properties.", () => {
        const id = "4d511d6e-ea14-4b9b-a40b-b63231e6bb91";
        const idUser = "3bff1d1b-e647-47cc-a151-e54b52c1e673";
        const category = new Category("Savings", id, idUser);

        expect(category.name).toBe("Savings");
        expect(category.id).toBe(id);
        expect(category.idUser).toBe(idUser);
    });
    it("Should update the Category name correctly.", () => {
        let category = new Category("Savings");

        category = category.setName("Payments");

        expect(category.name).toBe("Payments");
    });

    it("Should throw and error when creating a Category without a name.", () => {
        expect(() => new Category("")).toThrow("The name is required.");
    });
});