import { v4 as Uuid } from "uuid";

import { Transaction } from "../domain/Transaction";
import { TransactionRepository } from "../domain/TransactionRepository";
import { Account } from "../../account/domain/Account";
import { AccountRepository } from "../../account/domain/AccountRepository";
import { TranslatorRepository } from "../../shared/domain/TranslatorRepository";

export class TransferService {
    private repository: TransactionRepository;
    private accountRepository: AccountRepository;
    private translator: TranslatorRepository;

    constructor(repository: TransactionRepository, 
        accountRepository: AccountRepository, 
        translator: TranslatorRepository) {
        this.repository = repository;
        this.accountRepository = accountRepository;
        this.translator = translator;
    }

    async transfer(idUser: string, from: string, to: string, value: number, date: Date, description?: string): Promise<void> {
        if (from === to) throw new Error(this.translator.translate("transfers.errors.sameAccount"));

        const fromAccount = await this.accountRepository.search(idUser, from);
        if (!fromAccount) throw new Error(this.translator.translate("transfers.errors.accountNotFound", { account: from }));
        const toAccount = await this.accountRepository.search(idUser, to);
        if (!toAccount) throw new Error(this.translator.translate("transfers.errors.accountNotFound", { account: to }));

        if (Number(fromAccount.balance) < Number(value)) 
            throw new Error(this.translator.translate("transfers.errors.insufficientBalance"));

        const transferId: string = Uuid();

        const egress = new Transaction(this.translator, date, false, from, 
            value, 
            Uuid(), idUser, 
            undefined, description, 
            transferId, true);
        const ingress = new Transaction(this.translator, date, true, to, 
            value, 
            Uuid(), idUser, 
            undefined, description, 
            transferId, true);

        await this.repository.addRange([egress, ingress]);
        await this.accountRepository.update(fromAccount.egressBalance(value));
        await this.accountRepository.update(toAccount.ingressBalance(value));
    }

    async deleteTransfer(idUser: string, transferId: string): Promise<void> {
        const transactions: Transaction[] = await this.repository.getByTransferId(idUser, transferId);
        if (transactions.length === 0) throw new Error(this.translator.translate("transfers.errors.notFound"));

        const ids: string[] = transactions.map(t => t.id!);

        await this.repository.deleteByIds(idUser, ids);

        for (const transaction of transactions) {
            const account = await this.accountRepository.search(idUser, transaction.account);
            if (!account) continue;
            if (transaction.type) await this.accountRepository.update(account.egressBalance(transaction.value));
            else await this.accountRepository.update(account.ingressBalance(transaction.value));
        }
    }
}
