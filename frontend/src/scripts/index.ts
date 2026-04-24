import { v4 as Uuid } from "uuid";
import dayjs from "dayjs";
import dayjsUtc from "dayjs/plugin/utc";

import { Transaction } from "../core/transaction/domain/Transaction";
import type { TransactionRepository } from "../core/transaction/domain/TransactionRepository";
import type { TransactionFilter } from "../core/transaction/domain/TransactionFilter";
import { TransactionApiRepository } from "../core/transaction/infrastructure/TransactionApiRepository";
import { Account } from "../core/account/domain/Account";
import type { AccountRepository } from "../core/account/domain/AccountRepository";
import { AccountApiRepository } from "../core/account/infrastructure/AccountApiRepository"; 
import { Category } from "../core/category/domain/Category";
import type { CategoryRepository } from "../core/category/domain/CategoryRepository";
import { CategoryApiRepository } from "../core/category/infrastructure/CategoryApiRepository";

import { Pagination } from "../core/shared/domain/Pagination";
import { Attach, Notify } from "../core/shared/domain/Subject";
import { FormatNumber } from "../core/shared/domain/FormatNumber";
import { t } from "../core/shared/infrastructure/i18n";

dayjs.extend(dayjsUtc);

const transactionRepository: TransactionRepository = new TransactionApiRepository();
const accountRepository: AccountRepository = new AccountApiRepository();
const categoryRepository: CategoryRepository = new CategoryApiRepository();

let transaction: Transaction | undefined = undefined;
let accounts: Account[] = [];
let categories: Category[] = [];

const mftDateFrom = document.getElementById("iMFTDateFrom") as HTMLInputElement;
const mftDateTo = document.getElementById("iMFTDateTo") as HTMLInputElement;
const mftClear = document.getElementById("btnMFTClear") as HTMLButtonElement;
const mftAccount = document.getElementById("sMFTAccount") as HTMLSelectElement;
const mftCategory = document.getElementById("sMFTCategory") as HTMLSelectElement;
const mftType = document.getElementById("sMFTType") as HTMLSelectElement;
const mftCancel = document.getElementById("btnMFTCancel") as HTMLButtonElement;
const mftAccept = document.getElementById("btnMFTAccept") as HTMLButtonElement;
const mftClearFilters = document.getElementById("btnMFTClearFilters") as HTMLButtonElement;

const addTransaction = document.getElementById("btnAddTransaction") as HTMLButtonElement;

const modalAddTransaction = document.getElementById("modalAddTransaction") as HTMLDivElement;
const matTitle = modalAddTransaction.querySelector(".modal-card-title") as HTMLParagraphElement;
const matClose = modalAddTransaction.querySelector(".delete") as HTMLButtonElement;
const matSection1 = document.getElementById("sMAT1") as HTMLElement;
const matAccount = document.getElementById("sMATAccount") as HTMLSelectElement;
const matAccountBalance = document.getElementById("lMATAccountBalance") as HTMLLabelElement;
const matSection2 = document.getElementById("sMAT2") as HTMLElement;
const matType = document.getElementById("sMATType") as HTMLSelectElement;
const matValue = document.getElementById("iMATValue") as HTMLInputElement;
const matSection3 = document.getElementById("sMAT3") as HTMLElement;
const matDate = document.getElementById("iMATDate") as HTMLInputElement;
const matCategory = document.getElementById("sMATCategory") as HTMLSelectElement;
const matDescription = document.getElementById("taMATDescription") as HTMLTextAreaElement;
const matSection4 = document.getElementById("sMAT4") as HTMLElement;
const matAccountConfirm = document.getElementById("pMATAccountConfirm") as HTMLParagraphElement;
const matTypeConfirm = document.getElementById("pMATTypeConfirm") as HTMLParagraphElement;
const matValueConfirm = document.getElementById("pMATValueConfirm") as HTMLParagraphElement;
const matDateConfirm = document.getElementById("pMATDateConfirm") as HTMLParagraphElement;
const dmatCategoryConfirm = document.getElementById("dMATCategoryConfirm") as HTMLDivElement;
const matCategoryConfirm = document.getElementById("pMATCategoryConfirm") as HTMLParagraphElement;
const dmatDescriptionConfirm = document.getElementById("dMATDescriptionConfirm") as HTMLDivElement;
const matDescriptionConfirm = document.getElementById("pMATDescriptionConfirm") as HTMLParagraphElement;
const matSection5 = document.getElementById("sMAT5") as HTMLDivElement;
const matMessage = document.getElementById("pMATMessage") as HTMLParagraphElement;
const matCancel = document.getElementById("btnMATCancel") as HTMLButtonElement;
const matAccept = document.getElementById("btnMATAccept") as HTMLButtonElement;

const modalTransaction = document.getElementById("modalTransaction") as HTMLDivElement;
const mtClose = modalTransaction.querySelector(".delete") as HTMLButtonElement;
const mtAccount = document.getElementById("pMTAccount") as HTMLParagraphElement;
const mtType = document.getElementById("pMTType") as HTMLParagraphElement;
const mtValue = document.getElementById("pMTValue") as HTMLParagraphElement;
const mtDate = document.getElementById("pMTDate") as HTMLParagraphElement;
const dmtCategory = document.getElementById("dMTCategory") as HTMLDivElement;
const mtCategory = document.getElementById("pMTCategory") as HTMLParagraphElement;
const dmtDescription = document.getElementById("dMTDescription") as HTMLDivElement;
const mtDescription = document.getElementById("pMTDescription") as HTMLParagraphElement;
const mtOk = document.getElementById("btnMTOk") as HTMLButtonElement;

try {
    accountRepository.getList().then((pagination: Pagination<Account>) => {
        accounts = pagination.list
        if (accounts.length === 0) return;

        accounts.forEach(account => {
            const option = document.createElement("option");
            option.value = account.id!;
            option.innerText = account.name;
            matAccount.appendChild(option);
            mftAccount.appendChild(option.cloneNode(true));
        });
        matAccountBalance.innerText = `${t("shared.balance")}: ${FormatNumber(accounts[0].balance)}`;
    });
    categoryRepository.getList().then((pagination: Pagination<Category>) => {
        categories = pagination.list;
        if (categories.length === 0) return;

        {
            const option = document.createElement("option");
            option.value = "";
            option.innerText = t("index.transactions.categoryNone");
            matCategory.appendChild(option);
        }
        categories.forEach(category => {
            const option = document.createElement("option");
            option.value = category.id!;
            option.innerText = category.name;
            matCategory.appendChild(option);
            mftCategory.appendChild(option.cloneNode(true));
        });
    });
} catch (err: any) {
    if (err instanceof Error) {
        console.error(err);
        window.showAlert(err.message);
    }
}

const transactionShowUpdate = (_transaction: Transaction) => {
    transaction = _transaction;
    const account: Account | undefined = accounts.find(a => a.name === transaction!.account);
    if (account) {
        matAccount.value = account.id!;
        matAccountBalance.innerText = `${t("shared.balance")}: ${FormatNumber(account.balance)}`;
    }
    else {
        matAccount.value = accounts[0].id!;
        matAccountBalance.innerText = `${t("shared.balance")}: ${FormatNumber(accounts[0].balance)}`;
    }
    matType.value = transaction.type ? "true" : "false";
    matValue.value = transaction.value.toString();
    if (transaction.category) {
        const category: Category | undefined = categories.find(c => c.name === transaction!.category);
        matCategory.value = (category) ? category.id! : "";
    }
    else matCategory.value = "";
    if (transaction.description)
        matDescription.value = transaction.description;
    else matDescription.value = "";
    
    modalAddTransaction.classList.add("is-active");
    matTitle.innerText = t("index.transactions.update");
};
const transactionShowView = (_transaction: Transaction) => {
    transaction = _transaction;
    
    mtAccount.innerText = transaction.account;
    mtType.innerText = (transaction.type) ? t("index.transactions.ingress") : t("index.transactions.egress");
    mtValue.innerText = FormatNumber(transaction.value);
    mtDate.innerText = dayjs(transaction.date).format("DD/MM/YYYY HH:mm:ss");
    if (transaction.category) {
        dmtCategory.style.display = "flex";
        mtCategory.innerText = transaction.category;
    }
    else dmtCategory.style.display = "none";
    if (transaction.description) {
        dmtDescription.style.display = "block";
        mtDescription.innerText = transaction.description;
    }
    else dmtDescription.style.display = "none";
    
    modalTransaction.classList.add("is-active");
};
Attach("transaction:filter:show", () => {
    const modal = document.getElementById("modalFilterTransactions") as HTMLDivElement;
    modal.classList.add("is-active");
    mftClearFilters.classList.remove("is-loading");
    mftClearFilters.disabled = false;
    mftAccept.classList.remove("is-loading");
    mftAccept.disabled = false;
});
Attach("transaction:filter:hide", () => {
    const modal = document.getElementById("modalFilterTransactions") as HTMLDivElement;
    modal.classList.remove("is-active");
    mftClearFilters.classList.remove("is-loading");
    mftClearFilters.disabled = false;
    mftAccept.classList.remove("is-loading");
    mftAccept.disabled = false;
});
Attach("transaction:filter:activeButton", () => {
    mftClearFilters.classList.remove("is-loading");
    mftClearFilters.disabled = false;
    mftAccept.classList.remove("is-loading");
    mftAccept.disabled = false;
});
Attach("transaction:showUpdate", transactionShowUpdate);
Attach("transaction:showView", transactionShowView);

const matClickClose = () => {
    matSection5.style.display = "none";
    matSection4.style.display = "none";
    dmatDescriptionConfirm.style.display = "none";
    dmatCategoryConfirm.style.display = "none";
    matSection3.style.display = "none";
    matDescription.value = "";
    if (categories.length > 0) 
        matCategory.value = "";
    matSection2.style.display = "none";
    matValue.value = "";
    matType.value = "true";
    matSection1.style.display = "block";
    if (accounts.length > 0) {
        matAccount.value = accounts[0].id!;
        matAccountBalance.innerText = `${t("shared.balance")}: ${FormatNumber(accounts[0].balance)}`;
    }
    matCancel.innerText = t("shared.cancel");
    matAccept.innerText = t("shared.next");
    matCancel.style.display = "block";
    matClose.style.display = "block";
    modalAddTransaction.classList.remove("is-active");
};
const mtClickClose = () => {
    transaction = undefined;
    modalTransaction.classList.remove("is-active");
}

mftClear.onclick = () => {
    mftDateFrom.value = "";
    mftDateTo.value = "";
};
mftCancel.onclick = () => {
    const modal = document.getElementById("modalFilterTransactions") as HTMLDivElement;
    modal.classList.remove("is-active");
};
mftClearFilters.onclick = () => {
    Notify("transaction:filter:clear");
    mftClearFilters.classList.add("is-loading");
    mftClearFilters.disabled = true;
};
mftAccept.onclick = () => {
    const filter: TransactionFilter = {};
    if (mftDateFrom.value) filter.dateFrom = dayjs.utc(mftDateFrom.value).toDate();
    if (mftDateTo.value) filter.dateTo = dayjs.utc(mftDateTo.value).toDate();
    if (mftAccount.value) {
        const account = accounts.find(a => a.id === mftAccount.value);
        if (account) filter.account = account.name;
    }
    if (mftCategory.value) {
        const category = categories.find(c => c.id === mftCategory.value);
        if (category) filter.category = category.name;
    }
    if (mftType.value != "all") filter.type = mftType.value === "true" ? true : false;

    if (!filter.dateFrom && !filter.dateTo && 
        !filter.account && !filter.category && 
        !filter.type) {
        window.showAlert(t("index.transactions.filter.noSelectFilters"));
        return;
    }

    Notify("transaction:filter", filter);
    mftAccept.classList.add("is-loading");
    mftAccept.disabled = true;
};
addTransaction.onclick = () => {
    if (accounts.length == 0) {
        window.showAlert(t("index.transactions.accountsRequired"));
        return;
    }

    modalAddTransaction.classList.add("is-active");
    matTitle.innerText = t("index.transactions.add");
    transaction = undefined;
};
matClose.onclick = matClickClose;
matAccount.onchange = (event: Event) => {
    const id = (event.target as HTMLSelectElement).value;
    
    const account: Account | undefined = accounts.find(a => a.id === id);
    if (!account) return;

    matAccountBalance.innerText = `${t("shared.balance")}: ${FormatNumber(account.balance)}`;
};
matValue.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Enter") {
        event.preventDefault();
        matAccept.click();
    }
});
matDescription.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Enter" && event.ctrlKey) {
        event.preventDefault();
        matAccept.click();
    }
});
matCancel.onclick = () => {
    if (matSection1.style.display === "block") matClickClose();
    if (matSection2.style.display === "block") {
        matSection2.style.display = "none";
        matSection1.style.display = "block";
        matCancel.innerText = t("shared.cancel");
    }
    if (matSection3.style.display === "block") {
        matSection3.style.display = "none";
        matSection2.style.display = "block";
        matCancel.innerText = t("shared.back");
        matAccept.innerText = t("shared.next");
    }
    if (matSection4.style.display === "block") {
        matSection4.style.display = "none";
        matSection3.style.display = "block";
        matCancel.innerText = t("shared.back");
        matAccept.innerText = t("shared.next");
    }
};
matAccept.onclick = async () => {
    if (matSection1.style.display === "block") {
        matSection1.style.display = "none";
        matSection2.style.display = "block";
        matCancel.innerText = t("shared.back");
        return;
    }
    if (matSection2.style.display === "block") {
        if (matValue.value === "" || isNaN(Number(matValue.value)) || Number(matValue.value) <= 0) {
            window.showAlert(t("index.transactions.valueInvalid"));
            return;
        }
        const account = accounts.find(a => a.id === matAccount.value)!;
        
        matDate.value = (!transaction) ? 
            dayjs().format("YYYY-MM-DD HH:mm:ss") : 
            matDate.value = dayjs.utc(transaction.date).format("YYYY-MM-DD HH:mm:ss");
        matSection2.style.display = "none";
        matSection3.style.display = "block";
        matCancel.innerText = t("shared.back");
        matAccept.innerText = t("shared.next");
        return;
    }
    if (matSection3.style.display === "block") {
        matSection3.style.display = "none";
        matSection4.style.display = "block";

        const account = accounts.find(a => a.id === matAccount.value)!;
        matAccountConfirm.innerText = account.name;
        matTypeConfirm.innerText = matType.value === "true" ? t("index.transactions.ingress") : t("index.transactions.egress");
        matValueConfirm.innerText = FormatNumber(Number(matValue.value));
        matDateConfirm.innerText = dayjs(matDate.value).format("DD/MM/YYYY HH:mm:ss");
        if (matCategory.value) {
            dmatCategoryConfirm.style.display = "flex";
            matCategoryConfirm.innerText = categories.find(c => c.id === matCategory.value)!.name;
        }
        else dmatCategoryConfirm.style.display = "none";
        if (matDescription.value) {
            dmatDescriptionConfirm.style.display = "block";
            matDescriptionConfirm.innerText = matDescription.value;
        }
        else dmatDescriptionConfirm.style.display = "none";
        matCancel.innerText = t("shared.back");
        matAccept.innerText = (!transaction) ? t("shared.add") : t("shared.update");
        return;
    }
    if (matSection4.style.display === "block") {
        matAccept.classList.add("is-loading");
        matAccept.disabled = true;

        const id: string = (!transaction) ? Uuid() : transaction.id!;
        const account: string = accounts.find(a => a.id === matAccount.value)!.name;
        const type: boolean = matType.value === "true" ? true : false;
        const value: number = Number(matValue.value);
        const date: Date = dayjs.utc(matDate.value).toDate();
        const category: string | undefined = (matCategory.value) ? categories.find(c => c.id === matCategory.value)!.name : undefined;
        const description: string | undefined = matDescription.value ?? undefined;

        try {
            const _transaction = new Transaction(date, type, account, value, 
                id, undefined, 
                category, description);
            if (!transaction){
                await transactionRepository.add(_transaction);
                Notify("transaction:add", _transaction);
            }
            else {
                await transactionRepository.update(_transaction);
                Notify("transaction:update", _transaction);
            }
            accounts = accounts.map(a => {
                if (a.name === account) {
                    if (!transaction) {
                        a = (type) ? a.ingressBalance(value) : a.egressBalance(value);
                    }
                    else {
                        a = (transaction.type) ? a.egressBalance(transaction.value) : a.ingressBalance(transaction.value);
                        a = (type) ? a.ingressBalance(value) : a.egressBalance(value);
                    }
                }

                return a;
            });
            matMessage.innerText = (!transaction) ? 
                t("index.transactions.added") : 
                t("index.transactions.updated");

            matSection4.style.display = "none";
            matSection5.style.display = "block";
            matClose.style.display = "none";
            matCancel.style.display = "none";
            matAccept.innerText = "Ok";
        } catch (err: any) {
            if (err instanceof Error) {
                console.error(err);
                window.showAlert(err.message);
            }
        }
        matAccept.classList.remove("is-loading");
        matAccept.disabled = false;
        return;
    }
    if (matSection5.style.display === "block") {
        if (transaction) transaction = undefined;
        matClickClose();
    }
};

mtClose.onclick = mtClickClose;
mtOk.onclick = mtClickClose;