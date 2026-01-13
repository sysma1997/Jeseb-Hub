import { v4 as Uuid } from "uuid";

import { Account } from "../core/account/domain/Account";
import type { AccountRepository } from "../core/account/domain/AccountRepository";
import { AccountApiRepository } from "../core/account/infrastructure/AccountApiRepository";
import { Notify } from "../core/shared/domain/Subject";

const add = document.getElementById("btnAdd") as HTMLButtonElement;

const repository: AccountRepository = new AccountApiRepository();

add.onclick = async () => {
    window.showPrompt("Enter the name for the account", "Add account", (value: string) => {
        if (value.indexOf(" ") !== -1) {
            window.showAlert("Phrases are not allowed.");
            return;
        }

        window.showConfirm(`Create account with the name '${value}'?`, "Add account", async () => {
            const account: Account = new Account(value, 0.0, Uuid());
            try {
                await repository.add(account);

                window.showAlert(`Add account '${account.name}' success.`, "Add account", () => {
                    Notify("account:add", account);
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