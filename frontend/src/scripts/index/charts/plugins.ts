import { FormatNumber } from "../../../core/shared/domain/FormatNumber";
import { t } from "../../../core/shared/infrastructure/i18n";

export const createDoughnutCenterText = (accentColor: string) => ({
    id: 'doughnutCenterText',
    afterDraw(chart: any) {
        const { ctx } = chart;
        const meta = chart.getDatasetMeta(0);
        if (!meta || !meta.data || meta.data.length === 0) return;
        const arc = meta.data[0];
        const radius = arc.outerRadius ?? 100;
        const innerRadius = arc.innerRadius ?? 0;
        const centerX = arc.x;
        const centerY = arc.y;
        const donutBand = radius - innerRadius;
        const maxFontSize = Math.max(8, Math.min(donutBand * 0.28, 22));
        const labelFontSize = Math.max(8, maxFontSize * 0.65);
        const dataset = chart.data.datasets[0];
        const visibleTotal = dataset.data.reduce((sum: number, val: number, i: number) => {
            return sum + (chart.getDataVisibility(i) ? val : 0);
        }, 0);
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${labelFontSize}px sans-serif`;
        ctx.fillStyle = accentColor;
        ctx.globalAlpha = 0.6;
        ctx.fillText(t('index.graphics.total'), centerX, centerY - (maxFontSize * 0.45));
        ctx.globalAlpha = 1;
        ctx.font = `bold ${maxFontSize}px sans-serif`;
        ctx.fillStyle = accentColor;
        ctx.fillText(FormatNumber(visibleTotal), centerX, centerY + (maxFontSize * 0.55));
        ctx.restore();
    }
});

export const lineChartTotals = {
    id: 'lineChartTotals',
    afterDraw(chart: any) {
        const { ctx, chartArea } = chart;
        if (!chartArea) return;
        const textColor = (chart.options.plugins as any)?.lineChartTotals?.textColor ?? '#999';
        const datasets = chart.data.datasets;
        const totals = datasets.map((ds: any, i: number) => {
            const meta = chart.getDatasetMeta(i);
            if (meta.hidden) return null;
            return ds.data.reduce((sum: number, val: number) => sum + val, 0);
        });
        const labels = [t('index.graphics.totalIncome'), t('index.graphics.totalExpenses'), t('index.graphics.totalBalance')];
        const colors = datasets.map((d: any) => d.borderColor);
        const w = chartArea.right - chartArea.left;
        const fontSize = w < 250 ? 9 : w < 400 ? 10 : 11;
        ctx.save();
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        let x = chartArea.left;
        const y = chartArea.top - 2;
        for (let i = 0; i < labels.length; i++) {
            if (totals[i] === null) continue;
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.fillStyle = textColor;
            ctx.fillText(labels[i] + ': ', x, y);
            x += ctx.measureText(labels[i] + ': ').width;
            ctx.fillStyle = colors[i] as string;
            ctx.fillText(FormatNumber(totals[i] as number), x, y);
            x += ctx.measureText(FormatNumber(totals[i] as number)).width + (fontSize < 11 ? 8 : 16);
        }
        ctx.restore();
    }
};
