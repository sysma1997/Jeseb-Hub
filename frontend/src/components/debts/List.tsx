import { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import dayjsUtc from "dayjs/plugin/utc";
import { Icon } from "@iconify/react";

import { Debt } from "../../core/debt/domain/Debt";
import type { DebtRepository } from "../../core/debt/domain/DebtRepository";
import { DebtApiRepository } from "../../core/debt/infrastructure/DebtApiRepository";

import { Pagination } from "../../core/shared/domain/Pagination";
import { FormatNumber } from "../../core/shared/domain/FormatNumber";
import { Attach, Detach, Notify } from "../../core/shared/domain/Subject";
import { t } from "../../core/shared/infrastructure/i18n";

import { Pagination as CPagination } from "../shared/Pagination";

import "../../styles/debts/list.css";

dayjs.extend(dayjsUtc);

const repository: DebtRepository = new DebtApiRepository();

const statusLabel = (debt: Debt): string => {
    if (debt.status === "paid") return t("debt.statusPaid");
    if (debt.status === "overdue") return t("debt.statusOverdue");

    return t("debt.statusPending");
};

export const List = () => {
    const [search, setSearch] = useState<string>("");
    const [pagination, setPagination] = useState<Pagination<Debt>>(new Pagination());
    const [limit, setLimit] = useState<number>(15);
    const [page, setPage] = useState<number>(1);
    const requestId = useRef<number>(0);

    const showError = (err: any) => {
        if (err instanceof Error) {
            console.error(err);
            window.showAlert(err.message);
        }
    };
    const apply = (request: Promise<Pagination<Debt>>) => {
        const id = ++requestId.current;
        request.then((data: Pagination<Debt>) => {
            if (id === requestId.current) setPagination(data);
        }).catch(showError);
    };

    useEffect(() => {
        apply(repository.getList(15));
    }, []);

    useEffect(() => {
        const reload = () => {
            apply((search) ? 
                repository.getListSearch(search, limit, page) : 
                repository.getList(limit, page));
        };

        Attach("debt:changed", reload);
        return () => Detach("debt:changed", reload);
    }, [search, limit, page]);

    const clickSearch = () => {
        setPage(1);
        apply((search) ? 
            repository.getListSearch(search, limit, 1) : 
            repository.getList(limit, 1));
    };

    const clickUpdate = (debt: Debt) => {
        Notify("debt:update:request", debt);
    };
    const clickShow = (debt: Debt) => {
        Notify("debt:show", debt);
    };
    const clickDelete = (debt: Debt) => {
        window.showConfirm(t("debt.delete.confirm", { person: debt.person }), 
            t("debt.delete.title"), async () => {
            try {
                await repository.delete(debt.id!);

                Notify("debt:changed");
                window.showAlert(t("debt.delete.response"), t("debt.delete.title"));

                if (pagination.list.length === 1 && pagination.pages > 1 && page > 1) 
                    onChangePagination(limit, page - 1);
            } catch (err: any) {
                showError(err);
            }
        });
    };

    const onChangePagination = (limit: number, page: number) => {
        setLimit(limit);
        setPage(page);

        apply((search) ? 
            repository.getListSearch(search, limit, page) : 
            repository.getList(limit, page));
    };

    return <div className="debtsCard">
        <div className="debtsCard-header">
            <span>{t("debt.title")}</span>
            <button type="button" className="debtsAddButton" 
                onClick={() => Notify("debt:add:request")}>
                <Icon icon="material-symbols:add-2-rounded" />
                {t("debt.addButton")}
            </button>
        </div>
        <div className="debtsCard-content">
            <div className="debtsSearch">
                <input className="debtsSearch-input" type="text" placeholder={t("debt.search")}
                    value={search} onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && clickSearch()} />
                <button type="button" className="debtsSearch-button" onClick={clickSearch}>
                    {t("shared.search")}
                </button>
            </div>

            {(pagination.list.length === 0) && 
                <div className="debtsEmpty">{t("debt.noItems")}</div>}

            {(pagination.list.length > 0) && <>
                <table className="debtsTable">
                    <thead>
                        <tr>
                            <th>{t("debt.person")}</th>
                            <th style={{ textAlign: "right" }}>{t("debt.amount")}</th>
                            <th style={{ textAlign: "right" }}>{t("debt.pending")}</th>
                            <th>{t("debt.dueDate")}</th>
                            <th>{t("debt.status")}</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {pagination.list.map((debt: Debt) => <tr key={debt.id} className="debtsRow">
                            <td className="debtsPerson">
                                <span className="debtsPersonName">{debt.person}</span>
                                <span className={`debtsTypeBadge ${debt.type ? "receivable" : "payable"}`}>
                                    {debt.type ? t("debt.typeReceivable") : t("debt.typePayable")}
                                </span>
                            </td>
                            <td className="debtsAmount">
                                <span className="debtsCellLabel">{t("debt.amount")}</span>
                                <span className="debtsAmountCell">
                                    <span className="debtsAmountValue">{FormatNumber(debt.amount)}</span>
                                    {debt.paidAmount > 0 && <span className="debtsAmountPaid">
                                        {t("debt.paid")}: {FormatNumber(debt.paidAmount)}
                                    </span>}
                                </span>
                            </td>
                            <td className="debtsPending">
                                <span className="debtsCellLabel">{t("debt.pending")}</span>
                                <span className="debtsPendingValue">{FormatNumber(debt.pendingAmount)}</span>
                            </td>
                            <td className="debtsDueDate">
                                <span className="debtsCellLabel">{t("debt.dueDate")}</span>
                                <span>{debt.dueDate ? dayjs(debt.dueDate).format("DD/MM/YYYY") : "—"}</span>
                            </td>
                            <td className="debtsStatus">
                                <span className={`debtsStatusBadge ${debt.status}`}>{statusLabel(debt)}</span>
                            </td>
                            <td className="debtsActions-cell">
                                <div className="debtsActions">
                                    <button type="button" className="view" 
                                        aria-label={t("debt.view")} title={t("debt.view")}
                                        onClick={() => clickShow(debt)}>
                                        <Icon icon="ic:baseline-remove-red-eye" />
                                    </button>
                                    <button type="button" className="edit" 
                                        aria-label={t("shared.edit")} title={t("shared.edit")}
                                        onClick={() => clickUpdate(debt)}>
                                        <Icon icon="material-symbols:edit-rounded" />
                                    </button>
                                    <button type="button" className="btnDelete" 
                                        aria-label={t("shared.remove")} title={t("shared.remove")}
                                        onClick={() => clickDelete(debt)}>
                                        <Icon icon="solar:trash-bin-2-bold" />
                                    </button>
                                </div>
                            </td>
                        </tr>)}
                    </tbody>
                </table>
                <CPagination updatePages={pagination.pages} onChange={onChangePagination} />
            </>}
        </div>
    </div>;
};
