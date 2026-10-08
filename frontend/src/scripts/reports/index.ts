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

initReportAccordions();
initFilters();
initQuickRanges();
initBlockVisibility();

exportCsvButton.onclick = exportReportCsv;
exportPdfButton.onclick = async () => {
    if (!state.lastReport || state.reportIsDirty) return;
    preparePdfReport();
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
    if (!document.body.classList.contains("report-pdf-active")) preparePdfReport();
});
window.addEventListener("afterprint", () => {
    document.body.classList.remove("report-pdf-active");
    reportPdf.setAttribute("aria-hidden", "true");
});
