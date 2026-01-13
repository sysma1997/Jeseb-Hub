import { v4 as Uuid } from "uuid";
import dayjs from "dayjs";
import "dayjs/plugin/utc";

import { ControllerBase } from "../../shared/infrastructure/ControllerBase";
import { Transaction } from "../domain/Transaction";
import { TransactionRepository } from "../domain/TransactionRepository";
import { TransactionService } from "../application/TransactionService";
import { UserAuthenticate } from "../../user/infrastructure/UserAuthenticate";

export class TransactionController extends ControllerBase {
    private readonly repository: TransactionRepository;
    private readonly service: TransactionService;

    constructor(repository: TransactionRepository, 
        service: TransactionService) {
        super();
        this.repository = repository;
        this.service = service;
    }

    setup() {
        this.router.post("/add", UserAuthenticate, async (req, res) => {
            if (!req.body.date || 
                (req.body.type === undefined || req.body.type === null) || 
                !req.body.account || 
                !req.body.value) {
                let message = "";
                let lineBreak = 0;

                if (!req.body.date) {
                    message += "The date is required.";
                    lineBreak++;
                }
                if (req.body.type === undefined || req.body.type === null) message += ((lineBreak++ > 0) ? "\n" : "") + 
                    "The type is required.";
                if (!req.body.account) message += ((lineBreak++ > 0) ? "\n" : "") + 
                    "The account is required.";
                if (!req.body.value) message += ((lineBreak > 0) ? "\n" : "") + 
                    "The value is required.";
                
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

                const transaction = new Transaction(date, type, account, 
                    value, 
                    id, idUser, 
                    category, description);
                await this.service.add(transaction);

                res.status(201).send("Transaction add successfully.");
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
                let message = "";
                let lineBreak = 0;

                if (!req.body.id) {
                    message += "The id is required.";
                    lineBreak++;
                }
                if (!req.body.data) message += ((lineBreak++ > 0) ? "\n" : "") + 
                    "The date is required.";
                if (req.body.type === undefined || req.body.type === null) message += ((lineBreak++ > 0) ? "\n" : "") + 
                    "The type is required.";
                if (!req.body.account) message += ((lineBreak++ > 0) ? "\n" : "") + 
                    "The account is required.";
                if (!req.body.value) message += ((lineBreak > 0) ? "\n" : "") + 
                    "The value is required.";
                
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

                const transaction = new Transaction(date, type, account, 
                    value, 
                    id, idUser, 
                    category, description);
                await this.service.update(transaction);

                res.status(201).send("Transaction add successfully.");
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.delete("/delete/:id", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;
                const id: string = req.params.id!;

                await this.service.delete(idUser, id);
                res.send("Transaction delete successfully.");
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });


        this.router.get("/get/:id", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;
                const id: string = req.params.id!;

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
    }
}