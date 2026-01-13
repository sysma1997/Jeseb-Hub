import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

import { Category } from "../../core/category/domain/Category";
import type { CategoryRepository } from "../../core/category/domain/CategoryRepository";
import { CategoryApiRepository } from "../../core/category/infrastructure/CategoryApiRepository";

import { Pagination } from "../../core/shared/domain/Pagination";
import { Attach, Detach } from "../../core/shared/domain/Subject";

import { Pagination as CPagination } from "../shared/Pagination";

import "../../styles/categories/list.css";

const repository: CategoryRepository = new CategoryApiRepository();

export const List = () => {
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

    const clickUpdate = (category: Category) => {
        window.showPrompt("Enter the new name for this category", "Update category", (value: string) => {
            window.showConfirm(`Update name category with '${value}'?`, "Update category", async () => {
                category = category.setName(value);
                try {
                    await repository.update(category);
                    window.showAlert("Update category successfully.", "Update category", () => {
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
        window.showConfirm(`Delete this category '${name}'?`, "Delete category", async () => {
            try {
                await repository.delete(id);
                window.showAlert("Delete category successfully.", "Delete category", () => {
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

    return <div className="categoriesList card">
        <header className="card-header">
            <h2 className="card-header-title">Categories</h2>
        </header>
        <div className="card-content">
            <div className="content">
                {(pagination.list.length === 0) && <p className="noContent">There are not categories to show.</p>}
                {(pagination.list.length > 0) && <>
                    <div className="table-container">
                        <table className="table is-fullwidth">
                            <thead>
                                <tr>
                                    <th className="oneHundredPercent">Name</th>
                                    <th>Edit</th>
                                    <th>Remove</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagination.list.map((category: Category) => <tr key={category.id}>
                                    <th>{category.name}</th>
                                    <td><button className="button is-primary" 
                                        onClick={() => clickUpdate(category)}>
                                        <Icon icon="material-symbols:edit-rounded" />
                                    </button></td>
                                    <td><button className="button is-danger" 
                                        onClick={() => clickDelete(category.id!, category.name)}>
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