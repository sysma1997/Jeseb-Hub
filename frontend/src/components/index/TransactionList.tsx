import { useEffect, useState } from "react";
import dayjs from "dayjs";
import dayjsUtc from "dayjs/plugin/utc";
import { Icon } from "@iconify/react";

import { Transaction } from "../../core/transaction/domain/Transaction";
import type { TransactionRepository } from "../../core/transaction/domain/TransactionRepository";
import { TransactionApiRepository } from "../../core/transaction/infrastructure/TransactionApiRepository";

import { Pagination } from "../../core/shared/domain/Pagination";
import { FormatNumber } from "../../core/shared/domain/FormatNumber";
import { Attach, Detach, Notify } from "../../core/shared/domain/Subject";
import { t } from "../../core/shared/infrastructure/i18n";

import { Pagination as CPagination } from "../shared/Pagination";

import "../../styles/index/transactionsList.css";

dayjs.extend(dayjsUtc);

const repository: TransactionRepository = new TransactionApiRepository();

export const TransactionList = () => {
    const [pagination, setPagination] = useState<Pagination<Transaction>>(new Pagination());
    const [limit, setLimit] = useState<number>(15);
    const [page, setPage] = useState<number>(1);

    useEffect(() => {
        repository.getList(limit).then((pagination: Pagination<Transaction>) => {
            setPagination(pagination);
        });
    }, []);
    useEffect(() => {
        const add = (transaction: Transaction) => {
            let tra: Transaction[] = [];
            if (pagination.list.length > 0) tra = [...pagination.list];

            tra.push(transaction);
            tra = tra.sort((t1, t2) => dayjs.utc(t2.date).diff(dayjs.utc(t1.date)));
            
            const newPagination = new Pagination<Transaction>();
            newPagination.list = tra;
            newPagination.pages = pagination.pages;
            setPagination(newPagination);
        };
        const update = (transaction: Transaction) => {
            let tra: Transaction[] = [...pagination.list!];
            
            tra = tra.map(t => {
                if (t.id! === transaction.id!)
                    return transaction;
                return t;
            });
            tra = tra.sort((t1, t2) => dayjs.utc(t2.date).diff(dayjs.utc(t1.date)));
            const newPagination = new Pagination<Transaction>();
            newPagination.list = tra;
            newPagination.pages = pagination.pages;
            setPagination(newPagination);
        };

        Attach("transaction:add", add);
        Attach("transaction:update", update);
        return () => {
            Detach("transaction:add", add);
            Detach("transaction:update", update);
        };
    }, [pagination.list]);

    const clickShow = (transaction: Transaction) => {
        Notify("transaction:showView", transaction);
    }
    const clickUpdate = (transaction: Transaction) => {
        Notify("transaction:showUpdate", transaction);
    };
    const clickDelete = (id: string) => {
        window.showConfirm(t("index.transactions.delete.description"), t("index.transactions.delete.title"), async () => {
            try {
                await repository.delete(id);
                let tra: Transaction[] = [...pagination.list!];

                tra = tra.filter(t => t.id! !== id);
                if (tra.length === 0 && pagination.pages > 1 && page > 1) {
                    onChangePagination(limit, page - 1);
                    return;
                }

                const newPagination = new Pagination<Transaction>();
                newPagination.list = tra;
                newPagination.pages = pagination.pages;
                setPagination(newPagination);
                window.showAlert(t("index.transactions.delete.success"), t("index.transactions.delete.title"));
            } catch (err: any) {
                if (err instanceof Error) {
                    console.error(err);
                    window.showAlert(err.message);
                }
            }
        });
    };

    const onChangePagination = (limit: number, page: number) => {
        setLimit(limit);
        setPage(page);
        repository.getList(limit, page).then((pagination: Pagination<Transaction>) => {
            setPagination(pagination);
        });
    };

    return <div className="transactionsList card">
        <header className="card-header">
            <h2 className="card-header-title">{t("index.transactions.title")}</h2>
        </header>
        <div className="card-content">
            <div className="content">
                {(pagination.list.length === 0) && <p className="noContent">{t("index.transactions.noItems")}</p>}
                {(pagination.list.length > 0) && <>
                    <div className="table-container">
                        <table className="table is-fullwidth">
                            <thead>
                                <tr>
                                    <th className="fiftyPercent">{t("index.transactions.account")}</th>
                                    <th>{t("index.transactions.value")}</th>
                                    <th>{t("index.transactions.date")}</th>
                                    <th>{t("index.transactions.options")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagination.list.map((transaction: Transaction) => <tr key={transaction.id}>
                                    <th>{transaction.account}</th>
                                    <td style={{ color: (transaction.type) ? "green" : "red" }}>
                                        {((transaction.type) ? "" : "-") + FormatNumber(transaction.value)}
                                    </td>
                                    <td>{dayjs.utc(transaction.date).format("DD/MM/YYYY HH:mm:ss")}</td>
                                    <td>
                                        <div className="options">
                                            <button className="button is-info" 
                                                onClick={() => clickShow(transaction)}>
                                                <Icon icon="ic:baseline-remove-red-eye" />
                                            </button>
                                            <button className="button is-primary" 
                                                onClick={() => clickUpdate(transaction)}>
                                                <Icon icon="material-symbols:edit-rounded" />
                                            </button>
                                            <button className="button is-danger" 
                                                onClick={() => clickDelete(transaction.id!)}>
                                                <Icon icon="solar:trash-bin-2-bold" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>)}
                            </tbody>
                        </table>
                    </div>
                    <CPagination updatePages={pagination.pages} onChange={onChangePagination} />
                </>}
            </div>
        </div>
    </div>;
};