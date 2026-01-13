import { Transaction } from "../domain/Transaction";
import { TransactionRepository } from "../domain/TransactionRepository";
import { Account } from "../../account/domain/Account";
import { AccountRepository } from "../../account/domain/AccountRepository";

export class TransactionService {
    private repository: TransactionRepository;
    private accountRepository: AccountRepository;

    constructor(repository: TransactionRepository, 
        accountRepository: AccountRepository) {
        this.repository = repository;
        this.accountRepository = accountRepository;
    }

    async add(transaction: Transaction): Promise<void> {
        let account: Account | undefined = await this.accountRepository.search(transaction.idUser!, transaction.account);
        if (!account) throw new Error("Account not found");

        account = (transaction.type) ? account.ingressBalance(transaction.value) : 
            account.egressBalance(transaction.value);
        
        await this.repository.add(transaction);
        await this.accountRepository.update(account);
    }
    async update(transaction: Transaction): Promise<void> {
        let lastTransaction: Transaction = await this.repository.get(transaction.idUser!, transaction.id!);
        if (!lastTransaction) throw new Error("Transaction not found");
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
        if (!lastTransaction) throw new Error("Transaction not found");
        let account: Account | undefined = await this.accountRepository.search(idUser, lastTransaction.account);
        if (account) account = (lastTransaction.type) ? 
            account.egressBalance(lastTransaction.value) : 
            account.ingressBalance(lastTransaction.value);
        
        await this.repository.delete(idUser, id);
        if (account) await this.accountRepository.update(account);
    }
}