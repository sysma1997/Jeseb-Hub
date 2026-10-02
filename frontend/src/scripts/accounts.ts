import { v4 as Uuid } from "uuid";

import { Account } from "../core/account/domain/Account";
import type { AccountRepository } from "../core/account/domain/AccountRepository";
import { AccountApiRepository } from "../core/account/infrastructure/AccountApiRepository";

import { Attach, Notify } from "../core/shared/domain/Subject";
import { FormatNumber } from "../core/shared/domain/FormatNumber";
import { t } from "../core/shared/infrastructure/i18n";

const repository: AccountRepository = new AccountApiRepository();

const modalUpdateAccount = document.getElementById("modalUpdateAccount") as HTMLDivElement;
const modalClose = modalUpdateAccount.querySelector(".modal-close") as HTMLButtonElement;
const muName = document.getElementById("imuaName") as HTMLInputElement;
const muBalance = document.getElementById("imuaBalance") as HTMLInputElement;
const muCancel = document.getElementById("btnmuaCancel") as HTMLButtonElement;
const muUpdate = document.getElementById("btnmuaAccept") as HTMLButtonElement;

Attach("sidebar:add", () => {
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
});
Attach("account:update", (account: Account) => {
    modalUpdateAccount.classList.add("is-active");
    muName.placeholder = account.name;
    muBalance.placeholder = FormatNumber(account.balance);

    muUpdate.onclick = async () => {
        const name = muName.value.trim() || account.name;
        const balance = muBalance.value.trim() ? parseFloat(muBalance.value) : account.balance;

        if (name === account.name && balance === account.balance) {
            window.showAlert(t("account.update.sameValues"), t("account.update.title"));
            return;
        }

        const updated: Account = new Account(name, balance, account.id, account.idUser);
        try {
            await repository.update(updated);
            window.showAlert(t("account.update.response"), t("account.update.title"), () => {
                Notify("account:update", updated);
                modalUpdateAccount.classList.remove("is-active");
                muName.value = "";
                muBalance.value = "";
            });
        } catch (err: any) {
            if (err instanceof Error) window.showAlert(err.message);
        }
    };
});


modalClose.onclick = () => {
    modalUpdateAccount.classList.remove("is-active");
    muName.value = "";
    muBalance.value = "";
};
muCancel.onclick = () => {
    modalClose.click();
};