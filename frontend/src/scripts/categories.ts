import { v4 as Uuid } from "uuid";

import { Category } from "../core/category/domain/Category";
import type { CategoryRepository } from "../core/category/domain/CategoryRepository";
import { CategoryApiRepository } from "../core/category/infrastructure/CategoryApiRepository";
import { Notify } from "../core/shared/domain/Subject";

const add = document.getElementById("btnAdd") as HTMLButtonElement;

const repository: CategoryRepository = new CategoryApiRepository();

add.onclick = async () => {
    window.showPrompt("Enter the name for the category", "Add category", (value: string) => {
        if (value.indexOf(" ") !== -1) {
            window.showAlert("Phrases are not allowed.");
            return;
        }

        window.showConfirm(`Create category with the name '${value}'?`, "Add category", async () => {
            const category: Category = new Category(value, Uuid());
            try {
                await repository.add(category);

                window.showAlert(`Add category '${category.name}' success.`, "Add category", () => {
                    Notify("category:add", category);
                });
            } catch (err: any) {
                if (err instanceof Error) {
                    console.error(err);
                    window.showAlert(err.message);
                }
            }
        });
    });
};