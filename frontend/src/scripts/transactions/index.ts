import { v4 as Uuid } from "uuid";
import dayjs from "dayjs";
import dayjsUtc from "dayjs/plugin/utc";

import { Transaction } from "../../core/transaction/domain/Transaction";
import type { TransactionRepository } from "../../core/transaction/domain/TransactionRepository";
import type { TransactionFilter } from "../../core/transaction/domain/TransactionFilter";
import { TransactionApiRepository } from "../../core/transaction/infrastructure/TransactionApiRepository";
import { Account } from "../../core/account/domain/Account";
import type { AccountRepository } from "../../core/account/domain/AccountRepository";
import { AccountApiRepository } from "../../core/account/infrastructure/AccountApiRepository"; 
import { Category } from "../../core/category/domain/Category";
import type { CategoryRepository } from "../../core/category/domain/CategoryRepository";
import { CategoryApiRepository } from "../../core/category/infrastructure/CategoryApiRepository";

import { Pagination } from "../../core/shared/domain/Pagination";
import { Attach, Notify } from "../../core/shared/domain/Subject";
import { FormatNumber } from "../../core/shared/domain/FormatNumber";
import { t } from "../../core/shared/infrastructure/i18n";

import { summaryInit } from "./summary";

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

const modalAddTransaction = document.getElementById("modalAddTransaction") as HTMLDivElement;
const matTitle = modalAddTransaction.querySelector(".modal-header h3") as HTMLHeadingElement;
const matClose = modalAddTransaction.querySelector(".modal-close") as HTMLButtonElement;
const matOperationGroup = document.getElementById("gMATOperation") as HTMLDivElement;
const dmatOperation = document.getElementById("dMATOperation") as HTMLDivElement;
const matOpTransaction = document.getElementById("btnMATOpTransaction") as HTMLButtonElement;
const matOpTransfer = document.getElementById("btnMATOpTransfer") as HTMLButtonElement;
const matAccount = document.getElementById("sMATAccount") as HTMLSelectElement;
const dmatAccount = document.getElementById("dMATAccount") as HTMLDivElement;
const matAccountBalance = document.getElementById("lMATAccountBalance") as HTMLLabelElement;
const matFrom = document.getElementById("sMATFrom") as HTMLSelectElement;
const matFromBalance = document.getElementById("lMATFromBalance") as HTMLLabelElement;
const matTo = document.getElementById("sMATTo") as HTMLSelectElement;
const matToBalance = document.getElementById("lMATToBalance") as HTMLLabelElement;
const dmatFrom = document.getElementById("dMATFrom") as HTMLDivElement;
const dmatTo = document.getElementById("dMATTo") as HTMLDivElement;
const dmatType = document.getElementById("dMATType") as HTMLDivElement;
const dmatCategory = document.getElementById("dMATCategory") as HTMLDivElement;
const matTypeGroup = document.getElementById("gMATType") as HTMLDivElement;
const matTypeIngress = document.getElementById("btnMATIngress") as HTMLButtonElement;
const matTypeEgress = document.getElementById("btnMATEgress") as HTMLButtonElement;
const matValue = document.getElementById("iMATValue") as HTMLInputElement;
const matDate = document.getElementById("iMATDate") as HTMLInputElement;
const matCategory = document.getElementById("sMATCategory") as HTMLSelectElement;
const matDescription = document.getElementById("taMATDescription") as HTMLTextAreaElement;
const matMessage = document.getElementById("pMATMessage") as HTMLParagraphElement;
const matCancel = document.getElementById("btnMATCancel") as HTMLButtonElement;
const matAccept = document.getElementById("btnMATAccept") as HTMLButtonElement;

const modalTransaction = document.getElementById("modalTransaction") as HTMLDivElement;
const mtClose = modalTransaction.querySelector(".modal-close") as HTMLButtonElement;
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
            matFrom.appendChild(option.cloneNode(true));
            matTo.appendChild(option.cloneNode(true));
        });
        matAccountBalance.innerText = `${t("shared.balance")}: ${FormatNumber(accounts[0].balance)}`;
        matFromBalance.innerText = `${t("shared.balance")}: ${FormatNumber(accounts[0].balance)}`;
        if (accounts.length > 1) {
            matTo.value = accounts[1].id!;
            matToBalance.innerText = `${t("shared.balance")}: ${FormatNumber(accounts[1].balance)}`;
        }
        else {
            matToBalance.innerText = `${t("shared.balance")}: ${FormatNumber(accounts[0].balance)}`;
        }
    });
    categoryRepository.getList().then((pagination: Pagination<Category>) => {
        categories = pagination.list;
        if (categories.length === 0) return;

        {
            const option = document.createElement("option");
            option.value = "";
            option.innerText = t("transactions.categoryNone");
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

    summaryInit(transactionRepository);
} catch (err: any) {
    if (err instanceof Error) {
        console.error(err);
        window.showAlert(err.message);
    }
}

const matGetType = (): boolean => matTypeIngress.classList.contains("is-active");
const matGetTransfer = (): boolean => matOpTransfer.classList.contains("is-active");
const matSetOperation = (transfer: boolean) => {
    matOpTransaction.classList.toggle("is-active", !transfer);
    matOpTransfer.classList.toggle("is-active", transfer);

    dmatFrom.style.display = (transfer) ? "block" : "none";
    dmatTo.style.display = (transfer) ? "block" : "none";
    dmatAccount.style.display = (transfer) ? "none" : "block";
    dmatType.style.display = (transfer) ? "none" : "block";
    dmatCategory.style.display = (transfer) ? "none" : "block";
};
const matSetType = (type: boolean) => {
    matTypeIngress.classList.toggle("is-active", type);
    matTypeEgress.classList.toggle("is-active", !type);
};
const matReset = () => {
    matValue.value = "";
    matDescription.value = "";
    matSetType(true);
    matSetOperation(false);
    matOperationGroup.style.display = "flex";
    dmatOperation.style.display = "block";
    matDate.value = dayjs().format("YYYY-MM-DDTHH:mm");
    if (accounts.length > 0) {
        matAccount.value = accounts[0].id!;
        matAccountBalance.innerText = `${t("shared.balance")}: ${FormatNumber(accounts[0].balance)}`;
        matFrom.value = accounts[0].id!;
        matFromBalance.innerText = `${t("shared.balance")}: ${FormatNumber(accounts[0].balance)}`;
        if (accounts.length > 1) {
            matTo.value = accounts[1].id!;
            matToBalance.innerText = `${t("shared.balance")}: ${FormatNumber(accounts[1].balance)}`;
        }
        else {
            matToBalance.innerText = `${t("shared.balance")}: ${FormatNumber(accounts[0].balance)}`;
        }
    }
    if (categories.length > 0)
        matCategory.value = "";
    matCancel.innerText = t("shared.cancel");
    matMessage.innerText = "";
    matClose.style.display = "block";
};

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
    matSetType(transaction.type);
    matValue.value = transaction.value.toString();
    if (transaction.category) {
        const category: Category | undefined = categories.find(c => c.name === transaction!.category);
        matCategory.value = (category) ? category.id! : "";
    }
    else matCategory.value = "";
    if (transaction.description)
        matDescription.value = transaction.description;
    else matDescription.value = "";
    matDate.value = dayjs(transaction.date).format("YYYY-MM-DDTHH:mm");
    matMessage.innerText = "";
    matSetOperation(false);
    dmatOperation.style.display = "none";
    matOperationGroup.style.display = "none";
    
    modalAddTransaction.classList.add("is-active");
    matTitle.innerText = t("transactions.update");
    matAccept.innerText = t("shared.update");
};
const transactionShowView = (_transaction: Transaction) => {
    transaction = _transaction;
    
    mtAccount.innerText = transaction.account;
    mtType.innerText = (transaction.type) ? t("transactions.ingress") : t("transactions.egress");
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
Attach("sidebar:add", () => {
    if (accounts.length == 0) {
        window.showAlert(t("transactions.accountsRequired"));
        return;
    }

    transaction = undefined;
    matReset();
    matTitle.innerText = t("transactions.add");
    matAccept.innerText = t("shared.add");
    modalAddTransaction.classList.add("is-active");
});
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
    transaction = undefined;
    matReset();
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
    if (mftDateFrom.value) filter.dateFrom = dayjs(mftDateFrom.value).toDate();
    if (mftDateTo.value) filter.dateTo = dayjs(mftDateTo.value).toDate();
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
        filter.type === undefined) {
        window.showAlert(t("transactions.filter.noSelectFilters"));
        return;
    }

    Notify("transaction:filter", filter);
    mftAccept.classList.add("is-loading");
    mftAccept.disabled = true;
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
matTypeIngress.onclick = () => matSetType(true);
matTypeEgress.onclick = () => matSetType(false);
matOpTransaction.onclick = () => matSetOperation(false);
matOpTransfer.onclick = () => matSetOperation(true);
matFrom.onchange = (event: Event) => {
    const id = (event.target as HTMLSelectElement).value;
    const account: Account | undefined = accounts.find(a => a.id === id);
    if (!account) return;
    matFromBalance.innerText = `${t("shared.balance")}: ${FormatNumber(account.balance)}`;
};
matTo.onchange = (event: Event) => {
    const id = (event.target as HTMLSelectElement).value;
    const account: Account | undefined = accounts.find(a => a.id === id);
    if (!account) return;
    matToBalance.innerText = `${t("shared.balance")}: ${FormatNumber(account.balance)}`;
};

matCancel.onclick = () => {
    matClickClose();
};
matAccept.onclick = async () => {
    if (matValue.value === "" || isNaN(Number(matValue.value)) || Number(matValue.value) <= 0) {
        window.showAlert(t("transactions.valueInvalid"));
        return;
    }

    matAccept.classList.add("is-loading");
    matAccept.disabled = true;

    const value: number = Number(matValue.value);
    const date: Date = dayjs.utc(matDate.value).toDate();
    const description: string | undefined = matDescription.value ? matDescription.value : undefined;

    try {
        if (matGetTransfer()) {
            const from: string = accounts.find(a => a.id === matFrom.value)!.name;
            const to: string = accounts.find(a => a.id === matTo.value)!.name;
            if (from === to) {
                window.showAlert(t("transfers.sameAccount"));
                matAccept.classList.remove("is-loading");
                matAccept.disabled = false;
                return;
            }

            await transactionRepository.transfer(from, to, value, date, description);

            accounts = accounts.map(a => {
                if (a.name === from) return a.egressBalance(value);
                if (a.name === to) return a.ingressBalance(value);
                return a;
            });

            matReset();
            matMessage.innerText = t("transfers.added");
            matAccept.classList.remove("is-loading");
            matAccept.disabled = false;
            return;
        }

        const id: string = (!transaction) ? Uuid() : transaction.id!;
        const account: string = accounts.find(a => a.id === matAccount.value)!.name;
        const type: boolean = matGetType();
        const category: string | undefined = (matCategory.value) ? categories.find(c => c.id === matCategory.value)!.name : undefined;

        const _transaction = new Transaction(date, type, account, value,
            id, undefined,
            category, description);
        if (!transaction) {
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

        if (!transaction) {
            matReset();
            matMessage.innerText = t("transactions.added");
        }
        else {
            transaction = undefined;
            matClickClose();
        }
    } catch (err: any) {
        if (err instanceof Error) {
            console.error(err);
            window.showAlert(err.message);
        }
    }
    matAccept.classList.remove("is-loading");
    matAccept.disabled = false;
};


mtClose.onclick = mtClickClose;
mtOk.onclick = mtClickClose;