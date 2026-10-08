import type { Report } from "./Report";
import type { ReportFilters } from "./ReportFilters";

export interface ReportRepository {
    generate(dateInit: Date, dateEnd: Date, filters?: ReportFilters): Promise<Report>;
}
