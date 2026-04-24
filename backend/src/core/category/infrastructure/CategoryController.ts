import { Category, CategoryDto } from "../domain/Category";
import { CategoryRepository } from "../domain/CategoryRepository";
import { ControllerBase } from "../../shared/infrastructure/ControllerBase";
import { UserAuthenticate } from "../../user/infrastructure/UserAuthenticate";
import { Pagination } from "../../shared/domain/Pagination";
import { TranslatorRepository } from "../../shared/domain/TranslatorRepository";
import { MessageBuilder } from "../../shared/domain/MessageBuilder";

export class CategoryController extends ControllerBase {
    private readonly repository: CategoryRepository;
    private readonly translator: TranslatorRepository;

    constructor(repository: CategoryRepository, translator: TranslatorRepository) {
        super();
        this.repository = repository;
        this.translator = translator;
    }

    setup(): void {
        this.router.post("/add", UserAuthenticate, async (req, res) => {
            if (!req.body.name) 
                return res.status(400).send(this.translator.translate("categories.errors.nameRequired"));

            try {
                const idUser: string = req.user!.id;
                const name: string = req.body.name;
                const id: string | undefined = req.body.id ?? undefined;

                const category = new Category(this.translator, name, id, idUser);
                
                await this.repository.add(category);
                res.status(201).send(this.translator.translate("categories.success.categoryAdded"));
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.put("/update", UserAuthenticate, async (req, res) => {
            if (!req.body.id || 
                !req.body.name) {
                const message = new MessageBuilder(true);

                if (!req.body.id) message.add(this.translator.translate("categories.errors.idRequired"));
                if (!req.body.name) message.add(this.translator.translate("categories.errors.nameRequired"));
                
                return res.status(400).send(message);
            }

            try {
                const idUser: string = req.user!.id;
                const id: string = req.body.id;
                const name: string = req.body.name;

                const category = new Category(this.translator, name, id, idUser);

                const exists = await this.repository.search(idUser, name);
                if (exists) 
                    return res.status(400).send(this.translator.translate("categories.errors.nameAlreadyExists", { name: category.name }));
                    
                await this.repository.update(category);
                res.send(this.translator.translate("categories.success.categoryUpdated"));
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.delete("/delete/:id", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;
                const id: string = this.getQueryString(req.params.id!);

                await this.repository.delete(idUser, id);
                res.send(this.translator.translate("categories.success.categoryDeleted"));
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        
        this.router.get("/get/:id", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;
                const id: string = this.getQueryString(req.params.id!);

                const category: Category = await this.repository.get(idUser, id);
                res.json(category.toDto());
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.get("/search/:name", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;
                const name: string = this.getQueryString(req.params.name!);

                const category: Category | undefined = await this.repository.search(idUser, name);
                if (!category) return res.json({});
                res.json(category.toDto());
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });

        this.router.get("/list", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;

                const categories: Pagination<Category> = await this.repository.getList(idUser);
                const list: CategoryDto[] = categories.list.map(ac => ac.toDto());
                const pages: number = categories.pages;
                res.json({ list, pages });
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.get("/list/:limit", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;
                const limit: number = Number(req.params.limit!);

                const categories: Pagination<Category> = await this.repository.getList(idUser, limit);
                const list: CategoryDto[] = categories.list.map(ac => ac.toDto());
                const pages: number = categories.pages;
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

                const categories: Pagination<Category> = await this.repository.getList(idUser, limit, page);
                const list: CategoryDto[] = categories.list.map(ac => ac.toDto());
                const pages: number = categories.pages;
                res.json({ list, pages });
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.post("/list/search", UserAuthenticate, async (req, res) => {
            if (!req.body.name) 
                return res.status(400).send(this.translator.translate("categories.errors.nameRequired"));

            try {
                const idUser: string = req.user!.id;
                const name: string = req.body.name;
                const limit: number | undefined = req.body.limit ? Number(req.body.limit) : undefined;
                const page: number | undefined = req.body.page ? Number(req.body.page) : undefined;

                const categories: Pagination<Category> = await this.repository.getListSearch(idUser, name, limit, page);
                const list: CategoryDto[] = categories.list.map(ac => ac.toDto());
                const pages: number = categories.pages;
                res.json({ list, pages });
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
    }
}