import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

import { Account } from "../../core/account/domain/Account";
import type { AccountRepository } from "../../core/account/domain/AccountRepository";
import { AccountApiRepository } from "../../core/account/infrastructure/AccountApiRepository";

import { Pagination } from "../../core/shared/domain/Pagination";
import { FormatNumber } from "../../core/shared/domain/FormatNumber";
import { Attach, Detach } from "../../core/shared/domain/Subject";
import { t } from "../../core/shared/infrastructure/i18n";

import { Pagination as CPagination } from "../shared/Pagination";

import "../../styles/accounts/list.css";

const repository: AccountRepository = new AccountApiRepository();

export const List = () => {
    const [search, setSearch] = useState<string>("");
    const [total, setTotal] = useState<number>(0);

    const [pagination, setPagination] = useState<Pagination<Account>>(new Pagination());
    const [limit, setLimit] = useState<number>(15);
    const [page, setPage] = useState<number>(1);

    useEffect(() => {
        repository.getList(15).then((pagination: Pagination<Account>) => {
            setPagination(pagination);
        });
    }, []);
    useEffect(() => {
        let total: number = 0;
        pagination.list.forEach(account => total += account.balance);
        setTotal(total);

        const add = (account: Account) => {
            let acc: Account[] = [];
            if (pagination.list.length > 0) acc = [...pagination.list];

            acc.push(account);
            _sortAccounts(acc);
            const newPagination = new Pagination<Account>();
            newPagination.list = acc;
            newPagination.pages = pagination.pages;
            setPagination(newPagination);
        };
        
        Attach("account:add", add);
        return () => {
            Detach("account:add", add);
        };
    }, [pagination.list]);

    const _sortAccounts = (accounts: Account[]) => {
        accounts = accounts.sort((ac1, ac2) => 
            ac1.name.localeCompare(ac2.name));
    };

    const clickSearch = () => {
            if (search === "") {
                repository.getList(limit, page).then((pagination: Pagination<Account>) => setPagination(pagination));
                return;
            }
    
            repository.getListSearch(search, limit, page).then((pagination: Pagination<Account>) => {
                setPagination(pagination);
            });
        };
    const clickUpdate = (account: Account) => {
        window.showPrompt(t("account.update.description"), t("account.update.title"), (value: string) => {
            window.showConfirm(t("account.update.confirm", { name: value }), t("account.update.title"), async () => {
                account = account.setName(value);
                try {
                    await repository.update(account);
                    window.showAlert(t("account.update.response"), t("account.update.title"), () => {
                        let acc: Account[] = [...pagination.list!];

                        acc = acc.map(ac => {
                            if (ac.id! === account.id!) 
                                return account;
                            return ac;
                        });
                        _sortAccounts(acc);
                        const newPagination = new Pagination<Account>();
                        newPagination.list = acc;
                        newPagination.pages = pagination.pages;
                        setPagination(newPagination);
                    });
                } catch (err: any) {
                    if (err instanceof Error) {
                        console.error(err);
                        window.showAlert(err.message);
                    }
                }
            });
        });
    };
    const clickDelete = (id: string, name: string) => {
        window.showConfirm(t("account.delete.confirm", { name }), t("account.delete.title"), async () => {
            try {
                await repository.delete(id);
                window.showAlert(t("account.delete.response"), t("account.delete.title"), () => {
                    let acc: Account[] = [...pagination.list!];

                    acc = acc.filter(ac => ac.id! !== id);
                    if (acc.length === 0 && pagination.pages > 1 && page > 1) {
                        onChangePagination(limit, page - 1);
                        return;
                    }
                    
                    const newPagination = new Pagination<Account>();
                    newPagination.list = acc;
                    newPagination.pages = pagination.pages;
                    setPagination(newPagination);
                });
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
        repository.getList(limit, page).then((pagination: Pagination<Account>) => {
            setPagination(pagination);
        });
    };

    return <div className="accountsCard">
        <div className="accountsCard-header">{t("account.title")}</div>
        <div className="accountsCard-content">
            <div className="accountsSearch">
                <input className="accountsSearch-input" type="text" placeholder={t("account.search")}
                    value={search} onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key == "Enter" && clickSearch()} />
                <button className="accountsSearch-button" onClick={clickSearch}>
                    {t("shared.search")}
                </button>
            </div>
            {(pagination.list.length === 0) && <div className="accountsEmpty">{t("account.noItems")}</div>}
            {(pagination.list.length > 0) && <>
                <table className="accountsTable">
                    <thead>
                        <tr>
                            <th>{t("shared.name")}</th>
                            <th>{t("shared.balance")}</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {pagination.list.map((account: Account) => <tr key={account.id} className="accountsRow">
                            <td className="accountsName">{account.name}</td>
                            <td className="accountsBalance accountsRow-balance">
                                <span className="accountsRow-balance-label">{t("shared.balance")}</span>
                                <span className="accountsRow-balance-value">{FormatNumber(account.balance)}</span>
                            </td>
                            <td className="accountsActions-cell">
                                <div className="accountsActions">
                                    <button className="edit" onClick={() => clickUpdate(account)}>
                                        <Icon icon="material-symbols:edit-rounded" />
                                    </button>
                                    <button className="btnDelete" onClick={() => clickDelete(account.id!, account.name)}>
                                        <Icon icon="solar:trash-bin-2-bold" />
                                    </button>
                                </div>
                            </td>
                        </tr>)}
                        <tr className="accountsTotal">
                            <th>{t("account.total")}</th>
                            <td className="accountsTotal-value">{FormatNumber(total)}</td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
                <CPagination updatePages={pagination.pages} onChange={onChangePagination} />
            </>}
        </div>
    </div>;
};