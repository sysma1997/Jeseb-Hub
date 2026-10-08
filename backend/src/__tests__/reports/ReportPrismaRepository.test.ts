import { describe, it, expect, beforeEach } from "@jest/globals";
import dayjs from "dayjs";
import dayjsUtc from "dayjs/plugin/utc";

import { ReportPrismaRepository } from "../../core/reports/infrastructure/ReportPrismaRepository";
import { prismaMock } from "../shared/prisma/Singleton";
import { mockTranslator } from "../shared/TranslatorMock";

dayjs.extend(dayjsUtc);

describe("Report Prisma Repository filters", () => {
    let repository: ReportPrismaRepository;

    beforeEach(() => {
        repository = new ReportPrismaRepository(prismaMock, mockTranslator);
        prismaMock.transaction.aggregate.mockResolvedValue({ _sum: { value: 0 } } as any);
        prismaMock.transaction.findMany.mockResolvedValue([]);
    });

    it("applies selected account and category names consistently to all report queries", async () => {
        const idUser = "3bff1d1b-e647-47cc-a151-e54b52c1e673";
        const dateInit = new Date("2026-01-01T00:00:00.000Z");
        const dateEnd = new Date("2026-01-31T23:59:59.999Z");
        const filters = { accounts: ["Checking"], categories: ["Groceries"] };

        await repository.generate(idUser, dateInit, dateEnd, filters);

        const expectedWhere = {
            idUser,
            date: { gte: dateInit, lte: dateEnd },
            account: { in: filters.accounts },
            category: { in: filters.categories },
            isTransfer: false
        };
        expect(prismaMock.transaction.aggregate).toHaveBeenNthCalledWith(1, {
            where: expect.objectContaining({ ...expectedWhere, type: true }),
            _sum: { value: true }
        });
        expect(prismaMock.transaction.aggregate).toHaveBeenNthCalledWith(2, {
            where: expect.objectContaining({ ...expectedWhere, type: false }),
            _sum: { value: true }
        });
        expect(prismaMock.transaction.findMany).toHaveBeenCalledWith({
            where: expect.objectContaining(expectedWhere)
        });
    });

    it("keeps empty selections as explicit filters rather than treating them as all", async () => {
        const dateInit = new Date("2026-01-01T00:00:00.000Z");
        const dateEnd = new Date("2026-01-31T23:59:59.999Z");

        await repository.generate("user-id", dateInit, dateEnd, { accounts: [], categories: null });

        expect(prismaMock.transaction.aggregate).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({ account: { in: [] } })
        }));
        expect(prismaMock.transaction.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({ account: { in: [] } })
        }));
    });
});
