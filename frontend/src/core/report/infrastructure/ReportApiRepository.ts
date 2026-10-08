import dayjs from "dayjs";
import dayjsUtc from "dayjs/plugin/utc";

import type { Report } from "../domain/Report";
import type { ReportFilters } from "../domain/ReportFilters";
import type { ReportRepository } from "../domain/ReportRepository";
import { Api, ApiMethods } from "../../shared/infrastructure/Api";
import type { ApiResponse } from "../../shared/infrastructure/Api";

dayjs.extend(dayjsUtc);

export class ReportApiRepository extends Api implements ReportRepository {
    async generate(dateInit: Date, dateEnd: Date, filters?: ReportFilters): Promise<Report> {
        const params: any = { 
            dateInit: dayjs.utc(dateInit).toISOString(), 
            dateEnd: dayjs.utc(dateEnd).toISOString(),
            filters
        };
        const response = await this.fetch(ApiMethods.POST, "report/generate", params);
        if (response.status >= 400) 
            throw new Error(response.data);

        const report: Report = JSON.parse(response.data);
        return report;
    }
}
