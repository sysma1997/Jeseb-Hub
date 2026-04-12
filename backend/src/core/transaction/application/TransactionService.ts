import { v4 as Uuid } from "uuid";

import { Transaction } from "../domain/Transaction";
import { TransactionRepository } from "../domain/TransactionRepository";
import { Account } from "../../account/domain/Account";
import { AccountRepository } from "../../account/domain/AccountRepository";
import { Category } from "../../category/domain/Category";
import { CategoryRepository } from "../../category/domain/CategoryRepository";
import { Pagination } from "../../shared/domain/Pagination";
import { TranslatorRepository } from "../../shared/domain/TranslatorRepository";

export class TransactionService {
    private repository: TransactionRepository;
    private accountRepository: AccountRepository;
    private categoryRepository: CategoryRepository;
    private translator: TranslatorRepository;

    constructor(repository: TransactionRepository, 
        accountRepository: AccountRepository, 
        categoryRepository: CategoryRepository, 
        translator: TranslatorRepository) {
        this.repository = repository;
        this.accountRepository = accountRepository;
        this.categoryRepository = categoryRepository;
        this.translator = translator;
    }

    async add(transaction: Transaction): Promise<void> {
        let account: Account | undefined = await this.accountRepository.search(transaction.idUser!, transaction.account);
        if (!account) throw new Error(this.translator.translate("transactions.errors.accountNotFound"));

        account = (transaction.type) ? account.ingressBalance(transaction.value) : 
            account.egressBalance(transaction.value);
        
        await this.repository.add(transaction);
        await this.accountRepository.update(account);
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
        let lastTransaction: Transaction = await this.repository.get(transaction.idUser!, transaction.id!);
        if (!lastTransaction) throw new Error(this.translator.translate("transactions.errors.transactionNotFound"));
        let account: Account | undefined = await this.accountRepository.search(lastTransaction.idUser!, lastTransaction.account);
        if (account) {
            account = (lastTransaction.type) ? 
                account.egressBalance(lastTransaction.value) : 
                account.ingressBalance(lastTransaction.value);
            await this.accountRepository.update(account);
        }
        
        if (transaction.account !== lastTransaction.account) 
            account = await this.accountRepository.search(transaction.idUser!, transaction.account);
        if (account) {
            account = (transaction.type) ? account.ingressBalance(transaction.value) : 
                account.egressBalance(transaction.value);
            await this.accountRepository.update(account);
        }

        await this.repository.update(transaction);
    }
    async delete(idUser: string, id: string): Promise<void> {
        let lastTransaction: Transaction = await this.repository.get(idUser, id);
        if (!lastTransaction) throw new Error(this.translator.translate("transactions.errors.transactionNotFound"));
        let account: Account | undefined = await this.accountRepository.search(idUser, lastTransaction.account);
        if (account) account = (lastTransaction.type) ? 
            account.egressBalance(lastTransaction.value) : 
            account.ingressBalance(lastTransaction.value);
        
        await this.repository.delete(idUser, id);
        if (account) await this.accountRepository.update(account);
    }
}