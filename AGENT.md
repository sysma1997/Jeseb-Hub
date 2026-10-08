# AGENT.md - Módulo de Reportes (Reports)

## Objetivo del módulo
El módulo de Reportes tiene como finalidad proporcionar información financiera consolidada, auditable y visual para ayudar en la toma de decisiones. Se busca que, además de ser visualmente atractivo, sea **responsable y verificable**: lo que se muestra en gráficos debe poder comprobarse mediante tablas/exportaciones (CSV/PDF).

Razón para añadirlo a Jeseb:
- Brinda visibilidad global de ingresos, egresos, evolución del balance, cuentas y categorías en un periodo determinado.
- Permite auditar y validar datos sin tener que revisar transacciones una a una.
- Complementa el resto de módulos (Cuentas, Transacciones, Transferencias) con análisis agregado.
- Útil para generar reportes legibles para revisión/archivo (exportables).
- Sigue la filosofía del proyecto: arquitectura hexagonal, datos exactos (céntimos) y trazabilidad.

## Tecnologías, herramientas y librerías

### Backend
- Node.js + TypeScript
- Express.js (API REST)
- Arquitectura Hexagonal (Domain, Application, Infrastructure)
- Prisma ORM + PostgreSQL
- dayjs (manejo de fechas, UTC)
- Money (dominio) para conversiones decimales↔céntimos

### Frontend
- Astro + React (Islands Architecture)
- TypeScript
- Chart.js v4 (gráficos: line, bar, pie según necesidad)
- dayjs + dayjsUtc
- CSS/Bulma (estilos existentes)
- i18n (traducciones ES/EN)

## Backend - Implementación actual

### Dominio
**`backend/src/core/report/domain/Report.ts`**
```ts
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
```

**`backend/src/core/report/domain/ReportRepository.ts`**
```ts
import type { Report } from "./Report";

export interface ReportRepository {
    generate(dateInit: Date, dateEnd: Date): Promise<Report>;
}
```

### Infraestructura - Repositorio Prisma
**`backend/src/core/report/infrastructure/ReportPrismaRepository.ts`**

Responsabilidades:
- Calcula totales: ingresos (`type = true`, no transferencias) y egresos (`type = false`, no transferencias). Usa `Money.fromDecimal(_sum.value)` para obtener céntimos exactos.
- `balanceEvolution`: agrupa por mes (`date_trunc('month', date)`) ordenado ASC. Acumula saldo (running balance) `acumulatedBalance += (income - expenses)`. Devuelve `value` en céntimos (se mantiene coherente con dominio Money).
- `accounts`: balance neto por cuenta en el rango (ingresos - egresos por account). Agrupado por `account`, suma en céntimos.
- `categories`: balance neto por categoría (donde `category` no es null, no transferencias). Agrupado por `category`, suma en céntimos.
- Fechas tratadas en UTC (consistente con resto del sistema). Agrupaciones por mes con `date_trunc`.

Notas: todos los importes cruzan a céntimos mediante `Money.fromDecimal(...)`. El DTO del reporte expone valores numéricos (backend devuelve JSON); el frontend interpreta según convención.

### Infraestructura - Controller
**`backend/src/core/report/infrastructure/ReportController.ts`**
```ts
this.router.post("/generate", UserAuthenticate, async (req, res) => {
    try {
        const idUser: string = req.user!.id;
        const dateInit: Date = new Date(req.body.dateInit);
        const dateEnd: Date = new Date(req.body.dateEnd);

        const report: Report = await this.service.generate(idUser, dateInit, dateEnd);
        res.json(report);
    } catch (err: any) {
        if (err instanceof Error) res.status(400).send(err.message);
    }
});
```
(Nota: el servicio/repo recibe `idUser` para filtrar por usuario).

### Registro en app
**`backend/src/index.ts`**: inyección de `ReportRepository`, `ReportService`, `ReportController` y montaje de rutas `/api/report`.

## Frontend - Implementación actual

### Dominio (tipado compartido)
**`frontend/src/core/report/domain/Report.ts`** (mismo contrato):
```ts
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
```

### Infraestructura API
**`frontend/src/core/report/infrastructure/ReportApiRepository.ts`**
```ts
async generate(dateInit: Date, dateEnd: Date): Promise<Report> {
    const response: ApiResponse = await this.fetch(ApiMethods.POST, "report/generate", {
        dateInit: dateInit.toISOString(),
        dateEnd: dateEnd.toISOString()
    });
    return response.data as Report;
}
```

### UI - Página de reportes
**`frontend/src/pages/[lang]/reports.astro`**
Estructura:
- Filtros: Año, Mes desde, Mes hasta (Dropdowns)
- Botón "Generar reporte"
- Totales: Ingresos, Egresos, Diferencia (`lblTotalIncomes`, `lblTotalExpenses`, `lblDiff`)
- Gráficos: Balance Evolution, Accounts, Categories (canvas + wrappers)
- Traducciones: `reports.graphics.balanceEvolution`, `reports.graphics.accounts`, `reports.graphics.categories`

### Lógica JS - Gráficos
**`frontend/src/scripts/reports.ts`**

Configuración común:
- `Chart.js` registrado (LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend)
- Colores por dataset (10 colores predefinidos)
- `graphicGetOptions`: responsive, interaction (index), escalas con formato monetario ($K/$M + formateo local), leyenda inferior, tooltip con `FormatNumber(context.parsed.y)`, tema claro/oscuro dinámico (reacciona a `menu:theme`)

Funciones:
1. **`createGraphicLineBalanceEvolution(canvas, items: ReportItem[])`**
   - Un único dataset "Total"
   - `labels = items.map(i => i.name)` (el backend devuelve nombre del mes/agrupación)
   - `data = items.map(i => i.value)` (valores acumulados en céntimos)
   - Línea con relleno, tensión 0.4

2. **`createGraphicLineAcCa(canvas, items: ReportItem[])`** (usado para Accounts y Categories)
   - Agrupa correctamente por **cuenta/categoría** (dataset por `name`), y usa **fechas** como labels del eje X.
   - Extrae labels únicos ordenados (`date`) y cuentas/categorías únicas.
   - Para cada dataset: mapea valor por (cuenta/categoría, fecha). Si no existe, pone 0.
   - Asigna color secuencial por dataset. Tipo `line` con relleno.

Flujo al generar:
- Validación de rango (año/meses + `dateInit <= dateEnd`)
- Convierte a fechas inicio/fin de mes (UTC)
- Llama `repository.generate(vdi, vde)`
- Muestra totales: `totalIncome`, `totalExpenses`. Diferencia: `(Money.fromDecimal(report.totalIncome) - Money.fromDecimal(report.totalExpenses))` convertido con `Money.fromCents(Money.fromDecimal(...))` (coherente con céntimos). Se muestra formateado con `$ + FormatNumber`.
- Renderiza gráficos según datos (oculta bloques vacíos)
- Actualiza `lastReport` y re-renderiza al cambiar tema

## Estado actual conocido
- BalanceEvolution: OK
- Accounts: corregido (datasets por nombre de cuenta, labels por fecha)
- Categories: usa misma función `createGraphicLineAcCa`, habilitado cuando hay datos

## Mejoras propuestas (para reporte responsable/auditable)

### 1. Transparencia y auditabilidad
- **Tablas de detalle** por gráfico (Fecha | Nombre | Importe). Debajo de cada canvas, mostrar tabla espejo de los datos mostrados (mismos `ReportItem`).
- **Totales por tabla** (suma de columna valor).
- **Exportar CSV**: por bloques (BalanceEvolution, Accounts, Categories) o combinado. Incluir cabeceras y rango de fechas.
- **Exportar PDF**: reporte completo (título, rango de fechas, totales, gráficos, tablas). Diseño limpio para impresión/archivo.

### 2. Contexto y análisis
- **Rango visible**: mostrar periodo (`Mes/Año desde – hasta`) arriba de totales (no solo dropdowns).
- **Comparación periodo anterior**: Ingresos/Gastos/Diferencia vs periodo anterior + variación % y absoluta.
- **Porcentajes en categorías**: mostrar % sobre total de gastos (o ingresos) además del importe.

### 3. UX/Robustez
- **Loading state**: deshabilitar botón mientras genera, spinner opcional.
- **Mensajes vacíos por bloque**: en lugar de ocultar todo, mostrar "Sin datos para este periodo" por gráfico.
- **Print CSS**: ocultar filtros/botones al imprimir, expandir gráficos/tablas.
- **Tipo gráfico categorías**: considerar barras/apiladas o dona para distribución (mejor legibilidad que líneas para totales por categoría en periodo).

## Notas de diseño
- Importes siempre en céntimos en backend/agregados, mostrados formateados en frontend.
- Fechas UTC coherentes (agrupaciones por mes con `date_trunc`).
- Arquitectura hexagonal respetada (dominio aislado, puertos/adaptadores).
- i18n completo para nuevos textos (ES/EN).

