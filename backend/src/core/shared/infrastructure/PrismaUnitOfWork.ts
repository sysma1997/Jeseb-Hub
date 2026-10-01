import { PrismaClient } from "../../../generated/prisma/client";

import type { UnitOfWork, UnitOfWorkContext } from "../domain/UnitOfWork";
import type { TranslatorRepository } from "../domain/TranslatorRepository";

import { AccountPrismaRepository } from "../../account/infrastructure/AccountPrismaRepository";
import { TransactionPrismaRepository } from "../../transaction/infrastructure/TransactionPrismaRepository";

// Cada repositorio se construye con el cliente transaccional que entrega el callback
// de $transaction, no con el cliente global. Por eso todo lo que hagan dentro del
// bloque forma parte de la misma transaccion y se confirma o se deshace juntas.
export class PrismaUnitOfWork implements UnitOfWork {
    private readonly prisma: PrismaClient;
    private readonly translator: TranslatorRepository;

    constructor(prisma: PrismaClient, translator: TranslatorRepository) {
        this.prisma = prisma;
        this.translator = translator;
    }

    async run<T>(work: (context: UnitOfWorkContext) => Promise<T>): Promise<T> {
        return await this.prisma.$transaction(async (tx) => {
            const context: UnitOfWorkContext = {
                accounts: new AccountPrismaRepository(tx, this.translator),
                transactions: new TransactionPrismaRepository(tx, this.translator)
            };

            return await work(context);
        });
    }
}
