import { v4 as Uuid } from "uuid";

import { Transaction } from "../domain/Transaction";
import { TransactionRepository } from "../domain/TransactionRepository";
import { Account } from "../../account/domain/Account";
import { AccountRepository } from "../../account/domain/AccountRepository";
import { Category } from "../../category/domain/Category";
import { CategoryRepository } from "../../category/domain/CategoryRepository";
import { Pagination } from "../../shared/domain/Pagination";
import { TranslatorRepository } from "../../shared/domain/TranslatorRepository";
import type { UnitOfWork } from "../../shared/domain/UnitOfWork";

export class TransactionService {
    private repository: TransactionRepository;
    private accountRepository: AccountRepository;
    private categoryRepository: CategoryRepository;
    private translator: TranslatorRepository;
    private unitOfWork: UnitOfWork;

    constructor(repository: TransactionRepository, 
        accountRepository: AccountRepository, 
        categoryRepository: CategoryRepository, 
        translator: TranslatorRepository,
        unitOfWork: UnitOfWork) {
        this.repository = repository;
        this.accountRepository = accountRepository;
        this.categoryRepository = categoryRepository;
        this.translator = translator;
        this.unitOfWork = unitOfWork;
    }

    async add(transaction: Transaction): Promise<void> {
        await this.unitOfWork.run(async ({ accounts, transactions }) => {
            const account: Account | undefined = await accounts.search(transaction.idUser!, transaction.account);
            if (!account) throw new Error(this.translator.translate("transactions.errors.accountNotFound"));

            await transactions.add(transaction);
            // el saldo lo ajusta la base con increment/decrement: leerlo, restarlo en
            // JavaScript y escribir el absoluto dejaba una ventana en la que dos
            // movimientos concurrentes se pisaban
            await accounts.adjust(transaction.idUser!, account.id!, (transaction.type) ? transaction.value : -transaction.value);
        });
    }
    async addRange(idUser: string, transactions: Transaction[]): Promise<void> {
        const pAccounts: Pagination<Account> = await this.accountRepository.getList(idUser);
        const pCategories: Pagination<Category> = await this.categoryRepository.getList(idUser);
        const newCategories: Category[] = [];

        for (let i = 0; i < transactions.length; i++) {
            const transaction: Transaction | undefined = transactions[i];
            if (!transaction) continue;

            let account = pAccounts.list.find(a => a.name === transaction.account);
            if (!account) {
                account = new Account(this.translator, transaction.account, 
                    (transaction.type) ? transaction.value : -transaction.value, 
                    Uuid(), transaction.idUser!);
                pAccounts.list.push(account);
            }
            else {
                account = (transaction.type) ? account.ingressBalance(transaction.value) : 
                    account.egressBalance(transaction.value);
                pAccounts.list = pAccounts.list.map(a => {
                    if (a.id === account!.id) return account!;
                    return a;
                });
            }

            if (transaction.category) {
                let category = pCategories.list.find(c => c.name === transaction.category!);
                if (!category) {
                    const category = new Category(this.translator, transaction.category, undefined, transaction.idUser!);
                    pCategories.list.push(category);
                    newCategories.push(category);
                }
            }
        }

        await this.categoryRepository.addRange(newCategories);
        await this.accountRepository.addRange(pAccounts.list);
        await this.repository.addRange(transactions);
    }
    async update(transaction: Transaction): Promise<void> {
        await this.unitOfWork.run(async ({ accounts, transactions }) => {
            const lastTransaction: Transaction = await transactions.get(transaction.idUser!, transaction.id!);
            if (!lastTransaction) throw new Error(this.translator.translate("transactions.errors.notFound"));

            // primero se revierte el efecto del movimiento anterior y luego se aplica el
            // nuevo, dentro de la misma transaccion: entre medias el saldo nunca queda
            // en un estado intermedio visible
            const lastAccount: Account | undefined = await accounts.search(lastTransaction.idUser!, lastTransaction.account);
            if (lastAccount)
                await accounts.adjust(lastTransaction.idUser!, lastAccount.id!, (lastTransaction.type) ? -lastTransaction.value : lastTransaction.value);

            if (transaction.account !== lastTransaction.account) {
                const newAccount: Account | undefined = await accounts.search(transaction.idUser!, transaction.account);
                if (!newAccount) throw new Error(this.translator.translate("transactions.errors.accountNotFound"));

                await accounts.adjust(transaction.idUser!, newAccount.id!, (transaction.type) ? transaction.value : -transaction.value);
            }
            else if (lastAccount)
                await accounts.adjust(lastAccount.idUser!, lastAccount.id!, (transaction.type) ? transaction.value : -transaction.value);

            await transactions.update(transaction);
        });
    }
    async delete(idUser: string, id: string): Promise<void> {
        await this.unitOfWork.run(async ({ accounts, transactions }) => {
            const lastTransaction: Transaction = await transactions.get(idUser, id);
            if (!lastTransaction) throw new Error(this.translator.translate("transactions.errors.notFound"));
            const account: Account | undefined = await accounts.search(idUser, lastTransaction.account);

            await transactions.delete(idUser, id);
            // se deshace el efecto original: un ingreso que se borra resta, un gasto se suma
            if (account) await accounts.adjust(idUser, account.id!, (lastTransaction.type) ? -lastTransaction.value : lastTransaction.value);
        });
    }
}