export interface TransactionFilter {
    dateFrom?: Date | undefined;
    dateTo?: Date | undefined;
    type?: boolean | undefined;
    account?: string | undefined;
    category?: string | undefined;
}