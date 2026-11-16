import dayjs from "dayjs";
import dayjsUtc from "dayjs/plugin/utc";
import { v4 as Uuid } from "uuid";

import { Debt, DebtDto } from "../domain/Debt";
import { DebtPayment, DebtPaymentDto } from "../domain/DebtPayment";
import { DebtRepository } from "../domain/DebtRepository";
import { DebtSummary } from "../domain/DebtSummary";
import { DebtService } from "../application/DebtService";
import { ControllerBase } from "../../shared/infrastructure/ControllerBase";
import { UserAuthenticate } from "../../user/infrastructure/UserAuthenticate";
import { Pagination } from "../../shared/domain/Pagination";
import { TranslatorRepository } from "../../shared/domain/TranslatorRepository";
import { Money } from "../../shared/domain/Money";
import { MessageBuilder } from "../../shared/domain/MessageBuilder";

dayjs.extend(dayjsUtc);

export class DebtController extends ControllerBase {
    private readonly repository: DebtRepository;
    private readonly service: DebtService;
    private readonly translator: TranslatorRepository;

    constructor(repository: DebtRepository, 
        service: DebtService, 
        translator: TranslatorRepository) {
        super();
        this.repository = repository;
        this.service = service;
        this.translator = translator;
    }

    setup(): void {
        this.router.post("/add", UserAuthenticate, async (req, res) => {
            if (!req.body.person || 
                req.body.type === undefined || req.body.type === null || 
                req.body.amount === undefined || req.body.amount === null || req.body.amount === "") {
                const message = new MessageBuilder();

                if (!req.body.person) message.add(this.translator.translate("debts.errors.personRequired"));
                if (req.body.type === undefined || req.body.type === null) 
                    message.add(this.translator.translate("debts.errors.typeRequired"));
                if (req.body.amount === undefined || req.body.amount === null || req.body.amount === "") 
                    message.add(this.translator.translate("debts.errors.amountRequired"));

                return res.status(400).send(message.toString());
            }

            try {
                const idUser: string = req.user!.id;
                const person: string = req.body.person;
                const type: boolean = req.body.type;
                // la API habla en decimales y el dominio en centavos
                const amount: number = Money.toCents(req.body.amount);
                const date: Date = req.body.date ? 
                    dayjs.utc(String(req.body.date)).toDate() : new Date();
                const dueDate: Date | undefined = req.body.dueDate ? 
                    dayjs.utc(String(req.body.dueDate)).toDate() : undefined;
                const description: string | undefined = req.body.description ?? undefined;
                const id: string | undefined = req.body.id ?? undefined;

                const debt = new Debt(this.translator, person, type, amount, date, 
                    id, idUser, 
                    description, dueDate);

                await this.repository.add(debt);
                res.status(201).send(this.translator.translate("debts.success.debtAdded"));
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.put("/update", UserAuthenticate, async (req, res) => {
            if (!req.body.id) 
                return res.status(400).send(this.translator.translate("debts.errors.idRequired"));

            try {
                const idUser: string = req.user!.id;
                const id: string = req.body.id;

                const current: Debt = await this.repository.get(idUser, id);
                // se calculan todos los valores finales antes de construir la deuda:
                // si se cambian date y dueDate a la vez, validar cada cambio por
                // separado podia rechazar una combinacion que en conjunto es valida
                const person: string = (req.body.person !== undefined) ? 
                    req.body.person : current.person;
                const type: boolean = (req.body.type !== undefined && req.body.type !== null) ? 
                    req.body.type : current.type;
                // la API habla en decimales y el dominio en centavos
                const amount: number = (req.body.amount !== undefined) ? 
                    Money.toCents(req.body.amount) : current.amount;
                const date: Date = (req.body.date !== undefined) ? 
                    dayjs.utc(String(req.body.date)).toDate() : current.date;
                const dueDate: Date | undefined = (req.body.dueDate !== undefined) ? 
                    (req.body.dueDate ? dayjs.utc(String(req.body.dueDate)).toDate() : undefined) : 
                    current.dueDate;
                const description: string | undefined = (req.body.description !== undefined) ? 
                    (req.body.description === null ? undefined : req.body.description) : 
                    current.description;

                const debt = new Debt(this.translator, person, type, amount, date, 
                    current.id, current.idUser, 
                    description, dueDate, 
                    current.paidAmount, current.paymentCount);

                await this.service.update(idUser, debt);
                res.send(this.translator.translate("debts.success.debtUpdated"));
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.delete("/delete/:id", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;
                const id: string = this.getQueryString(req.params.id!);

                await this.service.deleteDebt(idUser, id);
                res.send(this.translator.translate("debts.success.debtDeleted"));
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });

        this.router.get("/get/:id", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;
                const id: string = this.getQueryString(req.params.id!);

                const debt: Debt = await this.repository.get(idUser, id);
                res.json(debt.toDto());
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });

        this.router.get("/list", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;

                const debts: Pagination<Debt> = await this.repository.getList(idUser);
                const list: DebtDto[] = debts.list.map(debt => debt.toDto());
                const pages: number = debts.pages;
                res.json({ list, pages });
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.get("/list/:limit", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;
                const limit: number = Number(req.params.limit!);

                const debts: Pagination<Debt> = await this.repository.getList(idUser, limit);
                const list: DebtDto[] = debts.list.map(debt => debt.toDto());
                const pages: number = debts.pages;
                res.json({ list, pages });
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.get("/list/:limit/:page", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;
                const limit: number = Number(req.params.limit!);
                const page: number = Number(req.params.page!);

                const debts: Pagination<Debt> = await this.repository.getList(idUser, limit, page);
                const list: DebtDto[] = debts.list.map(debt => debt.toDto());
                const pages: number = debts.pages;
                res.json({ list, pages });
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.post("/list/search", UserAuthenticate, async (req, res) => {
            if (!req.body.person) 
                return res.status(400).send(this.translator.translate("debts.errors.personRequired"));

            try {
                const idUser: string = req.user!.id;
                const person: string = req.body.person;
                const limit: number | undefined = req.body.limit ? Number(req.body.limit) : undefined;
                const page: number | undefined = req.body.page ? Number(req.body.page) : undefined;

                const debts: Pagination<Debt> = await this.repository.getListSearch(idUser, person, limit, page);
                const list: DebtDto[] = debts.list.map(debt => debt.toDto());
                const pages: number = debts.pages;
                res.json({ list, pages });
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });

        this.router.get("/summary", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;

                const summary: DebtSummary = await this.repository.getSummary(idUser);
                res.json(summary);
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });

        this.router.post("/payment/add", UserAuthenticate, async (req, res) => {
            if (!req.body.idDebt || 
                req.body.amount === undefined || req.body.amount === null || req.body.amount === "") {
                const message = new MessageBuilder();

                if (!req.body.idDebt) 
                    message.add(this.translator.translate("debts.errors.paymentDebtRequired"));
                if (req.body.amount === undefined || req.body.amount === null || req.body.amount === "") 
                    message.add(this.translator.translate("debts.errors.paymentAmountRequired"));

                return res.status(400).send(message.toString());
            }
            if (!req.body.idAccount)
                return res.status(400).send(this.translator.translate("debts.errors.paymentAccountRequired"));

            try {
                const idUser: string = req.user!.id;
                const idDebt: string = req.body.idDebt;
                // la API habla en decimales y el dominio en centavos
                const amount: number = Money.toCents(req.body.amount);
                const date: Date = req.body.date ? 
                    dayjs.utc(String(req.body.date)).toDate() : new Date();
                const description: string | undefined = req.body.description ?? undefined;
                const id: string = req.body.id ?? Uuid();
                const idAccount: string = req.body.idAccount;
                const category: string | undefined = req.body.category ?? undefined;

                const payment = new DebtPayment(this.translator, date, amount, idDebt, 
                    id, idUser, 
                    description, undefined, idAccount, undefined, category);

                await this.service.addPayment(idUser, payment);
                res.status(201).send(this.translator.translate("debts.success.paymentAdded"));
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.get("/payment/list/:idDebt", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;
                const idDebt: string = this.getQueryString(req.params.idDebt!);
                const limit: number | undefined = req.query.limit ? Number(req.query.limit) : undefined;
                const page: number | undefined = req.query.page ? Number(req.query.page) : undefined;

                const payments: Pagination<DebtPayment> = await this.repository.getPayments(idUser, idDebt, limit, page);
                const list: DebtPaymentDto[] = payments.list.map(payment => payment.toDto());
                const pages: number = payments.pages;
                res.json({ list, pages });
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.delete("/payment/delete/:idDebt/:id", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;
                const idDebt: string = this.getQueryString(req.params.idDebt!);
                const id: string = this.getQueryString(req.params.id!);

                await this.service.deletePayment(idUser, idDebt, id);
                res.send(this.translator.translate("debts.success.paymentDeleted"));
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
    }
}
