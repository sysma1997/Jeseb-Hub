import dayjs from "dayjs";
import dayjsUtc from "dayjs/plugin/utc";
import {
    Chart,
    Tooltip,
    Legend,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    BarController,
    BarElement,
    Filler
} from "chart.js";

import { Attach } from "../../core/shared/domain/Subject";
import { UserApiRepository } from "../../core/user/infrastructure/UserApiRepository";
import { initReportAccordions } from "./accordion";
import { initBlockVisibility } from "./blocks";
import { renderCharts, updateGraphicOptionsTheme } from "./charts";
import { exportReportCsv } from "./csv";
import { exportCsvButton, exportPdfButton, generateReport, reportPdf } from "./dom";
import { initFilters } from "./filters";
import { generateReportFlow } from "./generate";
import { preparePdfReport } from "./pdf";
import { initQuickRanges } from "./quickRange";
import { state } from "./state";

Chart.register(
    Tooltip,
    Legend,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    BarController,
    BarElement,
    Filler
);
dayjs.extend(dayjsUtc);

const reportUserNamePromise = new UserApiRepository().get()
    .then(user => user?.name.trim() ?? "")
    .catch(() => "");
let reportUserName = "";
void reportUserNamePromise.then(name => {
    reportUserName = name;
});

initReportAccordions();
initFilters();
initQuickRanges();
initBlockVisibility();

exportCsvButton.onclick = exportReportCsv;
exportPdfButton.onclick = async () => {
    if (!state.lastReport || state.reportIsDirty) return;
    reportUserName = await reportUserNamePromise;
    preparePdfReport(reportUserName);
    const images = Array.from(reportPdf.querySelectorAll<HTMLImageElement>("img"));
    await Promise.all(images.map(image => image.decode().catch(() => undefined)));
    window.print();
};

generateReport.onclick = generateReportFlow;

Attach("menu:theme", (newTheme: string) => {
    state.theme = newTheme;
    updateGraphicOptionsTheme();
    if (state.lastReport) renderCharts(state.lastReport);
});

window.addEventListener("beforeprint", () => {
    if (!document.body.classList.contains("report-pdf-active")) preparePdfReport(reportUserName);
});
window.addEventListener("afterprint", () => {
    document.body.classList.remove("report-pdf-active");
    reportPdf.setAttribute("aria-hidden", "true");
});
