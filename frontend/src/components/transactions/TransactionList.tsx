import { useEffect, useState } from "react";
import dayjs from "dayjs";
import dayjsUtc from "dayjs/plugin/utc";
import { Icon } from "@iconify/react";

import { Transaction } from "../../core/transaction/domain/Transaction";
import type { TransactionFilter } from "../../core/transaction/domain/TransactionFilter";
import type { TransactionRepository } from "../../core/transaction/domain/TransactionRepository";
import { TransactionApiRepository } from "../../core/transaction/infrastructure/TransactionApiRepository";

import { Pagination } from "../../core/shared/domain/Pagination";
import { FormatNumber } from "../../core/shared/domain/FormatNumber";
import { Attach, Detach, Notify } from "../../core/shared/domain/Subject";
import { t } from "../../core/shared/infrastructure/i18n";

import { Pagination as CPagination } from "../shared/Pagination";

import "../../styles/transactions/transactionsList.css";

dayjs.extend(dayjsUtc);

const repository: TransactionRepository = new TransactionApiRepository();

export const TransactionList = () => {
    const [filter, setFilter] = useState<TransactionFilter>();

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
        const filter = (filter: TransactionFilter) => {
            setFilter(filter);
            setPage(1);
            repository.getListFilter(filter, limit, 1).then((pagination: Pagination<Transaction>) => {
                setPagination(pagination);
                Notify("transaction:filter:hide");
            }).catch((err: any) => {
                if (err instanceof Error) {
                    window.showAlert(err.message);
                    Notify("transaction:filter:activeButton")
                }
            });
        };
        const clear = () => {
            setFilter(undefined);
            setPage(1);
            repository.getList(limit, 1).then((pagination: Pagination<Transaction>) => {
                setPagination(pagination);
                Notify("transaction:filter:hide");
            }).catch((err: any) => {
                if (err instanceof Error) {
                    window.showAlert(err.message);
                    Notify("transaction:filter:activeButton")
                }
            });
        };

        Attach("transaction:add", add);
        Attach("transaction:update", update);
        Attach("transaction:filter", filter);
        Attach("transaction:filter:clear", clear);
        return () => {
            Detach("transaction:add", add);
            Detach("transaction:update", update);
            Detach("transaction:filter", filter);
            Detach("transaction:filter:clear", clear);
        };
    }, [pagination.list, limit, page]);

    const clickShowFilter = () => {
        Notify("transaction:filter:show");
    }
    const clickShow = (transaction: Transaction) => {
        Notify("transaction:showView", transaction);
    }
    const clickUpdate = (transaction: Transaction) => {
        Notify("transaction:showUpdate", transaction);
    };
    const clickDelete = (transactionDeleted: Transaction) => {
        window.showConfirm(t("transactions.delete.description"), t("transactions.delete.title"), async () => {
            try {
                if (transactionDeleted.isTransfer && transactionDeleted.transferId) {
                    await repository.deleteTransfer(transactionDeleted.transferId);
                    let del: Transaction[] = [...pagination.list!];
                    del = del.filter(t => t.transferId !== transactionDeleted.transferId);
                    if (del.length === 0 && pagination.pages > 1 && page > 1) {
                        onChangePagination(limit, page - 1);
                        return;
                    }
                    const newPagination = new Pagination<Transaction>();
                    newPagination.list = del;
                    newPagination.pages = pagination.pages;
                    setPagination(newPagination);
                    window.showAlert(t("transactions.delete.success"), t("transactions.delete.title"));
                    return;
                }

                await repository.delete(transactionDeleted.id!);
                let tra: Transaction[] = [...pagination.list!];

                tra = tra.filter(t => t.id! !== transactionDeleted.id!);
                if (tra.length === 0 && pagination.pages > 1 && page > 1) {
                    onChangePagination(limit, page - 1);
                    return;
                }

                const newPagination = new Pagination<Transaction>();
                newPagination.list = tra;
                newPagination.pages = pagination.pages;
                setPagination(newPagination);
                Notify("transaction:delete", transactionDeleted.id!);
                window.showAlert(t("transactions.delete.success"), t("transactions.delete.title"));
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

        if (filter) repository.getListFilter(filter, limit, page).then((pagination: Pagination<Transaction>) => 
            setPagination(pagination));
        else repository.getList(limit, page).then((pagination: Pagination<Transaction>) => 
            setPagination(pagination));
    };

    return <div className="transactionsCard">
        <div className="transactionsCard-header">
            <span>{t("transactions.title")}</span>
            <button onClick={clickShowFilter} aria-label={t("shared.filter")}>
                <Icon icon="material-symbols:filter-alt-sharp" />
            </button>
        </div>
        <div className="transactionsCard-content">
            {(pagination.list.length === 0) && <div className="transactionsEmpty">{t("transactions.noItems")}</div>}
            {(pagination.list.length > 0) && <>
                <table className="transactionsTable">
                    <thead>
                        <tr>
                            <th>{t("transactions.account")}</th>
                            <th>{t("transactions.date")}</th>
                            <th>{t("transactions.value")}</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {pagination.list.map((transaction: Transaction) => {
                            const counterpart: Transaction | undefined = (transaction.isTransfer) ?
                                pagination.list.find(t => t.transferId === transaction.transferId && t.id !== transaction.id) :
                                undefined;
                            const neutralColor = "#7f8c8d";
                            return <tr key={transaction.id} className="transactionRow">
                            <td className="transactionAccount">
                                <div className="transactionAccountCell">
                                    {transaction.isTransfer && <Icon icon="mdi:swap-horizontal" className="transferIcon" />}
                                    <span className="transactionAccountName">
                                        {(transaction.isTransfer && counterpart)
                                            ? `${transaction.account} → ${counterpart.account}`
                                            : transaction.account}
                                    </span>
                                </div>
                            </td>
                            <td className="transactionDate">
                                {dayjs.utc(transaction.date).format("DD/MM/YYYY HH:mm:ss")}
                            </td>
                            <td className="transactionValue" style={{ color: (transaction.isTransfer) ? neutralColor : ((transaction.type) ? "#00d1b2" : "#ff3860") }}>
                                {FormatNumber(transaction.value)}
                            </td>
                            <td>
                                <div className="transactionOptions">
                                    <button className="view" onClick={() => clickShow(transaction)}>
                                        <Icon icon="ic:baseline-remove-red-eye" />
                                    </button>
                                    {!transaction.isTransfer && <button className="edit" onClick={() => clickUpdate(transaction)}>
                                        <Icon icon="material-symbols:edit-rounded" />
                                    </button>}
                                    <button className="btnDelete" onClick={() => clickDelete(transaction)}>
                                        <Icon icon="solar:trash-bin-2-bold" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                        })}
                    </tbody>
                </table>
                <CPagination updatePages={pagination.pages} onChange={onChangePagination} />
            </>}
        </div>
    </div>;
};