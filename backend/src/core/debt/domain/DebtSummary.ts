// Resumen agregado de las deudas pendientes del usuario. Los importes se
// devuelven en decimales porque son parte del contrato de la API; el calculo
// interno se hace en centavos enteros.
export interface DebtSummary {
    // saldo pendiente que otras personas le deben al usuario
    receivable: number;
    // saldo pendiente que el usuario debe a otras personas
    payable: number;
    // receivable - payable: positivo si al usuario le deben mas de lo que debe
    net: number;

    overdueReceivable: number;
    overduePayable: number;

    totalCount: number;
    // conteos por estado: pending no incluye las vencidas (overdue)
    pendingCount: number;
    overdueCount: number;
    paidCount: number;
}
