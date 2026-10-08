import dayjs from "dayjs";
import "dayjs/plugin/utc";

import type { Report } from "../domain/Report";
import type { ReportFilters } from "../domain/ReportFilters";
import type { ReportRepository } from "../domain/ReportRepository";
import { ControllerBase } from "../../shared/infrastructure/ControllerBase";
import { UserAuthenticate } from "../../user/infrastructure/UserAuthenticate";
import { MessageBuilder } from "../../shared/domain/MessageBuilder";
import { TranslatorRepository } from "../../shared/domain/TranslatorRepository";

export class ReportController extends ControllerBase {
    private readonly repository: ReportRepository;
    private readonly translator: TranslatorRepository;

    constructor(repository: ReportRepository, translator: TranslatorRepository) {
        super();
        this.repository = repository;
        this.translator = translator;
    }

    setup(): void {
        this.router.post("/generate", UserAuthenticate, async (req, res) => {
            if (!req.body.dateInit || 
                !req.body.dateEnd) {
                const message = new MessageBuilder();

                if (!req.body.dateInit) message.add(this.translator.translate("report.generate.dateInitRequired"));
                if (!req.body.dateEnd) message.add(this.translator.translate("report.generate.dateEndRequired"));

                return res.status(404).send(message.toString());
            }

            try {
                const idUser: string = req.user!.id;
                const dateInit: Date = dayjs.utc(req.body.dateInit).toDate();
                const dateEnd: Date = dayjs.utc(req.body.dateEnd).toDate();

                let filters: ReportFilters | undefined;
                if (req.body.filters !== undefined) {
                    const rawFilters = req.body.filters;
                    if (!rawFilters || typeof rawFilters !== "object" || Array.isArray(rawFilters))
                        return res.status(400).send(this.translator.translate("report.generate.filtersInvalid"));

                    const parseNames = (value: unknown): string[] | null => {
                        if (value === undefined || value === null) return null;
                        if (!Array.isArray(value) || value.some(name => typeof name !== "string"))
                            throw new Error(this.translator.translate("report.generate.filtersInvalid"));
                        return [...new Set(value.filter(name => name.trim().length > 0))];
                    };

                    filters = {
                        accounts: parseNames(rawFilters.accounts),
                        categories: parseNames(rawFilters.categories)
                    };
                }

                const report: Report = await this.repository.generate(idUser, dateInit, dateEnd, filters);
                res.send(report);
            } catch (err: any) {
                if (err instanceof Error) {
                    const status = err.message === this.translator.translate("report.generate.filtersInvalid") ? 400 : 404;
                    res.status(status).send(err.message);
                }
            }
        });
    }
}
