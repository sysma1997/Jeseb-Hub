import { Account, AccountDto } from "../domain/Account";
import { AccountRepository } from "../domain/AccountRepository";
import { ControllerBase } from "../../shared/infrastructure/ControllerBase";
import { UserAuthenticate } from "../../user/infrastructure/UserAuthenticate";
import { Pagination } from "../../shared/domain/Pagination";
import { TranslatorRepository } from "../../shared/domain/TranslatorRepository";
import { Money } from "../../shared/domain/Money";
import { MessageBuilder } from "../../shared/domain/MessageBuilder";

export class AccountController extends ControllerBase {
    private readonly repository: AccountRepository;
    private readonly translator: TranslatorRepository;

    constructor(repository: AccountRepository, translator: TranslatorRepository) {
        super();
        this.repository = repository;
        this.translator = translator;
    }

    setup(): void {
        this.router.post("/add", UserAuthenticate, async (req, res) => {
            if (!req.body.name) 
                return res.status(400).send(this.translator.translate("accounts.errors.nameRequired"));

            try {
                const idUser: string = req.user!.id;
                const name: string = req.body.name;
                const balance: number = Money.toCents(req.body.balance ?? 0.0);
                const id: string | undefined = req.body.id ?? undefined;

                const account = new Account(this.translator, name, balance, 
                    id, idUser);
                
                await this.repository.add(account);
                res.status(201).send(this.translator.translate("accounts.success.accountAdded"));
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
          this.router.put("/update", UserAuthenticate, async (req, res) => {
              if (!req.body.id || 
                  (!req.body.name && req.body.balance === undefined)) {
                  const message = new MessageBuilder();
  
                  if (!req.body.id) message.add(this.translator.translate("accounts.errors.idRequired"));
                  if (!req.body.name && req.body.balance === undefined) message.add(this.translator.translate("accounts.errors.nameRequired"));
                  
                  return res.status(400).send(message.toString());
              }
  
              try {
                  const idUser: string = req.user!.id;
                  const id: string = req.body.id;
                  const name: string | undefined = req.body.name;
                  const balance: number | undefined = req.body.balance;
  
                  let account: Account = await this.repository.get(idUser, id);
                  if (name) account = account.setName(name);
                  if (balance !== undefined) account = account.setBalance(Money.toCents(balance));
      
                  await this.repository.update(account);
                  res.send(this.translator.translate("accounts.success.accountUpdated"));
              } catch (err: any) {
                  if (err instanceof Error) res.status(400).send(err.message);
              }
          });
        this.router.delete("/delete/:id", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;
                const id: string = this.getQueryString(req.params.id!);

                await this.repository.delete(idUser, id);
                res.send(this.translator.translate("accounts.success.accountDeleted"));
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        
        this.router.get("/get/:id", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;
                const id: string = this.getQueryString(req.params.id!);

                const account: Account = await this.repository.get(idUser, id);
                res.json(account.toDto());
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.get("/search/:name", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;
                const name: string = this.getQueryString(req.params.name!);

                const account: Account | undefined = await this.repository.search(idUser, name);
                if (!account) return res.json({});
                res.json(account.toDto());
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });

        this.router.get("/list", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;

                const accounts: Pagination<Account> = await this.repository.getList(idUser);
                const list: AccountDto[] = accounts.list.map(ac => ac.toDto());
                const pages: number = accounts.pages;
                res.json({ list, pages });
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.get("/list/:limit", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;
                const limit: number = Number(req.params.limit!);

                const accounts: Pagination<Account> = await this.repository.getList(idUser, limit);
                const list: AccountDto[] = accounts.list.map(ac => ac.toDto());
                const pages: number = accounts.pages;
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

                const accounts: Pagination<Account> = await this.repository.getList(idUser, limit, page);
                const list: AccountDto[] = accounts.list.map(ac => ac.toDto());
                const pages: number = accounts.pages;
                res.json({ list, pages });
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.post("/list/search/", UserAuthenticate, async (req, res) => {
            if (!req.body.name) 
                return res.status(400).send(this.translator.translate("accounts.errors.nameRequired"));

            try {
                const idUser: string = req.user!.id;
                const search: string = req.body.name;
                const limit: number = Number(req.query.limit ?? 30);
                const page: number = Number(req.query.page ?? 1);

                const accounts: Pagination<Account> = await this.repository.getListSearch(idUser, search, limit, page);
                const list: AccountDto[] = accounts.list.map(ac => ac.toDto());
                const pages: number = accounts.pages;
                res.json({ list, pages });
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });

        this.router.get("/total/balance", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;
                // el repositorio devuelve centavos; la API responde en decimales
                const totalBalance: number = Money.fromCents(await this.repository.getTotalBalance(idUser));
                
                res.json({ totalBalance });
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
    }
}