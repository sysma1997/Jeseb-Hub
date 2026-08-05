import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { t } from "../../core/shared/infrastructure/i18n";

import { Category } from "../../core/category/domain/Category";
import type { CategoryRepository } from "../../core/category/domain/CategoryRepository";
import { CategoryApiRepository } from "../../core/category/infrastructure/CategoryApiRepository";

import { Pagination } from "../../core/shared/domain/Pagination";
import { Attach, Detach } from "../../core/shared/domain/Subject";

import { Pagination as CPagination } from "../shared/Pagination";

import "../../styles/categories/list.css";

const repository: CategoryRepository = new CategoryApiRepository();

export const List = () => {
    const [search, setSearch] = useState<string>("");

    const [pagination, setPagination] = useState<Pagination<Category>>(new Pagination<Category>());
    const [limit, setLimit] = useState<number>(15);
    const [page, setPage] = useState<number>(1);

    useEffect(() => {
        repository.getList(15).then((pagination: Pagination<Category>) => {
            setPagination(pagination);
        });
    }, []);
    useEffect(() => {
        const add = (category: Category) => {
            let cat: Category[] = [];
            if (pagination.list.length > 0) cat = [...pagination.list];

            cat.push(category);
            _sortCategories(cat);
            const newPagination = new Pagination<Category>();
            newPagination.list = cat;
            newPagination.pages = pagination.pages;
            setPagination(newPagination);
        };
        
        Attach("category:add", add);
        return () => {
            Detach("category:add", add);
        };
    }, [pagination.list]);

    const _sortCategories = (categories: Category[]) => {
        categories = categories.sort((ca1, ca2) => 
            ca1.name.localeCompare(ca2.name));
    };

    const clickSearch = () => {
        if (search === "") {
            repository.getList(limit, page).then((pagination: Pagination<Category>) => setPagination(pagination));
            return;
        }

        repository.getListSearch(search, limit, page).then((pagination: Pagination<Category>) => {
            setPagination(pagination);
        });
    };
    const clickUpdate = (category: Category) => {
        window.showPrompt(t("category.update.description"), t("category.update.title"), (value: string) => {
            window.showConfirm(t("category.update.confirm", { name: value }), t("category.update.title"), async () => {
                category = category.setName(value);
                try {
                    await repository.update(category);
                    window.showAlert(t("category.update.response"), t("category.update.title"), () => {
                        let cat: Category[] = [...pagination.list!];

                        cat = cat.map(ca => {
                            if (ca.id! === category.id!) 
                                return category;
                            return ca;
                        });
                        _sortCategories(cat);
                        const newPagination = new Pagination<Category>();
                        newPagination.list = cat;
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
        window.showConfirm(t("category.delete.confirm", { name }), t("category.delete.title"), async () => {
            try {
                await repository.delete(id);
                window.showAlert(t("category.delete.response"), t("category.delete.title"), () => {
                    let cat: Category[] = [...pagination.list!];

                    cat = cat.filter(ac => ac.id! !== id);
                    if (cat.length === 0 && pagination.pages > 1 && page > 1) {
                        onChangePagination(limit, page - 1);
                        return;
                    }

                    const newPagination = new Pagination<Category>();
                    newPagination.list = cat;
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
        repository.getList(limit, page).then((pagination: Pagination<Category>) => {
            setPagination(pagination);
        });
    };

    return <div className="categoriesCard">
        <div className="categoriesCard-header">{t("category.title")}</div>
        <div className="categoriesCard-content">
            <div className="categoriesSearch">
                <input className="categoriesSearch-input" type="text" placeholder={t("category.search")}
                    value={search} onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key == "Enter" && clickSearch()} />
                <button className="categoriesSearch-button" onClick={clickSearch}>
                    {t("shared.search")}
                </button>
            </div>
            {(pagination.list.length === 0) && <div className="categoriesEmpty">{t("category.noItems")}</div>}
            {(pagination.list.length > 0) && <>
                <table className="categoriesTable">
                    <thead>
                        <tr>
                            <th style={{ width: "100%" }}>{t("shared.name")}</th>
                            <th />
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {pagination.list.map((category: Category) => <tr key={category.id}>
                            <td className="categoriesName">{category.name}</td>
                            <td />
                            <td>
                                <div className="categoriesActions">
                                    <button className="edit" onClick={() => clickUpdate(category)}>
                                        <Icon icon="material-symbols:edit-rounded" />
                                    </button>
                                    <button className="btnDelete" onClick={() => clickDelete(category.id!, category.name)}>
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