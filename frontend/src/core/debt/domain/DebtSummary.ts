// Resumen agregado de las deudas pendientes del usuario. Los importes llegan
// en decimales porque son parte del contrato de la API.
export interface DebtSummary {
    // saldo pendiente que otras personas le deben al usuario
    receivable: number;
    // saldo pendiente que el usuario debe a otras personas
    payable: number;
    // receivable - payable: positivo si al usuario le deben más de lo que debe
    net: number;

    overdueReceivable: number;
    overduePayable: number;

    totalCount: number;
    // pending no incluye las vencidas (overdue)
    pendingCount: number;
    overdueCount: number;
    paidCount: number;
}
