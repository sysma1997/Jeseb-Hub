import { useEffect, useState, type ChangeEvent } from "react";

import "../../styles/shared/pagination.css"

export const Pagination = (props: {
    updatePages: number, 
    onChange: (limit: number, page: number) => void
}) => {
    const { updatePages, onChange } = props;

    const [pages, setPages] = useState<number>(1);
    const [limit, setLimit] = useState<number>(15);
    const [page, setPage] = useState<number>(1);

    useEffect(() => {
        setPages(updatePages);
    }, [updatePages]);

    const onChangeLimit = (event: ChangeEvent<HTMLSelectElement>) => {
        const newLimit = parseInt(event.target.value, 10);
        setLimit(newLimit);
        onChange(newLimit, 1);
    };
    const onChangePage = (event: ChangeEvent<HTMLSelectElement>) => {
        const newPage = parseInt(event.target.value, 10);
        setPage(newPage);
        onChange(limit, newPage);
    };

    return <div className="cPagination">
        <div className="item">
            <p>Limit:</p>
            <div className="select">
                <select value={limit} onChange={onChangeLimit}>
                    {[15, 30, 50, 100].map((limit) => 
                        <option key={limit} value={limit}>{limit}</option>)}
                </select>
            </div>
        </div>
        <div className="item">
            <p>Page:</p>
            <div className="select">
                <select value={page} onChange={onChangePage}>
                    {Array.from({ length: pages }, (_, i) => i + 1).map((pageNumber) => (
                        <option key={pageNumber} value={pageNumber}>{pageNumber}</option>
                    ))}
                </select>
            </div>
        </div>
    </div>;
};