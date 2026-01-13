import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

import { Account } from "../../core/account/domain/Account";
import type { AccountRepository } from "../../core/account/domain/AccountRepository";
import { AccountApiRepository } from "../../core/account/infrastructure/AccountApiRepository";

import { Pagination } from "../../core/shared/domain/Pagination";
import { FormatNumber } from "../../core/shared/domain/FormatNumber";
import { Attach, Detach } from "../../core/shared/domain/Subject";

import { Pagination as CPagination } from "../shared/Pagination";

import "../../styles/accounts/list.css";

const repository: AccountRepository = new AccountApiRepository();

export const List = () => {
    const [pagination, setPagination] = useState<Pagination<Account>>(new Pagination());
    const [limit, setLimit] = useState<number>(15);
    const [page, setPage] = useState<number>(1);

    useEffect(() => {
        repository.getList(15).then((pagination: Pagination<Account>) => {
            setPagination(pagination);
        });
    }, []);
    useEffect(() => {
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

    const clickUpdate = (account: Account) => {
        window.showPrompt("Enter the new name for this account", "Update account", (value: string) => {
            window.showConfirm(`Update name account with '${value}'?`, "Update account", async () => {
                account = account.setName(value);
                try {
                    await repository.update(account);
                    window.showAlert("Update account successfully.", "Update account", () => {
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
        window.showConfirm(`Delete this account '${name}'?`, "Delete account", async () => {
            try {
                await repository.delete(id);
                window.showAlert("Delete account successfully.", "Delete account", () => {
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

    return <div className="accountsList card">
        <header className="card-header">
            <h2 className="card-header-title">Accounts</h2>
        </header>
        <div className="card-content">
            <div className="content">
                {(pagination.list.length === 0) && <p className="noContent">There are not accounts to show.</p>}
                {(pagination.list.length > 0) && <>
                    <div className="table-container">
                        <table className="table is-fullwidth">
                            <thead>
                                <tr>
                                    <th className="fiftyPercent">Name</th>
                                    <th className="fiftyPercent">Balance</th>
                                    <th>Edit</th>
                                    <th>Remove</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagination.list.map((account: Account) => <tr key={account.id}>
                                    <th>{account.name}</th>
                                    <td>{FormatNumber(account.balance)}</td>
                                    <td><button className="button is-primary" 
                                        onClick={() => clickUpdate(account)}>
                                        <Icon icon="material-symbols:edit-rounded" />
                                    </button></td>
                                    <td><button className="button is-danger" 
                                        onClick={() => clickDelete(account.id!, account.name)}>
                                        <Icon icon="solar:trash-bin-2-bold" />
                                    </button></td>
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