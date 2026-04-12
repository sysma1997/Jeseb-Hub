import { v4 as Uuid } from "uuid";

import { Account } from "../core/account/domain/Account";
import type { AccountRepository } from "../core/account/domain/AccountRepository";
import { AccountApiRepository } from "../core/account/infrastructure/AccountApiRepository";
import { Notify } from "../core/shared/domain/Subject";
import { t } from "../core/shared/infrastructure/i18n";

const add = document.getElementById("btnAdd") as HTMLButtonElement;

const repository: AccountRepository = new AccountApiRepository();

add.onclick = async () => {
    window.showPrompt(t("account.add.description"), t("account.add.title"), (value: string) => {
        window.showConfirm(t("account.add.confirm", { name: value }), t("account.add.title"), async () => {
            try {
                const account: Account = new Account(value, 0.0, Uuid());
                
                await repository.add(account);

                window.showAlert(t("account.add.response"), t("account.add.title"), () => {
                    Notify("account:add", account);
                });
            } catch (err: any) {
                if (err instanceof Error) {
                    window.showAlert(err.message);
                    console.error(err);
                }
            }
        });
    });
};