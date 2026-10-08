export interface ReportFilters {
    /** Null includes every account; an empty array intentionally matches none. */
    accounts: string[] | null;
    /** Null includes every category; an empty array intentionally matches none. */
    categories: string[] | null;
}
