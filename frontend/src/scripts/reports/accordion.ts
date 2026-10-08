import { t } from "../../core/shared/infrastructure/i18n";
import { resizeChartForBox } from "./charts";

export interface AccordionControl {
    box: HTMLElement;
    content: HTMLDivElement;
    button: HTMLButtonElement;
    icon: HTMLSpanElement;
}

export const accordionControls: AccordionControl[] = [];

export const setReportBoxExpanded = (
    control: AccordionControl,
    expanded: boolean,
    resizeChart = true
): void => {
    control.content.hidden = !expanded;
    control.button.setAttribute("aria-expanded", String(expanded));
    control.button.setAttribute("aria-label", t(expanded ? "reports.collapse.minimize" : "reports.collapse.expand"));
    control.icon.textContent = expanded ? "−" : "+";
    control.box.dataset.collapsed = String(!expanded);

    if (expanded && resizeChart) {
        window.requestAnimationFrame(() => resizeChartForBox(control.box.id));
    }
};

export const initReportAccordions = (): void => {
    document.querySelectorAll<HTMLElement>(".container .box:not([data-no-collapse])").forEach((box, index) => {
        const title = box.querySelector<HTMLElement>(":scope > .title");
        if (!title) return;

        const content = document.createElement("div");
        content.className = "box-collapse-content";
        content.id = `reportBoxContent${index}`;
        for (const child of Array.from(box.children)) {
            if (child !== title) content.append(child);
        }

        const header = document.createElement("div");
        header.className = "box-heading";
        const button = document.createElement("button");
        button.type = "button";
        button.className = "box-collapse-toggle";
        button.setAttribute("aria-controls", content.id);
        const icon = document.createElement("span");
        icon.setAttribute("aria-hidden", "true");
        button.append(icon);
        header.append(title, button);
        box.replaceChildren(header, content);

        const control: AccordionControl = { box, content, button, icon };
        accordionControls.push(control);
        setReportBoxExpanded(control, true, false);
        button.addEventListener("click", () => {
            setReportBoxExpanded(control, content.hidden);
        });
    });
};
