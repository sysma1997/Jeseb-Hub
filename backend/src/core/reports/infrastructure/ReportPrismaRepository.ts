import { PrismaClient } from "../../../generated/prisma/client";
import dayjs from "dayjs";

import type { Report, ReportItem } from "../domain/Report";
import type { ReportFilters } from "../domain/ReportFilters";
import type { ReportRepository } from "../domain/ReportRepository";
import { TranslatorRepository } from "../../shared/domain/TranslatorRepository";
import { Money } from "../../shared/domain/Money";

export class ReportPrismaRepository implements ReportRepository {
    private readonly prisma: PrismaClient;
    private readonly translator: TranslatorRepository;

    constructor(prisma: PrismaClient, translator: TranslatorRepository) {
        this.prisma = prisma;
        this.translator = translator;
    }

    async generate(idUser: string, dateInit: Date, dateEnd: Date, filters?: ReportFilters): Promise<Report> {
        const filterWhere = {
            ...(filters?.accounts !== undefined && filters.accounts !== null
                ? { account: { in: filters.accounts } }
                : {}),
            ...(filters?.categories !== undefined && filters.categories !== null
                ? { category: { in: filters.categories } }
                : {})
        };

        const [queryTotalIncome, queryTotalExpenses, transactions] = await Promise.all([
            this.prisma.transaction.aggregate({
                where: { idUser, type: true,  
                    date: {
                        gte: dateInit, 
                        lte: dateEnd
                    },
                    ...filterWhere,
                    isTransfer: false
                }, 
                _sum: { value: true }
            }), 
            this.prisma.transaction.aggregate({
                where: { idUser, type: false, 
                    date: {
                        gte: dateInit, 
                        lte: dateEnd
                    },
                    ...filterWhere,
                    isTransfer: false
                }, 
                _sum: { value: true }
            }), 
            this.prisma.transaction.findMany({
                where: { idUser, 
                    date: {
                        gte: dateInit, 
                        lte: dateEnd
                    },
                    ...filterWhere,
                    isTransfer: false
                }
            })
        ]);

        const totalIncome = Number(queryTotalIncome._sum.value);
        const totalExpenses = Number(queryTotalExpenses._sum.value);

        let balanceEvolution: Array<ReportItem> = [];
        let accounts: Array<ReportItem> = [];
        let categories: Array<ReportItem> = [];
        for (const transaction of transactions) {
            const month = dayjs.utc(transaction.date).format("YYYY-MM");
            const value = Money.fromDecimal(transaction.value);

            let balance: ReportItem | undefined = balanceEvolution.find(be => be.date === month);
            if (!balance) {
                balance = {
                    name: month, 
                    date: month, 
                    value: 0
                };
                balanceEvolution.push(balance);
            }
            if (transaction.type) balance.value += value;
            else balance.value -= value;
            balanceEvolution = balanceEvolution.map(be => {
                if (be.date === month) return balance;
                return be;
            });

            let account: ReportItem | undefined = accounts.find(as => as.name === transaction.account && 
                as.date === month);
            if (!account) {
                account = {
                    name: transaction.account, 
                    date: month, 
                    value: 0
                };
                accounts.push(account);
            }
            if (transaction.type) account.value += value;
            else account.value -= value;
            accounts = accounts.map(as => {
                if (as.name === transaction.account && as.date === month) return account;
                return as;
            });

            if (transaction.category && !transaction.type) {
                let category: ReportItem | undefined = categories.find(cs => cs.name === transaction.category && 
                    cs.date === month);
                if (!category) {
                    category = {
                        name: transaction.category, 
                        date: month, 
                        value: 0
                    };
                    categories.push(category);
                }
                category.value += value;
                categories = categories.map(cs => {
                    if (cs.name === transaction.category && cs.date === month) return category;
                    return cs;
                });
            }
        }

        balanceEvolution = balanceEvolution.map(be => {
            be.value = Money.fromCents(be.value);
            return be;
        });
        accounts = accounts.map(as => {
            as.value = Money.fromCents(as.value);
            return as;
        });
        categories = categories.map(cs => {
            cs.value = Money.fromCents(cs.value);
            return cs;
        });
        balanceEvolution.sort((be1, be2) => be1.date.localeCompare(be2.date, undefined, { sensitivity: 'base' }));
        accounts.sort((as1, as2) => as1.name.localeCompare(as2.name, undefined, { sensitivity: 'base' }));
        categories.sort((cs1, cs2) => cs1.name.localeCompare(cs2.name, undefined, { sensitivity: 'base' }));

        return {
            totalIncome, 
            totalExpenses, 

            balanceEvolution, 
            accounts, 
            categories
        };
    }
}
