import { v4 as Uuid } from "uuid";

import { Debt } from "../domain/Debt";
import { DebtPayment } from "../domain/DebtPayment";
import { Transaction } from "../../transaction/domain/Transaction";
import { TranslatorRepository } from "../../shared/domain/TranslatorRepository";
import { Money } from "../../shared/domain/Money";
import type { UnitOfWork } from "../../shared/domain/UnitOfWork";

export class DebtService {
    private readonly translator: TranslatorRepository;
    private readonly unitOfWork: UnitOfWork;

    constructor(translator: TranslatorRepository, unitOfWork: UnitOfWork) {
        this.translator = translator;
        this.unitOfWork = unitOfWork;
    }

    async addPayment(idUser: string, payment: DebtPayment): Promise<void> {
        await this.unitOfWork.run(async ({ accounts, debts, transactions }) => {
            // Bloquea la deuda para serializar abonos concurrentes y evitar que
            // dos solicitudes gasten simultaneamente el mismo saldo pendiente.
            await debts.lockDebt(idUser, payment.idDebt);
            const debt: Debt = await debts.get(idUser, payment.idDebt);

            if (payment.amount > debt.pendingAmount)
                throw new Error(this.translator.translate("debts.errors.paymentExceedsPending", {
                    pending: Money.toDecimalString(debt.pendingAmount)
                }));

            if (!payment.idAccount)
                throw new Error(this.translator.translate("debts.errors.paymentAccountRequired"));

            const account = await accounts.get(idUser, payment.idAccount);
            if (!debt.type) {
                const debited = await accounts.adjustIfEnough(idUser, account.id!, payment.amount);
                if (!debited)
                    throw new Error(this.translator.translate("debts.errors.paymentInsufficientBalance"));
            } else {
                await accounts.adjust(idUser, account.id!, payment.amount);
            }

            const paymentId = payment.id ?? Uuid();
            const transaction = new Transaction(
                this.translator,
                payment.date,
                debt.type,
                account.name,
                payment.amount,
                Uuid(),
                idUser,
                payment.category,
                payment.description || this.translator.translate("debts.paymentTransactionDescription", {
                    person: debt.person
                }),
                undefined,
                false,
                undefined,
                paymentId
            );

            await debts.addPayment(idUser, new DebtPayment(
                this.translator,
                payment.date,
                payment.amount,
                payment.idDebt,
                paymentId,
                idUser,
                payment.description,
                undefined,
                account.id,
                account.name,
                payment.category
            ));
            await transactions.add(transaction);
        });
    }

    async deletePayment(idUser: string, idDebt: string, id: string): Promise<void> {
        await this.unitOfWork.run(async ({ accounts, debts, transactions }) => {
            await debts.lockDebt(idUser, idDebt);
            const payment = await debts.getPayment(idUser, idDebt, id);
            const transaction = await transactions.getByDebtPaymentId(idUser, payment.id!);

            if (transaction) {
                // idAccount conserva la identidad aunque la cuenta haya cambiado
                // de nombre desde que se registró el abono.
                if (payment.idAccount) {
                    const account = await accounts.get(idUser, payment.idAccount);
                    await accounts.adjust(
                        idUser,
                        account.id!,
                        transaction.type ? -transaction.value : transaction.value
                    );
                }

                await transactions.delete(idUser, transaction.id!);
            }

            await debts.deletePayment(idUser, idDebt, id);
        });
    }

    async deleteDebt(idUser: string, id: string): Promise<void> {
        await this.unitOfWork.run(async ({ debts }) => {
            await debts.lockDebt(idUser, id);
            // La FK transaction.debtPaymentId usa SET NULL. El cascade de
            // deuda -> abonos elimina estos últimos, pero conserva el ledger.
            await debts.delete(idUser, id);
        });
    }

    async update(idUser: string, debt: Debt): Promise<void> {
        await this.unitOfWork.run(async ({ debts }) => {
            await debts.lockDebt(idUser, debt.id!);
            const current = await debts.get(idUser, debt.id!);

            if (current.paymentCount > 0 && current.type !== debt.type)
                throw new Error(this.translator.translate("debts.errors.typeCannotChangeAfterPayment"));
            if (debt.amount < current.paidAmount)
                throw new Error(this.translator.translate("debts.errors.amountBelowPaid", {
                    paid: Money.toDecimalString(current.paidAmount)
                }));

            await debts.update(debt);
        });
    }
}
