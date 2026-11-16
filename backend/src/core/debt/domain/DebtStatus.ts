import dayjs from "dayjs";
import dayjsUtc from "dayjs/plugin/utc";

dayjs.extend(dayjsUtc);

// El estado no se guarda: se deriva del saldo pendiente y de la fecha de vencimiento.
// Asi una deuda no puede quedar marcada como "pagada" mientras sus abonos digan lo
// contrario, ni al reves.
export type DebtStatus = "pending" | "overdue" | "paid";

export function isDebtOverdue(dueDate: Date | undefined, now: Date = new Date()): boolean {
    if (!dueDate) return false;

    // se comparan dias completos en UTC: una deuda que vence hoy no esta vencida
    // hasta que empieza el dia siguiente
    const due = dayjs.utc(dueDate).startOf("day");
    const today = dayjs.utc(now).startOf("day");

    return due.isBefore(today);
}

export function getDebtStatus(pendingAmount: number, dueDate: Date | undefined, 
    now: Date = new Date()): DebtStatus {
    if (pendingAmount <= 0) return "paid";

    return isDebtOverdue(dueDate, now) ? "overdue" : "pending";
}
