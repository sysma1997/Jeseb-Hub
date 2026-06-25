import { useEffect, useState } from "react";
import dayjs from "dayjs";

import { Transaction } from "../../core/transaction/domain/Transaction";
import type { TransactionRepository } from "../../core/transaction/domain/TransactionRepository";
import { TransactionApiRepository } from "../../core/transaction/infrastructure/TransactionApiRepository";

import { Pagination } from "../../core/shared/domain/Pagination";
import { FormatNumber } from "../../core/shared/domain/FormatNumber";
import { t } from "../../core/shared/infrastructure/i18n";

const repository: TransactionRepository = new TransactionApiRepository();

import "../../styles/index/transactionListMini.css";

export const TransactionListMini = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        repository.getList(5, 1).then((pagination: Pagination<Transaction>) => {
            setTransactions(pagination.list);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="transactions-loading">
        <span className="loading-spinner"></span>
        <span>Loading...</span>
    </div>;

    return <div className="transactions-table-wrapper-modern">
        <table className="transactions-table-modern">
            <thead>
                <tr>
                    <th>{t("transactions.account")}</th>
                    <th>{t("transactions.date")}</th>
                    <th className="amount-header">{t("transactions.value")}</th>
                </tr>
            </thead>
            <tbody>
                {transactions.map((transaction: Transaction) => (
                    <tr key={transaction.id}>
                        <td className="transaction-account-modern">
                            <span className="account-badge">{transaction.account}</span>
                        </td>
                        <td className="transaction-date-modern">
                            {dayjs.utc(transaction.date).format("DD/MM/YYYY HH:mm:ss")}
                        </td>
                        <td className={`transaction-amount-modern ${transaction.type ? 'positive' : 'negative'}`}>
                            {transaction.type ? '+' : '-'}
                            {FormatNumber(transaction.value)}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>;
};