import { v4 as Uuid } from "uuid";
import dayjs from "dayjs";
import "dayjs/plugin/utc";

import { ControllerBase } from "../../shared/infrastructure/ControllerBase";
import { Transaction } from "../domain/Transaction";
import type { TransactionFilter } from "../domain/TransactionFilter";
import { TransactionRepository } from "../domain/TransactionRepository";
import { TransactionService } from "../application/TransactionService";
import { UserAuthenticate } from "../../user/infrastructure/UserAuthenticate";
import { TranslatorRepository } from "../../shared/domain/TranslatorRepository";
import { MessageBuilder } from "../../shared/domain/MessageBuilder"; 

export class TransactionController extends ControllerBase {
    private readonly repository: TransactionRepository;
    private readonly service: TransactionService;
    private readonly translator: TranslatorRepository;

    constructor(repository: TransactionRepository, 
        service: TransactionService, 
        translator: TranslatorRepository) {
        super();
        this.repository = repository;
        this.service = service;
        this.translator = translator;
    }

    setup() {
        this.router.post("/add", UserAuthenticate, async (req, res) => {
            if (!req.body.date || 
                (req.body.type === undefined || req.body.type === null) || 
                !req.body.account || 
                !req.body.value) {
                const message = new MessageBuilder(true);

                if (!req.body.date) {
                    message.add(this.translator.translate("transactions.errors.dateRequired"));
                }
                if (req.body.type === undefined || req.body.type === null) 
                    message.add(this.translator.translate("transactions.errors.typeRequired"));
                if (!req.body.account) message.add(this.translator.translate("transactions.errors.accountRequired"));
                if (!req.body.value) message.add(this.translator.translate("transactions.errors.valueRequired"));

                return res.status(400).send(message);
            }

            try {
                const id: string | undefined = req.body.id ?? Uuid();
                const idUser: string = req.user!.id;
                const date: Date = dayjs.utc(req.body.date).toDate();
                const type: boolean = req.body.type;
                const account: string = req.body.account;
                const value: number = req.body.value;
                const category: string | undefined = req.body.category ?? undefined;
                const description: string | undefined = req.body.description ?? undefined;

                const transaction = new Transaction(this.translator, date, type, account, 
                    value, 
                    id, idUser, 
                    category, description);
                await this.service.add(transaction);

                res.status(201).send(this.translator.translate("transaction.success.transactionAdded"));
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.put("/update", UserAuthenticate, async (req, res) => {
            if (!req.body.id || 
                !req.body.date || 
                (req.body.type === undefined || req.body.type === null) || 
                !req.body.account || 
                !req.body.value) {
                const message = new MessageBuilder();

                if (!req.body.id) message.add(this.translator.translate("transactions.errors.idRequired"));
                if (!req.body.data) message.add(this.translator.translate("transactions.errors.dateRequired"));
                if (req.body.type === undefined || req.body.type === null) 
                    message.add(this.translator.translate("transactions.errors.typeRequired"));
                if (!req.body.account) message.add(this.translator.translate("transactions.errors.accountRequired"));
                if (!req.body.value) message.add(this.translator.translate("transactions.errors.valueRequired"));
                
                return res.status(400).send(message);
            }

            try {
                const id: string = req.body.id;
                const idUser: string = req.user!.id;
                const date: Date = dayjs.utc(req.body.date).toDate();
                const type: boolean = req.body.type;
                const account: string = req.body.account;
                const value: number = req.body.value;
                const category: string | undefined = req.body.category ?? undefined;
                const description: string | undefined = req.body.description ?? undefined;

                const transaction = new Transaction(this.translator, date, type, account, 
                    value, 
                    id, idUser, 
                    category, description);
                await this.service.update(transaction);

                res.status(201).send(this.translator.translate("transaction.success.transactionUpdated"));
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.delete("/delete/:id", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;
                const id: string = this.getQueryString(req.params.id!);

                await this.service.delete(idUser, id);
                res.send(this.translator.translate("transaction.success.transactionDeleted"));
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });


        this.router.get("/get/:id", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;
                const id: string = this.getQueryString(req.params.id!);

                const transaction = await this.repository.get(idUser, id);

                res.json(transaction.toDto());
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });

        this.router.get("/list", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;

                const transactions = await this.repository.getList(idUser);
                const list = transactions.list.map(t => t.toDto());
                const pages = transactions.pages;

                res.json({ list, pages });
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.get("/list/:limit", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;
                const limit: number = Number(req.params.limit);

                const transactions = await this.repository.getList(idUser, limit);
                const list = transactions.list.map(t => t.toDto());
                const pages = transactions.pages;

                res.json({ list, pages });
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.get("/list/:limit/:page", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;
                const limit: number = Number(req.params.limit);
                const page: number = Number(req.params.page);

                const transactions = await this.repository.getList(idUser, limit, page);
                const list = transactions.list.map(t => t.toDto());
                const pages = transactions.pages;

                res.json({ list, pages });
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.post("/list/filter", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;
                const filter: TransactionFilter = {};
                filter.dateFrom = req.body.dateFrom ? dayjs.utc(String(req.body.dateFrom)).toDate() : undefined;
                filter.dateTo = req.body.dateTo ? dayjs.utc(String(req.body.dateTo)).toDate() : undefined;
                filter.type = req.body.type !== undefined ? String(req.body.type) === "true" : undefined;
                filter.account = req.body.account ? String(req.body.account) : undefined;
                filter.category = req.body.category ? String(req.body.category) : undefined;
                const limit: number | undefined = req.body.limit ? Number(req.body.limit) : undefined;
                const page: number | undefined = req.body.page ? Number(req.body.page) : undefined;
                
                const transactions = await this.repository.getListFilter(idUser, filter, limit, page);
                const list = transactions.list.map(t => t.toDto());
                const pages = transactions.pages;

                res.json({ list, pages });
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });

        this.router.post("/import", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;
                const array: any[] = req.body;

                if (!array || !Array.isArray(array)) 
                    return res.status(400).send(this.translator.translate("transactions.errors.invalidFormat"));
                if (array.length > 500) 
                    return res.status(400).send(this.translator.translate("transactions.errors.exceedLimit"));

                const transactions: Transaction[] = [];
                for (let i = 0; i < array.length; i++) {
                    const item = array[i];

                    const id: string = item.id ?? Uuid();
                    const date: Date = dayjs.utc(item.date).toDate();
                    const type: boolean = item.type;
                    const account: string = item.account;
                    const value: number = item.value;
                    const category: string | undefined = item.category ?? undefined;
                    const description: string | undefined = item.description ?? undefined;

                    const transaction = new Transaction(this.translator, date, type, account, 
                        value, 
                        id, idUser, 
                        category, description);
                    transactions.push(transaction);
                }

                await this.service.addRange(idUser, transactions);
                res.status(201).send(this.translator.translate("transactions.success.transactionsAdded"));
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.get("/export", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;
                const limit: number = 500;

                const totalTransactions = await this.repository.getCount(idUser);
                if (totalTransactions === 0) return res.status(400).send(this.translator.translate("transactions.errors.noTransactionsToExport"));

                res.setHeader("Content-Type", "application/json");
                res.setHeader("Transfer-Encoding", "chunked");

                const totalChunks = Math.ceil(totalTransactions / limit);
                let page: number = 1;

                while (true) {
                    const transactions = await this.repository.getList(idUser, limit, page);
                    if (transactions.list.length === 0) break;
                    
                    const chunkData = {
                        chunk: page, 
                        chunks: totalChunks, 
                        list: transactions.list.map(t => t.toDto())
                    };
                    res.write(JSON.stringify(chunkData) + "\n");

                    page++;
                }

                res.end();
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
    }
}