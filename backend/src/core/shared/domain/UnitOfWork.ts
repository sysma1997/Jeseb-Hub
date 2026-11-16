import type { AccountRepository } from "../../account/domain/AccountRepository";
import type { TransactionRepository } from "../../transaction/domain/TransactionRepository";
import type { DebtRepository } from "../../debt/domain/DebtRepository";

// Unidad de trabajo: una forma de ejecutar varios repositorios contra la MISMA
// transaccion de base de datos.
//
// Resuelve operaciones que modifican varias piezas financieras a la vez:
// transferencias, y abonos de deuda que tocan deuda, cuenta y transaccion.
// Los repositorios que se reciben ya estan enlazados a la transaccion abierta,
// de modo que un fallo en cualquier paso revierte todos los cambios.
//
// Vive en el dominio como interfaz, igual que los repositorios: el dominio depende de
// esta abstraccion y la implementacion con Prisma vive en infraestructura.

export interface UnitOfWorkContext {
    accounts: AccountRepository;
    transactions: TransactionRepository;
    debts: DebtRepository;
}

export interface UnitOfWork {
    run<T>(work: (context: UnitOfWorkContext) => Promise<T>): Promise<T>;
}
