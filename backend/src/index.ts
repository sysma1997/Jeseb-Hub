import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";
import dayjsUtc from "dayjs/plugin/utc";
import multer from "multer";

import { ControllerBase } from "./core/shared/infrastructure/ControllerBase";

import { translateMiddleware } from "./core/shared/infrastructure/express/translate.middleware";

import { UserRepository } from "./core/user/domain/UserRepository";
import { UserPrismaRepository } from "./core/user/infrastructure/UserPrismaRepository";
import { UserController } from "./core/user/infrastructure/UserController";
import { TransactionRepository } from "./core/transaction/domain/TransactionRepository";
import { TransactionPrismaRepository } from "./core/transaction/infrastructure/TransactionPrismaRepository";
import { TransactionService } from "./core/transaction/application/TransactionService";
import { TransactionController } from "./core/transaction/infrastructure/TransactionController";
import { AccountRepository } from "./core/account/domain/AccountRepository";
import { AccountPrismaRepository } from "./core/account/infrastructure/AccountPrismaRepository";
import { AccountController } from "./core/account/infrastructure/AccountController";
import { CategoryRepository } from "./core/category/domain/CategoryRepository";
import { CategoryPrismaRepository } from "./core/category/infrastructure/CategoryPrismaRepository";
import { CategoryController } from "./core/category/infrastructure/CategoryController";

import { TranslatorRepository } from "./core/shared/domain/TranslatorRepository";
import { TranslatorI18nRepository } from "./core/shared/infrastructure/i18next/index";

const PORT = process.env.PORT ?? 3000;
const FRONTEND_URL = (process.env.FRONTEND_URL) ? 
    process.env.FRONTEND_URL : "http://localhost:8000";

dayjs.extend(dayjsUtc);

const allowedOrigins = [
    "http://localhost:5678",
    FRONTEND_URL,
];

const corsOptions = {
    origin: (origin: any, callback: any) => {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) 
            callback(null, true);
        else callback(new Error("Not allowed by CORS"));
    },
    credentials: true, 
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
};

const translator: TranslatorRepository = new TranslatorI18nRepository();
const prisma = new PrismaClient();

const userRepository: UserRepository = new UserPrismaRepository(prisma, translator);
const userController: ControllerBase = new UserController(userRepository, translator);
const transactionRepository: TransactionRepository = new TransactionPrismaRepository(prisma, translator);
const accountRepository: AccountRepository = new AccountPrismaRepository(prisma, translator);
const accountController: ControllerBase = new AccountController(accountRepository, translator);
const categoryRepository: CategoryRepository = new CategoryPrismaRepository(prisma, translator);
const categoryController: ControllerBase = new CategoryController(categoryRepository, translator);
const transactionService: TransactionService = new TransactionService(transactionRepository, accountRepository, categoryRepository, translator);
const transactionController: ControllerBase = new TransactionController(transactionRepository, transactionService, translator);

userController.setup();
transactionController.setup();
accountController.setup();
categoryController.setup();

const app = express();

app.use(translateMiddleware);
app.use(cors(corsOptions));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));
app.use("/uploads", express.static("uploads"));

app.get("/", (_, res) => {
    res.send("Jeseb Api: v1.1.0");
});

app.use("/api/user", userController.getRouter());
app.use("/api/transaction", transactionController.getRouter());
app.use("/api/account", accountController.getRouter());
app.use("/api/category", categoryController.getRouter());

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") 
            return res.status(400).send("The file is too large, the limit is 5 MB.");
    }

    next(err);
});

app.listen(PORT, () => {
    console.log(`Listen to port: ${PORT}`);
    console.log(`CORS Allowed Origins: ${allowedOrigins.join(", ")}`);
});