import { v4 as Uuid } from "uuid";

import { Category } from "../core/category/domain/Category";
import type { CategoryRepository } from "../core/category/domain/CategoryRepository";
import { CategoryApiRepository } from "../core/category/infrastructure/CategoryApiRepository";
import { Notify } from "../core/shared/domain/Subject";
import { t } from "../core/shared/infrastructure/i18n";

const add = document.getElementById("btnAdd") as HTMLButtonElement;

const repository: CategoryRepository = new CategoryApiRepository();

add.onclick = async () => {
    window.showPrompt(t("category.add.description"), t("category.add.title"), (value: string) => {
        window.showConfirm(t("category.add.confirm", { name: value }), t("category.add.title"), async () => {
            const category: Category = new Category(value, Uuid());
            try {
                await repository.add(category);

                window.showAlert(t("category.add.response"), t("category.add.title"), () => {
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