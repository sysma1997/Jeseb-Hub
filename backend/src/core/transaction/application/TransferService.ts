import { v4 as Uuid } from "uuid";

import { Transaction } from "../domain/Transaction";
import { TranslatorRepository } from "../../shared/domain/TranslatorRepository";
import type { UnitOfWork } from "../../shared/domain/UnitOfWork";

export class TransferService {
    private readonly unitOfWork: UnitOfWork;
    private readonly translator: TranslatorRepository;

    constructor(unitOfWork: UnitOfWork, translator: TranslatorRepository) {
        this.unitOfWork = unitOfWork;
        this.translator = translator;
    }

    async transfer(idUser: string, from: string, to: string, value: number, date: Date, description?: string): Promise<void> {
        if (from === to) throw new Error(this.translator.translate("transfers.errors.sameAccount"));

        // value llega ya en centavos desde el controlador: convertirlo aqui de nuevo
        // multiplicaria por 100 dos veces
        const cents = value;

        await this.unitOfWork.run(async ({ accounts, transactions }) => {
            const fromAccount = await accounts.search(idUser, from);
            if (!fromAccount) throw new Error(this.translator.translate("transfers.errors.accountNotFound", { account: from }));
            const toAccount = await accounts.search(idUser, to);
            if (!toAccount) throw new Error(this.translator.translate("transfers.errors.accountNotFound", { account: to }));

            const transferId: string = Uuid();

            const egress = new Transaction(this.translator, date, false, from, cents,
                Uuid(), idUser,
                undefined, description,
                transferId, true);
            const ingress = new Transaction(this.translator, date, true, to, cents,
                Uuid(), idUser,
                undefined, description,
                transferId, true);

            // El debito va con la condicion de saldo suficiente dentro del propio
            // UPDATE, y la suma y los dos movimientos van despues en la misma
            // transaccion. Antes se comparaba el saldo en JavaScript y luego se
            // escribia el saldo absoluto ya calculado, con lo que dos transferencias
            // simultaneas podian Gastar dos veces el mismo dinero o dejar una
            // transferencia a medio aplicar si algo fallaba en medio.
            const debited = await accounts.adjustIfEnough(idUser, fromAccount.id!, cents);
            if (!debited) throw new Error(this.translator.translate("transfers.errors.insufficientBalance"));

            await transactions.addRange([egress, ingress]);
            await accounts.adjust(idUser, toAccount.id!, cents);
        });
    }

    async deleteTransfer(idUser: string, transferId: string): Promise<void> {
        await this.unitOfWork.run(async ({ accounts, transactions }) => {
            const movements: Transaction[] = await transactions.getByTransferId(idUser, transferId);
            if (movements.length === 0) throw new Error(this.translator.translate("transfers.errors.notFound"));

            const ids: string[] = movements.map(m => m.id!);

            // al revés que en transfer(): quien salió recupera, quien entró devuelve
            for (const movement of movements) {
                const account = await accounts.search(idUser, movement.account);
                if (!account) continue;

                await accounts.adjust(idUser, account.id!, movement.type ? -movement.value : movement.value);
            }

            await transactions.deleteByIds(idUser, ids);
        });
    }
}