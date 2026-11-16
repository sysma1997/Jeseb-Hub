import { useEffect, useRef, useState } from "react";

import type { DebtRepository } from "../../core/debt/domain/DebtRepository";
import type { DebtSummary } from "../../core/debt/domain/DebtSummary";
import { DebtApiRepository } from "../../core/debt/infrastructure/DebtApiRepository";

import { FormatNumber } from "../../core/shared/domain/FormatNumber";
import { Attach, Detach } from "../../core/shared/domain/Subject";
import { t } from "../../core/shared/infrastructure/i18n";

import "../../styles/debts/summary.css";

const repository: DebtRepository = new DebtApiRepository();

export const Summary = () => {
    const [summary, setSummary] = useState<DebtSummary | null>(null);
    const requestId = useRef<number>(0);

    useEffect(() => {
        let active = true;

        const load = () => {
            const id = ++requestId.current;
            repository.getSummary().then((data: DebtSummary) => {
                if (active && id === requestId.current) setSummary(data);
            }).catch((err: any) => {
                if (err instanceof Error) {
                    console.error(err);
                    window.showAlert(err.message);
                }
            });
        };

        load();
        Attach("debt:changed", load);
        return () => {
            active = false;
            Detach("debt:changed", load);
        };
    }, []);

    const netClass = (summary && summary.net < 0) ? "negative" : "positive";

    return <div className="debtsSummary" aria-live="polite">
        <div className="debtSummaryCard">
            <span className="debtSummaryLabel">{t("debt.summary.receivable")}</span>
            <span className="debtSummaryValue receivable">
                {summary ? FormatNumber(summary.receivable) : "…"}
            </span>
            {summary && summary.overdueReceivable > 0 && 
                <span className="debtSummaryOverdue">
                    {t("debt.summary.overdue", { amount: FormatNumber(summary.overdueReceivable) })}
                </span>}
        </div>

        <div className="debtSummaryCard">
            <span className="debtSummaryLabel">{t("debt.summary.payable")}</span>
            <span className="debtSummaryValue payable">
                {summary ? FormatNumber(summary.payable) : "…"}
            </span>
            {summary && summary.overduePayable > 0 && 
                <span className="debtSummaryOverdue">
                    {t("debt.summary.overdue", { amount: FormatNumber(summary.overduePayable) })}
                </span>}
        </div>

        <div className="debtSummaryCard">
            <span className="debtSummaryLabel">{t("debt.summary.net")}</span>
            <span className={`debtSummaryValue net ${netClass}`}>
                {summary ? FormatNumber(summary.net) : "…"}
            </span>
            {summary && <span className="debtSummaryHint">{t(`debt.summary.net${netClass === "negative" ? "Negative" : "Positive"}`)}</span>}
        </div>

        <div className="debtSummaryCard">
            <span className="debtSummaryLabel">{t("debt.summary.status")}</span>
            <div className="debtSummaryCounts">
                <span className="debtSummaryCount pending">
                    <b>{summary ? summary.pendingCount : "…"}</b>
                    {t("debt.summary.pendingCount")}
                </span>
                <span className="debtSummaryCount overdue">
                    <b>{summary ? summary.overdueCount : "…"}</b>
                    {t("debt.summary.overdueCount")}
                </span>
                <span className="debtSummaryCount paid">
                    <b>{summary ? summary.paidCount : "…"}</b>
                    {t("debt.summary.paidCount")}
                </span>
            </div>
            {summary && <span className="debtSummaryHint">
                {t("debt.summary.totalCount", { count: summary.totalCount })}
            </span>}
        </div>
    </div>;
};
