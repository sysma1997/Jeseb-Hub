export interface Report {
    totalIncome: number;
    totalExpenses: number;
    
    balanceEvolution: Array<ReportItem>;
    accounts: Array<ReportItem>;
    categories: Array<ReportItem>;
}

export interface ReportItem {
    name: string;
    date: string;
    value: number;
}