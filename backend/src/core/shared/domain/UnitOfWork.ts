import type { AccountRepository } from "../../account/domain/AccountRepository";
import type { TransactionRepository } from "../../transaction/domain/TransactionRepository";

// Unidad de trabajo: una forma de ejecutar varios repositorios contra la MISMA
// transaccion de base de datos.
//
// El problema que resuelve: una transfierencia toca cuentas y transacciones a la vez.
// Con repositorios independientes no hay forma de decir "o se guardan las dos cosas o
// ninguna", asi que un fallo a mitad camino dejaba el saldo debitado sin el movimiento
// que lo explicara. Aqui los repositorios que se reciben ya estan enlazados a la
// transaccion abierta, de modo que el commit y el rollback los decide el bloque.
//
// Vive en el dominio como interfaz, igual que los repositorios: el dominio depende de
// esta abstraccion y la implementacion con Prisma vive en infraestructura.

export interface UnitOfWorkContext {
    accounts: AccountRepository;
    transactions: TransactionRepository;
}

export interface UnitOfWork {
    run<T>(work: (context: UnitOfWorkContext) => Promise<T>): Promise<T>;
}